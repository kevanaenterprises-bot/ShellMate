import Stripe from 'stripe'
import { supabaseAdmin } from '../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const { type, data } = event

  if (type === 'checkout.session.completed') {
    const session = data.object
    const userId = session.metadata?.supabase_user_id
    const plan = session.metadata?.plan

    if (userId && plan) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan, subscription_status: 'active' })
        .eq('id', userId)

      await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        plan,
        status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'stripe_subscription_id' })
    }
  }

  if (type === 'customer.subscription.deleted') {
    const sub = data.object
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.id)

    // Downgrade to free
    await supabaseAdmin
      .from('profiles')
      .update({ plan: 'free', subscription_status: 'canceled' })
      .eq('stripe_customer_id', sub.customer)
  }

  if (type === 'invoice.payment_failed') {
    const invoice = data.object
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'past_due' })
      .eq('stripe_customer_id', invoice.customer)
  }

  return res.status(200).json({ received: true })
}
