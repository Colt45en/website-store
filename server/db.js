const fs = require('fs')
const path = require('path')

// Try to use better-sqlite3 for persistence; fallback to a simple JSON store if it's not available
let db = null
function migrate(){ /* noop for sqlite fallback until initialized below */ }

try {
  const Database = require('better-sqlite3')
  db = new Database(path.join(__dirname, 'db.sqlite'))
  migrate = function(){
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        verified INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        price REAL,
        desc TEXT
      );
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        items TEXT
      );
    `)
    // seed products if empty
    const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c
    if (count === 0) {
      const insert = db.prepare('INSERT INTO products (title, price, desc) VALUES (?,?,?)')
      insert.run('Nova T-Shirt', 19.99, 'Neon tee, black base with green/orange accents')
      insert.run('Nova Sticker Pack', 4.99, 'A set of neon stickers')
      insert.run('Nova Hoodie', 49.99, 'Premium hoodie, limited edition')
    }
  }
  module.exports = { db, migrate }
} catch (e) {
  // Fallback JSON store
  const FILE = path.join(__dirname, 'mockdb.json')
  let data = { users: [], products: [], carts: [] }
  try { if (fs.existsSync(FILE)) data = JSON.parse(fs.readFileSync(FILE,'utf8')) } catch(_){}

  // ensure products seeded
  if (!data.products || data.products.length === 0) {
    data.products = [
      { id: 1, title: 'Nova T-Shirt', price: 19.99, desc: 'Neon tee, black base with green/orange accents' },
      { id: 2, title: 'Nova Sticker Pack', price: 4.99, desc: 'A set of neon stickers' },
      { id: 3, title: 'Nova Hoodie', price: 49.99, desc: 'Premium hoodie, limited edition' }
    ]
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
  }

  function persist(){ fs.writeFileSync(FILE, JSON.stringify(data, null, 2)) }

  // minimal prepare() emulator for our limited query set
  const emu = {
    exec: (sql) => { /* noop */ },
    prepare: (sql) => {
      const s = sql.trim().toUpperCase()
      if (s.startsWith('SELECT COUNT')) {
        return { get: () => ({ c: data.products.length }) }
      }
      if (s.includes('FROM USERS') && s.includes('WHERE EMAIL')) {
        return { get: (email) => data.users.find(u => u.email === email) }
      }
      if (s.includes('FROM USERS') && s.includes('WHERE ID')) {
        return { get: (id) => data.users.find(u => u.id === id) }
      }
      if (s.startsWith('SELECT ID, TITLE, PRICE, DESC FROM PRODUCTS')) {
        return { all: () => data.products }
      }
      if (s.startsWith('SELECT ITEMS FROM CARTS WHERE USER_ID')) {
        return { get: (userId) => {
          const row = data.carts.find(c => c.user_id === userId)
          return row ? { items: row.items } : undefined
        } }
      }
      if (s.startsWith('SELECT ID FROM CARTS WHERE USER_ID')) {
        return { get: (userId) => { const row = data.carts.find(c => c.user_id === userId); return row ? { id: row.id } : undefined } }
      }
      if (s.startsWith('INSERT INTO USERS')) {
        return { run: (name, email, password) => {
          const id = (data.users.reduce((m,u)=>Math.max(m,u.id||0),0) || 0) + 1
          data.users.push({ id, name, email, password })
          persist()
          return { lastInsertRowid: id }
        } }
      }
      if (s.startsWith('INSERT INTO PRODUCTS')) {
        return { run: (title, price, desc) => {
          const id = (data.products.reduce((m,p)=>Math.max(m,p.id||0),0) || 0) + 1
          data.products.push({ id, title, price, desc })
          persist()
          return {}
        } }
      }
      if (s.startsWith('INSERT INTO CARTS')) {
        return { run: (user_id, items) => {
          const id = (data.carts.reduce((m,c)=>Math.max(m,c.id||0),0) || 0) + 1
          data.carts.push({ id, user_id, items })
          persist()
          return { lastInsertRowid: id }
        } }
      }
      if (s.startsWith('UPDATE CARTS SET ITEMS')) {
        return { run: (items, id) => {
          const row = data.carts.find(c=>c.id===id); if (row) { row.items = items; persist() }
          return {}
        } }
      }
      // generic fallback that does nothing
      return { get: () => undefined, all: () => [], run: () => ({}) }
    }
  }

  module.exports = { db: emu, migrate: () => { emu.exec(); } }
}
