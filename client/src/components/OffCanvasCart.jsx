import React, { useState } from 'react'
import { useCart } from './CartContext'
import { useToasts } from './Toast'

export default function OffCanvasCart({ open, onClose, token }){
  const { items, removeItem, close } = useCart()
  const addToast = useToasts()
  const [saving, setSaving] = useState(false)
  async function save(){
    if (!token) { addToast('Sign in to save cart', { timeout: 3000 }); return }
    setSaving(true)
    try{
      const res = await fetch('http://localhost:4000/api/cart', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ items }) })
      if (!res.ok) throw new Error('Save failed')
      addToast('Cart saved', { timeout: 2500 })
    }catch(e){
      addToast('Failed to save cart', { timeout: 4000 })
    } finally {
      setSaving(false)
    }
  }
  if (!open) return null
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e)=>e.stopPropagation()}>
        <h3>Your Cart</h3>
        {items.length===0 && <div>Cart empty</div>}
        {items.map((it, idx) => (
          <div key={idx} className="drawer-item">
            <div>{it.title}</div>
            <div>${it.price.toFixed(2)}</div>
            <button onClick={()=>removeItem(idx)} className="cta">Remove</button>
          </div>
        ))}
        <div style={{ marginTop:12 }}>
          <button className="cta" onClick={() => addToast('Checkout not implemented', { timeout: 3000 })} disabled={saving}>Checkout</button>
          <button style={{ marginLeft:8, position:'relative' }} onClick={save} disabled={saving} className="cta">
            {saving ? (
              <>
                <span className="spinner" style={{ marginRight:8, verticalAlign:'middle' }}></span>
                Saving...
              </>
            ) : 'Save'}
          </button>
        </div>
        <div style={{ marginTop:12 }}>
          <button onClick={() => close()} className="nav-btn">Close</button>
        </div>
      </aside>
    </div>
  )
}
