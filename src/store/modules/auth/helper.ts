import { ls } from '@/utils/storage'

const LOCAL_NAME = 'SECRET_TOKEN'

export function getToken() {
  return ls.get(LOCAL_NAME)
}

export function setToken(token: string) {
  return ls.set(LOCAL_NAME, token)
}

export function removeToken() {
  return ls.remove(LOCAL_NAME)
}
