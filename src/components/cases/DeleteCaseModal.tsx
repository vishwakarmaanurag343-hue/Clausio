'use client'
// ─────────────────────────────────────────────────
//  src/components/cases/DeleteModal.tsx
//
//  Delete case confirmation modal.
//
//  Safety features:
//  1. Shows case name + stats (hearings, docs count)
//  2. Warns about Archive instead
//  3. Requires typing the case number to confirm
//  4. "Archive instead" button always offered
// ─────────────────────────────────────────────────

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface Props { onClose: () => void; caseId: string | null }

const CASE_NUMBER = 'FC/2847/2023'

export default function DeleteModal({ onClose, caseId }: Props) {
  const [typedNumber, setTypedNumber] = useState('')

  // Only allow deletion when case number is typed correctly
  const canDelete = typedNumber.trim() === CASE_NUMBER

  return (
    <Modal isOpen onClose={onClose} title="Delete case" size="sm">

      {/* Trash icon */}
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>
        🗑️
      </div>

      {/* Title + subtitle */}
      <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', textAlign: 'center', marginBottom: 6 }}>
        Delete this case permanently?
      </p>
      <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 1.6, marginBottom: 14 }}>
        This cannot be undone. All hearings, documents, AI analysis, and history associated with this case will be permanently deleted.
      </p>

      {/* Case summary card */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>
          Priya Sharma v. Rohit Vikram Sharma
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          {CASE_NUMBER} · Family Court Bandra · 14 hearing entries · 8 documents
        </div>
      </div>

      {/* Archive suggestion */}
      <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 7, padding: '9px 11px', fontSize: 11, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
        <i className="ti ti-alert-triangle" style={{ fontSize: 14, flexShrink: 0, color: '#d97706', marginTop: 1 }} />
        <div>
          Consider <strong>archiving</strong> instead of deleting. Archived cases can be restored anytime and all data is preserved.
        </div>
      </div>

      {/* Type to confirm */}
      <div>
        <p style={{ fontSize: 11, color: '#374151', marginBottom: 5, fontWeight: 500 }}>
          Type the case number to confirm deletion:
        </p>
        <input
          type="text"
          value={typedNumber}
          onChange={e => setTypedNumber(e.target.value)}
          placeholder={CASE_NUMBER}
          style={{
            width: '100%', padding: '8px 10px',
            border: `1px solid ${canDelete ? '#10b981' : '#fca5a5'}`,
            borderRadius: 7, fontSize: 13, fontFamily: 'inherit',
            outline: 'none', color: canDelete ? '#15803d' : '#0f172a',
          }}
        />
        {canDelete && (
          <p style={{ fontSize: 10, color: '#15803d', marginTop: 4 }}>
            ✓ Case number confirmed — deletion is now enabled.
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={btn()}>Cancel</button>
        <button onClick={onClose} style={btn()}><i className="ti ti-archive" style={{ fontSize: 12 }} /> Archive instead</button>
        <button
          disabled={!canDelete}
          onClick={onClose}
          style={{
            ...btn(true),
            marginLeft: 'auto',
            opacity: canDelete ? 1 : 0.45,
            cursor: canDelete ? 'pointer' : 'not-allowed',
          }}
        >
          <i className="ti ti-trash" style={{ fontSize: 12 }} />
          Delete permanently
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
