import { ls } from '@/utils/storage'

const CHAT_STATE_STORAGE = 'chatStateStorage'
const CHAT_DATA_STORAGE = 'chatDataStorage'

const defaultChat: Chat = {
  state: {
    active: null,
    history: [],
    conversations: {},
  },
  data: {},
}

export function getChatState(): ChatState.Main {
  return ls.get(CHAT_STATE_STORAGE) || defaultChat.state
}

export function setChatState(state: ChatState.Main) {
  ls.set(CHAT_STATE_STORAGE, state)
}

export function getChatData(): ChatData.Main {
  return ls.get(CHAT_DATA_STORAGE) || defaultChat.data
}

export function setChatData(data: ChatData.Main) {
  ls.set(CHAT_DATA_STORAGE, data)
}
