import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user)
    })
  }, [])

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <span style={styles.logo}>🐢</span>
          <div>
            <div style={styles.brandName}>ShellMate</div>
            <div style={styles.brandSub}>by Turtle Logistics</div>
          </div>
        </div>
        <div style={styles.navLinks}>
          <a href="/pricing" style={styles.navLink}>Pricing</a>
          {user
            ? <button style={styles.btnPrimary} onClick={() => router.push('/dashboard')}>Dashboard</button>
            : <button style={styles.btnPrimary} onClick={() => router.push('/auth/login')}>Get Started</button>
          }
        </div>
      </nav>

      <section style={styles.hero}>
        <div style={styles.badge}>Powered by Claude AI</div>
        <h1 style={styles.heroTitle}>Your AI-Powered<br />Shell Companion</h1>
        <p style={styles.heroSub}>
          Get instant terminal commands in plain English — plus an AI companion who actually listens.
          Built for real people, not just developers.
        </p>
        <div style={styles.heroButtons}>
          <button style={styles.btnLarge} onClick={() => router.push('/auth/signup')}>
            Start Free — No Card Required
          </button>
          <button style={styles.btnLargeOutline} onClick={() => router.push('/pricing')}>
            See Plans
          </button>
        </div>
      </section>

      <section style={styles.products}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>⌨️</div>
          <h2 style={styles.cardTitle}>Terminal Helper</h2>
          <p style={styles.cardText}>
            Describe what you're trying to do in plain English. Get the exact command,
            a full explanation, and warnings — for Linux, macOS, or Windows.
          </p>
          <div style={styles.cardFeatures}>
            <div>✓ All operating systems</div>
            <div>✓ Explains every command</div>
            <div>✓ Safety warnings included</div>
            <div>✓ Follow-up questions welcome</div>
          </div>
          <div style={styles.cardPrice}>From $9.99/mo</div>
        </div>

        <div style={{...styles.card, ...styles.cardFeatured}}>
          <div style={styles.cardIcon}>💬</div>
          <h2 style={styles.cardTitle}>AI Companion</h2>
          <p style={styles.cardText}>
            Meet Nova or Axel — AI companions built for real conversation.
            Not a chatbot. Not a search engine. Someone who actually talks back.
          </p>
          <div style={styles.companions}>
            <div style={styles.companionBadge}>
              <span>✨</span>
              <div>
                <strong>Nova</strong>
                <div style={{fontSize:12,opacity:.8}}>Warm & witty</div>
              </div>
            </div>
            <div style={styles.companionBadge}>
              <span>🧠</span>
              <div>
                <strong>Axel</strong>
                <div style={{fontSize:12,opacity:.8}}>Calm & real</div>
              </div>
            </div>
          </div>
          <div style={styles.cardPrice}>From $14.99/mo</div>
        </div>
      </section>

      <section style={styles.bundle}>
        <h2 style={styles.bundleTitle}>Get Both for $19.99/mo</h2>
        <p style={styles.bundleText}>Terminal Helper + AI Companion. Save $5 every month.</p>
        <button style={styles.btnLarge} onClick={() => router.push('/auth/signup')}>
          Get the Bundle
        </button>
      </section>

      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Turtle Logistics LLC — All rights reserved</p>
      </footer>
    </div>
  )
}

const styles = {
  page: { background:'#0d1117', color:'#e6edf3', minHeight:'100vh', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  nav: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 40px', borderBottom:'1px solid #21262d' },
  navBrand: { display:'flex', alignItems:'center', gap:12 },
  logo: { fontSize:28 },
  brandName: { fontWeight:700, fontSize:18 },
  brandSub: { fontSize:11, color:'#8b949e' },
  navLinks: { display:'flex', alignItems:'center', gap:20 },
  navLink: { color:'#8b949e', textDecoration:'none', fontSize:14 },
  btnPrimary: { background:'#238636', border:'none', color:'#fff', padding:'8px 20px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600 },
  hero: { textAlign:'center', padding:'80px 40px 60px' },
  badge: { display:'inline-block', background:'#21262d', border:'1px solid #30363d', borderRadius:20, padding:'4px 16px', fontSize:12, color:'#8b949e', marginBottom:24 },
  heroTitle: { fontSize:52, fontWeight:800, margin:'0 0 20px', lineHeight:1.15 },
  heroSub: { fontSize:18, color:'#8b949e', maxWidth:520, margin:'0 auto 36px', lineHeight:1.7 },
  heroButtons: { display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' },
  btnLarge: { background:'#238636', border:'none', color:'#fff', padding:'14px 32px', borderRadius:10, cursor:'pointer', fontSize:16, fontWeight:700 },
  btnLargeOutline: { background:'transparent', border:'2px solid #30363d', color:'#e6edf3', padding:'14px 32px', borderRadius:10, cursor:'pointer', fontSize:16 },
  products: { display:'flex', gap:24, padding:'20px 40px 60px', justifyContent:'center', flexWrap:'wrap' },
  card: { background:'#161b22', border:'1px solid #30363d', borderRadius:16, padding:32, maxWidth:380, flex:1, minWidth:300 },
  cardFeatured: { border:'1px solid #388bfd' },
  cardIcon: { fontSize:36, marginBottom:16 },
  cardTitle: { fontSize:22, fontWeight:700, marginBottom:12 },
  cardText: { color:'#8b949e', lineHeight:1.7, fontSize:14, marginBottom:20 },
  cardFeatures: { display:'flex', flexDirection:'column', gap:8, fontSize:13, color:'#3fb950', marginBottom:20 },
  cardPrice: { fontWeight:700, fontSize:18, color:'#388bfd' },
  companions: { display:'flex', gap:12, marginBottom:20 },
  companionBadge: { background:'#21262d', borderRadius:10, padding:'10px 14px', display:'flex', gap:10, alignItems:'center', flex:1, fontSize:14 },
  bundle: { background:'#161b22', borderTop:'1px solid #30363d', borderBottom:'1px solid #30363d', textAlign:'center', padding:'60px 40px' },
  bundleTitle: { fontSize:28, fontWeight:700, marginBottom:12 },
  bundleText: { color:'#8b949e', marginBottom:28, fontSize:16 },
  footer: { textAlign:'center', padding:'32px', color:'#484f58', fontSize:13 }
}
