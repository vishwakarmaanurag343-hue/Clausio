'use client'

import { useState } from 'react'
import AddCaseModal from './AddCaseModal'

export default function CasesHeader() {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        {/* Left */}
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Cases
          </h1>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            Manage all your active matters across practice areas.
          </p>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="glass-button" style={secondaryButton}>
            📤 Export
          </button>
          <button className="glass-button" style={secondaryButton}>
            🔍 Filter
          </button>
          <button style={primaryButton} onClick={() => setShowAddModal(true)}>
            ➕ New Case
          </button>
        </div>
      </div>

      <AddCaseModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </>
  )
}

/* ---------------- BUTTONS ---------------- */

const primaryButton: React.CSSProperties = {
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
}

const secondaryButton: React.CSSProperties = {
  height: 38,
  padding: '0 16px',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.6)',
  color: '#0f172a',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
}