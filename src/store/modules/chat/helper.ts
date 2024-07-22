import { ls } from '@/utils/storage'
import { v4 as uuidv4 } from 'uuid'

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

function migrateLegacyChatStore(legacyStore: LegacyChat.State): Chat {
  let store: Chat = {
    state: {
      active: null,
      history: [],
      conversations: {},
    },
    data: {},
  }

  for (const legacyHistory of legacyStore.history) {
    const cIndex = legacyStore.chat.findIndex(c => c.uuid === legacyHistory.uuid)
    if (cIndex === -1)
      continue
    const legacyChat = legacyStore.chat[cIndex]

    const cid: CID = uuidv4()
    if (legacyHistory.uuid === legacyStore.active)
      store.state.active = cid
    store.state.history.push(cid)
    store.state.conversations[cid] = {
      draftPrompt: legacyChat.draftPrompt ?? '',
      usingContext: legacyChat.usingContext ?? true,
    }
    store.data[cid] = { title: legacyHistory.title, messages: [] }
    for (const message of legacyChat.data) {
      store.data[cid].messages.push({
        mid: uuidv4(),
        dateTime: message.dateTime,
        text: message.text,
        inversion: message.inversion as boolean,
        error: message.error ?? false,
      })
    }
  }

  return store
}

const LEGACY_CHAT_STORAGE = 'chatStorage'
const legacyChatStore = ls.get(LEGACY_CHAT_STORAGE)
if (legacyChatStore) {
  try {
    const migratedChatStore = migrateLegacyChatStore(legacyChatStore)
    ls.remove(LEGACY_CHAT_STORAGE)
    setChatState(migratedChatStore.state)
    setChatData(migratedChatStore.data)
  } catch (e) {
    ls.set(LEGACY_CHAT_STORAGE, legacyChatStore)
    console.error('Failed to migrate from legacy chat store:', e)
  }
}
