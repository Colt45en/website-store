// Helper to flush pending chat items stored in localStorage
// Exports an async function that attempts to append each pending item to the server.
async function flushPending(addToast){
  try{
    const token = localStorage.getItem('nova_token')
    if (!token) return { ok:false, reason: 'no-token' }
    let pending = []
    try{ pending = JSON.parse(localStorage.getItem('nova_chat_pending') || '[]') }catch(e){ pending = [] }
    const remaining = []
    let sentCount = 0
    for (const p of pending){
      try{
        const res = await fetch('/api/chat/append', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ item: p.entry, incr: p.incr||0 })
        })
        if (!res.ok) throw new Error('HTTP '+res.status)
        sentCount += 1
        try{ if (addToast) addToast('Pending message sent', { timeout: 2200 }) }catch(e){}
      }catch(e){
        remaining.push(p)
      }
    }
    try{ localStorage.setItem('nova_chat_pending', JSON.stringify(remaining)) }catch(e){}
    return { ok:true, remaining, sent: sentCount, failed: remaining.length }
  }catch(e){
    return { ok:false, reason: String(e) }
  }
}

// CommonJS + ESM interop: export as module.exports and default
module.exports = flushPending
module.exports.default = flushPending
