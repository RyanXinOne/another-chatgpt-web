export interface PostMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type StopReason = 'end' | 'length' | 'others'

export interface ResponseChunk {
  delta_text?: string
  stop_reason?: StopReason
  error?: string
}
