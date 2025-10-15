import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, opts = {}) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, ...opts }])
    // auto-remove after timeout
    const timeout = opts.timeout || 3000
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), timeout)
    return id
  }, [])

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast" onClick={() => removeToast(t.id)}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToasts(){
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts must be used inside ToastProvider')
  return ctx.addToast
}

export default ToastProvider
