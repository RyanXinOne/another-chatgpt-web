import { ss } from '@/utils/storage'
import { t } from '@/locales'

const LOCAL_NAME = 'chatStorage'

export function defaultState(): Chat.State {
  const uuid = Date.now()
  return {
    active: uuid,
    history: [{ uuid, title: t('chat.newChatTitle'), isEdit: false }],
    chat: [{ uuid, data: [], usingContext: true }],
  }
}

export function getLocalState(): Chat.State {
  const localState = ss.get(LOCAL_NAME)
  return { ...defaultState(), ...localState }
}

export function setLocalState(state: Chat.State) {
  ss.set(LOCAL_NAME, state)
}
