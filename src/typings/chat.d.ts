declare namespace ChatState {
  interface Main {
    active: number | null
    history: number[]
    conversation: ChatState.Conversation[]
  }

  interface Conversation {
    uuid: number
    usingContext: boolean
    draftPrompt: string
  }
}

declare namespace ChatData {
  interface Conversation {
    uuid: number
    title: string
    messages: ChatData.Message[]
  }

  interface Message {
    dateTime: string
    text: string
    inversion: boolean
    error?: boolean
    loading?: boolean
  }
}

interface ConversationResponse {
  id: string
  choices: {
    delta: {
      content: string | null
      role: string
    }
    logprobs: object | null
    finish_reason: string | null
    index: integer
  }[]
  created: number
  model: string
  system_fingerprint: string
  object: string
  usage: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
}

// legacy
declare namespace Chat {
  interface State {
    active: number | null
    history: History[]
    chat: Chat[]
  }

  interface History {
    uuid: number
    title: string
  }

  interface Chat {
    uuid: number
    data: Message[]
    usingContext?: boolean
    draftPrompt?: string
  }

  interface Message {
    dateTime: string
    text: string
    inversion?: boolean
    error?: boolean
    loading?: boolean
  }
}
