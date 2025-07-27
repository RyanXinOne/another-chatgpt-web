import env from '../utils/env'
import OpenAI from 'openai'
import type { ResponseUsage } from 'openai/src/resources/responses/responses'
import { get_encoding } from 'tiktoken'
import { sendResponse } from '../utils'
import { isNotEmptyString } from '../utils/is'
import type { OpenAIAPI } from './types'
import type { Message, TokenLimit, Usage, ResponseChunk, StopReason } from '../types'

if (!isNotEmptyString(env.OPENAI_API_KEY))
  throw new Error('Missing OPENAI_API_KEY environment variable')

const model_contexts: { [model in OpenAIAPI.Model]: TokenLimit } = {
  'gpt-4.1': {
    model_name: 'gpt-4.1-2025-04-14',
    max_context_tokens: Math.min(env.MAX_CONTEXT_TOKENS, 1047576),
    max_response_tokens: 32768,
  },
  'o4-mini': {
    model_name: 'o4-mini-2025-04-16',
    max_context_tokens: Math.min(env.MAX_CONTEXT_TOKENS, 200000),
    max_response_tokens: 10000,
  },
  'gpt-4o': {
    model_name: 'gpt-4o-2024-11-20',
    max_context_tokens: Math.min(env.MAX_CONTEXT_TOKENS, 127000),
    max_response_tokens: 15000,
  },
  'gpt-4o-mini': {
    model_name: 'gpt-4o-mini-2024-07-18',
    max_context_tokens: Math.min(env.MAX_CONTEXT_TOKENS, 127000),
    max_response_tokens: 15000,
  },
}

function filterMessagesByTokenCount(messages: Message[], max_tokens?: number): Message[] {
  const encoding = get_encoding('cl100k_base')
  const tokens_per_message = 3
  const count_message_token = (message: Message) => {
    let tokens = tokens_per_message
    tokens += encoding.encode(message.role).length
    for (const content of message.content) {
      if (content.type === 'input_text') {
        tokens += encoding.encode(content.text).length
      }
      else if (content.type === 'input_image') {
        tokens += 1000 // Rough estimate for image tokens, which is capped by 1536 when width/32*height/32 is bigger than it.
      }
      else if (content.type === 'input_file') {
        tokens += encoding.encode(content.filename).length
        tokens += encoding.encode(content.file_data).length
      } 
    }
    return tokens
  }
  let estimated_tokens = 3

  if (messages.length > 0 && messages[0].role === 'system') {
    estimated_tokens += count_message_token(messages[0])
  }

  for (let i = messages.length - 1; i >= 1; i--) {
    let curr_tokens = count_message_token(messages[i])
    if (max_tokens && estimated_tokens + curr_tokens > max_tokens) {
      messages.splice(1, i)
      break
    }
    estimated_tokens += curr_tokens
  }

  return messages
}

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

export async function openaiChatCompletion(options: OpenAIAPI.RequestOptions) {
  let { model, messages, temperature, top_p, callback } = options
  if (!(model in model_contexts)) {
    return sendResponse({ type: 'Fail', message: 'Invalid model requested.' })
  }
  const { model_name, max_context_tokens, max_response_tokens } = model_contexts[model]
  messages = filterMessagesByTokenCount(messages, max_context_tokens - max_response_tokens)
  try {
    const stream = await openai.responses.create({
      model: model_name,
      input: messages,
      max_output_tokens: max_response_tokens,
      store: false,
      stream: true,
      temperature,
      top_p,
    })
    let usage: ResponseUsage
    for await (const chunk of stream) {
      if (chunk.response?.usage) {
        usage = chunk.response.usage
        break
      }
      let stop_reason: any = chunk.response?.error?.code || undefined
      switch (stop_reason) {
        case undefined:
          stop_reason = 'end'
          break
        default:
          stop_reason = 'others'
          break
      }
      callback({
        delta_text: chunk.delta || undefined,
        stop_reason: stop_reason as StopReason,
      } as ResponseChunk)
    }
    return sendResponse({
      type: 'Success', data: {
        model: model_name,
        usage: {
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
          total_tokens: usage.total_tokens,
        } as Usage
      }
    })
  } catch (error: any) {
    return sendResponse({ type: 'Fail', message: error.message })
  }
}
