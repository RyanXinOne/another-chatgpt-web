import type { Message, ResponseChunk } from '../types'

export declare namespace OpenAIAPI {
  type Model = 'gpt-4o' | 'gpt-4o-mini'

  interface RequestOptions {
    model: OpenAIAPI.Model
    messages: Message[]
    temperature?: number
    top_p?: number
    user?: string
    callback: (chunk: ResponseChunk) => void
  }
}
