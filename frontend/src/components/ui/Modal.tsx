'use client'
// ─────────────────────────────────────────────────
//  src/components/ui/Modal.tsx
//
//  Reusable modal overlay.
//  Used by AddCaseModal, EditCaseModal, DeleteModal.
//
//  USAGE:
//  <Modal isOpen={true} onClose={fn} title="..." size="md">
//    ...content...
//  </Modal>
// ─────────────────────────────────────────────────

import { useEffect } from 'react'

const sizes = { sm: 420, md: 560, lg: 720 }

interface Props {
  isOpen:    boolean
  onClose:   () => void
  title:     string
  size?:     'sm' | 'md' | 'lg'
  children:  React.ReactNode
}

export default function Modal({ isOpen, onClose, title, size = 'md', children }: Props) {
  // Close on Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  if (!isOpen) return null

  return (
    // Dark overlay — click outside to close
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      {/* Modal box — stop click so inner clicks don't close */}
      <div
        style={{
          width: '100%', maxWidth: sizes[size],
          maxHeight: '90vh', background: '#fff', borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', flexShrink: 0, gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', flex: 1 }}>{title}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 26, height: 26, borderRadius: 6, background: '#f1f5f9',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#64748b',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '18px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
