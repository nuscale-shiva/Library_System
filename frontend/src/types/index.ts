export interface Book {
  id: number
  title: string
  author: string
  isbn: string
  available: boolean
  created_at: string
}

export interface BookCreate {
  title: string
  author: string
  isbn: string
}

export interface BookUpdate {
  title?: string
  author?: string
  isbn?: string
  available?: boolean
}

export interface Member {
  id: number
  name: string
  email: string
  phone?: string
  created_at: string
}

export interface MemberCreate {
  name: string
  email: string
  phone?: string
}

export interface MemberUpdate {
  name?: string
  email?: string
  phone?: string
}

export interface Borrow {
  id: number
  book_id: number
  member_id: number
  borrowed_at: string
  returned_at?: string
  is_returned: boolean
}

export interface BorrowCreate {
  book_id: number
  member_id: number
}

export interface ToolCall {
  tool: string
  input: any
  output: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  tool_calls?: ToolCall[]
  timestamp: Date
}

export interface ChatRequest {
  message: string
  session_id?: string
}

export interface ChatResponse {
  response: string
  tool_calls: ToolCall[]
  session_id: string
}

export interface LibraryStats {
  total_books: number
  available_books: number
  borrowed_books: number
  total_members: number
  active_borrows: number
}
