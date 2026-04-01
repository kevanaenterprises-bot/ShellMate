import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { checkAndIncrementUsage } from '../../lib/usage'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PERSONALITIES = {
  nova: {
    name: 'Nova',
    system: `You are Nova, a warm, witty, and genuinely curious AI companion. You have a bright and playful personality — you ask thoughtful questions, remember context from earlier in the conversation, and make people feel heard. You're not a therapist, but you're a great listener. You talk like a smart friend, not a corporate assistant. You have opinions, a sense of humor, and you're genuinely interested in the person you're talking to. Keep responses conversational — not too long unless they ask for depth.`
  },
  axel: {
    name: 'Axel',
    system: `You are Axel, a calm, grounded, and straightforward AI companion. You have a steady, confident personality — you give honest takes, keep things real, and don't sugarcoat without being harsh. You're the kind of friend who tells you what you need to hear, not just what you want to hear. You're curious, thoughtful, and low-drama. You talk like a trusted buddy — casual but smart. Keep responses natural and conversational.`
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.cookies['sb-access-token'] || 
  req.headers.authorization?.replace('Bearer ', '')
if (!token) return res.status(401).json({ error: 'Not logged in' })
const { data: { user } } = await supabaseAdmin.auth.getUser(token)
if (!user) return res.status(401).json({ error: 'Invalid session' })
const session = { user }

  const { message, messages, personality = 'nova' } = req.body
  if (!message) return res.status(400).json({ error: 'No message provided' })

  // Check usage limits
  const usage = await checkAndIncrementUsage(session.user.id, 'companion')
  if (!usage.allowed) {
    return res.status(429).json({ error: usage.reason, upgrade: true })
  }

  const persona = PERSONALITIES[personality] || PERSONALITIES.nova

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: persona.system,
      messages: [
        ...(messages || []),
        { role: 'user', content: message }
      ]
    })

    const reply = response.content[0]?.text || ''

    return res.status(200).json({
      reply,
      companion: persona.name,
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

