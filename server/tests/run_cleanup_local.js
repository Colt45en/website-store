const { spawn } = require('child_process')
const net = require('net')
const path = require('path')
const fs = require('fs')

const SERVER_CWD = path.join(__dirname, '..')
const PORT = process.env.SERVER_PORT || 4000
const START_SCRIPT = process.env.START_SCRIPT || 'start:cleanup'

function isPortOpen(port, host='127.0.0.1', timeout=200){
  return new Promise(resolve=>{
    const s = new net.Socket()
    let done = false
    s.setTimeout(timeout)
    s.on('connect', ()=>{ done=true; s.destroy(); resolve(true) })
    s.on('timeout', ()=>{ if(!done){ done=true; s.destroy(); resolve(false) } })
    s.on('error', ()=>{ if(!done){ done=true; resolve(false) } })
    s.connect(port, host)
  })
}

async function waitForPort(port, retries=120, interval=250){
  for (let i=0;i<retries;i++){
    if (await isPortOpen(port)) return true
    await new Promise(r=>setTimeout(r, interval))
  }
  return false
}

async function main(){
  // Spawn npm run start:cleanup in server dir
  console.log('Spawning server via npm', START_SCRIPT)
  const env = Object.assign({}, process.env, { TEST_CLEANUP_ENABLED: '1', TEST_CLEANUP_TOKEN: process.env.TEST_CLEANUP_TOKEN || 'localtesttoken', NODE_ENV: 'test' })
  let child
  if (process.platform === 'win32'){
    // Use cmd.exe /c to run npm scripts reliably on Windows
    child = spawn('cmd.exe', ['/c', 'npm', 'run', START_SCRIPT], { cwd: SERVER_CWD, env, stdio: ['ignore','pipe','pipe'] })
  } else {
    const npmCmd = 'npm'
    const args = START_SCRIPT === 'start' ? ['start'] : ['run', START_SCRIPT]
    child = spawn(npmCmd, args, { cwd: SERVER_CWD, env, stdio: ['ignore','pipe','pipe'] })
  }
  const logPath = path.join(SERVER_CWD, 'tests', `run_cleanup_server.log`)
  const logStream = fs.createWriteStream(logPath, { flags: 'a' })
  child.stdout.pipe(logStream)
  child.stderr.pipe(logStream)
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)

  const ready = await waitForPort(Number(PORT))
  if (!ready){ console.error('Server did not become ready on port', PORT); child.kill(); process.exit(3) }
  console.log('Server ready; running integration test')

  // run the integration test via node (child process)
  const testCmd = process.execPath
  const testArgs = [ path.join(SERVER_CWD, 'tests', 'cleanup_integration_test.js') ]
  const test = spawn(testCmd, testArgs, { cwd: SERVER_CWD, env: Object.assign({}, process.env, { TEST_CLEANUP_ENABLED: '1', TEST_CLEANUP_TOKEN: env.TEST_CLEANUP_TOKEN }) , stdio: 'inherit' })
  test.on('close', (code) => {
    console.log('Integration test exited with', code)
    // teardown server
    try{ child.kill() }catch(e){}
    process.exit(code)
  })
}

main()
