import type { Message, ResponseChunk } from '../types'

export declare namespace OpenAIAPI {
  type Model = 'gpt-4.1' | 'o4-mini' | 'gpt-4o' | 'gpt-4o-mini'

  interface RequestOptions {
    model: OpenAIAPI.Model
    messages: Message[]
    temperature?: number
    top_p?: number
    callback: (chunk: ResponseChunk) => void
  }
}
