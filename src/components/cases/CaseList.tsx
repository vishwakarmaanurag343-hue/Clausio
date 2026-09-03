'use client'
import { useState } from 'react'

const CASES = [
  { name: 'Priya v. Rohit Sharma', num: 'FC/2847/2023', type: 'Family',    dot: '#ef4444', status: 'Hearing today',  sBg: '#fef2f2', sClr: '#dc2626' },
  { name: 'Mehta v. Mehta',        num: 'FC/1203/2024', type: 'Family',    dot: '#10b981', status: 'Active',         sBg: '#f0fdf4', sClr: '#15803d' },
  { name: 'State v. Ramesh Patel', num: 'CR/445/2024',  type: 'Criminal',  dot: '#f59e0b', status: 'Pending filing', sBg: '#fef3c7', sClr: '#d97706' },
  { name: 'Gupta Property',        num: 'CIV/2090/2023',type: 'Civil',     dot: '#3b82f6', status: 'Evidence',       sBg: '#eff6ff', sClr: '#1e40af' },
  { name: 'Khan Cheque Bounce',    num: 'NI/338/2024',  type: 'NI Act 138',dot: '#10b981', status: 'Active',         sBg: '#f0fdf4', sClr: '#15803d' },
  { name: 'Sharma GST Appeal',     num: 'GST/112/2024', type: 'Tax',       dot: '#7c3aed', status: 'Arguments',      sBg: '#f5f3ff', sClr: '#7c3aed' },
  { name: 'Patel Income Tax',      num: 'IT/220/2024',  type: 'Income Tax',dot: '#94a3b8', status: 'Closed',         sBg: '#f1f5f9', sClr: '#64748b' },
]
const FILTERS = ['All (154)', 'Active', 'Today', 'At risk']

export default function CaseList() {
  const [filter, setFilter] = useState('All (154)')
  const [sel, setSel] = useState(0)

  return (
    <div className="glass-panel" style={{ height: 'calc(100% - 16px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.4)', flexShrink: 0, background: 'rgba(255,255,255,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 12, padding: '6px 10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
          <i className="ti ti-search" style={{ fontSize: 13, color: '#64748b', marginRight: 6 }} />
          <input type="text" placeholder="Search cases..." style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0f172a' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'glass-pill' : ''} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, cursor: 'pointer', border: filter === f ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent', background: filter === f ? 'rgba(255,255,255,0.9)' : 'transparent', color: filter === f ? '#0f172a' : '#64748b', fontFamily: 'inherit', fontWeight: filter === f ? 600 : 500, transition: 'all 0.2s ease' }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {CASES.map((c, i) => (
          <div key={i} onClick={() => setSel(i)} style={{ padding: '10px', borderRadius: 16, cursor: 'pointer', background: sel === i ? 'rgba(255,255,255,0.8)' : 'transparent', boxShadow: sel === i ? '0 2px 8px rgba(0,0,0,0.04)' : 'none', border: sel === i ? '1px solid rgba(255,255,255,0.9)' : '1px solid transparent', transition: 'all 0.2s ease', marginBottom: 4 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${c.dot}40` }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 500 }}>{c.num} · {c.type}</div>
                <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8, marginTop: 4, background: c.sBg, color: c.sClr, border: `1px solid ${c.sClr}30` }}>{c.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
