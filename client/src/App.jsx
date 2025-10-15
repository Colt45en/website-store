import React, { useEffect, useState } from 'react'
import Landing from './pages/Landing'
import BuildProgressBar from './components/BuildProgressBar'
import SignIn from './pages/SignIn'
import Store from './pages/Store'
import Dashboard from './pages/Dashboard'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/Cart'
import Register from './pages/Register'
import NovaAI from './pages/NovaAI'
import { CartIcon, UserIcon, MenuIcon } from './components/Icons'
import ThemeSelector from './components/ThemeSelector'
import ToastProvider, { useToasts } from './components/Toast'
import OffCanvasCart from './components/OffCanvasCart'
import CartProvider, { useCart } from './components/CartContext'
import ChatOverlay from './components/ChatOverlay'

export default function App(){
  const [route, setRoute] = useState('landing')
  const [token, setToken] = useState(localStorage.getItem('nova_token'))
  const [user, setUser] = useState(null)
  const { open, openCart, closeCart, items } = useCart()

  useEffect(() => {
    if (token) localStorage.setItem('nova_token', token)
    else localStorage.removeItem('nova_token')
  }, [token])

  function onSignedIn(t, u){ setToken(t); setUser(u); setRoute('dashboard') }
  function signOut(){ setToken(null); setUser(null); setRoute('landing') }

  return (
    <ToastProvider>
      <BuildProgressBar />
      <div>
        <header className="nova-header">
          <div className="nova-brand">NOVA</div>
          <div className="nav-right">
            <button onClick={() => setRoute('landing')} className="nav-btn">Home</button>
            <button onClick={() => setRoute('store')} className="nav-btn">Store</button>
            <button onClick={() => openCart()} className="nav-btn"><CartIcon /> Cart ({items.length || 0})</button>
            <div className="auth-block">
              {token ? (
                <button onClick={() => setRoute('dashboard')} className="nav-btn"><UserIcon /> Hub</button>
              ) : (
                <>
                  <button onClick={() => setRoute('signin')} className="nav-btn">Sign In</button>
                  <button onClick={() => setRoute('register')} className="nav-btn">Register</button>
                </>
              )}
              <ThemeSelector />
              <ChatOverlay />
              <button className="nav-btn" onClick={async ()=>{
                // demo login convenience
                try{
                  const res = await fetch('/api/auth/demo', { method: 'POST' })
                  const j = await res.json(); localStorage.setItem('nova_token', j.token); window.location.reload()
                }catch(e){ alert('Demo login failed') }
              }}>Demo</button>
            </div>
            <button className="mobile-menu nav-btn" onClick={() => setRoute('store')}><MenuIcon /></button>
          </div>
        </header>
        <div style={{ position:'absolute', right:20, top:14 }}>
          <button className="nav-btn" onClick={() => setRoute('ai')}>AI</button>
        </div>
        <OffCanvasCart open={open} onClose={closeCart} token={token} />

        <main>
          {route === 'landing' && <Landing onShop={() => setRoute('store')} />}
        {route === 'ai' && <NovaAI />}
          {route === 'signin' && <SignIn onSignedIn={onSignedIn} />}
          {route === 'register' && <Register onSignedIn={onSignedIn} />}
          {route === 'store' && <Store token={token} onView={(id)=> setRoute(`product:${id}`)} />}
          {route.startsWith('product:') && <ProductDetail id={Number(route.split(':')[1])} />}
          {route === 'cart' && <CartPage token={token} />}
          {route === 'dashboard' && <Dashboard token={token} onSignOut={signOut} />}
        </main>

        <footer className="nova-footer">© Nova — Neon Store</footer>
      </div>
    </ToastProvider>
  )
}
