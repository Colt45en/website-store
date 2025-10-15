import React, { useState } from 'react'

export default function SignIn({ onSignedIn }){
  const [email, setEmail] = useState('demo@nova.local')
  const [password, setPassword] = useState('password')
  const [err, setErr] = useState(null)

  async function submit(e){
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (!res.ok) throw new Error('Login failed')
      const data = await res.json()
      onSignedIn(data.token, data.user)
    } catch (err) { setErr(String(err)) }
  }

  return (
    <div className="auth-box">
      <h2>Sign In</h2>
      <form onSubmit={submit}>
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="cta" type="submit">Sign In</button>
        {err && <div className="error">{err}</div>}
      </form>
      <p className="hint">Demo: demo@nova.local / password</p>
    </div>
  )
}
