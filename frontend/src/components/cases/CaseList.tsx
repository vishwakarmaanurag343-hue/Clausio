'use client'
import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'

const FILTERS = ['All', 'Active', 'Today', 'At risk']

interface Props {
  compact?: boolean
}

export default function CaseList({ compact = false }: Props) {
  const [filter,  setFilter]  = useState('All')
  const [cases,   setCases]   = useState<any[]>([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)

  // ✅ Get selected case from store
  const { selectedCaseId, setSelectedCase } = useCaseStore()

  // Load real cases from backend
  useEffect(() => {
    const token = localStorage.getItem('clausio_token')
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5123/api').replace(/\/+$/, '')
    const url = apiBase.endsWith('/api') ? `${apiBase}/cases` : `${apiBase}/api/cases`
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setCases(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Filter cases by search
  const filtered = cases.filter(c =>
    search === '' ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.caseNumber?.toLowerCase().includes(search.toLowerCase())
  )

  function getDot(status: string) {
    if (status === 'Active')  return '#10b981'
    if (status === 'Closed')  return '#94a3b8'
    if (status === 'Pending') return '#f59e0b'
    return '#ef4444'
  }

  function getStatusBg(status: string) {
    if (status === 'Active')  return { bg: '#f0fdf4', clr: '#15803d' }
    if (status === 'Closed')  return { bg: '#f1f5f9', clr: '#64748b' }
    if (status === 'Pending') return { bg: '#fef3c7', clr: '#d97706' }
    return { bg: '#fef2f2', clr: '#dc2626' }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.3)' }}>
      {compact ? (
        <div style={{
          padding: '10px 10px 6px',
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Cases
        </div>
      ) : (
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0, background: 'rgba(255,255,255,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 12, padding: '6px 10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
            <i className="ti ti-search" style={{ fontSize: 13, color: '#64748b', marginRight: 6 }} />
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0f172a' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'glass-pill' : ''} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, cursor: 'pointer', border: filter === f ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent', background: filter === f ? 'rgba(255,255,255,0.9)' : 'transparent', color: filter === f ? '#0f172a' : '#64748b', fontFamily: 'inherit', fontWeight: filter === f ? 600 : 500, transition: 'all 0.2s ease' }}>
                {f}{f === 'All' ? ` (${cases.length})` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>

        {loading && (
          <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            Loading cases...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            {search ? `No cases match "${search}"` : 'No cases yet.'}
          </div>
        )}

        {filtered.map((c) => {
          const dot      = getDot(c.status)
          const sBg      = getStatusBg(c.status)
          const isSelected = c.id === selectedCaseId

          if (compact) {
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c.id, c.name)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: isSelected ? '#eff6ff' : 'transparent',
                  border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isSelected ? '#2563eb' : '#cbd5e1',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isSelected ? '#1d4ed8' : '#374151',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 110,
                }}>
                  {(c.name || 'Case').slice(0, 12)}{(c.name || '').length > 12 ? '...' : ''}
                </span>
              </div>
            )
          }

          return (
            <div
              key={c.id}
              // ✅ CHANGED: clicking case updates the store
              onClick={() => setSelectedCase(c.id, c.name)}
              style={{ padding: '10px', borderRadius: 16, cursor: 'pointer', background: isSelected ? 'rgba(255,255,255,0.8)' : 'transparent', boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.04)' : 'none', border: isSelected ? '1px solid rgba(255,255,255,0.9)' : '1px solid transparent', transition: 'all 0.2s ease', marginBottom: 4 }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${dot}40` }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 500 }}>{c.caseNumber} · {c.caseType}</div>
                  <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8, marginTop: 4, background: sBg.bg, color: sBg.clr, border: `1px solid ${sBg.clr}30` }}>{c.status}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
