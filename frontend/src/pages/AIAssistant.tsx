import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send, Bot, User, MessageSquare, Phone } from 'lucide-react'
import { aiAPI } from '../services/ai-api'
import type { ChatMessage } from '../types'
import Card from '../components/ui/Card'
import ToolCallDisplay from '../components/ai/ToolCallDisplay'
import VoiceCall from '../components/ai/VoiceCall'
import LoadingOverlay from '../components/LoadingOverlay'

const STORAGE_KEYS = {
  MESSAGES: 'libraryai_chat_messages',
  SESSION_ID: 'libraryai_session_id'
}

const DEFAULT_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hello! I'm your Library AI Assistant. I can help you add books and members, let members borrow and return books, search for information, and provide library statistics. How can I assist you today?",
  timestamp: new Date()
}

type AssistantMode = 'text' | 'voice'

export default function AIAssistant() {
  const [mode, setMode] = useState<AssistantMode>('text')
  const [voiceSessionId, setVoiceSessionId] = useState<string>('')
  const [isStartingCall, setIsStartingCall] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)

  // Load messages from localStorage on mount
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
    return [DEFAULT_MESSAGE]
  })

  const [input, setInput] = useState('')

  // Load session ID from localStorage on mount
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_ID)
      return stored || undefined
    } catch (error) {
      console.error('Failed to load session ID:', error)
      return undefined
    }
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }, [messages])

  // Save session ID to localStorage whenever it changes
  useEffect(() => {
    try {
      if (sessionId) {
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId)
      }
    } catch (error) {
      console.error('Failed to save session ID:', error)
    }
  }, [sessionId])

  const chatMutation = useMutation({
    mutationFn: aiAPI.chat,
    onSuccess: (data) => {
      setSessionId(data.session_id)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          tool_calls: data.tool_calls,
          timestamp: new Date()
        }
      ])
    },
    onError: (error: any) => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.response?.data?.detail || error.message || 'Something went wrong'}`,
          timestamp: new Date()
        }
      ])
    }
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || chatMutation.isPending) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    chatMutation.mutate({
      message: input,
      session_id: sessionId
    })
  }

  const clearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.MESSAGES)
      localStorage.removeItem(STORAGE_KEYS.SESSION_ID)
      setMessages([DEFAULT_MESSAGE])
      setSessionId(undefined)
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  const startVoiceCall = async () => {
    setIsStartingCall(true)
    setShowLoadingOverlay(true)

    try {
      // Show loading overlay for 3 seconds for the cool effect
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Generate session ID for voice call
      const sessionId = `voice_${Date.now()}_${Math.random().toString(36).substring(7)}`
      setVoiceSessionId(sessionId)
      setMode('voice')
    } catch (error) {
      console.error('Failed to start voice call:', error)
      alert('Failed to start voice call. Make sure the backend is running and Deepgram API key is configured.')
    } finally {
      setIsStartingCall(false)
      setShowLoadingOverlay(false)
    }
  }

  const endVoiceCall = async () => {
    console.log('🔙 Ending voice call from parent...')
    // VoiceCall component handles cleanup
    setMode('text')
    setVoiceSessionId('')
    console.log('✅ Switched back to text mode')
  }

  // If in voice mode, show voice UI
  if (mode === 'voice' && voiceSessionId) {
    return <VoiceCall sessionId={voiceSessionId} onEndCall={endVoiceCall} />
  }

  return (
    <>
      {showLoadingOverlay && <LoadingOverlay />}
      <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in-up">
      <div className="mb-6 animate-slide-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black border border-white/10 corner-brackets relative">
              <Bot className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white relative inline-block">
                AI Assistant
                <span className="absolute -bottom-1 left-0 w-full h-px bg-white/20"></span>
              </h1>
              <p className="text-xs text-white/60 mt-2 hologram">Intelligent library management powered by AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            {/* Mode Switcher */}
            <div className="flex items-center gap-2 bg-black border border-white/10 p-1 hover:border-white/20 transition-colors">
              <button
                onClick={() => setMode('text')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-all duration-300 ${
                  mode === 'text'
                    ? 'bg-white text-black font-medium'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Text Chat
              </button>
              <button
                onClick={startVoiceCall}
                disabled={isStartingCall}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-all duration-300 disabled:opacity-50 ${
                  mode === 'voice'
                    ? 'bg-green-500 text-white font-medium'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                {isStartingCall ? 'Connecting...' : 'Voice Call'}
              </button>
            </div>
            <button
              onClick={clearHistory}
              className="text-xs text-white/40 hover:text-white/80 px-3 py-1.5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/5"
            >
              Clear History
            </button>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden animate-slide-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 animate-fade-in-up ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex-shrink-0 w-8 h-8 border border-white/10 bg-black flex items-center justify-center hover:border-white/30 transition-colors">
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white animate-pulse" />
                )}
              </div>

              <div className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`px-4 py-2.5 transition-all duration-300 hover:shadow-lg ${
                  message.role === 'user'
                    ? 'bg-white text-black hover:bg-white/95'
                    : 'bg-black border border-white/10 text-white hover:border-white/20 hover:bg-white/5'
                }`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>

                {message.tool_calls && message.tool_calls.length > 0 && (
                  <div className="mt-2 animate-slide-in" style={{ animationDelay: '0.2s' }}>
                    <ToolCallDisplay toolCalls={message.tool_calls} />
                  </div>
                )}

                <p className="text-xs text-white/30 mt-1.5 hologram">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3 animate-fade-in-up">
              <div className="flex-shrink-0 w-8 h-8 border border-white/10 bg-black flex items-center justify-center relative">
                <Bot className="w-4 h-4 text-white animate-glitch" />
                <div className="absolute inset-0 border border-white/20 animate-ping"></div>
              </div>
              <div className="flex-1">
                <div className="px-4 py-2.5 bg-black border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white/80 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-white/80 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-white/80 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-white/60 hologram">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-white/10 p-6 relative">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to add books/members, borrow/return, or search..."
              disabled={chatMutation.isPending}
              className="flex-1 input-field disabled:opacity-50 hover:border-white/20 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed sci-fi-hover"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-white/40 hologram">
              GPT-4o-mini • LangChain • ChromaDB Vector Store
            </p>
            {sessionId && (
              <p className="text-xs text-white/30 hologram">
                Session: {sessionId.slice(0, 8)}...
              </p>
            )}
          </div>
        </form>
      </Card>
    </div>
    </>
  )
}
