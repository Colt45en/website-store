import React, { useEffect, useRef, useState } from 'react'
import { useToasts } from './Toast'
import flushPendingHelper from '../lib/flushPending'
import './ChatOverlay.css'

export default function ChatOverlay(){
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState([]) // array of { q, answers, ts }
  const [unread, setUnread] = useState(0)

  const cacheRef = useRef(new Map())
  const inflightRef = useRef(new Map())
  const pendingRef = useRef([]) // pending append queue [{entry, incr, attempts, nextAttempt}]
  const [nowTick, setNowTick] = useState(Date.now())
  const [retryAllLoading, setRetryAllLoading] = useState(false)
  const [retrySummary, setRetrySummary] = useState('')
  const retryTimerRef = useRef(null)
  const addToast = useToasts()

  useEffect(()=>{
    try{
      const raw = sessionStorage.getItem('nova_qa_cache')
      if (raw) {
        const obj = JSON.parse(raw)
        Object.entries(obj).forEach(([k,v]) => cacheRef.current.set(k, v))
      }
    }catch(e){}
    // restore conversation
    try{
      const rawConv = sessionStorage.getItem('nova_chat_conversation')
      if (rawConv){ setConversation(JSON.parse(rawConv)) }
    }catch(e){}
    try{
      const rawU = sessionStorage.getItem('nova_chat_unread')
      if (rawU) setUnread(Number(rawU) || 0)
    }catch(e){}
    // if user is signed in, try to load server-backed chat
    try{
      const token = localStorage.getItem('nova_token')
      if (token){
        fetch('/api/chat', { headers: { Authorization: 'Bearer ' + token } }).then(r=>r.json()).then(j=>{
          if (j && j.conversation) setConversation(j.conversation||[])
          if (j && typeof j.unread !== 'undefined') setUnread(Number(j.unread)||0)
        }).catch(()=>{})
      }
    }catch(e){}
  }, [])
  useEffect(()=>{
    const t = setInterval(()=>{
      try{ const obj = Object.fromEntries(cacheRef.current); sessionStorage.setItem('nova_qa_cache', JSON.stringify(obj)) }catch(e){}
    },5000)
    return ()=> clearInterval(t)
  }, [])

  // restore pending queue and background flush using exponential backoff + jitter
  useEffect(()=>{
    try{
      const raw = localStorage.getItem('nova_chat_pending')
      if (raw) pendingRef.current = JSON.parse(raw)
    }catch(e){}

    const MAX_ATTEMPTS = 6
    const BASE_DELAY = 2000 // ms

    const loop = setInterval(()=>{
      try{
        const now = Date.now()
        // update tick so UI can show live ETA countdown
        setNowTick(now)
        if (!pendingRef.current || pendingRef.current.length === 0) return
        const token = localStorage.getItem('nova_token')
        if (!token) return
        // attempt any items whose nextAttempt is due
        for (let i = 0; i < pendingRef.current.length; i++){
          const item = pendingRef.current[i]
          if (item.nextAttempt && item.nextAttempt > now) continue
          // try send
          fetch('/api/chat/append', { method:'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ item: item.entry, incr: item.incr||0 }) }).then(r=>{
            if (!r.ok) throw new Error('HTTP '+r.status)
            return r.json()
          }).then(()=>{
            // remove this item
            pendingRef.current = pendingRef.current.filter(x=>x.entry.ts !== item.entry.ts)
            try{ localStorage.setItem('nova_chat_pending', JSON.stringify(pendingRef.current)) }catch(e){}
      try{ addToast('Pending message sent', { timeout: 2200 }) }catch(e){}
          }).catch(()=>{
            item.attempts = (item.attempts||0) + 1
            if (item.attempts > MAX_ATTEMPTS){
              // drop it
              pendingRef.current = pendingRef.current.filter(x=>x.entry.ts !== item.entry.ts)
              try{ localStorage.setItem('nova_chat_pending', JSON.stringify(pendingRef.current)) }catch(e){}
            } else {
              // set exponential backoff with jitter
              const delay = Math.min(60000, BASE_DELAY * Math.pow(2, item.attempts))
              const jitter = Math.floor(Math.random() * 1000)
              item.nextAttempt = Date.now() + delay + jitter
              try{ localStorage.setItem('nova_chat_pending', JSON.stringify(pendingRef.current)) }catch(e){}
            }
          })
        }
      }catch(e){}
    }, 2000)
    return ()=> clearInterval(loop)
  }, [])
  // flush function to attempt sending all pending items immediately (used on sign-in)
  async function flushPending(){
    try{
      setRetryAllLoading(true)
      const result = await flushPendingHelper(addToast)
      // reload pendingRef from storage
      try{ pendingRef.current = JSON.parse(localStorage.getItem('nova_chat_pending') || '[]') }catch(e){ pendingRef.current = [] }
      // show summary toast with exact counts
      try{
          if (result && result.ok){
            const sent = result.sent || 0
            const failed = result.failed || 0
            if (failed === 0) {
              addToast(`${sent} message(s) sent`, { timeout: 2200 })
              setRetrySummary(`${sent} message(s) sent`)
            } else {
              addToast(`${sent} sent, ${failed} failed`, { timeout: 3000 })
              setRetrySummary(`${sent} sent, ${failed} failed`)
            }
            // auto-clear the inline summary after 10 seconds
            try{ if (retryTimerRef.current) clearTimeout(retryTimerRef.current) }catch(e){}
            retryTimerRef.current = setTimeout(()=>{ setRetrySummary(''); retryTimerRef.current = null }, 10000)
        } else {
          addToast('Retry finished (some failed)', { timeout: 3000 })
        }
      }catch(e){}
      return result
    }catch(e){ return { ok:false, reason: String(e) } }
    finally{ setRetryAllLoading(false) }
  }

  // listen for storage events so signing in from another tab triggers flush
  useEffect(()=>{
    function onStorage(e){
      try{ if (e.key === 'nova_token' && e.newValue) flushPending() }catch(_){}
    }
    window.addEventListener('storage', onStorage)
    return ()=> window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(()=>{
    function onMsg(e){
      try{
        const d = e.data || {}
        if (d && d.type === 'sc-widget-patch'){
          const text = `${d.summary}\n\nOriginal snippet:\n${d.code.substring(0,1000)}`
          setQ(text)
          setOpen(true)
        }
      }catch(_){ }
    }
    window.addEventListener('message', onMsg)
    return ()=> window.removeEventListener('message', onMsg)
  }, [])

  // keyboard shortcut: Ctrl/Cmd+K to toggle chat
  useEffect(()=>{
    function onKey(e){
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
        e.preventDefault(); setOpen(o=>!o)
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [])

  async function ask(){
    const key = (q||'').toLowerCase().trim()
    if (!key) return
    if (cacheRef.current.has(key)){ const cached = cacheRef.current.get(key); pushConversation(key, cached); setOpen(true); return }
    if (inflightRef.current.has(key)){
      try{ const answers = await inflightRef.current.get(key); pushConversation(key, answers); setOpen(true); return }catch(e){}
    }
    setLoading(true)
    const promise = (async ()=>{
      try{
        const res = await fetch('/api/qa', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ q: key }) })
        const j = await res.json()
        const answers = j.answers || []
        try{ cacheRef.current.set(key, answers) }catch(e){}
        return answers
      }catch(e){ return [{ text: 'QA failed: ' + String(e) }] }
    })()
    inflightRef.current.set(key, promise)
    const answers = await promise
    inflightRef.current.delete(key)
    pushConversation(key, answers)
    setLoading(false)
    setOpen(true)
  }

  function pushConversation(qText, answers){
    const entry = { q: qText, answers, ts: Date.now() }
    setConversation(prev => {
      const next = (prev||[]).concat(entry).slice(-50)
      try{ sessionStorage.setItem('nova_chat_conversation', JSON.stringify(next)) }catch(e){}
      // increment unread if overlay is closed
      try{
        if (!open) {
          const nu = (Number(sessionStorage.getItem('nova_chat_unread'))||0) + 1
          sessionStorage.setItem('nova_chat_unread', String(nu))
          setUnread(nu)
          // trigger badge pulse animation
          const el = document.querySelector('.chat-badge')
          if (el){ el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse') }
        }
      }catch(e){}
      return next
    })
    try{ cacheRef.current.set(qText, answers) }catch(e){}
    // sync to server if signed in: append the single entry and increment unread
    try{
      const token = localStorage.getItem('nova_token')
      if (token) {
        fetch('/api/chat/append', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ item: entry, incr: 1 }) }).then(r=>{
          if (!r.ok) throw new Error('HTTP '+r.status)
        }).catch(()=>{
          // enqueue for retry
          pendingRef.current = pendingRef.current || []
          pendingRef.current.push({ entry, incr: 1, attempts: 0 })
          try{ localStorage.setItem('nova_chat_pending', JSON.stringify(pendingRef.current)) }catch(e){}
        })
      } else {
        // not signed in, keep pending locally to flush later
  pendingRef.current = pendingRef.current || []
  pendingRef.current.push({ entry, incr: 0, attempts: 0 })
  try{ localStorage.setItem('nova_chat_pending', JSON.stringify(pendingRef.current)) }catch(e){}
      }
    }catch(e){
      pendingRef.current = pendingRef.current || []
      pendingRef.current.push({ entry, incr: 0, attempts: 0 })
      try{ localStorage.setItem('nova_chat_pending', JSON.stringify(pendingRef.current)) }catch(e){}
    }
  }

  // Send a raw user message (optimistic): add entry and enqueue for append
  function sendUserMessage(text){
    if (!text || !text.trim()) return
    const entry = { q: text.trim(), role: 'user', ts: Date.now() }
    setConversation(prev => {
      const next = (prev||[]).concat(entry).slice(-50)
      try{ sessionStorage.setItem('nova_chat_conversation', JSON.stringify(next)) }catch(e){}
      return next
    })
    try{
  pendingRef.current = pendingRef.current || []
  const token = localStorage.getItem('nova_token')
  pendingRef.current.push({ entry, incr: token ? 1 : 0, attempts: 0 })
  try{ localStorage.setItem('nova_chat_pending', JSON.stringify(pendingRef.current)) }catch(e){}
      // try immediate flush if signed in
      if (token) fetch('/api/chat/append', { method:'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ item: entry, incr: 1 }) }).then(r=>{
  if (!r.ok) throw new Error('HTTP '+r.status)
  // remove any pending with same ts
  pendingRef.current = (pendingRef.current||[]).filter(p=>p.entry.ts !== entry.ts)
  try{ localStorage.setItem('nova_chat_pending', JSON.stringify(pendingRef.current)) }catch(e){}
      }).catch(()=>{})
    }catch(e){}
  }

  function deleteEntry(idx){
    setConversation(prev => {
      const next = (prev||[]).slice(); next.splice(idx,1)
      try{ sessionStorage.setItem('nova_chat_conversation', JSON.stringify(next)) }catch(e){}
      try{ const token = localStorage.getItem('nova_token'); if (token){ const ts = prev[idx] && prev[idx].ts; if (ts) fetch('/api/chat/entry/'+ts, { method:'DELETE', headers:{ Authorization: 'Bearer ' + token } }).catch(()=>{}) } }catch(e){}
      return next
    })
  }

  function exportEntry(idx){
    const entry = conversation[idx]
    if (!entry) return
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `nova-chat-entry-${entry.ts}.json`; a.click(); URL.revokeObjectURL(url)
  }

  function exportAll(){
    const blob = new Blob([JSON.stringify(conversation || [], null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `nova-chat-conversation-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url)
    // if signed in, also trigger server export endpoint in new tab
    try{ const token = localStorage.getItem('nova_token'); if (token) window.open('/api/chat/export', '_blank') }catch(e){}
  }

  async function seedHaptics(){
    try{
      const demo = await fetch('/api/auth/demo',{ method: 'POST' }).then(r=>r.json())
      const token = demo.token
      const body = {
        title: 'Haptics & Audio Guidelines (short)',
        text: 'Frequency/vibration: use ~40–200Hz for LRAs; <100Hz for ERMs. Resolution: audio = sample rate/bit depth (48k recommended); haptics = PWM/update resolution. Depth/contrast: audio = reverb/LPF/HRTF; haptics = amplitude, envelope, multi-frequency. Sandbox: WebAudio in browser for demos; native or microcontroller for low-latency haptics.'
      }
      const res = await fetch('/api/qa/train', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) })
      if (res.ok) alert('Haptics guide added to KB (demo)')
      else alert('Failed to add guide')
    }catch(e){ alert('Seed failed: '+String(e)) }
  }

  return (
    <>
      <div style={{ position:'relative', display:'inline-block', marginLeft:8 }}>
        <button className="nav-btn" onClick={() => {
          setOpen(true);
          setUnread(0);
          try{ sessionStorage.setItem('nova_chat_unread','0') }catch(e){}
          try{
            const token = localStorage.getItem('nova_token')
            if (token) fetch('/api/chat/mark-read', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(()=>{})
          }catch(e){}
        }}>
          Chat
        </button>
        {unread > 0 && (
          <div className="chat-badge">{unread}</div>
        )}
        {pendingRef.current && pendingRef.current.length > 0 && (
          <div className="chat-badge" style={{ right: -6, top: 18, background: '#f39c12' }}>{pendingRef.current.length}</div>
        )}
      </div>
      {open && (
        <div style={{ position:'fixed', left:0, top:0, right:0, bottom:0, zIndex:9998, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'92%', maxWidth:980, height:'82%', background:'#071018', borderRadius:10, padding:16, boxShadow:'0 24px 80px rgba(0,0,0,0.6)', display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:18, fontWeight:700 }}>
                NOVA Chat
                {retrySummary && <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:4 }}>{retrySummary}</div>}
              </div>
              <div>
                    <button onClick={()=>setOpen(false)} className="nav-btn">Close</button>
                    <button onClick={()=>{ flushPending(); }} disabled={retryAllLoading} className="nav-btn" style={{ marginLeft:8 }}>
                      {retryAllLoading ? 'Retrying...' : 'Retry all'}
                    </button>
                    <button onClick={()=>{
                      if (!confirm('Clear chat history? This cannot be undone.')) return;
                      try{ sessionStorage.removeItem('nova_chat_conversation'); sessionStorage.removeItem('nova_chat_unread') }catch(e){}
                      setConversation([]); setUnread(0)
                    }} className="nav-btn" style={{ marginLeft:8 }}>Clear history</button>
                    <button onClick={exportAll} className="nav-btn" style={{ marginLeft:8 }}>Export all</button>
              </div>
            </div>
            <div style={{ flex:1, display:'flex', gap:12 }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                <div className="chat-history">
                  {(!conversation || conversation.length===0) && <div className="chat-empty">No answers yet. Ask a question or load a widget and "Send patch to chat".</div>}
                  {conversation.map((entry, idx) => (
                    <div key={idx} className="chat-entry">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div className="chat-q">Q: {entry.q}</div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="nav-btn" onClick={()=>exportEntry(idx)}>Export</button>
                          <button className="nav-btn" onClick={()=>{ if (!confirm('Delete this entry?')) return; deleteEntry(idx) }}>Delete</button>
                        </div>
                      </div>
                      {entry.answers && entry.answers.map((a, i)=> (
                        <div key={i} className="chat-a">
                          <div className="chat-a-title">{a.title || 'Source'}</div>
                          <div className="chat-a-text">{a.text}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {/* Pending unsent messages */}
                  {pendingRef.current && pendingRef.current.length > 0 && (
                    <div style={{ marginTop:12, padding:8, borderTop: '1px dashed rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Pending unsent messages</div>
                      {pendingRef.current.map((p, i) => {
                        const attempts = p.attempts || 0
                        const now = Date.now()
                        let eta = ''
                        if (p.nextAttempt && p.nextAttempt > now) {
                          const s = Math.max(0, Math.round((p.nextAttempt - now)/1000))
                          eta = ` (retry in ${s}s)`
                        }
                        return (
                        <div key={p.entry.ts} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:6 }}>
                          <div style={{ fontSize:13 }}>{p.entry.q || p.entry.text || '(no text)'} <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>[{attempts} attempts]{eta}</span></div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button className="nav-btn" onClick={()=>{ flushPending(); }} >Retry</button>
                            <button className="nav-btn" onClick={()=>{ pendingRef.current = (pendingRef.current||[]).filter(x=>x.entry.ts !== p.entry.ts); try{ localStorage.setItem('nova_chat_pending', JSON.stringify(pendingRef.current)) }catch(e){} }}>Remove</button>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about a product, listing, or site..." style={{ flex:1, padding:10, borderRadius:8, background:'#071018', border:'1px solid rgba(255,255,255,0.04)', color:'var(--white)' }} />
                  <button className="cta" onClick={ask} disabled={loading}>{loading ? 'Searching...' : 'Ask'}</button>
                  <button className="nav-btn" onClick={()=>{ sendUserMessage(q); setQ('') }} style={{ marginLeft:8 }}>Send</button>
                </div>
              </div>
              <div style={{ width:240, display:'flex', flexDirection:'column', gap:8 }}>
                <button className="cta" onClick={() => window.open('/sc-widget/index.html', '_blank')}>Open widget</button>
                <button className="cta" onClick={seedHaptics}>Seed haptics guide</button>
                <div style={{ marginTop: 'auto', fontSize:12, color:'rgba(255,255,255,0.6)' }}>Tip: Click "Send patch to chat" in the widget to prefill the input.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
