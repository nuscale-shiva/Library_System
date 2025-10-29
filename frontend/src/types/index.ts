export type Book = {
  id: number
  title: string
  author: string
  isbn: string
  available: boolean
  created_at: string
}

export type BookCreate = {
  title: string
  author: string
  isbn: string
}

export type BookUpdate = {
  title?: string
  author?: string
  isbn?: string
  available?: boolean
}

export type Member = {
  id: number
  name: string
  email: string
  phone?: string
  created_at: string
}

export type MemberCreate = {
  name: string
  email: string
  phone?: string
}

export type MemberUpdate = {
  name?: string
  email?: string
  phone?: string
}

export type Borrow = {
  id: number
  book_id: number
  member_id: number
  borrowed_at: string
  returned_at?: string
  is_returned: boolean
}

export type BorrowCreate = {
  book_id: number
  member_id: number
}

export type ToolCall = {
  tool: string
  input: any
  output: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  tool_calls?: ToolCall[]
  timestamp: Date
}

export type ChatRequest = {
  message: string
  session_id?: string
}

export type ChatResponse = {
  response: string
  tool_calls: ToolCall[]
  session_id: string
}

export type LibraryStats = {
  total_books: number
  available_books: number
  borrowed_books: number
  total_members: number
  active_borrows: number
}