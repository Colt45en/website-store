import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import ToastProvider from './components/Toast'
import CartProvider from './components/CartContext'

// Apply saved theme early
try{ const t = localStorage.getItem('nova_theme'); if (t) document.documentElement.setAttribute('data-theme', t) }catch(e){}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CartProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </CartProvider>
  </React.StrictMode>
)
