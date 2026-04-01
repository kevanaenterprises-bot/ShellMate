import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🐢</div>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.sub}>Free — no card required to start</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSignup} style={styles.form}>
          <input style={styles.input} type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
          <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
          <button style={styles.btn} disabled={loading}>{loading ? 'Creating account...' : 'Create Free Account'}</button>
        </form>
        <p style={styles.fine}>Free plan includes 10 questions/day per product.</p>
        <p style={styles.switch}>Already have an account? <a href="/auth/login" style={styles.link}>Sign in</a></p>
      </div>
    </div>
  )
}

const styles = {
  page: { background:'#0d1117', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system,sans-serif' },
  card: { background:'#161b22', border:'1px solid #30363d', borderRadius:16, padding:40, width:'100%', maxWidth:400, textAlign:'center' },
  logo: { fontSize:40, marginBottom:16 },
  title: { color:'#e6edf3', fontSize:22, fontWeight:700, margin:'0 0 6px' },
  sub: { color:'#3fb950', fontSize:14, marginBottom:28, fontWeight:600 },
  error: { background:'#3d1c1c', border:'1px solid #f85149', color:'#f85149', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 },
  form: { display:'flex', flexDirection:'column', gap:12 },
  input: { background:'#0d1117', border:'1px solid #30363d', borderRadius:8, color:'#e6edf3', fontSize:14, padding:'10px 14px', outline:'none' },
  btn: { background:'#238636', border:'none', borderRadius:8, color:'#fff', fontSize:15, fontWeight:600, padding:'12px', cursor:'pointer', marginTop:4 },
  fine: { color:'#484f58', fontSize:12, marginTop:16 },
  switch: { color:'#8b949e', fontSize:13, marginTop:8 },
  link: { color:'#388bfd', textDecoration:'none' }
}
