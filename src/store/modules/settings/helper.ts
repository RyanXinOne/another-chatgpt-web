import { ls } from '@/utils/storage'

const LOCAL_NAME = 'settingsStorage'

export type Model = 'gpt-4o' | 'gpt-3.5-turbo'

export interface SettingsState {
  model: Model
  systemMessage: string
  temperature: number
  top_p: number
}

export function defaultSetting(): SettingsState {
  return {
    model: 'gpt-4o',
    systemMessage: 'You are ChatGPT, a large language model trained by OpenAI. Follow the user\'s instructions carefully. Respond using markdown.',
    temperature: 1,
    top_p: 1,
  }
}

export function getLocalState(): SettingsState {
  const localSetting: SettingsState | undefined = ls.get(LOCAL_NAME)
  return { ...defaultSetting(), ...localSetting }
}

export function setLocalState(setting: SettingsState): void {
  ls.set(LOCAL_NAME, setting)
}

export function removeLocalState() {
  ls.remove(LOCAL_NAME)
}
