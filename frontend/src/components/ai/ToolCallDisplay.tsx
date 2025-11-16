import { Wrench } from 'lucide-react'
import type { ToolCall } from '../../types'

interface ToolCallDisplayProps {
  toolCalls: ToolCall[]
}

export default function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  if (!toolCalls || toolCalls.length === 0) return null

  const getToolIcon = (toolName: string) => {
    const icons: Record<string, string> = {
      search_books: 'SEARCH',
      check_book_availability: 'CHECK',
      get_member_borrow_history: 'HISTORY',
      get_library_statistics: 'STATS',
      get_all_available_books: 'LIST',
      get_all_books: 'BOOKS',
      get_all_members: 'MEMBERS',
      add_book: 'ADD_BOOK',
      update_book: 'UPDATE_BOOK',
      delete_book: 'DELETE_BOOK',
      add_member: 'ADD_MEMBER',
      update_member: 'UPDATE_MEMBER',
      delete_member: 'DELETE_MEMBER',
      create_borrow: 'BORROW',
      return_book: 'RETURN'
    }
    return icons[toolName] || 'TOOL'
  }

  const formatToolName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="mt-2 space-y-1.5">
      {toolCalls.map((call, idx) => (
        <details key={idx} className="bg-black border border-white/10">
          <summary className="px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-2">
            <span className="text-xs font-mono text-white/60">[{getToolIcon(call.tool)}]</span>
            <span className="text-xs text-white/80">{formatToolName(call.tool)}</span>
            <Wrench className="w-3 h-3 ml-auto text-white/30" />
          </summary>
          <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/10">
            <div>
              <p className="text-xs text-white/40 mb-1">INPUT:</p>
              <pre className="bg-black border border-white/10 p-2 text-xs overflow-x-auto text-white/80 font-mono">
                {typeof call.input === 'string'
                  ? call.input
                  : JSON.stringify(call.input, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">OUTPUT:</p>
              <pre className="bg-black border border-white/10 p-2 text-xs overflow-x-auto max-h-40 overflow-y-auto text-white/80 font-mono scrollbar-thin">
                {call.output}
              </pre>
            </div>
          </div>
        </details>
      ))}
    </div>
  )
}
