import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }){
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nova_cart')||'[]') } catch (e) { return [] }
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('nova_cart', JSON.stringify(items))
    localStorage.setItem('nova_cart_count', String(items.length))
  }, [items])

  const addItem = useCallback((item) => setItems(prev => [...prev, item]), [])
  const removeItem = useCallback((index) => setItems(prev => { const c=[...prev]; c.splice(index,1); return c }), [])
  const clear = useCallback(() => setItems([]), [])
  const openCart = useCallback(() => setOpen(true), [])
  const closeCart = useCallback(() => setOpen(false), [])

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, open, openCart, closeCart, close: closeCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(){
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

export default CartProvider
