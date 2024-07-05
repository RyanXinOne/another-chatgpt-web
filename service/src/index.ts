import * as dotenv from 'dotenv'
import express from 'express'
import type { ChatCompletionChunk } from 'openai/src/resources/chat'
import { chatReplyProcess } from './chatgpt'
import { auth, getAuthConfig } from './middleware/auth'
import type { RequestProps } from './types'

dotenv.config({ override: true })

const SERVER_PORT: number = parseInt(process.env.SERVER_PORT) || 3002

const router = express.Router()

router.post('/chat-process', [auth], async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    const { model, messages, temperature, top_p } = req.body as RequestProps
    const user = req.header('Authorization')?.replace('Bearer ', '').trim()
    let firstChunk = true
    await chatReplyProcess({
      model, messages, temperature, top_p, user,
      callback: (chunk: ChatCompletionChunk) => {
        res.write(firstChunk ? JSON.stringify(chunk) : `\n${JSON.stringify(chunk)}`)
        firstChunk = false
      },
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/session', async (req, res) => {
  try {
    const authConfig = await getAuthConfig()
    const hasAuth = Object.keys(authConfig).length > 0
    res.send({ status: 'Success', message: '', data: { auth: hasAuth } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('Secret key is empty')

    const authConfig = await getAuthConfig()
    if (!(token in authConfig && authConfig[token].allow))
      throw new Error('Your secret key is invalid')

    res.send({ status: 'Success', message: 'Verify successfully', data: authConfig[token].info })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

const app = express()
app.use(express.static('public'))
app.use(express.json({ limit: '1mb' }))
app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})
app.use('/api', router)
app.set('trust proxy', 1)
app.listen(SERVER_PORT, () => global.console.log(`Server is running on port ${SERVER_PORT}`))
