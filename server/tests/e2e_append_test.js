// Simple e2e script: requires server running on localhost:4000
// It will request a demo token, then POST a chat append and print the server response.
const fetch = require('node-fetch')

async function run(){
  try{
    console.log('Requesting demo token...')
    const demo = await fetch('http://localhost:4000/api/auth/demo', { method: 'POST' }).then(r=>r.json())
    if (!demo || !demo.token) { console.error('No token received', demo); process.exit(2) }
    console.log('Token received for user', demo.user && demo.user.id)
    const token = demo.token
    const entry = { q: 'e2e test message', ts: Date.now(), role: 'user' }
    const res = await fetch('http://localhost:4000/api/chat/append', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ item: entry, incr: 1 }) })
    console.log('append status', res.status)
    const j = await res.json().catch(()=>null)
    console.log('append resp', j)
  }catch(e){ console.error('e2e failed:', e); process.exit(3) }
}

run()
