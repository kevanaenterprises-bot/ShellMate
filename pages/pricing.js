import { useRouter } from 'next/router'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#8b949e',
    features: ['10 terminal questions/day', '10 companion messages/day', 'All operating systems', 'Nova & Axel available'],
    cta: 'Get Started Free',
    action: 'signup'
  },
  {
    id: 'terminal',
    name: 'Terminal Pro',
    price: '$9.99',
    period: 'per month',
    color: '#388bfd',
    features: ['200 terminal questions/day', 'All operating systems', 'Full conversation history', 'Priority responses', 'Cancel anytime'],
    cta: 'Get Terminal Pro',
    action: 'checkout'
  },
  {
    id: 'companion',
    name: 'Companion Pro',
    price: '$14.99',
    period: 'per month',
    color: '#bc8cff',
    features: ['200 companion messages/day', 'Choose Nova or Axel', 'Deeper conversations', 'Memory within session', 'Cancel anytime'],
    cta: 'Get Companion Pro',
    action: 'checkout'
  },
  {
    id: 'bundle',
    name: 'Bundle',
    price: '$19.99',
    period: 'per month',
    color: '#3fb950',
    badge: 'Best Value — Save $5',
    features: ['200 terminal questions/day', '200 companion messages/day', 'Everything in both Pro plans', 'Priority support', 'Cancel anytime'],
    cta: 'Get the Bundle',
    action: 'checkout'
  }
]

export default function Pricing() {
  const router = useRouter()
  const [loading, setLoading] = useState(null)

  async function handleCTA(plan) {
    if (plan.action === 'signup') return router.push('/auth/signup')

    setLoading(plan.id)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return router.push('/auth/signup')

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: plan.id })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(null)
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <a href="/" style={styles.brand}>🐢 ShellMate</a>
      </nav>
      <div style={styles.header}>
        <h1 style={styles.title}>Simple, honest pricing</h1>
        <p style={styles.sub}>Start free. Upgrade when you're ready. Cancel anytime.</p>
      </div>
      <div style={styles.grid}>
        {plans.map(plan => (
          <div key={plan.id} style={{...styles.card, borderColor: plan.id === 'bundle' ? plan.color : '#30363d'}}>
            {plan.badge && <div style={{...styles.badge, background: plan.color}}>{plan.badge}</div>}
            <div style={{...styles.planName, color: plan.color}}>{plan.name}</div>
            <div style={styles.price}>{plan.price}<span style={styles.period}> / {plan.period}</span></div>
            <ul style={styles.features}>
              {plan.features.map(f => <li key={f} style={styles.feature}><span style={{color: plan.color}}>✓</span> {f}</li>)}
            </ul>
            <button
              style={{...styles.btn, background: plan.id === 'free' ? 'transparent' : plan.color, border: plan.id === 'free' ? `2px solid ${plan.color}` : 'none', color: plan.id === 'free' ? plan.color : '#fff'}}
              onClick={() => handleCTA(plan)}
              disabled={loading === plan.id}
            >
              {loading === plan.id ? 'Loading...' : plan.cta}
            </button>
          </div>
        ))}
      </div>
      <div style={styles.footer}>
        <p style={styles.footerText}>© {new Date().getFullYear()} Turtle Logistics LLC — Secure payments via Stripe</p>
      </div>
    </div>
  )
}

const styles = {
  page: { background:'#0d1117', color:'#e6edf3', minHeight:'100vh', fontFamily:'-apple-system,sans-serif' },
  nav: { padding:'16px 40px', borderBottom:'1px solid #21262d' },
  brand: { color:'#e6edf3', textDecoration:'none', fontSize:18, fontWeight:700 },
  header: { textAlign:'center', padding:'60px 40px 40px' },
  title: { fontSize:40, fontWeight:800, margin:'0 0 12px' },
  sub: { color:'#8b949e', fontSize:16 },
  grid: { display:'flex', gap:20, padding:'0 40px 60px', justifyContent:'center', flexWrap:'wrap', maxWidth:1100, margin:'0 auto' },
  card: { background:'#161b22', border:'1px solid #30363d', borderRadius:16, padding:28, width:240, position:'relative', display:'flex', flexDirection:'column' },
  badge: { position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', padding:'3px 14px', borderRadius:20, fontSize:11, fontWeight:700, color:'#fff', whiteSpace:'nowrap' },
  planName: { fontSize:14, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:.5 },
  price: { fontSize:32, fontWeight:800, margin:'0 0 20px' },
  period: { fontSize:14, color:'#8b949e', fontWeight:400 },
  features: { listStyle:'none', padding:0, margin:'0 0 24px', display:'flex', flexDirection:'column', gap:10, flex:1 },
  feature: { fontSize:13, color:'#c9d1d9', display:'flex', gap:8 },
  btn: { padding:'12px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600, transition:'opacity .15s' }
}
