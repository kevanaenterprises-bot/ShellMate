import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/auth/login')

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div style={styles.loading}>Loading...</div>

  const planLabel = { free:'Free', terminal:'Terminal Pro', companion:'Companion Pro', bundle:'Bundle' }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <a href="/" style={styles.brand}>🐢 ShellMate</a>
        <div style={styles.navRight}>
          <span style={styles.planBadge}>{planLabel[profile?.plan] || 'Free'}</span>
          <button style={styles.logoutBtn} onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div style={styles.content}>
        <h1 style={styles.greeting}>Hey {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
        <p style={styles.sub}>What do you want to do today?</p>

        {router.query.success && (
          <div style={styles.successBanner}>
            🎉 You're all set! Your subscription is now active.
          </div>
        )}

        <div style={styles.cards}>
          <div style={styles.appCard} onClick={() => router.push('/terminal')}>
            <div style={styles.appIcon}>⌨️</div>
            <h2 style={styles.appTitle}>Terminal Helper</h2>
            <p style={styles.appDesc}>Get terminal commands in plain English</p>
            {(profile?.plan === 'free' || !['terminal','bundle'].includes(profile?.plan)) && (
              <div style={styles.freeBadge}>Free: 10/day</div>
            )}
            <button style={styles.appBtn}>Open Terminal Helper →</button>
          </div>

          <div style={styles.appCard} onClick={() => router.push('/companion')}>
            <div style={styles.appIcon}>💬</div>
            <h2 style={styles.appTitle}>AI Companion</h2>
            <p style={styles.appDesc}>Chat with Nova or Axel</p>
            {(profile?.plan === 'free' || !['companion','bundle'].includes(profile?.plan)) && (
              <div style={styles.freeBadge}>Free: 10/day</div>
            )}
            <button style={{...styles.appBtn, background:'#6e40c9'}}>Open Companion →</button>
          </div>
        </div>

        {profile?.plan === 'free' && (
          <div style={styles.upgradeBanner}>
            <div>
              <strong>Upgrade for more</strong>
              <p style={{margin:'4px 0 0',fontSize:13,color:'#8b949e'}}>Get 200 questions/day per product</p>
            </div>
            <button style={styles.upgradeBtn} onClick={() => router.push('/pricing')}>See Plans →</button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { background:'#0d1117', color:'#e6edf3', minHeight:'100vh', fontFamily:'-apple-system,sans-serif' },
  loading: { background:'#0d1117', color:'#8b949e', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif' },
  nav: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 40px', borderBottom:'1px solid #21262d' },
  brand: { color:'#e6edf3', textDecoration:'none', fontSize:18, fontWeight:700 },
  navRight: { display:'flex', alignItems:'center', gap:16 },
  planBadge: { background:'#21262d', border:'1px solid #30363d', borderRadius:20, padding:'3px 12px', fontSize:12, color:'#8b949e' },
  logoutBtn: { background:'transparent', border:'1px solid #30363d', color:'#8b949e', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:13 },
  content: { maxWidth:800, margin:'0 auto', padding:'48px 24px' },
  greeting: { fontSize:32, fontWeight:800, margin:'0 0 8px' },
  sub: { color:'#8b949e', fontSize:16, marginBottom:32 },
  successBanner: { background:'#1a3a1a', border:'1px solid #3fb950', borderRadius:10, padding:'14px 20px', marginBottom:28, color:'#3fb950', fontWeight:600 },
  cards: { display:'flex', gap:20, flexWrap:'wrap', marginBottom:28 },
  appCard: { background:'#161b22', border:'1px solid #30363d', borderRadius:16, padding:28, flex:1, minWidth:260, cursor:'pointer', transition:'border-color .15s' },
  appIcon: { fontSize:36, marginBottom:14 },
  appTitle: { fontSize:20, fontWeight:700, margin:'0 0 8px' },
  appDesc: { color:'#8b949e', fontSize:14, marginBottom:16 },
  freeBadge: { background:'#21262d', borderRadius:6, padding:'3px 10px', fontSize:12, color:'#8b949e', display:'inline-block', marginBottom:14 },
  appBtn: { background:'#238636', border:'none', color:'#fff', padding:'10px 20px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600 },
  upgradeBanner: { background:'#161b22', border:'1px solid #388bfd', borderRadius:12, padding:'18px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 },
  upgradeBtn: { background:'#388bfd', border:'none', color:'#fff', padding:'10px 20px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600 }
}
