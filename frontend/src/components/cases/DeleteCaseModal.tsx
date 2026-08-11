'use client'
// src/components/cases/DeleteCaseModal.tsx
// EXACT SAME UI — loads the real case so the confirmation matches the case actually being deleted.

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { casesApi } from '@/lib/api'

interface Props {
  onClose:    () => void
  onDeleted?: () => void
  caseId:     string | null
}

export default function DeleteModal({ onClose, onDeleted, caseId }: Props) {
  const [caseData,    setCaseData]    = useState<any>(null)
  const [typedNumber, setTypedNumber] = useState('')
  const [deleting,    setDeleting]    = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (!caseId) return
    casesApi.getById(caseId)
      .then(setCaseData)
      .catch(err => setError(err.message || 'Failed to load case'))
  }, [caseId])

  const caseNumber = caseData?.caseNumber ?? ''
  const canDelete  = !!caseNumber && typedNumber.trim() === caseNumber

  async function handleDelete() {
    if (!caseId || !canDelete) return
    setDeleting(true)
    setError('')
    try {
      await casesApi.remove(caseId)
      onDeleted?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error deleting case. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    // EXACT SAME UI as original
    <Modal isOpen onClose={onClose} title="Delete case" size="sm">
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>
        🗑️
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', textAlign: 'center', marginBottom: 6 }}>
        Delete this case permanently?
      </p>
      <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 1.6, marginBottom: 14 }}>
        This cannot be undone. All hearings, documents, AI analysis, and history associated with this case will be permanently deleted.
      </p>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>
          {caseData?.name ?? 'Loading...'}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          {caseNumber || '—'} · {caseData?.court ?? '—'}
        </div>
      </div>
      <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 7, padding: '9px 11px', fontSize: 11, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
        <i className="ti ti-alert-triangle" style={{ fontSize: 14, flexShrink: 0, color: '#d97706', marginTop: 1 }} />
        <div>
          Consider <strong>archiving</strong> instead of deleting. Archived cases can be restored anytime and all data is preserved.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '8px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, color: '#dc2626', marginBottom: 10 }}>
          {error}
        </div>
      )}

      <div>
        <p style={{ fontSize: 11, color: '#374151', marginBottom: 5, fontWeight: 500 }}>
          Type the case number to confirm deletion:
        </p>
        <input
          type="text"
          value={typedNumber}
          onChange={e => setTypedNumber(e.target.value)}
          placeholder={caseNumber || '...'}
          style={{ width: '100%', padding: '8px 10px', border: `1px solid ${canDelete ? '#10b981' : '#fca5a5'}`, borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: canDelete ? '#15803d' : '#0f172a' }}
        />
        {canDelete && (
          <p style={{ fontSize: 10, color: '#15803d', marginTop: 4 }}>
            ✓ Case number confirmed — deletion is now enabled.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={btn()}>Cancel</button>
        <button onClick={onClose} style={btn()}><i className="ti ti-archive" style={{ fontSize: 12 }} /> Archive instead</button>
        <button
          disabled={!canDelete || deleting}
          onClick={handleDelete}
          style={{ ...btn(true), marginLeft: 'auto', opacity: canDelete ? 1 : 0.45, cursor: canDelete ? 'pointer' : 'not-allowed' }}
        >
          <i className="ti ti-trash" style={{ fontSize: 12 }} />
          {deleting ? 'Deleting...' : 'Delete permanently'}
        </button>
      </div>
    </Modal>
  )
}

function btn(danger?: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    border: danger ? '1px solid #dc2626' : '1px solid #e2e8f0',
    background: danger ? '#dc2626' : '#f8fafc',
    color: danger ? '#fff' : '#374151',
  }
}
