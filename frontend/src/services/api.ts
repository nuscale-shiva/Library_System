import axios from 'axios'
import type {
  Book, BookCreate, BookUpdate,
  Member, MemberCreate, MemberUpdate,
  Borrow, BorrowCreate
} from '../types'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const booksAPI = {
  getAll: async (availableOnly = false): Promise<Book[]> => {
    const response = await api.get(`/books`, { params: { available_only: availableOnly } })
    return response.data
  },

  getOne: async (id: number): Promise<Book> => {
    const response = await api.get(`/books/${id}`)
    return response.data
  },

  create: async (data: BookCreate): Promise<Book> => {
    const response = await api.post('/books', data)
    return response.data
  },

  update: async (id: number, data: BookUpdate): Promise<Book> => {
    const response = await api.put(`/books/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/books/${id}`)
  }
}

export const membersAPI = {
  getAll: async (): Promise<Member[]> => {
    const response = await api.get('/members')
    return response.data
  },

  getOne: async (id: number): Promise<Member> => {
    const response = await api.get(`/members/${id}`)
    return response.data
  },

  create: async (data: MemberCreate): Promise<Member> => {
    const response = await api.post('/members', data)
    return response.data
  },

  update: async (id: number, data: MemberUpdate): Promise<Member> => {
    const response = await api.put(`/members/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/members/${id}`)
  }
}

export const borrowsAPI = {
  getAll: async (activeOnly = false): Promise<Borrow[]> => {
    const response = await api.get('/borrow', { params: { active_only: activeOnly } })
    return response.data
  },

  getOne: async (id: number): Promise<Borrow> => {
    const response = await api.get(`/borrow/${id}`)
    return response.data
  },

  create: async (data: BorrowCreate): Promise<Borrow> => {
    const response = await api.post('/borrow', data)
    return response.data
  },

  return: async (id: number): Promise<Borrow> => {
    const response = await api.post(`/borrow/${id}/return`)
    return response.data
  }
}

export default api
