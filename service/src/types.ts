import type { OpenAIAPI } from './openai/types'

export type Model = OpenAIAPI.Model

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface RequestProps {
  model: Model
  messages: Message[]
  temperature?: number
  top_p?: number
}

export type StopReason = 'end' | 'length' | 'others'

export interface ResponseChunk {
  delta_text?: string
  stop_reason?: StopReason
  error?: string
}

export interface TokenLimit {
  max_context_tokens: number
  max_response_tokens: number
}

export interface Usage {
  prompt_tokens: number
  completion_tokens: number
}
