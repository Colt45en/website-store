import React, { useEffect, useState } from 'react'

export default function Store(){
  const [products, setProducts] = useState([])
  useEffect(() => { fetch('http://localhost:4000/api/products').then(r => r.json()).then(setProducts) }, [])
  return (
    <div className="store">
      <h2>Store</h2>
      <div className="grid">
        {products.map(p => (
          <div key={p.id} className="card">
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <div className="price">${p.price.toFixed(2)}</div>
            <button className="cta">Buy</button>
          </div>
        ))}
      </div>
    </div>
  )
}
