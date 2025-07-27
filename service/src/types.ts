import type { OpenAIAPI } from './openai/types'

export type Model = OpenAIAPI.Model

export type MessageContentTypes = 
  | { type: 'input_text', text: string }
  | { type: 'output_text', text: string }
  | { type: 'input_image', image_url: string }
  | { type: 'input_file', filename: string, file_data: string }

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: MessageContentTypes[]
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
  model_name: string
  max_context_tokens: number
  max_response_tokens: number
}

export interface Usage {
  input_tokens: number
  output_tokens: number
  total_tokens: number
}
