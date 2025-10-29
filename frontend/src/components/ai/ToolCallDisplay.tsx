import { Tool } from 'lucide-react'
import { ToolCall } from '../../types'

interface ToolCallDisplayProps {
  toolCalls: ToolCall[]
}

export default function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  if (!toolCalls || toolCalls.length === 0) return null

  const getToolIcon = (toolName: string) => {
    const icons: Record<string, string> = {
      search_books: '🔍',
      recommend_books: '✨',
      check_book_availability: '📚',
      get_member_borrow_history: '📋',
      get_library_statistics: '📊',
      get_all_available_books: '📖'
    }
    return icons[toolName] || '🔧'
  }

  const formatToolName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="mt-3 space-y-2">
      {toolCalls.map((call, idx) => (
        <details key={idx} className="bg-dark-bg/50 rounded-lg border border-dark-border">
          <summary className="px-3 py-2 cursor-pointer hover:bg-dark-hover transition-colors flex items-center gap-2">
            <span className="text-lg">{getToolIcon(call.tool)}</span>
            <span className="text-sm font-medium">{formatToolName(call.tool)}</span>
            <Tool className="w-3 h-3 ml-auto text-gray-500" />
          </summary>
          <div className="px-3 pb-3 pt-1 space-y-2 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Input:</p>
              <pre className="bg-dark-surface p-2 rounded text-xs overflow-x-auto">
                {typeof call.input === 'string'
                  ? call.input
                  : JSON.stringify(call.input, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Output:</p>
              <pre className="bg-dark-surface p-2 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                {call.output}
              </pre>
            </div>
          </div>
        </details>
      ))}
    </div>
  )
}
