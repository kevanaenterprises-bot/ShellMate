import { supabaseAdmin } from './supabase'

// Daily limits per plan per product
export const LIMITS = {
  free:      { terminal: 10,  companion: 10  },
  terminal:  { terminal: 200, companion: 0   },
  companion: { terminal: 0,   companion: 200 },
  bundle:    { terminal: 200, companion: 200 },
}

// Token budgets per month (soft cap — user sees warning at 80%)
export const TOKEN_BUDGETS = {
  free:      100_000,
  terminal:  500_000,
  companion: 500_000,
  bundle:    900_000,
}

export async function checkAndIncrementUsage(userId, product) {
  // Get user plan
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', userId)
    .single()

  if (!profile) return { allowed: false, reason: 'Profile not found' }

  const plan = profile.plan || 'free'
  const limit = LIMITS[plan]?.[product] ?? 0

  if (limit === 0) {
    return {
      allowed: false,
      reason: plan === 'free'
        ? `You've used your free questions for today. Upgrade to keep going.`
        : `Your current plan doesn't include ${product}. Upgrade to bundle.`
    }
  }

  // Get today's usage
  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await supabaseAdmin
    .from('usage')
    .select('questions_asked, tokens_used')
    .eq('user_id', userId)
    .eq('product', product)
    .eq('date', today)
    .single()

  const currentCount = usage?.questions_asked ?? 0

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `You've hit your daily limit of ${limit} questions. Resets at midnight.`,
      limit,
      used: currentCount
    }
  }

  // Increment usage (upsert)
  await supabaseAdmin
    .from('usage')
    .upsert({
      user_id: userId,
      product,
      date: today,
      questions_asked: currentCount + 1,
    }, { onConflict: 'user_id,product,date' })

  return {
    allowed: true,
    used: currentCount + 1,
    limit,
    remaining: limit - currentCount - 1
  }
}
