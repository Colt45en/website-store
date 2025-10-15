import React, { useEffect, useState } from 'react'

export default function CartPage({ token }){
  const [items, setItems] = useState(JSON.parse(localStorage.getItem('nova_cart')||'[]'))
  useEffect(()=>{ localStorage.setItem('nova_cart_count', String(items.length)) }, [items])

  async function save(){
    if (!token) return alert('Sign in to save cart')
    await fetch('http://localhost:4000/api/cart', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ items }) })
    alert('Cart saved to your account')
  }

  function remove(i){ const copy=[...items]; copy.splice(i,1); setItems(copy) }
  function checkout(){ alert('Checkout stub — integrate Stripe here') }
  return (
    <div style={{ padding:24 }}>
      <h2>Your Cart</h2>
      {items.length===0 && <div>Your cart is empty</div>}
      {items.map((it, idx) => (
        <div key={idx} style={{ border:'1px solid rgba(255,255,255,0.04)', padding:8, borderRadius:8, margin:8 }}>
          <div style={{ fontWeight:700 }}>{it.title}</div>
          <div>${it.price.toFixed(2)}</div>
          <button onClick={()=>remove(idx)} className="cta" style={{ marginTop:6 }}>Remove</button>
        </div>
      ))}
      <div style={{ marginTop:12 }}>
        <button className="cta" onClick={checkout}>Checkout</button>
        <button style={{ marginLeft:8 }} onClick={save}>Save to account</button>
      </div>
    </div>
  )
}
