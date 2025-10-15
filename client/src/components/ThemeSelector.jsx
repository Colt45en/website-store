import React, { useEffect, useState } from 'react'

const THEMES = [
  { id: 'neon', label: 'Neon' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' }
]

function applyTheme(t){
  try{ document.documentElement.setAttribute('data-theme', t) }catch(e){}
}

export default function ThemeSelector(){
  const [theme, setTheme] = useState(() => {
    try{ return localStorage.getItem('nova_theme') || 'neon' }catch(e){ return 'neon' }
  })
  useEffect(()=>{ applyTheme(theme); try{ localStorage.setItem('nova_theme', theme) }catch(e){} }, [theme])

  return (
    <select aria-label="Theme" value={theme} onChange={e=>setTheme(e.target.value)} style={{ background:'transparent', color:'var(--white)', border:'1px solid rgba(255,255,255,0.04)', padding:'6px 8px', borderRadius:6 }}>
      {THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
    </select>
  )
}
