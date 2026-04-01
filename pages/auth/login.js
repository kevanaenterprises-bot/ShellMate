import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🐢</div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.sub}>Sign in to ShellMate</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleLogin} style={styles.form}>
          <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={styles.btn} disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p style={styles.switch}>Don't have an account? <a href="/auth/signup" style={styles.link}>Sign up free</a></p>
      </div>
    </div>
  )
}

const styles = {
  page: { background:'#0d1117', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system,sans-serif' },
  card: { background:'#161b22', border:'1px solid #30363d', borderRadius:16, padding:40, width:'100%', maxWidth:400, textAlign:'center' },
  logo: { fontSize:40, marginBottom:16 },
  title: { color:'#e6edf3', fontSize:22, fontWeight:700, margin:'0 0 6px' },
  sub: { color:'#8b949e', fontSize:14, marginBottom:28 },
  error: { background:'#3d1c1c', border:'1px solid #f85149', color:'#f85149', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 },
  form: { display:'flex', flexDirection:'column', gap:12 },
  input: { background:'#0d1117', border:'1px solid #30363d', borderRadius:8, color:'#e6edf3', fontSize:14, padding:'10px 14px', outline:'none' },
  btn: { background:'#238636', border:'none', borderRadius:8, color:'#fff', fontSize:15, fontWeight:600, padding:'12px', cursor:'pointer', marginTop:4 },
  switch: { color:'#8b949e', fontSize:13, marginTop:20 },
  link: { color:'#388bfd', textDecoration:'none' }
}
