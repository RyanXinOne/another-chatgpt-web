import type { Message, Model } from './chatgpt/types'

export interface RequestProps {
  model: Model
  messages: Message[]
  temperature?: number
  top_p?: number
}
