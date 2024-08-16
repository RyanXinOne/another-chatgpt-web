import * as dotenv from 'dotenv'
dotenv.config({ override: true })
import { isHavingAuth } from '../middleware/auth'

interface Env {
    OPENAI_API_KEY: string
    SERVER_PORT: number
    DEBUG_MODE: boolean
    MAX_CONTEXT_TOKENS: number
}

const env: Env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
    SERVER_PORT: parseInt(process.env.SERVER_PORT) || 3002,
    DEBUG_MODE: process.env.DEBUG_MODE === 'true',
    MAX_CONTEXT_TOKENS: parseInt(process.env.MAX_CONTEXT_TOKENS) || 999999
}

export default env

async function main() {
    global.console.log(`Environment: ${JSON.stringify({ ...env, OPENAI_API_KEY: undefined }, null, 2)}`)
    global.console.log(`Auth is ${await isHavingAuth() ? 'enabled' : 'disabled'}`)
}
main()
