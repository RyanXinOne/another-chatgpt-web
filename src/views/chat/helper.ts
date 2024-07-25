import { getEncoding } from 'js-tiktoken'
import { useChatStore, useSettingStore } from '@/store'
import { t } from '@/locales'
import { fetchChatAPIProcess } from '@/api'
import type { PostMessage } from '@/api/helper'

const chatStore = useChatStore()
const settingStore = useSettingStore()

export function buildContextMessages(cid: CID | null, startIndex?: number, endIndex?: number, systemMsg: boolean = true, maxTokens: number = 128000): PostMessage[] {
  const sourceMessages = chatStore.getMessages(cid)

  startIndex = startIndex !== undefined ? Math.max(0, startIndex) : 0
  endIndex = endIndex !== undefined ? Math.min(sourceMessages.length, endIndex) : sourceMessages.length

  const encoding = getEncoding('cl100k_base')
  const tokens_per_message = 3
  const count_message_token = (message: PostMessage) => {
    let tokens = tokens_per_message
    tokens += encoding.encode(message.role).length
    tokens += encoding.encode(message.content).length
    return tokens
  }
  let estimated_tokens = 3

  const systemMessage: PostMessage = { role: 'system', content: settingStore.systemMessage }
  if (systemMsg)
    estimated_tokens += count_message_token(systemMessage)

  const messages: PostMessage[] = []
  for (let i = endIndex - 1; i >= startIndex; i--) {
    const item = sourceMessages[i]
    if (!item.error) {
      const message: PostMessage = {
        role: item.inversion ? 'user' : 'assistant',
        content: item.text,
      }
      estimated_tokens += count_message_token(message)
      if (estimated_tokens > maxTokens)
        break
      messages.push(message)
    }
  }
  if (systemMsg)
    messages.push(systemMessage)
  messages.reverse()
  return messages
}

export async function generateTitle(cid: CID | null) {
  chatStore.setTitle(cid, t('chat.thinking'))

  let messages: PostMessage[] = buildContextMessages(cid, undefined, undefined, false)
  messages.push({ role: 'system', content: 'Extract keywords from above messages to generate a summary title of the conversation topic. Respond as briefly as possible and do not add heading.' })
  try {
    await fetchChatAPIProcess<ConversationResponse>({
      model: 'gpt-4o',
      messages,
      temperature: 0,
      top_p: 1,
      onDownloadProgress: ({ event }) => {
        const xhr = event.target
        const { responseText } = xhr
        try {
          const chunks = responseText.trim().split('\n')
          const data: ConversationResponse[] = chunks.map((chunk: string) => JSON.parse(chunk))
          const text = data.map((response) => response.choices[0]?.delta?.content || '').join('')
          chatStore.setTitle(cid, text)
        }
        catch { }
      },
    })
  }
  catch {
    if (chatStore.getTitle(cid) === t('chat.thinking'))
      chatStore.setTitle(cid, t('chat.newChatTitle'))
  }
}
