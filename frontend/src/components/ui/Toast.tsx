'use client'
// src/components/ui/Toast.tsx
// Lightweight toast notification system.
// Usage:
//   import { useToast } from '@/components/ui/Toast'
//   const toast = useToast()
//   toast.success('Case saved!')
//   toast.error('Something went wrong')
//   toast.info('Generating draft...')

import { useState, useCallback, createContext, useContext } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id:      number
  type:    ToastType
  message: string
}

interface ToastCtx {
  success: (msg: string) => void
  error:   (msg: string) => void
  info:    (msg: string) => void
  warning: (msg: string) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

const ICONS: Record<ToastType, string> = {
  success: 'ti-circle-check',
  error:   'ti-circle-x',
  info:    'ti-info-circle',
  warning: 'ti-alert-triangle',
}

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: '#15803d', text: '#14532d' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '#dc2626', text: '#7f1d1d' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', text: '#1e3a8a' },
  warning: { bg: '#fef3c7', border: '#fcd34d', icon: '#d97706', text: '#78350f' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((type: ToastType, message: string) => {
    const id = Date.now()
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const ctx: ToastCtx = {
    success: msg => add('success', msg),
    error:   msg => add('error',   msg),
    info:    msg => add('info',    msg),
    warning: msg => add('warning', msg),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast container — bottom right */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => {
          const c = COLORS[t.type]
          return (
            <div key={t.id} className="animate-slide-right"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 9, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 260, maxWidth: 360, fontSize: 12, color: c.text, fontFamily: 'Inter, sans-serif' }}>
              <i className={`ti ${ICONS[t.type]}`} style={{ fontSize: 16, color: c.icon, flexShrink: 0 }} />
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: c.icon, fontSize: 14, display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-x" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}