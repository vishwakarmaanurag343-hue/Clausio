'use client'

import { useState } from 'react'
import AddCaseModal from './AddCaseModal'

interface Props {
  onSaved?: () => void
  buttonStyle?: React.CSSProperties
  buttonText?: string
}

export default function CasesHeader({ onSaved, buttonStyle, buttonText }: Props) {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <>
      <button
        style={{
          height: 38,
          padding: '0 16px',
          border: 'none',
          borderRadius: 10,
          background: '#3b82f6',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          fontFamily: 'inherit',
          ...buttonStyle,
        }}
        onClick={() => setShowAddModal(true)}
      >
        {buttonText ?? '➕ New Case'}
      </button>

      <AddCaseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => { setShowAddModal(false); onSaved?.() }}
      />
    </>
  )
}
