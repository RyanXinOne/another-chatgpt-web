import type { AxiosProgressEvent, GenericAbortSignal } from 'axios'
import { post } from '@/utils/request'
import type { Model } from '@/store/modules/settings/helper'
import type { PostMessage } from './helper'

export function fetchChatAPIProcess<T = any>(
  params: {
    model: Model
    messages: PostMessage[]
    temperature: number
    top_p: number
    signal?: GenericAbortSignal
    onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void
  },
) {
  let data: Record<string, any> = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature,
    top_p: params.top_p,
  }

  return post<T>({
    url: '/chat-process',
    data,
    signal: params.signal,
    onDownloadProgress: params.onDownloadProgress,
  })
}

export function fetchSession<T>() {
  return post<T>({
    url: '/session',
  })
}

export function fetchVerify<T>(token: string) {
  return post<T>({
    url: '/verify',
    data: { token },
  })
}
