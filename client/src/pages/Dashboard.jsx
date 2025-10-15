import React, { useEffect, useState } from 'react'

export default function Dashboard({ token, onSignOut }){
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState([])
  const [listings, setListings] = useState([])
  const [pending, setPending] = useState([])
  const [newListing, setNewListing] = useState({ title:'', desc:'', price:0 })
  const refreshPending = async () => {
    if (!token) return
    const res = await fetch('/api/listings/mine', { headers: { Authorization: 'Bearer ' + token } })
    const d = await res.json().catch(()=>[])
    if (Array.isArray(d)) setPending(d.filter(l=>l.status!=='approved'))
  }
  useEffect(() => {
    if (!token) return
    fetch('http://localhost:4000/api/auth/me', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.json()).then(setUser)
    fetch('http://localhost:4000/api/cart', { headers: { Authorization: 'Bearer ' + token } }).then(r=>r.json()).then(d=>{ if (d && d.items) setCart(d.items) })
    // fetch user's listings and public approved
    fetch('/api/listings').then(r=>r.json()).then(setListings)
    fetch('/api/listings/mine', { headers: { Authorization: 'Bearer ' + token } }).then(r=>r.json()).then(d=>{ if (Array.isArray(d)) setPending(d.filter(l=>l.status!=='approved')) })
    // ensure refresh function populates pending on load
    refreshPending()
  }, [token])

  if (!token) return <div className="auth-box">Please sign in.</div>
  return (
    <div className="dashboard">
      <h2>Client Hub</h2>
      {user ? <div>Welcome back, {user.name}</div> : <div>Loading...</div>}
      <div style={{ marginTop:12 }}>
        <h4>Your saved cart</h4>
        {cart.length===0 && <div>No saved items</div>}
        {cart.map((it,idx)=> (
          <div key={idx} style={{ padding:8, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontWeight:700 }}>{it.title}</div>
            <div>${it.price?.toFixed?.(2) || it.price}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <h4>Sell an item</h4>
        <input placeholder="Title" value={newListing.title} onChange={e=>setNewListing({...newListing, title: e.target.value})} />
        <input placeholder="Price" type="number" value={newListing.price} onChange={e=>setNewListing({...newListing, price: Number(e.target.value)})} />
        <textarea placeholder="Description" value={newListing.desc} onChange={e=>setNewListing({...newListing, desc: e.target.value})} />
        <div style={{ marginTop:8 }}>
          <button className="cta" onClick={async ()=>{
            const res = await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(newListing) })
            if (res.ok) { setNewListing({ title:'', desc:'', price:0 }); alert('Listing submitted for approval') }
          }}>Submit for approval</button>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h4>Your pending listings</h4>
        {pending.length===0 && <div>No pending listings</div>}
        {pending.map(p => (
          <div key={p.id} style={{ padding:8, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontWeight:700 }}>{p.title} — <small>{p.status}</small></div>
            <div>{p.desc}</div>
            <div>${p.price}</div>
            {/* Approve button shown only if current user is demo admin (server checks email) */}
            {user && user.email === 'demo@nova.local' && (
              <div style={{ marginTop:6 }}>
                <button className="cta" onClick={async ()=>{
                  const res = await fetch(`/api/listings/${p.id}/approve`, { method: 'POST', headers: { Authorization: 'Bearer ' + token } })
                  if (res.ok) { alert('Approved'); refreshPending(); } else { const j = await res.json().catch(()=>({})); alert('Approve failed: '+(j.error||res.statusText)) }
                }}>Approve</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <h4>Public listings</h4>
        {listings.length===0 && <div>No items for sale</div>}
        {listings.map(l => (
          <div key={l.id} style={{ padding:8, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontWeight:700 }}>{l.title}</div>
            <div>{l.desc}</div>
            <div>${l.price}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="cta" onClick={onSignOut}>Sign Out</button>
      </div>
    </div>
  )
}
