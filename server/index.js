const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { db, migrate } = require('./db');
const bcrypt = require('bcryptjs');
migrate();

const SECRET = 'demo-nova-secret';
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple login (demo only) - accepts {email,password}
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const row = db.prepare('SELECT id, name, email, password FROM users WHERE email = ?').get(email);
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, row.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: row.id }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: row.id, name: row.name, email: row.email } });
});

// registration

// Demo login endpoint: creates demo user if needed, returns token
app.post('/api/auth/demo', (req, res) => {
  const demoEmail = 'demo@nova.local';
  const demoName = 'Demo User';
  const demoPass = 'demo1234';
  let user = db.prepare('SELECT id, name, email, password FROM users WHERE email = ?').get(demoEmail);
  if (!user) {
    const hashed = bcrypt.hashSync(demoPass, 8);
    const info = db.prepare('INSERT INTO users (name, email, password) VALUES (?,?,?)').run(demoName, demoEmail, hashed);
    user = { id: info.lastInsertRowid, name: demoName, email: demoEmail, password: hashed };
  }
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const hashed = bcrypt.hashSync(password, 8);
  try {
    const info = db.prepare('INSERT INTO users (name, email, password) VALUES (?,?,?)').run(name || null, email, hashed);
    const id = info.lastInsertRowid;
    const token = jwt.sign({ id }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, name, email } });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Middleware
function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Bad auth' });
  const token = parts[1];
  try {
    const data = jwt.verify(token, SECRET);
    // fetch user from db (works with sqlite or JSON fallback)
    try {
      const u = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(data.id);
      if (!u) return res.status(401).json({ error: 'Invalid token' });
      req.user = u
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const u = req.user;
  res.json({ id: u.id, name: u.name, email: u.email });
});

app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT id, title, price, desc FROM products').all();
  res.json(rows);
});

// Landing config - public GET, protected POST
app.get('/api/landing', (req, res) => {
  try{
    // for sqlite path, try reading from a table; for JSON fallback we store in mockdb.json under _landing
    if (db && db.prepare) {
      // JSON fallback exposes a simple API; try to read from mock file
      const path = require('path')
      const FILE = path.join(__dirname, 'mockdb.json')
      if (require('fs').existsSync(FILE)){
        const data = JSON.parse(require('fs').readFileSync(FILE,'utf8'))
        return res.json(data._landing || {})
      }
    }
    return res.json({})
  }catch(e){ return res.json({}) }
})

app.post('/api/landing', authMiddleware, (req, res) => {
  try{
    const cfg = req.body || {}
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { users: [], products: [], carts: [] }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    data._landing = cfg
    require('fs').writeFileSync(FILE, JSON.stringify(data, null, 2))
    return res.json({ ok: true })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

// Listings: submit (auth), get mine (auth), get pending (admin), approve (admin), public approved
app.post('/api/listings', authMiddleware, (req, res) => {
  try{
    const body = req.body || {}
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { users: [], products: [], carts: [], listings: [] }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    const id = (data.listings.reduce((m,l)=>Math.max(m,l.id||0),0) || 0) + 1
    const listing = { id, user_id: req.user.id, title: body.title||'Untitled', desc: body.desc||'', price: body.price||0, images: body.images||[], status: 'pending', createdAt: Date.now() }
    data.listings.push(listing)
    require('fs').writeFileSync(FILE, JSON.stringify(data, null, 2))
    return res.json({ ok: true, id })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

app.get('/api/listings/mine', authMiddleware, (req, res) => {
  try{
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { listings: [] }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    const mine = (data.listings||[]).filter(l => l.user_id === req.user.id)
    return res.json(mine)
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

// simple admin check: demo@nova.local is admin
function isAdmin(user){ return user && user.email === 'demo@nova.local' }

app.get('/api/listings/pending', authMiddleware, (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' })
  const path = require('path')
  const FILE = path.join(__dirname, 'mockdb.json')
  let data = { listings: [] }
  try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
  const pending = (data.listings||[]).filter(l => l.status === 'pending')
  return res.json(pending)
})

app.post('/api/listings/:id/approve', authMiddleware, (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' })
  try{
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { listings: [] }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    const id = Number(req.params.id)
    const row = (data.listings||[]).find(l=>l.id===id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    row.status = 'approved'
    require('fs').writeFileSync(FILE, JSON.stringify(data, null, 2))
    return res.json({ ok: true })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

app.get('/api/listings', (req, res) => {
  try{
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { listings: [] }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    const approved = (data.listings||[]).filter(l => l.status === 'approved')
    return res.json(approved)
  }catch(e){ return res.json([]) }
})

// --- Simple Site QA endpoints (lightweight, local) ---
function gatherKB(){
  const path = require('path')
  const FILE = path.join(__dirname, 'mockdb.json')
  let data = { products: [], listings: [], _landing: null, kb: [] }
  try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
  const kb = []
  // products
  (data.products||[]).forEach(p => kb.push({ id: `product:${p.id}`, title: p.title, text: `${p.title} ${p.desc} price ${p.price}`, type: 'product' }))
  // listings
  (data.listings||[]).forEach(l => kb.push({ id: `listing:${l.id}`, title: l.title, text: `${l.title} ${l.desc} price ${l.price} status ${l.status}`, type: 'listing' }))
  // landing
  if (data._landing) kb.push({ id: 'landing', title: 'Landing', text: `${data._landing.heroTitle || ''} ${data._landing.heroSubtitle || ''} ${data._landing.promo || ''}`, type: 'landing' })
  // custom KB
  (data.kb||[]).forEach((k, i) => kb.push({ id: `kb:${i}`, title: k.title||'KB', text: k.text||'', type: 'kb' }))
  return kb
}

// simple in-memory cache for QA queries
const qaCache = new Map(); // key -> { ts, answers }
const QA_CACHE_TTL = 60 * 1000; // 60s

// POST /api/qa { q } -> { answers: [ { text, sourceId, title, score } ] }
app.post('/api/qa', (req, res) => {
  try{
    const q = (req.body.q||'').toLowerCase().trim()
    const key = q
    // check cache
    if (qaCache.has(key)){
      const entry = qaCache.get(key)
      if (Date.now() - entry.ts < QA_CACHE_TTL){
        return res.json({ answers: entry.answers })
      } else qaCache.delete(key)
    }
    if (!q) return res.json({ answers: [] })
    const words = q.split(/\W+/).filter(Boolean)
    const kb = gatherKB()
    // simple score: count of matching words in text
    const scored = kb.map(entry => {
      const txt = (entry.text||'').toLowerCase()
      let score = 0
      words.forEach(w => { if (txt.includes(w)) score += 1 })
      return { entry, score }
    }).filter(s=>s.score>0).sort((a,b)=>b.score-a.score).slice(0,5)
    const answers = scored.map(s => ({ text: s.entry.text, sourceId: s.entry.id, title: s.entry.title, score: s.score }))
    // fallback: if no matches, return a helpful message
    if (answers.length===0) return res.json({ answers: [{ text: "I couldn't find a direct answer in site content. Try rephrasing or ask about products/listings.", sourceId: null, title: 'No match', score:0 }] })
    // store in cache
    try{ qaCache.set(key, { ts: Date.now(), answers }) }catch(e){}
    return res.json({ answers })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

// POST /api/qa/train (auth) -> add custom KB entry
app.post('/api/qa/train', authMiddleware, (req, res) => {
  try{
    const item = { title: req.body.title||'KB', text: req.body.text||'' }
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { kb: [] }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    data.kb = data.kb||[]
    data.kb.push(item)
    require('fs').writeFileSync(FILE, JSON.stringify(data, null, 2))
    return res.json({ ok: true })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

// cart endpoints (simple): GET /api/cart returns JSON items, POST /api/cart updates items
app.get('/api/cart', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT items FROM carts WHERE user_id = ?').get(req.user.id);
  if (!row) return res.json({ items: [] });
  try { const items = JSON.parse(row.items); return res.json({ items }); } catch (e) { return res.json({ items: [] }); }
});

app.post('/api/cart', authMiddleware, (req, res) => {
  const items = req.body.items || [];
  const str = JSON.stringify(items);
  const existing = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(req.user.id);
  if (existing) {
    db.prepare('UPDATE carts SET items = ? WHERE id = ?').run(str, existing.id);
  } else {
    db.prepare('INSERT INTO carts (user_id, items) VALUES (?,?)').run(req.user.id, str);
  }
  res.json({ ok: true });
});

// --- Chat persistence endpoints (per-user, stored in mockdb.json) ---
app.get('/api/chat', authMiddleware, (req, res) => {
  try{
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { chats: {} }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    const userKey = `user:${req.user.id}`
    const chat = (data.chats && data.chats[userKey]) || { conversation: [], unread: 0 }
    return res.json(chat)
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

app.post('/api/chat', authMiddleware, (req, res) => {
  try{
    const payload = req.body || {}
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { chats: {} }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    data.chats = data.chats || {}
    const userKey = `user:${req.user.id}`
    data.chats[userKey] = { conversation: payload.conversation || [], unread: Number(payload.unread)||0 }
    require('fs').writeFileSync(FILE, JSON.stringify(data, null, 2))
    return res.json({ ok: true })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

// Append one or more items to the user's conversation (auth). Body: { item: {...} } or { item: [ {...}, ... ], unread?: number, incr?: number }
app.post('/api/chat/append', authMiddleware, (req, res) => {
  try{
    const body = req.body || {}
    const items = body.item
    if (!items) return res.status(400).json({ error: 'Missing item to append' })
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { chats: {} }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    data.chats = data.chats || {}
    const userKey = `user:${req.user.id}`
    const chat = (data.chats && data.chats[userKey]) || { conversation: [], unread: 0 }
    // support either a single object or an array
    if (Array.isArray(items)) chat.conversation = (chat.conversation||[]).concat(items)
    else chat.conversation = (chat.conversation||[]).concat([items])
    // update unread: if incr provided, add it; else if unread provided, set; otherwise keep existing
    if (typeof body.incr !== 'undefined') {
      chat.unread = Number(chat.unread || 0) + Number(body.incr || 0)
    } else if (typeof body.unread !== 'undefined') {
      chat.unread = Number(body.unread || 0)
    }
    data.chats[userKey] = chat
    require('fs').writeFileSync(FILE, JSON.stringify(data, null, 2))
    return res.json({ ok: true, chat })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

// Mark the current user's chat as read (sets unread = 0)
app.post('/api/chat/mark-read', authMiddleware, (req, res) => {
  try{
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { chats: {} }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    data.chats = data.chats || {}
    const userKey = `user:${req.user.id}`
    const chat = (data.chats && data.chats[userKey]) || { conversation: [], unread: 0 }
    chat.unread = 0
    data.chats[userKey] = chat
    require('fs').writeFileSync(FILE, JSON.stringify(data, null, 2))
    return res.json({ ok: true })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

app.delete('/api/chat/entry/:ts', authMiddleware, (req, res) => {
  try{
    const ts = Number(req.params.ts)
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { chats: {} }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    const userKey = `user:${req.user.id}`
    const chat = (data.chats && data.chats[userKey]) || { conversation: [], unread: 0 }
    chat.conversation = (chat.conversation||[]).filter(c => Number(c.ts) !== ts)
    data.chats[userKey] = chat
    require('fs').writeFileSync(FILE, JSON.stringify(data, null, 2))
    return res.json({ ok: true })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

app.get('/api/chat/export', authMiddleware, (req, res) => {
  try{
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    let data = { chats: {} }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    const userKey = `user:${req.user.id}`
    const chat = (data.chats && data.chats[userKey]) || { conversation: [], unread: 0 }
    res.setHeader('Content-Type','application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="nova-chat-'+req.user.id+'.json"')
    return res.send(JSON.stringify(chat.conversation || [], null, 2))
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

// === Test-only cleanup endpoint ===
// Allows an admin (demo user) to remove test-created users and related data.
// Enabled always but restricted to admin accounts to avoid accidental deletion.
// Body: { emails: ["a@b"], emailPattern: "^e2e" }
app.post('/api/test/cleanup', authMiddleware, (req, res) => {
  // Gate this powerful endpoint behind an explicit env var AND a CI/test environment
  // Require TEST_CLEANUP_ENABLED=1 and either NODE_ENV==='test' or running under GITHUB_ACTIONS
  const enabled = process.env.TEST_CLEANUP_ENABLED === '1'
  const inTestEnv = process.env.NODE_ENV === 'test' || process.env.GITHUB_ACTIONS === 'true'
  if (!enabled || !inTestEnv) return res.status(404).json({ error: 'Not found' })
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' })
  // Require a shared secret token for extra safety. The token must be set in TEST_CLEANUP_TOKEN
  // and provided by the caller in header 'x-test-cleanup-token' or body.token.
  const requiredToken = process.env.TEST_CLEANUP_TOKEN || null
  if (!requiredToken) return res.status(403).json({ error: 'Cleanup token not configured' })
  const provided = req.headers['x-test-cleanup-token'] || (req.body && req.body.token)
  if (!provided || provided !== requiredToken) return res.status(403).json({ error: 'Invalid cleanup token' })
  try{
    const body = req.body || {}
    const emails = Array.isArray(body.emails) ? body.emails : []
    const pattern = body.emailPattern ? new RegExp(body.emailPattern) : null
    const path = require('path')
    const FILE = path.join(__dirname, 'mockdb.json')
    // handle JSON fallback
    let data = { users: [], products: [], carts: [], listings: [], chats: {} }
    try{ if (require('fs').existsSync(FILE)) data = JSON.parse(require('fs').readFileSync(FILE,'utf8')) } catch(e){}
    const toDelete = new Set()
    // find by explicit emails
    emails.forEach(em => {
      const u = (data.users||[]).find(x => x.email === em)
      if (u && u.id) toDelete.add(u.id)
    })
    // find by pattern in data.users
    if (pattern){ (data.users||[]).forEach(u=>{ if (u && u.email && pattern.test(u.email) && u.id) toDelete.add(u.id) }) }

    let deletedUsers = 0, deletedChats = 0, deletedListings = 0, deletedCarts = 0
    if (toDelete.size > 0){
      const ids = Array.from(toDelete)
      // JSON fallback removals
      data.users = (data.users||[]).filter(u => !toDelete.has(u.id))
      // remove carts
      if (data.carts) {
        const before = (data.carts||[]).length
        data.carts = (data.carts||[]).filter(c => !toDelete.has(c.user_id))
        deletedCarts = before - data.carts.length
      }
      // remove listings
      if (data.listings) {
        const before = (data.listings||[]).length
        data.listings = (data.listings||[]).filter(l => !toDelete.has(l.user_id))
        deletedListings = before - data.listings.length
      }
      // remove chats keyed by user:<id>
      if (data.chats){
        ids.forEach(id => { const k = `user:${id}`; if (data.chats[k]) { delete data.chats[k]; deletedChats++ } })
      }
      // persist JSON fallback
      try{ require('fs').writeFileSync(FILE, JSON.stringify(data, null, 2)) }catch(e){}
      deletedUsers = ids.length
    }

    // Also attempt to remove from sqlite if present
    try{
      if (db && db.prepare && typeof db.prepare === 'function'){
        // remove by exact emails
        for (const em of (emails||[])){
          try{ db.prepare('DELETE FROM users WHERE email = ?').run(em) }catch(e){}
        }
        // remove by pattern: query all users and delete matching
        if (pattern){
          try{
            const all = db.prepare('SELECT id, email FROM users').all()
            (all||[]).forEach(u => { if (u && u.email && pattern.test(u.email)) { try{ db.prepare('DELETE FROM users WHERE id = ?').run(u.id) }catch(e){} } })
          }catch(e){}
        }
      }
    }catch(e){}

    return res.json({ ok: true, deletedUsers, deletedChats, deletedListings, deletedCarts })
  }catch(e){ return res.status(500).json({ error: String(e) }) }
})

app.listen(4000, () => console.log('Nova server running on http://localhost:4000'));
