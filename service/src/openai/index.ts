import * as dotenv from 'dotenv'
import OpenAI from 'openai'
import type { CompletionUsage } from 'openai/src/resources/completions'
import { get_encoding } from 'tiktoken'
import { sendResponse } from '../utils'
import { isNotEmptyString } from '../utils/is'
import type { OpenAIAPI } from './types'
import type { Message, TokenLimit, Usage, ResponseChunk, StopReason } from '../types'

dotenv.config({ override: true })

const OPENAI_API_KEY: string = process.env.OPENAI_API_KEY ?? ''
const MAX_CONTEXT_TOKENS: number = parseInt(process.env.MAX_CONTEXT_TOKENS) || 999999

if (!isNotEmptyString(OPENAI_API_KEY))
  throw new Error('Missing OPENAI_API_KEY environment variable')

const model_contexts: { [model in OpenAIAPI.Model]: TokenLimit } = {
  'gpt-4o': {
    model_name: 'gpt-4o-2024-08-06',
    max_context_tokens: Math.min(MAX_CONTEXT_TOKENS, 127000),
    max_response_tokens: 4000,
  },
  'gpt-4o-mini': {
    model_name: 'gpt-4o-mini-2024-07-18',
    max_context_tokens: Math.min(MAX_CONTEXT_TOKENS, 127000),
    max_response_tokens: 16000,
  },
}

function filterMessagesByTokenCount(messages: Message[], max_tokens?: number): Message[] {
  const encoding = get_encoding('cl100k_base')
  const tokens_per_message = 3
  const count_message_token = (message: Message) => {
    let tokens = tokens_per_message
    tokens += encoding.encode(message.role).length
    tokens += encoding.encode(message.content).length
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
  apiKey: OPENAI_API_KEY,
})

export async function openaiChatCompletion(options: OpenAIAPI.RequestOptions) {
  let { model, messages, temperature, top_p, callback } = options
  if (!(model in model_contexts)) {
    return sendResponse({ type: 'Fail', message: 'Invalid model requested.' })
  }
  const { model_name, max_context_tokens, max_response_tokens } = model_contexts[model]
  messages = filterMessagesByTokenCount(messages, max_context_tokens - max_response_tokens)
  try {
    const stream = await openai.chat.completions.create({
      model: model_name,
      messages,
      max_tokens: max_response_tokens,
      stream: true,
      stream_options: { include_usage: true },
      temperature,
      top_p,
    })
    let usage: CompletionUsage
    for await (const chunk of stream) {
      if (chunk.usage) {
        usage = chunk.usage
        break
      }
      let stop_reason: any = chunk.choices[0]?.finish_reason || undefined
      switch (stop_reason) {
        case undefined:
          break
        case 'stop':
          stop_reason = 'end'
          break
        case 'length':
          stop_reason = 'length'
          break
        default:
          stop_reason = 'others'
          break
      }
      callback({
        delta_text: chunk.choices[0]?.delta?.content || undefined,
        stop_reason: stop_reason as StopReason,
      } as ResponseChunk)
    }
    return sendResponse({
      type: 'Success', data: {
        model: model_name,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
        } as Usage
      }
    })
  } catch (error: any) {
    return sendResponse({ type: 'Fail', message: error.message })
  }
}
