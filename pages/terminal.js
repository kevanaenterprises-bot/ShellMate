import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const OS_OPTIONS = ['Linux / Kali', 'Ubuntu / Debian', 'macOS', 'Windows CMD', 'PowerShell']

function md(text) {
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, c) => `<pre style="background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px;overflow-x:auto;font-family:monospace;font-size:13px;color:#79c0ff;margin:8px 0">${c.trim().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`)
    .replace(/`([^`]+)`/g, '<code style="background:#0d1117;padding:2px 6px;border-radius:4px;font-family:monospace;color:#79c0ff">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e6edf3">$1</strong>')
    .replace(/\n/g, '<br>')
}

export default function Terminal() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [os, setOs] = useState('Linux / Kali')
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState(null)
  const [authed, setAuthed] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth/login')
      else setAuthed(true)
    })
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)

    const res = await fetch('/api/terminal', {
      method: 'POST',
      headers: { 
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
},
      body: JSON.stringify({
        message: userMsg,
        messages: messages.slice(-10),
        os
      })
    })

    const data = await res.json()

    if (res.status === 429) {
      setMessages([...newMessages, { role: 'assistant', content: `⚠️ ${data.error}`, upgrade: data.upgrade }])
    } else if (data.reply) {
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
      if (data.usage) setUsage(data.usage)
    }

    setLoading(false)
  }

  if (!authed) return null

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <a href="/dashboard" style={styles.back}>← Dashboard</a>
        <span style={styles.navTitle}>⌨️ Terminal Helper</span>
        <select style={styles.select} value={os} onChange={e => setOs(e.target.value)}>
          {OS_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
      </nav>

      {usage && (
        <div style={styles.usageBar}>
          <span>{usage.used}/{usage.limit} questions today</span>
          {usage.remaining <= 5 && <a href="/pricing" style={styles.upgradeLink}>Upgrade for more →</a>}
        </div>
      )}

      <div style={styles.chat} ref={chatRef}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            <div style={styles.welcomeIcon}>⌨️</div>
            <h2 style={styles.welcomeTitle}>What are you trying to do?</h2>
            <p style={styles.welcomeText}>Describe your goal in plain English. I'll give you the exact command for <strong>{os}</strong>.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{...styles.msg, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'}}>
            {m.role === 'assistant' && <div style={styles.avatar}>🤖</div>}
            <div style={m.role === 'user' ? styles.userBubble : styles.botBubble}>
              <span dangerouslySetInnerHTML={{ __html: md(m.content) }} />
              {m.upgrade && <div style={{marginTop:12}}><a href="/pricing" style={styles.upgradeBtn}>See upgrade plans →</a></div>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{...styles.msg, justifyContent:'flex-start'}}>
            <div style={styles.avatar}>🤖</div>
            <div style={styles.botBubble}>
              <span style={{color:'#8b949e'}}>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div style={styles.inputArea}>
        <textarea
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Describe what you want to do in the terminal..."
          rows={1}
        />
        <button style={styles.sendBtn} onClick={send} disabled={loading}>➤</button>
      </div>
    </div>
  )
}

const styles = {
  page: { background:'#0d1117', color:'#e6edf3', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'-apple-system,sans-serif' },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', borderBottom:'1px solid #21262d', flexShrink:0 },
  back: { color:'#8b949e', textDecoration:'none', fontSize:13 },
  navTitle: { fontWeight:700, fontSize:15 },
  select: { background:'#161b22', border:'1px solid #30363d', color:'#e6edf3', borderRadius:8, padding:'5px 10px', fontSize:12 },
  usageBar: { background:'#161b22', borderBottom:'1px solid #21262d', padding:'6px 24px', fontSize:12, color:'#8b949e', display:'flex', justifyContent:'space-between', flexShrink:0 },
  upgradeLink: { color:'#388bfd', textDecoration:'none', fontWeight:600 },
  chat: { flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 },
  welcome: { textAlign:'center', margin:'auto', maxWidth:440 },
  welcomeIcon: { fontSize:48, marginBottom:16 },
  welcomeTitle: { fontSize:22, fontWeight:700, margin:'0 0 10px' },
  welcomeText: { color:'#8b949e', fontSize:14, lineHeight:1.7 },
  msg: { display:'flex', gap:10, alignItems:'flex-start' },
  avatar: { width:32, height:32, background:'#238636', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 },
  userBubble: { background:'#1f6feb', borderRadius:'12px 12px 4px 12px', padding:'10px 16px', maxWidth:'75%', fontSize:14, lineHeight:1.6 },
  botBubble: { background:'#161b22', border:'1px solid #30363d', borderRadius:'12px 12px 12px 4px', padding:'12px 16px', maxWidth:'80%', fontSize:14, lineHeight:1.7, color:'#c9d1d9' },
  upgradeBtn: { background:'#388bfd', color:'#fff', padding:'7px 16px', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600 },
  inputArea: { borderTop:'1px solid #21262d', padding:'14px 24px', display:'flex', gap:10, flexShrink:0 },
  input: { flex:1, background:'#161b22', border:'1px solid #30363d', borderRadius:8, color:'#e6edf3', fontSize:14, padding:'10px 14px', resize:'none', fontFamily:'inherit', outline:'none' },
  sendBtn: { background:'#238636', border:'none', borderRadius:8, color:'#fff', width:44, height:44, fontSize:18, cursor:'pointer' }
}
