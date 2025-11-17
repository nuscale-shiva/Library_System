import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, PhoneOff, Loader, AlertCircle, CheckCircle, Volume2, Settings } from 'lucide-react'
import api from '../../services/api'
import {
  checkMicrophonePermission,
  requestMicrophonePermission,
  getDeviceInfo,
  type MicPermissionStatus
} from '../../utils/microphonePermission'
import MicrophoneDiagnostic from '../MicrophoneDiagnostic'

interface VoiceCallProps {
  sessionId: string
  onEndCall: () => void
}

export default function VoiceCall({ sessionId, onEndCall }: VoiceCallProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [transcription, setTranscription] = useState('Initializing voice system...')
  const [isProcessing, setIsProcessing] = useState(false)
  const [librarianSpeaking, setLibrarianSpeaking] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<MicPermissionStatus | null>(null)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [deviceInfo] = useState(getDeviceInfo())
  const [micTestPassed, setMicTestPassed] = useState(false)
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  // Refs
  const callTimerRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const deepgramSocketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const currentTranscriptRef = useRef<string>('')
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const isProcessingRef = useRef<boolean>(false)

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      console.log('🔍 Checking microphone permission status...')
      const status = await checkMicrophonePermission()
      console.log('📊 Permission status:', status)
      setPermissionStatus(status)

      if (status.granted) {
        setTranscription('✅ Microphone ready! Starting voice assistant...')
        setMicTestPassed(true)
        // Auto-start voice call after a short delay
        setTimeout(() => startVoiceCall(), 1000)
      } else {
        setTranscription('👆 Click "Allow Microphone" button below to start')
      }
    }

    console.log('🌐 Browser Info:', deviceInfo)
    checkPermission()

    // Start call timer
    callTimerRef.current = window.setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
      cleanup()
    }
  }, [])

  // Cleanup function
  const cleanup = () => {
    if (deepgramSocketRef.current) {
      deepgramSocketRef.current.close()
      deepgramSocketRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
  }

  // Format call duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Request microphone permission
  const handleRequestPermission = async () => {
    console.log('🎯 User clicked Allow Microphone button')
    setIsRequestingPermission(true)
    setTranscription('📍 Opening browser permission dialog...')

    await new Promise(resolve => setTimeout(resolve, 500))

    const status = await requestMicrophonePermission()
    console.log('📊 Permission result:', status)
    setPermissionStatus(status)
    setIsRequestingPermission(false)

    if (status.granted) {
      setTranscription('✅ Permission granted! Click Start to begin voice call...')
      setMicTestPassed(true)
      // Auto-start after permission
      setTimeout(() => startVoiceCall(), 1000)
    } else {
      setTranscription(status.message || 'Failed to get microphone permission')
    }
  }

  // Start voice call with VAPI STT
  const startVoiceCall = async () => {
    try {
      console.log('🚀 Starting voice call with VAPI...')
      setTranscription('🎤 Connecting to VAPI...')

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      streamRef.current = stream
      console.log('✅ Microphone stream acquired')

      // Get VAPI/Deepgram API key from backend
      const response = await api.get('/ai/voice/deepgram-key')
      const { api_key } = response.data

      if (!api_key) {
        throw new Error('VAPI API key not configured in backend')
      }

      // Connect to VAPI WebSocket for live transcription
      const deepgramUrl = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&interim_results=true&punctuate=true&smart_format=true`
      const socket = new WebSocket(deepgramUrl, ['token', api_key])
      deepgramSocketRef.current = socket

      socket.onopen = () => {
        console.log('✅ VAPI WebSocket connected')
        setIsRecording(true)
        setTranscription('🎧 Call connected! Start speaking...')

        // Start sending audio to VAPI
        startAudioStreaming(stream, socket)
      }

      socket.onmessage = async (message) => {
        const data = JSON.parse(message.data)

        if (data.channel) {
          const transcript = data.channel.alternatives[0]?.transcript

          if (transcript && transcript.trim()) {
            const isFinal = data.is_final

            if (isFinal) {
              // Prevent duplicate processing of the same transcript
              if (currentTranscriptRef.current === transcript) {
                console.log('🔁 Skipping duplicate transcript:', transcript)
                return
              }

              // Prevent multiple simultaneous processing
              if (isProcessingRef.current) {
                console.log('⏸️ Already processing, skipping:', transcript)
                return
              }

              // Final transcript - send to GPT
              console.log('📝 Final transcript:', transcript)
              currentTranscriptRef.current = transcript
              setTranscription(`YOU: ${transcript}`)

              // Send to GPT assistant
              await sendToGPTAssistant(transcript)
            } else {
              // Interim transcript - show live
              setTranscription(`YOU: ${transcript}...`)
            }
          }
        }
      }

      socket.onerror = (error) => {
        console.error('❌ VAPI error:', error)
        setTranscription('Error: VAPI connection failed')
        setIsRecording(false)
      }

      socket.onclose = () => {
        console.log('📞 VAPI connection closed')
      }

    } catch (error: any) {
      console.error('Failed to start voice call:', error)
      setTranscription(`Error: ${error.message}`)
      setPermissionStatus({
        granted: false,
        state: 'error',
        message: error.message,
        canRetry: true
      })
    }
  }

  // Stream audio to VAPI
  const startAudioStreaming = (stream: MediaStream, socket: WebSocket) => {
    const audioContext = new AudioContext({ sampleRate: 16000 })
    audioContextRef.current = audioContext

    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)

    source.connect(processor)
    processor.connect(audioContext.destination)

    processor.onaudioprocess = (e) => {
      if (socket.readyState === WebSocket.OPEN && !isMuted) {
        const inputData = e.inputBuffer.getChannelData(0)

        // Convert float32 to int16
        const int16Data = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }

        // Send to VAPI
        socket.send(int16Data.buffer)
      }
    }
  }

  // Send transcript to GPT assistant
  const sendToGPTAssistant = async (userMessage: string) => {
    try {
      setIsProcessing(true)
      setTranscription(`YOU: ${userMessage}\n\nLIBRARIAN: Thinking...`)

      console.log('🤖 Sending to GPT assistant:', userMessage)

      // Send to existing GPT assistant endpoint
      const response = await api.post('/ai/chat', {
        message: userMessage,
        session_id: sessionId
      })

      const assistantResponse = response.data.response
      console.log('💬 GPT response:', assistantResponse)

      // Update transcription
      setTranscription(`YOU: ${userMessage}\n\nLIBRARIAN: ${assistantResponse}`)

      // Convert response to speech using VAPI TTS
      await speakResponse(assistantResponse)

    } catch (error: any) {
      console.error('❌ Error processing message:', error)
      setTranscription((prev) => `${prev}\n\nError: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Text-to-Speech using VAPI
  const speakResponse = async (text: string) => {
    try {
      // Stop any currently playing audio to prevent overlapping
      if (currentAudioRef.current) {
        console.log('⏹️ Stopping previous audio')
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      setLibrarianSpeaking(true)
      console.log('🔊 Converting to speech:', text)

      // Call backend to generate speech
      const response = await api.post('/ai/voice/speak',
        { text },
        { responseType: 'blob' }
      )

      // Play audio
      const audioBlob = new Blob([response.data], { type: 'audio/mp3' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio

      audio.onended = () => {
        console.log('✅ Finished speaking')
        setLibrarianSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
      }

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error)
        setLibrarianSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
      }

      await audio.play()

    } catch (error: any) {
      console.error('❌ TTS error:', error)
      setLibrarianSpeaking(false)
      currentAudioRef.current = null
    }
  }

  const toggleMute = () => {
    if (!permissionStatus?.granted || !isRecording) return

    setIsMuted(!isMuted)
    console.log(isMuted ? '🔊 Unmuted' : '🔇 Muted')
  }

  const handleEndCall = () => {
    cleanup()
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }
    onEndCall()
  }

  return (
    <>
      {showDiagnostic && <MicrophoneDiagnostic onClose={() => setShowDiagnostic(false)} />}
      <div className="fixed inset-0 top-16 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-md mx-auto">
        <div className="bg-black border border-white/10 rounded-none shadow-2xl overflow-hidden" style={{ maxHeight: '85vh' }}>
          {/* Header */}
          <div className="bg-black border-b border-white/10 px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="relative">
                  <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                    permissionStatus?.granted && isRecording ? 'bg-white animate-pulse' : 'bg-white/30'
                  }`}></div>
                  {permissionStatus?.granted && isRecording && (
                    <div className="absolute inset-0 w-2 h-2 md:w-3 md:h-3 bg-white/50 rounded-full animate-ping"></div>
                  )}
                </div>
                <span className="text-white font-mono text-xs md:text-sm tracking-wider">
                  {permissionStatus?.granted && isRecording ? 'VOICE CALL ACTIVE' : 'WAITING FOR MIC'}
                </span>
              </div>
              <span className="text-white/60 font-mono text-sm md:text-lg tabular-nums">
                {formatDuration(callDuration)}
              </span>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="px-4 md:px-6 py-6 md:py-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
            {/* Permission Section */}
            {!permissionStatus?.granted && (
              <div className="flex flex-col items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <h3 className="text-white text-base md:text-lg font-mono mb-2 flex items-center justify-center gap-2">
                    {permissionStatus?.state === 'unsupported' && <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />}
                    {permissionStatus?.state === 'denied' && <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />}
                    {permissionStatus?.state === 'prompt' && <Mic className="w-4 h-4 md:w-5 md:h-5" />}
                    Microphone Access Required
                  </h3>

                  {/* Device Info */}
                  <div className="text-white/40 text-xs font-mono mb-3">
                    {deviceInfo.browser} • {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}
                    {deviceInfo.isSecure ? ' • HTTPS ✓' : ' • ⚠️ NOT SECURE'}
                  </div>

                  <p className="text-white/60 text-xs md:text-sm font-mono mb-4 max-w-xs whitespace-pre-line">
                    {permissionStatus?.message || 'Click below to grant microphone access'}
                  </p>
                </div>

                {permissionStatus?.canRetry && (
                  <button
                    onClick={handleRequestPermission}
                    disabled={isRequestingPermission}
                    className="px-4 md:px-6 py-2 md:py-3 bg-white text-black font-mono text-sm md:text-base hover:bg-white/90 transition-all transform hover:scale-105 flex items-center gap-2 md:gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequestingPermission ? (
                      <>
                        <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                        Opening Permission Dialog...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 md:w-5 md:h-5" />
                        Allow Microphone Access
                      </>
                    )}
                  </button>
                )}

                {/* Debug Info */}
                {!deviceInfo.hasGetUserMedia && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                    ❌ getUserMedia not supported in this browser!
                  </div>
                )}

                {/* Diagnostic Button for Errors */}
                {permissionStatus?.state === 'error' && (
                  <button
                    onClick={() => setShowDiagnostic(true)}
                    className="mt-4 px-4 py-2 bg-white/10 text-white font-mono text-xs hover:bg-white/20 transition-all flex items-center gap-2 mx-auto border border-white/20"
                  >
                    <Settings className="w-4 h-4" />
                    Run Microphone Diagnostic
                  </button>
                )}
              </div>
            )}

            {/* Transcription */}
            <div className={!permissionStatus?.granted ? 'opacity-30' : ''}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${
                  permissionStatus?.granted && isRecording ? 'bg-white/60 animate-pulse' : 'bg-white/20'
                }`}></div>
                <span className="text-white/40 text-xs font-mono tracking-wider">
                  {isProcessing ? 'PROCESSING' : isRecording ? 'LISTENING' : 'TRANSCRIPTION'}
                </span>
              </div>

              <div className="relative">
                <p className="text-white/80 text-xs md:text-sm leading-relaxed min-h-[100px] md:min-h-[120px] font-mono whitespace-pre-wrap">
                  {transcription}
                  {isProcessing && <span className="inline-block ml-2 animate-pulse">|</span>}
                </p>

                {librarianSpeaking && (
                  <div className="absolute -left-2 top-0">
                    <Volume2 className="w-4 h-4 text-white/60 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* Audio Visualization */}
            {isRecording && !isMuted && permissionStatus?.granted && (
              <div className="flex items-center justify-center gap-1 h-12 md:h-16 mt-4">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/80 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 60 + 10}%`,
                      animationDelay: `${Math.random() * 500}ms`,
                      animationDuration: `${Math.random() * 400 + 400}ms`
                    }}
                  ></div>
                ))}
              </div>
            )}

            {/* Mic Icon Animation */}
            <div className="flex justify-center mt-4 md:mt-6">
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                {isRecording && !isMuted && permissionStatus?.granted && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-white/20 rounded-full animate-ping"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 md:w-24 md:h-24 border border-white/30 rounded-full animate-pulse"></div>
                    </div>
                  </>
                )}

                <div className="relative w-12 h-12 md:w-16 md:h-16 border-2 border-white/40 rounded-full flex items-center justify-center bg-black">
                  {permissionStatus?.granted ? (
                    <Mic className={`w-6 h-6 md:w-8 md:h-8 text-white ${isRecording && !isMuted ? 'animate-pulse' : ''}`} />
                  ) : (
                    <MicOff className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
                  )}
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls - Fixed at bottom */}
          <div className="bg-black border-t border-white/10 px-4 md:px-6 py-4 md:py-6">
            <div className="flex items-center justify-center gap-4 md:gap-6">
              <button
                onClick={toggleMute}
                disabled={!permissionStatus?.granted || !isRecording}
                className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed ${
                  isMuted
                    ? 'bg-black border-2 border-white/60 text-white/60'
                    : 'bg-white/10 border-2 border-white/30 text-white hover:bg-white/20'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
              </button>

              <button
                onClick={handleEndCall}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-all transform hover:scale-110 shadow-lg shadow-white/20"
              >
                <PhoneOff className="w-6 h-6 md:w-8 md:h-8 text-black" />
              </button>
            </div>

            <div className="mt-4 md:mt-6 text-center">
              <p className="text-white/40 text-xs font-mono">
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-3 h-3 animate-spin" />
                    Processing...
                  </span>
                ) : isMuted ? (
                  'Muted'
                ) : permissionStatus?.granted && isRecording ? (
                  'Listening... Speak clearly'
                ) : permissionStatus?.granted ? (
                  'Initializing...'
                ) : (
                  'Waiting for permission...'
                )}
              </p>

              {permissionStatus?.granted && micTestPassed && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-green-500/80 text-xs">Microphone Active</span>
                </div>
              )}

              <p className="text-white/20 text-xs mt-2">
                Session: {sessionId.slice(0, 12)}...
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-6 text-center">
          <p className="text-white/30 text-xs">
            Powered by VAPI • Library Voice Assistant
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
