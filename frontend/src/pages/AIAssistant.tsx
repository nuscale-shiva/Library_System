import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send, Bot, User, Sparkles, Loader } from 'lucide-react'
import { aiAPI } from '../services/ai-api'
import type { ChatMessage } from '../types'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ToolCallDisplay from '../components/ai/ToolCallDisplay'

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your Library AI Assistant. I can help you search for books, get recommendations, check availability, and provide library statistics. How can I assist you today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-75 animate-pulse"></div>
            <div className="relative p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="gradient-text">AI Assistant</span>
            </h1>
            <p className="text-gray-400">Intelligent library management powered by AI</p>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none"></div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-4 animate-fade-in ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`flex-shrink-0 ${
                message.role === 'user'
                  ? 'w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 p-[2px]'
                  : 'w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]'
              }`}>
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  )}
                </div>
              </div>

              <div className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`rounded-2xl px-5 py-3.5 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 text-white'
                    : 'glass text-gray-100'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>

                {message.tool_calls && message.tool_calls.length > 0 && (
                  <div className="mt-3">
                    <ToolCallDisplay toolCalls={message.tool_calls} />
                  </div>
                )}

                <p className="text-xs text-gray-600 mt-2 px-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-4 animate-fade-in">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <div className="rounded-2xl px-5 py-3.5 glass">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-white/10 p-6 relative">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-purple-500/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="relative flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about books, members, or library statistics..."
              disabled={chatMutation.isPending}
              className="flex-1 px-5 py-3 rounded-xl glass text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="px-6 shadow-lg shadow-purple-500/30"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-600">
              Powered by GPT-4o-mini with LangChain and RAG
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-gray-600">AI Online</span>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
