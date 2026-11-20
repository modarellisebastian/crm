import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
}

const STYLES = {
  success: { bg: '#f5f5f5', border: '#ebebeb', color: '#157a47', icon: '#16a34a' },
  error:   { bg: '#f5f5f5', border: '#f5b4b0', color: '#8b1a1a', icon: '#d13b4c' },
  warning: { bg: '#f5f5f5', border: '#f9dfa0', color: '#7a5000', icon: '#ca8a04' },
  info:    { bg: '#eaf3fc', border: '#b5d4f4', color: '#0c447c', icon: '#3454d1' },
}

function ToastItem({ id, message, type = 'success', onRemove }) {
  const s = STYLES[type] ?? STYLES.info
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: s.bg, border: `1px solid ${s.border}`,
        borderRadius: 10, padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        minWidth: 260, maxWidth: 360,
        animation: 'slideIn .2s ease',
      }}
    >
      <span style={{ color: s.icon, flexShrink: 0, marginTop: 1 }}>{ICONS[type]}</span>
      <span style={{ fontSize: 13, color: s.color, flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={() => onRemove(id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, opacity: 0.5, padding: 0, lineHeight: 1, flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Portal de toasts */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        <style>{`@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
