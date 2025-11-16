import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in-up">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in-up"
        onClick={onClose}
      />
      <div className={cn(
        'relative w-full mx-4 bg-black border border-white/20',
        'shadow-2xl animate-fade-in-up corner-brackets',
        'hover:border-white/30 transition-all duration-300',
        sizes[size]
      )}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white uppercase relative inline-block">
            {title}
            <span className="absolute -bottom-1 left-0 w-full h-px bg-white/20"></span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300"
          >
            <X className="w-4 h-4 text-white/60 hover:text-white" />
          </button>
        </div>
        <div className="p-6 relative">
          {children}
          <div className="absolute top-0 right-0 w-2 h-2 bg-white/40 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
