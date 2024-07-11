import { ls } from '@/utils/storage'

const LOCAL_NAME = 'userStorage'

export interface UserInfo {
  avatar: string
  name: string
  description: string
}

export interface UserState {
  userInfo: UserInfo
}

export function defaultSetting(): UserState {
  return {
    userInfo: {
      avatar: 'https://raw.githubusercontent.com/RyanXinOne/another-chatgpt-web/main/src/assets/avatar.jpg',
      name: 'You',
      description: 'Come to chat!',
    },
  }
}

export function getLocalState(): UserState {
  const localSetting: UserState | undefined = ls.get(LOCAL_NAME)
  return { ...defaultSetting(), ...localSetting }
}

export function setLocalState(setting: UserState): void {
  ls.set(LOCAL_NAME, setting)
}
