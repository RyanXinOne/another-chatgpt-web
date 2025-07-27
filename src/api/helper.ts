export type MessageContentTypes = 
  | { type: 'input_text', text: string }
  | { type: 'output_text', text: string }
  | { type: 'input_image', image_url: string }
  | { type: 'input_file', filename: string, file_data: string }

export interface PostMessage {
  role: 'system' | 'user' | 'assistant'
  content: MessageContentTypes[]
}

export type StopReason = 'end' | 'length' | 'others'

export interface ResponseChunk {
  delta_text?: string
  stop_reason?: StopReason
  error?: string
}
