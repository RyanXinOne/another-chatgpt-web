import type { Message } from './chatgpt/types'

export interface RequestProps {
  model: string
  messages: Message[]
  temperature?: number
  top_p?: number
}
