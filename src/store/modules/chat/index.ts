import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { getChatData, getChatState, setChatData,  setChatState } from './helper'
import { t } from '@/locales'

export const useChatStore = defineStore('chat-store', {
  state: (): Chat => {
    return {
      state: getChatState(),
      data: getChatData(),
    }
  },

  getters: {
    active: state => state.state.active,
    history: state => state.state.history,
  },

  actions: {
    setActive(cid: CID | null) {
      this.state.active = cid
      setChatState(this.state)
    },

    addConversation() {
      const cid: CID = uuidv4()
      this.state.active = cid
      this.state.history.unshift(cid)
      this.state.conversations[cid] = { draftPrompt: '', usingContext: true }
      this.data[cid] = { title: t('chat.newChatTitle'), messages: [] }
      setChatState(this.state)
      setChatData(this.data)
    },

    deleteConversation(cid: CID | null) {
      if (cid === null)
        return
      const index = this.state.history.findIndex(item => item === cid)
      this.state.history.splice(index, 1)
      delete this.state.conversations[cid]
      delete this.data[cid]
      const next_uuid = this.state.history.length > 0 ? this.state.history[index > 0 ? index - 1 : 0] : null
      this.state.active = next_uuid
      setChatState(this.state)
      setChatData(this.data)
    },

    clearConversations() {
      this.state.active = null
      this.state.history = []
      this.state.conversations = {}
      this.data = {}
      setChatState(this.state)
      setChatData(this.data)
    },

    getDraftPrompt(cid: CID | null): string {
      if (cid === null)
        return ''
      return this.state.conversations[cid].draftPrompt
    },

    updateDraftPrompt(cid: CID | null, draftPrompt: string) {
      if (cid === null)
        return
      this.state.conversations[cid].draftPrompt = draftPrompt
      setChatState(this.state)
    },

    getUsingContext(cid: CID | null): boolean {
      if (cid === null)
        return true
      return this.state.conversations[cid].usingContext
    },

    toggleUsingContext(cid: CID | null) {
      if (cid === null)
        return
      this.state.conversations[cid].usingContext = !this.state.conversations[cid].usingContext
      setChatState(this.state)
    },

    getTitle(cid: CID | null): string {
      if (cid === null)
        return ''
      return this.data[cid].title
    },

    setTitle(cid: CID | null, title: string) {
      if (cid === null)
        return
      this.data[cid].title = title
      setChatData(this.data)
    },

    getMessages(cid: CID | null): ChatData.Message[] {
      if (cid === null)
        return []
      return this.data[cid].messages
    },

    clearMessages(cid: CID | null) {
      if (cid === null)
        return
      this.data[cid].messages = []
      setChatData(this.data)
    },

    getMessage(cid: CID | null, messageIndex: number): ChatData.Message | null {
      if (cid === null)
        return null
      return this.data[cid].messages[messageIndex]
    },

    addMessage(cid: CID | null, message: ChatData.Message) {
      if (cid === null)
        return
      this.data[cid].messages.push(message)
      if (this.data[cid].title === t('chat.newChatTitle'))
        this.data[cid].title = message.text
      setChatData(this.data)
    },

    updateMessage(cid: CID | null, messageIndex: number, message: Partial<ChatData.Message>) {
      if (cid === null)
        return
      this.data[cid].messages[messageIndex] = { ...this.data[cid].messages[messageIndex], ...message }
      setChatData(this.data)
    },

    deleteMessage(cid: CID | null, messageIndex: number) {
      if (cid === null)
        return
      this.data[cid].messages.splice(messageIndex, 1)
      setChatData(this.data)
    },

    import(state: Chat) {
      this.state = state.state
      this.data = state.data
      setChatState(this.state)
      setChatData(this.data)
    },

    export(): Chat {
      return this.$state
    },
  },
})
