export interface PostMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}