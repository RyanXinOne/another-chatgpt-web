import type { ChatCompletionChunk } from 'openai/src/resources/chat'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface RequestOptions {
  model: string
  messages: Message[]
  temperature?: number
  top_p?: number
  callback: (chunk: ChatCompletionChunk) => void
}
