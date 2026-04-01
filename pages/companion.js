import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const COMPANIONS = {
  nova: { name: 'Nova', emoji: '✨', color: '#bc8cff', desc: 'Warm, witty & curious' },
  axel: { name: 'Axel', emoji: '🧠', color: '#388bfd', desc: 'Calm, real & straight-talking' }
}

export default function Companion() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [personality, setPersonality] = useState(null)
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

  function pickCompanion(key) {
    setPersonality(key)
    const c = COMPANIONS[key]
    setMessages([{
      role: 'assistant',
      content: key === 'nova'
        ? `Hey! I'm Nova 😊 Really glad you're here. What's on your mind today?`
        : `Hey, I'm Axel. Good to meet you. What's going on?`
    }])
  }

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)

    const res = await fetch('/api/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMsg,
        messages: messages.slice(-20).filter(m => m.role !== 'system'),
        personality
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

  const comp = personality ? COMPANIONS[personality] : null

  if (!authed) return null

  // Companion picker screen
  if (!personality) return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <a href="/dashboard" style={styles.back}>← Dashboard</a>
        <span style={styles.navTitle}>💬 AI Companion</span>
        <span />
      </nav>
      <div style={styles.picker}>
        <h1 style={styles.pickerTitle}>Who do you want to talk to?</h1>
        <p style={styles.pickerSub}>Pick your companion for this session. You can switch anytime.</p>
        <div style={styles.pickerCards}>
          {Object.entries(COMPANIONS).map(([key, c]) => (
            <div key={key} style={{...styles.pickerCard, borderColor: c.color}} onClick={() => pickCompanion(key)}>
              <div style={styles.companionEmoji}>{c.emoji}</div>
              <h2 style={{...styles.companionName, color: c.color}}>{c.name}</h2>
              <p style={styles.companionDesc}>{c.desc}</p>
              <button style={{...styles.pickBtn, background: c.color}}>Chat with {c.name} →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <a href="/dashboard" style={styles.back}>← Dashboard</a>
        <span style={{...styles.navTitle, color: comp.color}}>{comp.emoji} {comp.name}</span>
        <button style={styles.switchBtn} onClick={() => { setPersonality(null); setMessages([]) }}>Switch</button>
      </nav>

      {usage && (
        <div style={styles.usageBar}>
          <span>{usage.used}/{usage.limit} messages today</span>
          {usage.remaining <= 5 && <a href="/pricing" style={styles.upgradeLink}>Upgrade for more →</a>}
        </div>
      )}

      <div style={styles.chat} ref={chatRef}>
        {messages.map((m, i) => (
          <div key={i} style={{...styles.msg, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'}}>
            {m.role === 'assistant' && (
              <div style={{...styles.avatar, background: comp.color}}>{comp.emoji}</div>
            )}
            <div style={m.role === 'user' ? styles.userBubble : styles.botBubble}>
              {m.content}
              {m.upgrade && <div style={{marginTop:12}}><a href="/pricing" style={{...styles.upgradeBtn, background: comp.color}}>See upgrade plans →</a></div>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{...styles.msg, justifyContent:'flex-start'}}>
            <div style={{...styles.avatar, background: comp.color}}>{comp.emoji}</div>
            <div style={styles.botBubble}><span style={{color:'#8b949e'}}>typing...</span></div>
          </div>
        )}
      </div>

      <div style={styles.inputArea}>
        <textarea
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={`Say something to ${comp.name}...`}
          rows={1}
        />
        <button style={{...styles.sendBtn, background: comp.color}} onClick={send} disabled={loading}>➤</button>
      </div>
    </div>
  )
}

const styles = {
  page: { background:'#0d1117', color:'#e6edf3', height:'100vh', display:'flex', flexDirection:'column', fontFamily:'-apple-system,sans-serif' },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', borderBottom:'1px solid #21262d', flexShrink:0 },
  back: { color:'#8b949e', textDecoration:'none', fontSize:13 },
  navTitle: { fontWeight:700, fontSize:15 },
  switchBtn: { background:'transparent', border:'1px solid #30363d', color:'#8b949e', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12 },
  usageBar: { background:'#161b22', borderBottom:'1px solid #21262d', padding:'6px 24px', fontSize:12, color:'#8b949e', display:'flex', justifyContent:'space-between', flexShrink:0 },
  upgradeLink: { color:'#388bfd', textDecoration:'none', fontWeight:600 },
  picker: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40 },
  pickerTitle: { fontSize:28, fontWeight:800, margin:'0 0 10px', textAlign:'center' },
  pickerSub: { color:'#8b949e', fontSize:15, marginBottom:40, textAlign:'center' },
  pickerCards: { display:'flex', gap:24, flexWrap:'wrap', justifyContent:'center' },
  pickerCard: { background:'#161b22', border:'2px solid', borderRadius:20, padding:36, width:260, textAlign:'center', cursor:'pointer', transition:'transform .15s' },
  companionEmoji: { fontSize:52, marginBottom:16 },
  companionName: { fontSize:24, fontWeight:800, margin:'0 0 8px' },
  companionDesc: { color:'#8b949e', fontSize:14, marginBottom:24, lineHeight:1.6 },
  pickBtn: { border:'none', color:'#fff', padding:'12px 24px', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:700, width:'100%' },
  chat: { flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:14 },
  msg: { display:'flex', gap:10, alignItems:'flex-start' },
  avatar: { width:32, height:32, borderRadius:50, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 },
  userBubble: { background:'#1f6feb', borderRadius:'18px 18px 4px 18px', padding:'10px 16px', maxWidth:'72%', fontSize:14, lineHeight:1.6 },
  botBubble: { background:'#161b22', border:'1px solid #30363d', borderRadius:'18px 18px 18px 4px', padding:'12px 16px', maxWidth:'72%', fontSize:14, lineHeight:1.7, color:'#c9d1d9' },
  upgradeBtn: { color:'#fff', padding:'7px 16px', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600, display:'inline-block' },
  inputArea: { borderTop:'1px solid #21262d', padding:'14px 24px', display:'flex', gap:10, flexShrink:0 },
  input: { flex:1, background:'#161b22', border:'1px solid #30363d', borderRadius:20, color:'#e6edf3', fontSize:14, padding:'10px 18px', resize:'none', fontFamily:'inherit', outline:'none' },
  sendBtn: { border:'none', borderRadius:50, color:'#fff', width:44, height:44, fontSize:18, cursor:'pointer', flexShrink:0 }
}
