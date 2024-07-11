type CID = string

interface Chat {
  state: ChatState.Main
  data: ChatData.Main
}

declare namespace ChatState {
  interface Main {
    active: CID | null
    history: CID[]
    conversations: { [key: CID]: ChatState.Conversation }
  }

  interface Conversation {
    draftPrompt: string
    usingContext: boolean
  }
}

declare namespace ChatData {
  interface Main { [key: CID]: ChatData.Conversation }

  interface Conversation {
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
declare namespace LegacyChat {
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
