import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { checkAndIncrementUsage } from '../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Auth check
  const supabase = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not logged in' })

  const { message, messages, os } = req.body
  if (!message) return res.status(400).json({ error: 'No message provided' })

  // Check usage limits
  const usage = await checkAndIncrementUsage(session.user.id, 'terminal')
  if (!usage.allowed) {
    return res.status(429).json({ error: usage.reason, upgrade: true })
  }

  const systemPrompt = `You are a friendly terminal command expert. The user is on: ${os || 'Linux'}.

When they describe what they want to do, respond with:
1. The exact command(s) they need in a code block
2. A plain-English explanation of what each part does
3. Any important warnings (destructive commands, sudo requirements, etc.)
4. A quick tip or alternative if relevant

Keep explanations concise and practical. Use simple language — assume the user is learning.
Always tailor commands to ${os || 'Linux'} specifically.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        ...(messages || []),
        { role: 'user', content: message }
      ]
    })

    const reply = response.content[0]?.text || ''

    return res.status(200).json({
      reply,
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining
      }
    })
  } catch (err) {
    console.error('Anthropic error:', err)
    return res.status(500).json({ error: 'AI request failed' })
  }
}
