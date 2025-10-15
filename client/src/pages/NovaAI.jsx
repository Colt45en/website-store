import React, { useState, useEffect, useRef } from 'react'

export default function NovaAI({}){
  const [q, setQ] = useState('')
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  // listen for messages from the embedded sc-widget
  React.useEffect(()=>{
    function onMsg(e){
      try{
        const d = e.data || {}
        if (d && d.type === 'sc-widget-patch'){
          const text = `${d.summary}\n\nOriginal snippet:\n${d.code.substring(0,1000)}`
          setQ(text)
        }
      }catch(_){ }
    }
    window.addEventListener('message', onMsg)
    return ()=> window.removeEventListener('message', onMsg)
  }, [])

  // client-side cache for QA (in-memory + sessionStorage)
  const cacheRef = useRef(new Map())
  const inflightRef = useRef(new Map())
  // populate cache from sessionStorage if present
  useEffect(()=>{
    try{
      const raw = sessionStorage.getItem('nova_qa_cache')
      if (raw) {
        const obj = JSON.parse(raw)
        Object.entries(obj).forEach(([k,v]) => cacheRef.current.set(k, v))
      }
    }catch(e){}
  }, [])

  // persist cache periodically
  useEffect(()=>{
    const t = setInterval(()=>{
      try{
        const obj = Object.fromEntries(cacheRef.current)
        sessionStorage.setItem('nova_qa_cache', JSON.stringify(obj))
      }catch(e){}
    }, 5000)
    return ()=> clearInterval(t)
  }, [])

  // lazy widget load
  const [widgetLoaded, setWidgetLoaded] = useState(false)

  async function ask(){
    const key = (q||'').toLowerCase().trim()
    if (!key) return
    // check cache first
    if (cacheRef.current.has(key)){
      setAnswers(cacheRef.current.get(key))
      return
    }
    // dedupe in-flight requests
    if (inflightRef.current.has(key)){
      try{
        const answers = await inflightRef.current.get(key)
        setAnswers(answers)
        return
      }catch(e){ /* fallthrough */ }
    }
    setLoading(true); setAnswers([])
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
    setAnswers(answers)
    setLoading(false)
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
    <div className="landing" style={{ padding:24 }}>
      <h1 className="nova-title">NOVA AI</h1>
      <p className="nova-sub">Ask about the site, products, and listings.</p>
      <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <small style={{ color: 'rgba(255,255,255,0.6)' }}>Embedded SC widget (Tone.js) — playable demo of SuperCollider snippets.</small>
          <div style={{ marginTop: 8, border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden' }}>
            {!widgetLoaded ? (
              <div style={{ padding:16, display:'flex', gap:8, alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ color:'rgba(255,255,255,0.7)' }}>SC widget not loaded to save resources.</div>
                <div>
                  <button className="cta" onClick={()=> setWidgetLoaded(true)}>Load widget</button>
                </div>
              </div>
            ) : (
              <iframe title="sc-widget" src="/sc-widget/index.html" style={{ width: '100%', height: 320, border: 'none' }} />
            )}
          </div>
        </div>
        <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="cta" onClick={() => window.open('/sc-widget/index.html', '_blank')}>Open widget</button>
          <a className="cta" href="/client/docs/haptics-guidelines.md" target="_blank" rel="noreferrer">Haptics guide</a>
          <button className="cta" onClick={seedHaptics}>Seed haptics guide</button>
        </div>
      </div>
      <div style={{ marginTop:16, display:'flex', gap:8 }}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about a product, listing, or site..." style={{ flex:1, padding:10, borderRadius:8, background:'#071018', border:'1px solid rgba(255,255,255,0.04)', color:'var(--white)' }} />
        <button className="cta" onClick={ask} disabled={loading}>{loading ? 'Searching...' : 'Ask'}</button>
      </div>
      <div style={{ marginTop:18 }}>
        {answers.map((a,idx) => (
          <div key={idx} className="card" style={{ marginBottom:10, transition:'transform .18s ease' }}>
            <div style={{ fontWeight:700 }}>{a.title || 'Source'}</div>
            <div style={{ opacity:0.9, marginTop:6 }}>{a.text}</div>
            {a.sourceId && <div style={{ marginTop:8, fontSize:12, color:'rgba(255,255,255,0.6)' }}>source: {a.sourceId}</div>}
          </div>
        ))}
      </div>

      {/* Floating chat toggle */}
      <button onClick={()=>setChatOpen(true)} style={{ position:'fixed', right:20, bottom:20, zIndex:9999, padding:'10px 14px', borderRadius:8, background:'#0b79d0', color:'#fff', border:'none', boxShadow:'0 8px 30px rgba(2,6,23,0.4)' }}>Open Chat</button>

      {/* Chat overlay */}
      {chatOpen && (
        <div style={{ position:'fixed', left:0, top:0, right:0, bottom:0, zIndex:9998, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'92%', maxWidth:980, height:'82%', background:'#071018', borderRadius:10, padding:16, boxShadow:'0 24px 80px rgba(0,0,0,0.6)', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:18, fontWeight:700 }}>NOVA Chat</div>
              <div>
                <button onClick={()=>setChatOpen(false)} style={{ marginRight:8 }} className="nav-btn">Close</button>
              </div>
            </div>
            <div style={{ flex:1, display:'flex', gap:12 }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ flex:1, overflowY:'auto', padding:8, borderRadius:6, background:'rgba(255,255,255,0.02)' }}>
                  {answers.length===0 && <div style={{ color:'rgba(255,255,255,0.6)' }}>No answers yet. Ask a question or load a widget and "Send patch to chat".</div>}
                  {answers.map((a, i) => (
                    <div key={i} style={{ marginBottom:12 }}>
                      <div style={{ fontWeight:700 }}>{a.title || 'Source'}</div>
                      <div style={{ opacity:0.9 }}>{a.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about a product, listing, or site..." style={{ flex:1, padding:10, borderRadius:8, background:'#071018', border:'1px solid rgba(255,255,255,0.04)', color:'var(--white)' }} />
                  <button className="cta" onClick={ask} disabled={loading}>{loading ? 'Searching...' : 'Ask'}</button>
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
    </div>
  )
}
