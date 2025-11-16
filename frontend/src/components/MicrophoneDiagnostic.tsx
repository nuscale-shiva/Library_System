import { useState } from 'react'
import { Mic, MicOff, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'

export default function MicrophoneDiagnostic({ onClose }: { onClose?: () => void }) {
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<{
    hasGetUserMedia: boolean | null
    hasMicrophone: boolean | null
    microphones: MediaDeviceInfo[]
    error: string | null
  }>({
    hasGetUserMedia: null,
    hasMicrophone: null,
    microphones: [],
    error: null
  })

  const runDiagnostic = async () => {
    setIsChecking(true)
    const newResults = {
      hasGetUserMedia: false,
      hasMicrophone: false,
      microphones: [] as MediaDeviceInfo[],
      error: null as string | null
    }

    // Check 1: Browser Support
    newResults.hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

    // Check 2: List all audio input devices
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter(device => device.kind === 'audioinput')
        newResults.microphones = audioInputs
        newResults.hasMicrophone = audioInputs.length > 0

        console.log('Found audio input devices:', audioInputs)
      }
    } catch (error: any) {
      console.error('Error enumerating devices:', error)
      newResults.error = error.message
    }

    // Check 3: Try to access microphone
    if (newResults.hasMicrophone) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        console.log('✅ Successfully accessed microphone')
      } catch (error: any) {
        console.error('❌ Could not access microphone:', error)
        newResults.error = `Could not access mic: ${error.name}`
      }
    }

    setResults(newResults)
    setIsChecking(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-white/20 p-6 max-w-md w-full">
        <h2 className="text-white text-xl font-mono mb-4">🎤 Microphone Diagnostic</h2>

        {!isChecking && results.hasGetUserMedia === null && (
          <div className="text-center py-8">
            <button
              onClick={runDiagnostic}
              className="px-6 py-3 bg-white text-black font-mono hover:bg-white/90 transition-all flex items-center gap-3 mx-auto"
            >
              <Mic className="w-5 h-5" />
              Run Diagnostic
            </button>
          </div>
        )}

        {isChecking && (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
            <p className="text-white/60 font-mono text-sm">Checking microphone...</p>
          </div>
        )}

        {!isChecking && results.hasGetUserMedia !== null && (
          <div className="space-y-4">
            {/* Browser Support */}
            <div className="flex items-center gap-3 p-3 border border-white/10">
              {results.hasGetUserMedia ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div className="flex-1">
                <p className="text-white font-mono text-sm">Browser Support</p>
                <p className="text-white/40 text-xs">
                  {results.hasGetUserMedia ? 'getUserMedia supported' : 'getUserMedia NOT supported'}
                </p>
              </div>
            </div>

            {/* Microphone Detection */}
            <div className="flex items-center gap-3 p-3 border border-white/10">
              {results.hasMicrophone ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div className="flex-1">
                <p className="text-white font-mono text-sm">Microphone Hardware</p>
                <p className="text-white/40 text-xs">
                  {results.hasMicrophone
                    ? `${results.microphones.length} microphone(s) found`
                    : 'No microphones detected'}
                </p>
              </div>
            </div>

            {/* List Microphones */}
            {results.microphones.length > 0 && (
              <div className="border border-white/10 p-3">
                <p className="text-white font-mono text-sm mb-2">Detected Devices:</p>
                {results.microphones.map((mic, i) => (
                  <div key={i} className="text-white/60 text-xs font-mono mb-1">
                    {i + 1}. {mic.label || `Microphone ${i + 1}`} ({mic.deviceId.slice(0, 8)}...)
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {results.error && (
              <div className="flex items-start gap-3 p-3 border border-red-500/30 bg-red-500/10">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-white font-mono text-sm">Error Detected</p>
                  <p className="text-red-400 text-xs mt-1">{results.error}</p>
                </div>
              </div>
            )}

            {/* Solutions */}
            {!results.hasMicrophone && (
              <div className="border border-yellow-500/30 bg-yellow-500/10 p-4">
                <p className="text-yellow-400 font-mono text-sm mb-2">💡 Solutions:</p>
                <ul className="text-yellow-400/80 text-xs space-y-1 list-disc ml-4">
                  <li>Connect a USB microphone or headset</li>
                  <li>Check your system audio settings</li>
                  <li>On Mac: System Settings → Sound → Input</li>
                  <li>On Windows: Settings → System → Sound</li>
                  <li>Make sure microphone is not disabled</li>
                  <li>Try a different browser (Chrome/Edge recommended)</li>
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={runDiagnostic}
                className="flex-1 px-4 py-2 bg-white/10 text-white font-mono text-sm hover:bg-white/20 transition-all"
              >
                Re-run Diagnostic
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-white text-black font-mono text-sm hover:bg-white/90 transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}