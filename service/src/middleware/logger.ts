import fs from 'fs/promises'
import type { Model, Usage } from '../types'

interface UsageRecord {
  [date: string]: {
    [user: string]: {
      [model in Model]?: Usage
    }
  }
}

export async function logUsage(model: Model, usage: Usage, user?: string) {
  user = user ?? '__default__'
  const date = new Date()
  const monthKey = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}`
  const dateKey = `${monthKey}_${date.getDate()}`

  const recordStr = await fs.readFile(`logs/${monthKey}.json`, 'utf8').catch(() => '{}')
  const record: UsageRecord = JSON.parse(recordStr)

  record[dateKey] = record[dateKey] ?? {}
  record[dateKey][user] = record[dateKey][user] ?? {}
  record[dateKey][user][model] = record[dateKey][user][model] ?? { prompt_tokens: 0, completion_tokens: 0 }
  record[dateKey][user][model].prompt_tokens += usage.prompt_tokens
  record[dateKey][user][model].completion_tokens += usage.completion_tokens

  fs.mkdir('logs', { recursive: true })
  await fs.writeFile(`logs/${monthKey}.json`, JSON.stringify(record, null, 2))
}
