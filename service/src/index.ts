import env from './utils/env'
import express from 'express'
import { openaiChatCompletion } from './openai'
import { auth, getAuthConfig, isHavingAuth } from './middleware/auth'
import { logUsage } from './middleware/logger'
import type { RequestProps, ResponseChunk, Usage } from './types'

const router = express.Router()

router.post('/chat-process', [auth], async (req, res) => {
  const user = req.header('Authorization')?.replace('Bearer ', '').trim()
  res.setHeader('Content-type', 'application/octet-stream')
  try {
    const { model, messages, temperature, top_p } = req.body as RequestProps
    if (env.DEBUG_MODE) {
      global.console.log('-'.repeat(30))
      global.console.log(`Time: ${new Date().toISOString()}`)
      global.console.log(`Requested Model: ${model}`)
      global.console.log(`Temperature: ${temperature}`)
      global.console.log(`Top P: ${top_p}`)
      global.console.log(`Messages: ${JSON.stringify(messages, null, 2)}`)
    }
    let firstChunk = true
    const response = await openaiChatCompletion({
      model, messages, temperature, top_p,
      callback: (chunk: ResponseChunk) => {
        const chunkStr = JSON.stringify(chunk)
        if (chunkStr === '{}') return
        res.write(firstChunk ? chunkStr : `\n${chunkStr}`)
        firstChunk = false
      },
    }) as { data: { model: string, usage: Usage } }
    if (env.DEBUG_MODE) {
      global.console.log(`Upstream Model: ${response.data.model}`)
      global.console.log(`Usage: ${JSON.stringify(response.data.usage, null, 2)}`)
    }
    await logUsage(response.data.model, response.data.usage, user)
  }
  catch (error) {
    global.console.error(error)
    const chunk: ResponseChunk = { error: error.message || '500 Internal Server Error' }
    res.write(JSON.stringify(chunk))
  }
  finally {
    res.end()
  }
})

router.post('/session', async (req, res) => {
  try {
    res.send({ status: 'Success', message: '', data: { auth: await isHavingAuth() } })
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
app.listen(env.SERVER_PORT, () => global.console.log(`Server is running on port ${env.SERVER_PORT}`))
