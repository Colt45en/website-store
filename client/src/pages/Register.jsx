import React, { useState } from 'react'

export default function Register({ onSignedIn }){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)

  async function submit(e){
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:4000/api/auth/register', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ name, email, password }) })
      if (!res.ok) throw new Error('Register failed')
      const data = await res.json()
      onSignedIn(data.token, data.user)
    } catch (err) { setErr(String(err)) }
  }

  return (
    <div className="auth-box">
      <h2>Register</h2>
      <form onSubmit={submit}>
        <label>Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} />
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="cta" type="submit">Register</button>
        {err && <div className="error">{err}</div>}
      </form>
    </div>
  )
}
