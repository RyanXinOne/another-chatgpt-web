import { defineStore } from 'pinia'
import { defaultState, getLocalState, setLocalState } from './helper'
import { t } from '@/locales'

export const useChatStore = defineStore('chat-store', {
  state: (): Chat.State => getLocalState(),

  actions: {
    recordState() {
      setLocalState(this.$state)
    },

    setActive(uuid: number | null) {
      this.active = uuid
      this.recordState()
    },

    addHistoryAndChat() {
      const uuid = Date.now()
      this.history.unshift({ uuid, title: t('chat.newChatTitle'), isEdit: false })
      this.chat.unshift({ uuid, data: [], usingContext: true, draftPrompt: ''})
      this.recordState()
      this.setActive(uuid)
    },

    deleteHistoryAndChat(uuid: number | null) {
      const index = this.history.findIndex(item => item.uuid === uuid)
      if (index === -1)
        return

      this.history.splice(index, 1)
      this.chat.splice(index, 1)
      this.recordState()

      const next_uuid = this.history.length > 0 ? this.history[index > 0 ? index - 1 : 0].uuid : null
      this.setActive(next_uuid)
    },

    clearHistoryAndChat() {
      this.$state = { ...defaultState() }
      this.recordState()
    },

    getHistory(uuid: number | null): Chat.History | null {
      const index = this.history.findIndex(item => item.uuid === uuid)
      return index > -1 ? this.history[index] : null
    },

    updateHistory(uuid: number | null, history: Partial<Chat.History>) {
      const index = this.history.findIndex(item => item.uuid === uuid)
      if (index === -1)
        return
      this.history[index] = { ...this.history[index], ...history }
      this.recordState()
    },

    getChatUsingContext(uuid: number | null): boolean {
      const index = this.chat.findIndex(item => item.uuid === uuid)
      return index > -1 ? (this.chat[index].usingContext ?? true) : true
    },

    toggleChatUsingContext(uuid: number | null) {
      const index = this.chat.findIndex(item => item.uuid === uuid)
      if (index === -1)
        return
      this.chat[index].usingContext = !(this.chat[index].usingContext ?? true)
      this.recordState()
    },

    getChatMessages(uuid: number | null): Chat.Message[] {
      const index = this.chat.findIndex(item => item.uuid === uuid)
      return index > -1 ? this.chat[index].data : []
    },

    clearChatMessages(uuid: number | null) {
      const index = this.chat.findIndex(item => item.uuid === uuid)
      if (index === -1)
        return
      this.chat[index].data = []
      this.recordState()
    },

    getChatMessage(uuid: number | null, messageIndex: number): Chat.Message | null {
      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex === -1)
        return null
      return this.chat[chatIndex].data[messageIndex] ?? null
    },

    addChatMessage(uuid: number | null, message: Chat.Message) {
      const index = this.chat.findIndex(item => item.uuid === uuid)
      if (index === -1)
        return
      this.chat[index].data.push(message)
      if (this.history[index].title === t('chat.newChatTitle'))
        this.history[index].title = message.text
      this.recordState()
    },

    updateChatMessage(uuid: number | null, messageIndex: number, message: Partial<Chat.Message>) {
      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex === -1 || this.chat[chatIndex].data[messageIndex] === undefined)
        return
      this.chat[chatIndex].data[messageIndex] = { ...this.chat[chatIndex].data[messageIndex], ...message }
      this.recordState()
    },

    deleteChatMessage(uuid: number | null, messageIndex: number) {
      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex === -1)
        return
      this.chat[chatIndex].data.splice(messageIndex, 1)
      this.recordState()
    },

    getDraftPrompt(uuid: number | null): string {
      const index = this.chat.findIndex(item => item.uuid === uuid)
      return index > -1 ? this.chat[index].draftPrompt : ''
    },

    updateDraftPrompt(uuid: number | null, draftPrompt: string) {
      const index = this.chat.findIndex(item => item.uuid === uuid)
      if (index === -1)
        return
      this.chat[index].draftPrompt = draftPrompt
      this.recordState()
    },
  },
})
