import type { ChatCompletionChunk } from 'openai/src/resources/chat'

export type Model = 'gpt-4o' | 'gpt-3.5-turbo'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface RequestOptions {
  model: Model
  messages: Message[]
  temperature?: number
  top_p?: number
  callback: (chunk: ChatCompletionChunk) => void
}

export interface ModelContext {
  max_context_tokens: number
  max_response_tokens: number
}
