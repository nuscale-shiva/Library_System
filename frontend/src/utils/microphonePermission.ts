/**
 * Production-ready microphone permission handler
 * Handles various browser quirks and edge cases
 */

export interface MicPermissionStatus {
  granted: boolean
  state: 'granted' | 'denied' | 'prompt' | 'unsupported' | 'error'
  message?: string
  canRetry: boolean
}

/**
 * Check current microphone permission status without triggering prompt
 */
export async function checkMicrophonePermission(): Promise<MicPermissionStatus> {
  try {
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        granted: false,
        state: 'unsupported',
        message: 'Your browser does not support microphone access. Please use Chrome, Edge, or Firefox.',
        canRetry: false
      }
    }

    // Check if we're on HTTPS (required for getUserMedia in production)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return {
        granted: false,
        state: 'error',
        message: 'Microphone access requires HTTPS. Please use a secure connection.',
        canRetry: false
      }
    }

    // Try to check permission status if available (not all browsers support this)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })

        if (result.state === 'granted') {
          return {
            granted: true,
            state: 'granted',
            canRetry: false
          }
        } else if (result.state === 'denied') {
          return {
            granted: false,
            state: 'denied',
            message: 'Microphone access was previously denied. Please check your browser settings.',
            canRetry: false
          }
        } else {
          return {
            granted: false,
            state: 'prompt',
            message: 'Click to request microphone permission',
            canRetry: true
          }
        }
      } catch (permError) {
        // Permissions API not fully supported, assume we need to prompt
        console.log('Permissions API not available, will prompt on request')
      }
    }

    // Default: assume we need to prompt
    return {
      granted: false,
      state: 'prompt',
      message: 'Click to request microphone permission',
      canRetry: true
    }
  } catch (error) {
    console.error('Error checking microphone permission:', error)
    return {
      granted: false,
      state: 'error',
      message: 'Failed to check microphone permission',
      canRetry: true
    }
  }
}

/**
 * Request microphone permission - GUARANTEED to show browser prompt
 */
export async function requestMicrophonePermission(): Promise<MicPermissionStatus> {
  console.log('🎤 Requesting microphone permission...')

  // DIRECTLY call getUserMedia - this WILL trigger the browser prompt
  try {
    // This WILL show the browser permission dialog
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100  // Higher quality audio
      }
    })

    console.log('✅ Microphone permission granted!')

    // Important: Stop the stream immediately after getting permission
    stream.getTracks().forEach(track => {
      track.stop()
      console.log('🛑 Stopped audio track:', track.label)
    })

    return {
      granted: true,
      state: 'granted',
      message: 'Microphone access granted',
      canRetry: false
    }

  } catch (error: any) {
    console.error('❌ Microphone permission error:', error)

    // Handle specific error cases
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      // User clicked "Block" in the permission dialog
      return {
        granted: false,
        state: 'denied',
        message: `Microphone blocked! To fix:
1. Click the 🔒 icon in your browser's address bar
2. Find "Microphone" and change to "Allow"
3. Refresh this page
4. Try again`,
        canRetry: false
      }
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      // No microphone hardware detected
      return {
        granted: false,
        state: 'error',
        message: `No microphone detected!

Please try:
1. Connect a microphone/headset to your computer
2. Check System Settings → Sound → Input (Mac) or Sound Settings (Windows)
3. Make sure your microphone is not muted in system settings
4. If using Bluetooth, ensure it's connected
5. Try refreshing the page after connecting

If you have a built-in mic, it might be disabled in system settings.`,
        canRetry: true
      }
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      // Microphone is being used by another app
      return {
        granted: false,
        state: 'error',
        message: 'Microphone is busy! Close other apps using the microphone (Zoom, Teams, etc.) and try again.',
        canRetry: true
      }
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      // Try again with simpler constraints
      try {
        console.log('Retrying with basic constraints...')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        return {
          granted: true,
          state: 'granted',
          message: 'Microphone access granted',
          canRetry: false
        }
      } catch (retryError: any) {
        return {
          granted: false,
          state: 'error',
          message: 'Microphone configuration error. Please try again.',
          canRetry: true
        }
      }
    } else if (error.name === 'AbortError' || error.name === 'SecurityError') {
      return {
        granted: false,
        state: 'error',
        message: 'Security error! Make sure you are on a secure connection (HTTPS or localhost).',
        canRetry: true
      }
    } else {
      // Unknown error
      return {
        granted: false,
        state: 'error',
        message: `Error: ${error.name || error.message || 'Unknown error'}. Please try again.`,
        canRetry: true
      }
    }
  }
}

/**
 * Initialize speech recognition with proper error handling
 */
export function initializeSpeechRecognition() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognition) {
    throw new Error('Speech recognition not supported in this browser. Please use Chrome or Edge.')
  }

  const recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'
  recognition.maxAlternatives = 1

  return recognition
}

/**
 * Get browser and device info for debugging
 */
export function getDeviceInfo() {
  const userAgent = navigator.userAgent
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)
  const isEdge = /Edg/.test(userAgent)
  const isFirefox = /Firefox/.test(userAgent)
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)

  return {
    browser: isChrome ? 'Chrome' : isEdge ? 'Edge' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Unknown',
    isMobile,
    isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    hasSpeechRecognition: !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition,
    hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    userAgent: userAgent
  }
}

/**
 * Test microphone with visual feedback
 */
export async function testMicrophone(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Create audio context to check if microphone is working
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const microphone = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()

    microphone.connect(analyser)
    analyser.fftSize = 256

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Check audio levels
    analyser.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b) / bufferLength

    // Cleanup
    microphone.disconnect()
    audioContext.close()
    stream.getTracks().forEach(track => track.stop())

    console.log(`🎤 Microphone test: Average level = ${average}`)
    return average > 0 // Return true if we're getting audio data
  } catch (error) {
    console.error('Microphone test failed:', error)
    return false
  }
}