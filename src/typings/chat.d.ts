declare namespace Chat {

	interface ChatState {
		active: number | null
		usingContext: boolean;
		history: History[]
		chat: { uuid: number; data: Chat[] }[]
	}

	interface Chat {
		dateTime: string
		text: string
		inversion?: boolean
		error?: boolean
		loading?: boolean
	}

	interface History {
		title: string
		isEdit: boolean
		uuid: number
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
}
