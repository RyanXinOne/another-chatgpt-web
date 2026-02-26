import type { Message, ResponseChunk } from '../types'

export declare namespace OpenAIAPI {
  type Model = 'gpt-5.2' | 'gpt-5.1'

  interface RequestOptions {
    model: OpenAIAPI.Model
    messages: Message[]
    temperature?: number
    top_p?: number
    callback: (chunk: ResponseChunk) => void
  }
}
