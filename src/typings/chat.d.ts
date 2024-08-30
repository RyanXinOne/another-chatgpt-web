type CID = string
type MID = string

interface Chat {
  state: ChatState.Main
  data: ChatData.Main
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  content: string
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
    mid: MID
    dateTime: string
    text: string
    inversion: boolean
    error?: boolean
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
  }
}
