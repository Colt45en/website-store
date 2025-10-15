const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
(async ()=>{
  const base = 'http://localhost:4000'
  console.log('Requesting demo token...')
  const demo = await fetch(base + '/api/auth/demo', { method: 'POST' }).then(r=>r.json())
  const token = demo.token
  console.log('Token received for user', demo.user.id)

  // append
  const item = { ts: Math.floor(Date.now()/1000), role: 'test-bot', text: 'hello from test' }
  const res1 = await fetch(base + '/api/chat/append', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ item, incr: 1 }) })
  console.log('append status', res1.status)
  const j1 = await res1.json()
  console.log('append resp', j1)

  // mark-read
  const res2 = await fetch(base + '/api/chat/mark-read', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })
  console.log('mark-read status', res2.status)

  // read mockdb.json
  const FILE = path.join(__dirname, '..', 'mockdb.json')
  const data = JSON.parse(fs.readFileSync(FILE,'utf8'))
  console.log('mockdb snippet:', JSON.stringify(data.chats, null, 2))
})();
