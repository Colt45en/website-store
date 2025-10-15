const flushPending = require('../src/lib/flushPending')


describe('flushPending helper', ()=>{
  const OLD = global.fetch
  beforeEach(()=>{
    // reset localStorage
    localStorage.clear()
    // provide a demo token
    localStorage.setItem('nova_token', 'demo-token')
  })
  afterEach(()=>{
    global.fetch = OLD
    localStorage.clear()
  })

  test('sends pending items and clears storage on success', async ()=>{
    // create two pending items
    const now = Date.now()
    const pending = [ { entry: { q: 'hello', ts: now }, incr: 0 }, { entry: { q: 'world', ts: now+1 }, incr: 1 } ]
    localStorage.setItem('nova_chat_pending', JSON.stringify(pending))

    const calls = []
    global.fetch = jest.fn().mockImplementation((url, opts)=>{
      calls.push({ url, opts })
      return Promise.resolve({ ok: true, json: async ()=>({ ok:true }) })
    })

    const res = await flushPending((msg)=>{})
    expect(res.ok).toBe(true)
    expect(calls.length).toBe(2)
    const rem = JSON.parse(localStorage.getItem('nova_chat_pending')||'[]')
    expect(rem.length).toBe(0)
  })

  test('keeps items that fail', async ()=>{
    const now = Date.now()
    const pending = [ { entry: { q: 'keep', ts: now }, incr: 0 } ]
    localStorage.setItem('nova_chat_pending', JSON.stringify(pending))

    global.fetch = jest.fn().mockImplementation((url, opts)=>{
      return Promise.resolve({ ok: false, status: 500 })
    })

    const res = await flushPending(()=>{})
    expect(res.ok).toBe(true)
    const rem = JSON.parse(localStorage.getItem('nova_chat_pending')||'[]')
    expect(rem.length).toBe(1)
    expect(rem[0].entry.q).toBe('keep')
  })
})
