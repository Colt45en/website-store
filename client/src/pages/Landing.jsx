import React, { useEffect, useState } from 'react'
import { loadLanding, saveLanding } from '../lib/landingConfig'

export default function Landing({ onShop }){
  const [cfg, setCfg] = useState(loadLanding())
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(false)

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    if (params.get('edit') === 'true') setEditing(true)
    // fetch server landing config if available
    fetch('/api/landing').then(r=>r.json()).then(srv=>{
      if (srv && Object.keys(srv).length>0) setCfg(prev=>({ ...prev, ...srv }))
    }).catch(()=>{})
    if (cfg.showProducts) fetch('/api/products').then(r=>r.json()).then(d=>setProducts(d)).catch(()=>setProducts([]))
  }, [])

  async function save(){
    // if logged in, POST to server, else save locally
    const token = localStorage.getItem('nova_token')
    if (token) {
      try{
        const res = await fetch('/api/landing', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(cfg) })
        if (res.ok) { setEditing(false); return }
      }catch(e){ /* fallthrough to local save */ }
    }
    saveLanding(cfg); setEditing(false)
  }

  if (editing) return (
    <div className="landing auth-box">
      <h3>Edit Landing</h3>
      <label>Title</label>
      <input value={cfg.heroTitle} onChange={e=>setCfg({...cfg, heroTitle: e.target.value})} />
      <label>Subtitle</label>
      <input value={cfg.heroSubtitle} onChange={e=>setCfg({...cfg, heroSubtitle: e.target.value})} />
      <label>Promo</label>
      <input value={cfg.promo} onChange={e=>setCfg({...cfg, promo: e.target.value})} />
      <div style={{ marginTop:12 }}>
        <button className="cta" onClick={save}>Save</button>
        <button style={{ marginLeft:8 }} onClick={()=>setEditing(false)} className="nav-btn">Cancel</button>
      </div>
    </div>
  )

  return (
    <div className="landing">
      <h1 className="nova-title">{cfg.heroTitle}</h1>
      <p className="nova-sub">{cfg.heroSubtitle}</p>
      <div className="landing-cta">
        <button className="cta" onClick={onShop}>Shop Now</button>
      </div>
      <div style={{ marginTop:18, color:'var(--neon-orange)' }}>{cfg.promo}</div>
      {cfg.showProducts && products.length>0 && (
        <div style={{ marginTop:18 }}>
          <h3>Featured</h3>
          <div className="grid">
            {products.map(p => (
              <div key={p.id} className="card">
                <h3>{p.title}</h3>
                <div className="price">${p.price.toFixed(2)}</div>
                <p>{p.desc}</p>
                <div style={{ marginTop:8 }}>
                  <button className="cta" onClick={() => window.alert('View product ' + p.id)}>View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
