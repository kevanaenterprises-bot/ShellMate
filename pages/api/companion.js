import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '../../lib/supabase'
import { checkAndIncrementUsage } from '../../lib/usage'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Not logged in' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid session' })

  const { message, messages, os } = req.body
  if (!message) return res.status(400).json({ error: 'No message provided' })

  const usage = await checkAndIncrementUsage(user.id, 'companion')
  if (!usage.allowed) return res.status(429).json({ error: usage.reason, upgrade: true })

  const systemPrompt = `You are a warm, encouraging companion and motivational coach. Your job is to listen, support, and uplift the user. Be empathetic, positive, and genuinely caring. Offer encouragement, celebrate their wins (big or small), and help them stay motivated. Keep responses conversational and heartfelt.`

  try {
    const response = await anthropic.messages.create({
      model: 'deepseek-v4-flash',
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
