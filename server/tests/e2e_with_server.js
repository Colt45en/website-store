// e2e_with_server.js
// Starts the server if not running, waits for it to be ready, runs an append test, then tears down spawned server.
const fetch = require('node-fetch')
const { spawn } = require('child_process')
const net = require('net')
const path = require('path')

const HOST = process.env.SERVER_HOST || '127.0.0.1'
const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 4000)
// CI matrix labels (passed from workflow)
const CI_OS = process.env.CI_OS || process.env.MATRIX_OS || process.env.GITHUB_OS || process.env.GITHUB_RUNNER_OS || ''
const CI_NODE = process.env.CI_NODE || process.env.MATRIX_NODE || process.env.GITHUB_NODE || ''

// Exit codes
const EXIT_OK = 0
const EXIT_TEST_FAILED = 2
const EXIT_TIMEOUT = 3
const EXIT_SPAWN_FAILED = 4
const EXIT_RUNNER_ERROR = 5

// START_SCRIPT can be specified via env START_SCRIPT or CLI --start-script=name
function parseStartScript(){
  const cliIndex = process.argv.indexOf('--start-script')
  if (cliIndex !== -1 && process.argv.length > cliIndex+1) return process.argv[cliIndex+1]
  if (process.env.START_SCRIPT) return process.env.START_SCRIPT
  return 'start'
}

const START_SCRIPT = parseStartScript()

function isPortOpen(host, port, timeout=200){
  return new Promise(resolve=>{
    const sock = new net.Socket()
    let called = false
    sock.setTimeout(timeout)
    sock.on('connect', ()=>{ called = true; sock.destroy(); resolve(true) })
    sock.on('timeout', ()=>{ if (!called){ called = true; sock.destroy(); resolve(false) } })
    sock.on('error', ()=>{ if (!called){ called = true; resolve(false) } })
    sock.connect(port, host)
  })
}

async function waitForServer(retries=120, interval=250){
  // retries*interval default: 120*250ms = 30s
  for (let i=0;i<retries;i++){
    const open = await isPortOpen(HOST, PORT, 200)
    if (open) return true
    await new Promise(r=>setTimeout(r,interval))
  }
  return false
}

async function runTest(){
  try{
    // Determine auth token: register/login if START_WITH_REGISTER env set; otherwise use demo auth
    let token = null
    if (process.env.START_WITH_REGISTER === '1' || process.env.START_WITH_REGISTER === 'true'){
      const email = `e2e+${Date.now()}@example.test`
      const password = 'e2e-pass-1234'
      console.log('Registering user', email)
      const reg = await fetch(`http://${HOST}:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name: 'E2E', email, password }) }).then(r=>r.json())
      token = reg && reg.token
    }
    if (!token){
      console.log('Requesting demo token...')
      const demo = await fetch(`http://${HOST}:${PORT}/api/auth/demo`, { method: 'POST' }).then(r=>r.json())
      token = demo && demo.token
    }
    if (!token) throw new Error('No token acquired')
    console.log('Using token (truncated):', token && token.substring(0,20))

    // perform multiple appends
    const appended = []
    let sent = 0, failed = 0
    for (let i=0;i<3;i++){
      const entry = { q: `e2e message ${i} ${Date.now()}`, ts: Date.now() + i, role: 'user' }
      try{
        const res = await fetch(`http://${HOST}:${PORT}/api/chat/append`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ item: entry, incr: 1 }) })
        console.log('append', i, 'status', res.status)
  const j = await res.json().catch(()=>null)
  console.log('append resp', j)
  appended.push(entry)
  if (res.ok) { sent++ } else { failed++ }
      }catch(err){ console.warn('append failed', err); failed++; }
    }

    // fetch conversation
    const convRes = await fetch(`http://${HOST}:${PORT}/api/chat`, { headers: { Authorization: 'Bearer ' + token } })
    const conv = await convRes.json().catch(()=>null)
    const convLen = (conv && conv.conversation && conv.conversation.length) || 0
    console.log('conversation length', convLen)

    // cleanup: delete appended entries (best-effort)
    let deleted = 0
    for (const e of appended){
      try{
        const del = await fetch(`http://${HOST}:${PORT}/api/chat/entry/${e.ts}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
        console.log('delete', e.ts, 'status', del.status)
        if (del.ok) deleted++
      }catch(err){ console.warn('delete failed', err) }
    }

    // Attempt to remove test-created user(s) if we registered one during this run
    let cleanupResult = null
    try{
      if (process.env.START_WITH_REGISTER === '1' || process.env.START_WITH_REGISTER === 'true'){
        // call /api/test/cleanup as demo admin to remove users that match our e2e email pattern
        console.log('Running server-side cleanup for test users')
        // request demo token
        const demo = await fetch(`http://${HOST}:${PORT}/api/auth/demo`, { method: 'POST' }).then(r=>r.json())
        const adminToken = demo && demo.token
        if (adminToken){
          const cleanupBody = { emailPattern: '^e2e' }
          const headers = { 'Content-Type':'application/json', Authorization: 'Bearer ' + adminToken }
          if (process.env.TEST_CLEANUP_TOKEN) headers['x-test-cleanup-token'] = process.env.TEST_CLEANUP_TOKEN
          const creq = await fetch(`http://${HOST}:${PORT}/api/test/cleanup`, { method: 'POST', headers, body: JSON.stringify(cleanupBody) })
          cleanupResult = await creq.json().catch(()=>null)
          console.log('cleanup result', cleanupResult)
        }
      }
    }catch(e){ console.warn('cleanup pass failed', e) }

    // write structured summary for CI
    try{
      const fs = require('fs')
      const path = require('path')
      const summary = {
        timestamp: new Date().toISOString(),
        ci: { os: CI_OS, node: CI_NODE },
        host: `${HOST}:${PORT}`,
        attempts: 3,
        sent, failed,
        conversationLength: convLen,
        deletedAppended: deleted,
        cleanup: cleanupResult
      }
      const outPath = path.join(__dirname, 'e2e-summary.json')
      fs.writeFileSync(outPath, JSON.stringify(summary, null, 2))
      console.log('Wrote summary to', outPath)
    }catch(e){ console.warn('Failed to write summary', e) }

    return EXIT_OK
  }catch(e){ console.error('e2e test failed', e); return EXIT_TEST_FAILED }
}

async function main(){
  let spawned = null
  try{
    const already = await isPortOpen(HOST, PORT, 200)
    if (!already){
      console.log('Starting server via npm (%s)...', START_SCRIPT)
      // Use npm start or npm run <script> (platform-aware command)
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
      const args = START_SCRIPT === 'start' ? ['start'] : ['run', START_SCRIPT]
      // spawn with pipes so we can capture logs
      try{
        spawned = spawn(npmCmd, args, { cwd: path.join(__dirname, '..'), stdio: ['ignore','pipe','pipe'] })
      }catch(spawnErr){
        console.error('Failed to spawn server process', spawnErr)
        try{ require('fs').writeFileSync(path.join(__dirname,'e2e-rc.txt'), String(EXIT_SPAWN_FAILED)) }catch(e){}
        process.exit(EXIT_SPAWN_FAILED)
      }
      // create log file to capture server stdout/stderr (timestamped)
      const fs = require('fs')
  const now = new Date().toISOString().replace(/[:.]/g,'-')
  const safeScript = START_SCRIPT.replace(/[^a-zA-Z0-9-_]/g,'')
  const labelPart = (CI_OS || CI_NODE) ? `-${CI_OS || 'unknown'}-node${CI_NODE || 'unknown'}` : ''
  const logFileName = `e2e-server-${now}-p${PORT}-${safeScript}${labelPart}.log`
      const logPath = path.join(__dirname, logFileName)
      const logStream = fs.createWriteStream(logPath, { flags: 'a' })
      if (spawned.stdout) spawned.stdout.pipe(logStream)
      if (spawned.stderr) spawned.stderr.pipe(logStream)
      // also pipe to parent stdout for live CI logs
      if (spawned.stdout) spawned.stdout.pipe(process.stdout)
      if (spawned.stderr) spawned.stderr.pipe(process.stderr)
    } else console.log('Server already running on', PORT)

  const ready = await waitForServer()
  if (!ready){ console.error('Server did not become ready'); if (spawned) spawned.kill(); try{ require('fs').writeFileSync(path.join(__dirname,'e2e-rc.txt'), String(EXIT_TIMEOUT)) }catch(e){}; process.exit(EXIT_TIMEOUT) }
  const code = await runTest()
    if (spawned){
      console.log('Stopping spawned server...')
      // try a graceful kill
      try{ spawned.kill() }catch(e){}
      // wait briefly to see if it exited
      await new Promise(r=>setTimeout(r,500))
      // if still running, use platform-specific forcible kill
      try{
        if (!spawned.killed){
          if (process.platform === 'win32'){
            // taskkill the pid tree
            const { execSync } = require('child_process')
            try{ execSync(`taskkill /PID ${spawned.pid} /T /F`) }catch(e){}
          } else {
            try{ process.kill(spawned.pid, 'SIGKILL') }catch(e){}
          }
        }
      }catch(e){}
      // close log stream if present
      try{ if (typeof logStream !== 'undefined' && logStream) logStream.end() }catch(e){}
      // copy most recent log to e2e-output.txt (server root) for CI artifact convenience
      try{
        const fs = require('fs')
        const files = fs.readdirSync(__dirname).filter(f=>f.indexOf('e2e-server-')===0).sort()
        if (files.length>0){
          const lp = path.join(__dirname, files[files.length-1])
          // write to tests dir and server root
          const outTests = path.join(__dirname, 'e2e-output.txt')
          const outRoot = path.join(__dirname, '..', 'e2e-output.txt')
          fs.copyFileSync(lp, outTests)
          try{ fs.copyFileSync(lp, outRoot) }catch(e){}
        }
      }catch(e){}
    }
    // write exit rc for CI to pick up (also write to server root)
    try{ 
      const fs = require('fs')
      const rcPathTests = path.join(__dirname,'e2e-rc.txt')
      const rcPathRoot = path.join(__dirname,'..','e2e-rc.txt')
      fs.writeFileSync(rcPathTests, String(code))
      try{ fs.writeFileSync(rcPathRoot, String(code)) }catch(e){}
    }catch(e){}
    process.exit(code)
  }catch(e){ console.error('e2e runner error', e); if (spawned) spawned.kill(); process.exit(4) }
}

main()
