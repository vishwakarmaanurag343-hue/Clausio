import React from 'react'

const DRAFT_TYPES = [
  'Divorce Petition',
  'Maintenance Petition',
  'Bail Application',
  'Written Statement',
  'Affidavit',
  'Legal Notice'
]

export default function DraftTypeSelector() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>Type of draft</label>
      <select style={{
        width: '100%', padding: '12px 14px',
        border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12,
        fontSize: 13, background: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', outline: 'none',
        color: '#0f172a', appearance: 'auto', fontWeight: 600, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
      }}>
        {DRAFT_TYPES.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
    </div>
  )
}