import api from './api'

export interface VoiceMessageRequest {
  message: string
  session_id?: string
  is_first_message?: boolean
}

export interface VoiceMessageResponse {
  response: string
  tool_calls: any[]
  session_id: string
  conversation_turn?: number
}

export interface CallStartResponse {
  session_id: string
  assistant_id?: string
  call_id?: string
  web_call_url?: string
  web_token?: string
  greeting: string
  vapi_configured: boolean
}

export interface ToolExecutionRequest {
  tool_name: string
  tool_params: Record<string, any>
  session_id: string
}

export const voiceAPI = {
  /**
   * Start a new voice call session
   */
  startCall: async (sessionId?: string): Promise<CallStartResponse> => {
    try {
      const response = await api.post('/ai/voice/start', null, {
        params: { session_id: sessionId }
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to start voice call:', error)
      throw error
    }
  },

  /**
   * Send a voice message (transcribed text)
   */
  sendMessage: async (request: VoiceMessageRequest): Promise<VoiceMessageResponse> => {
    try {
      const response = await api.post('/ai/voice/chat', request)
      return response.data
    } catch (error: any) {
      console.error('Failed to send voice message:', error)
      throw error
    }
  },

  /**
   * Execute a tool after confirming with user
   */
  executeTool: async (request: ToolExecutionRequest) => {
    try {
      const response = await api.post('/ai/voice/execute-tool', request)
      return response.data
    } catch (error: any) {
      console.error('Failed to execute tool:', error)
      throw error
    }
  },

  /**
   * End a voice call session
   */
  endCall: async (sessionId: string) => {
    try {
      const response = await api.post(`/ai/voice/sessions/${sessionId}/end`)
      return response.data
    } catch (error: any) {
      console.error('Failed to end call:', error)
      throw error
    }
  },

  /**
   * Check voice AI health status
   */
  healthCheck: async () => {
    try {
      const response = await api.get('/ai/voice/health')
      return response.data
    } catch (error: any) {
      console.error('Voice health check failed:', error)
      throw error
    }
  }
}

/**
 * WebSocket client for real-time voice streaming
 */
export class VoiceStreamClient {
  private ws: WebSocket | null = null
  private sessionId: string

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  connect(
    onMessage: (data: any) => void,
    onError?: (error: Event) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:8000/ai/voice/stream/${this.sessionId}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('Voice stream connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        if (onError) {
          onError(error)
        }
        reject(error)
      }

      this.ws.onclose = () => {
        console.log('Voice stream disconnected')
      }
    })
  }

  sendText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'text',
        data: text,
        timestamp: new Date().toISOString()
      }))
    }
  }

  sendAudio(audioData: Blob) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Convert blob to base64 or array buffer for sending
      const reader = new FileReader()
      reader.onload = () => {
        this.ws?.send(JSON.stringify({
          type: 'audio',
          data: reader.result,
          timestamp: new Date().toISOString()
        }))
      }
      reader.readAsDataURL(audioData)
    }
  }

  sendControl(command: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'control',
        data: command,
        timestamp: new Date().toISOString()
      }))
    }
  }

  disconnect() {
    if (this.ws) {
      this.sendControl('end_call')
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}
