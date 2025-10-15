import React, { useEffect, useState } from 'react'
import { useToasts } from '../components/Toast'

export default function ProductDetail({ id }){
  const [product, setProduct] = useState(null)
  useEffect(() => { fetch('http://localhost:4000/api/products').then(r=>r.json()).then(list=>setProduct(list.find(p=>p.id===id))) }, [id])
  if (!product) return <div style={{ padding:24 }}>Loading...</div>
  const addToast = useToasts()
  function addToCart(){
    const existing = JSON.parse(localStorage.getItem('nova_cart')||'[]')
    existing.push({ id: product.id, title: product.title, price: product.price, qty:1 })
    localStorage.setItem('nova_cart', JSON.stringify(existing))
    localStorage.setItem('nova_cart_count', String(existing.length))
    addToast('Added to cart')
  }
  return (
    <div style={{ padding:24 }}>
      <h2>{product.title}</h2>
      <p>{product.desc}</p>
      <div style={{ fontWeight:700 }}>${product.price.toFixed(2)}</div>
      <button className="cta" onClick={addToCart}>Add to Cart</button>
    </div>
  )
}
