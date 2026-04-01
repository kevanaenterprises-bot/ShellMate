import Stripe from 'stripe'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_MAP = {
  terminal:  process.env.STRIPE_PRICE_TERMINAL,
  companion: process.env.STRIPE_PRICE_COMPANION,
  bundle:    process.env.STRIPE_PRICE_BUNDLE,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not logged in' })

  const { plan } = req.body
  const priceId = PRICE_MAP[plan]
  if (!priceId) return res.status(400).json({ error: 'Invalid plan' })

  // Get or create Stripe customer
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', session.user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { supabase_user_id: session.user.id }
    })
    customerId = customer.id

    await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', session.user.id)
  }

  // Create Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      supabase_user_id: session.user.id,
      plan
    }
  })

  return res.status(200).json({ url: checkoutSession.url })
}
