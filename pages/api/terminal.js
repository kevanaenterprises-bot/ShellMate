import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '../../lib/supabase'
import { checkAndIncrementUsage } from '../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Not logged in' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid session' })

  const { message, messages, os } = req.body
  if (!message) return res.status(400).json({ error: 'No message provided' })

  const usage = await checkAndIncrementUsage(user.id, 'terminal')
  if (!usage.allowed) return res.status(429).json({ error: usage.reason, upgrade: true })

  const systemPrompt = `You are a friendly terminal command expert. The user is on: ${os || 'Linux'}.
When they describe what they want to do, respond with:
1. The exact command(s) they need in a code block
2. A plain-English explanation of what each part does
3. Any important warnings
4. A quick tip if relevant
Keep explanations concise. Always tailor commands to ${os || 'Linux'}.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [...(messages || []), { role: 'user', content: message }]
    })
    return res.status(200).json({
      reply: response.content[0]?.text || '',
      usage: { used: usage.used, limit: usage.limit, remaining: usage.remaining }
    })
  } catch (err) {
    console.error('Anthropic error:', err)
    return res.status(500).json({ error: 'AI request failed' })
  }
}
