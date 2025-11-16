import { useEffect, useState } from 'react'

interface LoadingOverlayProps {
  message?: string
}

export default function LoadingOverlay({ message = 'Initializing Voice AI' }: LoadingOverlayProps) {
  const [dots, setDots] = useState('')
  const [scanPosition, setScanPosition] = useState(0)

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)

    const scanInterval = setInterval(() => {
      setScanPosition(prev => (prev >= 100 ? 0 : prev + 2))
    }, 50)

    return () => {
      clearInterval(dotsInterval)
      clearInterval(scanInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(white 1px, transparent 1px),
              linear-gradient(90deg, white 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Scanning Line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-white opacity-30"
        style={{
          top: `${scanPosition}%`,
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
        }}
      />

      {/* Main Content */}
      <div className="relative">
        {/* Outer Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border border-white/20 rounded-full animate-spin" style={{ animationDuration: '8s' }}>
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />
          </div>
        </div>

        {/* Middle Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-white/30 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
            <div className="absolute top-1/2 left-0 w-2 h-2 bg-white rounded-full -translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 right-0 w-2 h-2 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
        </div>

        {/* Inner Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 border border-white/40 rounded-full animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 border border-white/20 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>
        </div>

        {/* Center Core */}
        <div className="w-64 h-64 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Pulsing Center */}
            <div className="w-16 h-16 bg-black border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full animate-pulse" />
              <div className="absolute inset-0 w-16 h-16 border border-white/30 rounded-full animate-ping" />
            </div>

            {/* Corner Brackets */}
            <div className="absolute -top-6 -left-6 w-4 h-4 border-l-2 border-t-2 border-white animate-pulse" />
            <div className="absolute -top-6 -right-6 w-4 h-4 border-r-2 border-t-2 border-white animate-pulse" />
            <div className="absolute -bottom-6 -left-6 w-4 h-4 border-l-2 border-b-2 border-white animate-pulse" />
            <div className="absolute -bottom-6 -right-6 w-4 h-4 border-r-2 border-b-2 border-white animate-pulse" />
          </div>

          {/* Status Text */}
          <div className="mt-12 text-center">
            <div className="text-white font-mono text-lg tracking-wider mb-2">
              {message}{dots}
            </div>
            <div className="flex items-center justify-center gap-1 mt-4">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Data Stream Effect */}
      <div className="absolute bottom-10 left-10 font-mono text-white/20 text-xs">
        <div className="animate-pulse">SYS.INIT</div>
        <div className="animate-pulse" style={{ animationDelay: '100ms' }}>AUDIO.STREAM.READY</div>
        <div className="animate-pulse" style={{ animationDelay: '200ms' }}>GEMINI.CONNECT</div>
      </div>

      <div className="absolute top-10 right-10 font-mono text-white/20 text-xs text-right">
        <div className="animate-pulse">MIC.STATUS.CHECK</div>
        <div className="animate-pulse" style={{ animationDelay: '150ms' }}>PERMISSION.REQUEST</div>
        <div className="animate-pulse" style={{ animationDelay: '300ms' }}>VOICE.ENGINE.LOAD</div>
      </div>
    </div>
  )
}