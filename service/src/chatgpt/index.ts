import * as dotenv from 'dotenv'
import OpenAI from 'openai'
import type { CompletionUsage } from 'openai/src/resources/completions'
import { encoding_for_model } from 'tiktoken'
import { sendResponse } from '../utils'
import { isNotEmptyString } from '../utils/is'
import type { Message, Model, ModelContext, RequestOptions } from './types'
import { logUsage } from '../middleware/logger'

dotenv.config({ override: true })

const DEBUG_MODE = process.env.DEBUG_MODE === 'true'

if (!isNotEmptyString(process.env.OPENAI_API_KEY))
  throw new Error('Missing OPENAI_API_KEY environment variable')

const model_contexts: { [model in Model]: ModelContext } = {
  'gpt-4o': {
    max_context_tokens: 127000,
    max_response_tokens: 4000,
  },
  'gpt-3.5-turbo': {
    max_context_tokens: 16000,
    max_response_tokens: 4000,
  },
}

function filterMessagesByTokenCount(messages: Message[], model: Model, max_tokens?: number): { messages: Message[]; estimated_tokens: number } {
  const encoding = encoding_for_model(model)
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

  return { messages, estimated_tokens }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function chatReplyProcess(options: RequestOptions) {
  let { model, messages, temperature, top_p, user, callback } = options
  const { max_context_tokens, max_response_tokens } = model_contexts[model]
  let estimated_tokens: number
  ({ messages, estimated_tokens } = filterMessagesByTokenCount(messages, model, max_context_tokens - max_response_tokens))
  if (DEBUG_MODE) {
    global.console.log('-'.repeat(30))
    global.console.log(`Time: ${new Date().toISOString()}`)
    global.console.log(`Model: ${model}`)
    global.console.log(`Temperature: ${temperature}`)
    global.console.log(`Top P: ${top_p}`)
    global.console.log(`Estimated tokens: ${estimated_tokens}`)
    global.console.log(`Messages: ${JSON.stringify(messages, null, 2)}`)
  }
  try {
    const stream = await openai.chat.completions.create({
      model,
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
      callback(chunk)
    }
    if (DEBUG_MODE) {
      global.console.log(`Usage: ${JSON.stringify(usage, null, 2)}`)
    }
    await logUsage(model, usage, user)
    return sendResponse({ type: 'Success' })
  } catch (error: any) {
    global.console.error(error)
    return sendResponse({ type: 'Fail', message: error.message })
  }
}
