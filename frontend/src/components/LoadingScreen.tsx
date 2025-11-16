import { useState, useEffect } from 'react'

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const duration = 2500 // 2.5 seconds total loading time
    const steps = 100
    const interval = duration / steps

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 200) // Small delay before showing content
          return 100
        }
        return prev + 1
      })
    }, interval)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full max-w-2xl px-8">
        <div className="space-y-8">
          <div>
            <p className="text-zinc-500 text-sm font-mono mb-2">
              The Correct Way To Launch
            </p>
            <h1 className="text-6xl font-bold text-white font-mono mb-8">
              LibraryAI
            </h1>
          </div>

          <div>
            <p className="text-zinc-400 text-sm font-mono mb-4">
              Connecting to neural networks
            </p>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-bold text-white font-mono">
                {progress}%
              </span>
              <span className="text-zinc-600 text-sm font-mono">
                +{progress}% since you last checked
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1 h-8">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 transition-all duration-100 ${
                    i < (progress / 100) * 40
                      ? 'bg-white'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
