import * as dotenv from 'dotenv'
import OpenAI from 'openai'
import { sendResponse } from '../utils'
import { isNotEmptyString } from '../utils/is'
import type { RequestOptions } from './types'

dotenv.config({ override: true })

if (!isNotEmptyString(process.env.OPENAI_API_KEY))
  throw new Error('Missing OPENAI_API_KEY environment variable')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function chatReplyProcess(options) {
  const { model, messages, temperature, top_p, callback } = options as RequestOptions
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature,
      top_p,
    })
    for await (const chunk of stream) {
      if (chunk) {
        callback(chunk)
      }
    }
    return sendResponse({ type: 'Success' })
  } catch (error: any) {
    global.console.error(error)
    return sendResponse({ type: 'Fail', message: error.message })
  }
}
