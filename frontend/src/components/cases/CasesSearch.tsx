'use client'

import { useState } from 'react'

interface Props {
  search: string
  onSearchChange: (value: string) => void
}

export default function CasesSearch({ search, onSearchChange }: Props) {
  const [court, setCourt] = useState('All Courts')
  const [status, setStatus] = useState('All Status')
  const [practice, setPractice] = useState('All Practice Areas')

  const clearFilters = () => {
    onSearchChange('')
    setCourt('All Courts')
    setStatus('All Status')
    setPractice('All Practice Areas')
  }

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cases by client name, case number, advocate..."
            style={inputStyle}
          />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 14 }}>🔍</span>
        </div>

        {/* Court */}
        <select value={court} onChange={(e) => setCourt(e.target.value)} style={selectStyle}>
          <option>All Courts</option>
          <option>Supreme Court</option>
          <option>High Court</option>
          <option>District Court</option>
          <option>Family Court</option>
          <option>Commercial Court</option>
        </select>

        {/* Status */}
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option>All Status</option>
          <option>Active</option>
          <option>Pending</option>
          <option>Closed</option>
          <option>Archived</option>
        </select>

        {/* Practice */}
        <select value={practice} onChange={(e) => setPractice(e.target.value)} style={selectStyle}>
          <option>All Practice Areas</option>
          <option>Family Law</option>
          <option>Civil</option>
          <option>Criminal</option>
          <option>Corporate</option>
          <option>GST</option>
          <option>Income Tax</option>
          <option>NI Act</option>
        </select>

        {/* Clear */}
        <button onClick={clearFilters} style={clearButton}>
          Clear
        </button>
      </div>

      {/* Bottom Row */}
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag label="Family" />
          <Tag label="Civil" />
          <Tag label="Criminal" />
          <Tag label="Tax" />
          <Tag label="Corporate" />
        </div>
        <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>
          🤖 AI Search Ready
        </div>
      </div>
    </div>
  )
}

/* ---------------- COMPONENTS ---------------- */

function Tag({ label }: { label: string }) {
  return (
    <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 600, fontSize: 11, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
      {label}
    </div>
  )
}

/* ---------------- STYLES ---------------- */

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 38,
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  padding: '0 36px 0 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.6)',
  color: '#0f172a',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  height: 38,
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 13,
  background: 'rgba(255,255,255,0.6)',
  color: '#0f172a',
  outline: 'none',
  cursor: 'pointer',
}

const clearButton: React.CSSProperties = {
  height: 38,
  padding: '0 16px',
  borderRadius: 10,
  background: 'rgba(239, 68, 68, 0.1)',
  color: '#dc2626',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  border: '1px solid rgba(239, 68, 68, 0.2)',
}