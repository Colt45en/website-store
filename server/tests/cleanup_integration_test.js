// Simple integration test for the /api/test/cleanup endpoint.
// Usage: set TEST_CLEANUP_ENABLED=1 and TEST_CLEANUP_TOKEN to a secret value, then run.
const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')

const HOST = process.env.SERVER_HOST || '127.0.0.1'
const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 4000)
const TOKEN = process.env.TEST_CLEANUP_TOKEN || null

function readMock(){
  const FILE = path.join(__dirname, '..', 'mockdb.json')
  try{ if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE,'utf8')) }catch(e){}
  return { users: [] }
}

async function main(){
  if (!process.env.TEST_CLEANUP_ENABLED || process.env.TEST_CLEANUP_ENABLED !== '1'){
    console.error('TEST_CLEANUP_ENABLED must be set to 1 to run this test')
    process.exit(2)
  }
  if (!TOKEN){ console.error('TEST_CLEANUP_TOKEN must be set to run this test'); process.exit(2) }

  // Create a unique test user via the public register endpoint
  const email = `e2e-test-${Date.now()}@example.test`
  const password = 'e2e-pass'
  console.log('Registering test user', email)
  const reg = await fetch(`http://${HOST}:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name: 'E2E Test', email, password }) }).then(r=>r.json()).catch(e=>{ console.error('register error',e); process.exit(2) })
  if (!reg || !reg.token){ console.error('Registration failed', reg); process.exit(2) }

  // Ensure user is present in mockdb.json
  const before = readMock()
  const found = (before.users||[]).find(u => u.email === email)
  if (!found){ console.error('User not found in mockdb after register'); process.exit(2) }
  console.log('User created with id', found.id)

  // Call cleanup as demo admin
  console.log('Invoking /api/test/cleanup with pattern e2e-test-')
  const demo = await fetch(`http://${HOST}:${PORT}/api/auth/demo`, { method: 'POST' }).then(r=>r.json())
  const adminToken = demo && demo.token
  if (!adminToken){ console.error('Failed to acquire demo token'); process.exit(2) }

  const headers = { 'Content-Type':'application/json', Authorization: 'Bearer ' + adminToken }
  headers['x-test-cleanup-token'] = TOKEN
  const body = { emailPattern: '^e2e-test-' }
  const resp = await fetch(`http://${HOST}:${PORT}/api/test/cleanup`, { method: 'POST', headers, body: JSON.stringify(body) }).then(r=>r.json()).catch(e=>{ console.error('cleanup call failed', e); process.exit(2) })
  console.log('cleanup response', resp)

  // Verify user removed
  const after = readMock()
  const still = (after.users||[]).find(u => u.email === email)
  if (still){ console.error('User still present after cleanup'); process.exit(2) }
  console.log('Cleanup integration test passed')
  process.exit(0)
}

main()
