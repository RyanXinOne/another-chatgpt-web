import * as dotenv from 'dotenv'
import OpenAI from 'openai'
import type { CompletionUsage } from 'openai/src/resources/completions'
import { encoding_for_model } from 'tiktoken'
import type { TiktokenModel } from 'tiktoken'
import { sendResponse } from '../utils'
import { isNotEmptyString } from '../utils/is'
import type { Message, RequestOptions } from './types'

dotenv.config({ override: true })

const MAX_INPUT_TOKENS = parseInt(process.env.MAX_INPUT_TOKENS) || undefined
const MAX_RESPONSE_TOKENS = parseInt(process.env.MAX_RESPONSE_TOKENS) || undefined
const DEBUG_MODE = process.env.DEBUG_MODE === 'true'

if (!isNotEmptyString(process.env.OPENAI_API_KEY))
  throw new Error('Missing OPENAI_API_KEY environment variable')

function filterMessagesByTokenCount(messages: Message[], model: string, max_tokens?: number): { messages: Message[]; estimated_tokens: number } {
  const encoding = encoding_for_model(model as TiktokenModel)
  const tokens_per_message = 3
  const count_message_token = (message: Message) => {
    let tokens = tokens_per_message
    for (const key in message) {
      tokens += encoding.encode(message[key]).length
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

  return { messages, estimated_tokens }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function chatReplyProcess(options) {
  let { model, messages, temperature, top_p, callback } = options as RequestOptions
  let estimated_tokens: number
  ({ messages, estimated_tokens } = filterMessagesByTokenCount(messages, model, MAX_INPUT_TOKENS))
  if (DEBUG_MODE) {
    global.console.log('-'.repeat(30))
    global.console.log(`Time: ${new Date().toISOString()}`)
    global.console.log(`Model: ${model}`)
    global.console.log(`Temperature: ${temperature}`)
    global.console.log(`Top P: ${top_p}`)
    global.console.log(`Estimated tokens: ${estimated_tokens}`)
    global.console.log(`Messages: ${JSON.stringify(messages, null, 2)}`)
  }
  let usage: CompletionUsage | undefined
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: MAX_RESPONSE_TOKENS,
      stream: true,
      stream_options: { include_usage: true },
      temperature,
      top_p,
    })
    for await (const chunk of stream) {
      if (chunk.usage) {
        usage = chunk.usage
        break
      }
      callback(chunk)
    }
    if (DEBUG_MODE) {
      global.console.log(`Usage: ${JSON.stringify(usage, null, 2)}`)
    }
    return sendResponse({ type: 'Success' })
  } catch (error: any) {
    global.console.error(error)
    return sendResponse({ type: 'Fail', message: error.message })
  }
}
