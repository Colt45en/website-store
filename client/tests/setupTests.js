// Simple localStorage polyfill for tests
const _store = {}
global.localStorage = {
  getItem: (k) => (_store.hasOwnProperty(k) ? _store[k] : null),
  setItem: (k, v) => { _store[k] = String(v) },
  removeItem: (k) => { delete _store[k] },
  clear: () => { Object.keys(_store).forEach(k=>delete _store[k]) }
}

// Provide a minimal window.postMessage stub used by other components/tests
if (typeof global.window === 'undefined') global.window = global
global.window.postMessage = global.window.postMessage || function(){ }
