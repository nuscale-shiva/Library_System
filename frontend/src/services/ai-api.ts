import api from './api'
import type { ChatRequest, ChatResponse } from '../types'

export const aiAPI = {
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post('/ai/chat', request)
    return response.data
  },

  clearSession: async (sessionId: string): Promise<void> => {
    await api.post(`/ai/sessions/${sessionId}/clear`)
  },

  refreshRAG: async (): Promise<void> => {
    await api.post('/ai/rag/refresh')
  },

  healthCheck: async (): Promise<{ status: string; service: string; version: string }> => {
    const response = await api.get('/ai/health')
    return response.data
  }
}
