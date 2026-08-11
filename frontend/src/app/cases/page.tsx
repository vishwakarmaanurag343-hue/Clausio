'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { casesApi } from '@/lib/api'
import CasesHeader    from '@/components/cases/CasesHeader'
import CaseStats      from '@/components/cases/CaseStats'
import PracticeAreas  from '@/components/cases/PracticeAreas'
import CaseTable      from '@/components/cases/CaseTable'
import EditCaseModal  from '@/components/cases/EditCaseModal'
import DeleteCaseModal from '@/components/cases/DeleteCaseModal'

export default function CasesPage() {
  const [editCaseId,     setEditCaseId]     = useState<string | null>(null)
  const [deleteCaseId,   setDeleteCaseId]   = useState<string | null>(null)
  const [refresh,        setRefresh]        = useState(0)
  const [cases,          setCases]          = useState<any[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')

  // Filter state
  const [search,         setSearch]         = useState('')
  const [courtFilter,    setCourtFilter]    = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [practiceFilter, setPracticeFilter] = useState('')
  const [showFilters,    setShowFilters]    = useState(false)

  function handleSaved() { setRefresh(r => r + 1) }

  const loadCases = useCallback(() => {
    setLoading(true)
    setError('')
    casesApi.getAll()
      .then(data => setCases(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message || 'Failed to load cases'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadCases() }, [loadCases, refresh])

  // ✅ Export to CSV — actually works
  function handleExport() {
    if (cases.length === 0) return
    const headers = ['Case Name', 'Case Number', 'Case Type', 'Court', 'Stage', 'Status', 'Priority', 'Client', 'Next Hearing', 'Filed On']
    const rows = filteredCases.map(c => [
      c.name ?? '',
      c.caseNumber ?? '',
      c.caseType ?? '',
      c.court ?? '',
      c.stage ?? '',
      c.status ?? '',
      c.priority ?? '',
      c.client ? `${c.client.firstName ?? ''} ${c.client.lastName ?? ''}`.trim() : '',
      c.nextHearing ? new Date(c.nextHearing).toLocaleDateString('en-IN') : '',
      c.filedOn ? new Date(c.filedOn).toLocaleDateString('en-IN') : '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `clausio-cases-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const clientName = c.client ? `${c.client.firstName ?? ''} ${c.client.lastName ?? ''}` : ''
      const matchesSearch   = search === '' || c.name?.toLowerCase().includes(search.toLowerCase()) || c.caseNumber?.toLowerCase().includes(search.toLowerCase()) || clientName.toLowerCase().includes(search.toLowerCase()) || c.caseType?.toLowerCase().includes(search.toLowerCase())
      const matchesCourt    = courtFilter === '' || c.court?.toLowerCase().includes(courtFilter.toLowerCase())
      const matchesStatus   = statusFilter === '' || c.status?.toLowerCase() === statusFilter.toLowerCase()
      const matchesPractice = practiceFilter === '' || c.caseType?.toLowerCase().includes(practiceFilter.toLowerCase())
      return matchesSearch && matchesCourt && matchesStatus && matchesPractice
    })
  }, [cases, search, courtFilter, statusFilter, practiceFilter])

  const hasActiveFilters = search || courtFilter || statusFilter || practiceFilter

  function clearAll() {
    setSearch(''); setCourtFilter(''); setStatusFilter(''); setPracticeFilter('')
  }

  return (
    <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>

      {/* Header with working Export and Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Cases</h1>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            {cases.length} total matters · {filteredCases.length} shown
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {hasActiveFilters && (
            <button onClick={clearAll} style={{ height: 38, padding: '0 12px', border: '1px solid #fca5a5', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear filters ✕
            </button>
          )}
          <button
            onClick={handleExport}
            className="glass-button"
            style={{ height: 38, padding: '0 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, background: 'rgba(255,255,255,0.6)', color: '#0f172a', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
          >
            📤 Export CSV
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ height: 38, padding: '0 16px', border: `1px solid ${showFilters ? '#3b82f6' : 'rgba(0,0,0,0.1)'}`, borderRadius: 10, background: showFilters ? '#eff6ff' : 'rgba(255,255,255,0.6)', color: showFilters ? '#1e40af' : '#0f172a', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
          >
            🔍 Filters {hasActiveFilters ? '●' : ''}
          </button>
          <CasesHeader onSaved={handleSaved} />
        </div>
      </div>

      {/* ✅ Filter panel — actually connected */}
      {showFilters && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, case number, client..."
                style={{ width: '100%', height: 38, border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 36px 0 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc', color: '#0f172a', fontFamily: 'inherit' }}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>🔍</span>
            </div>
            <select value={courtFilter} onChange={e => setCourtFilter(e.target.value)} style={selectStyle}>
              <option value="">All Courts</option>
              <option>Supreme Court</option>
              <option>High Court</option>
              <option>District Court</option>
              <option>Family Court</option>
              <option>Sessions Court</option>
              <option>Commercial Court</option>
              <option>Consumer Forum</option>
              <option>Labour Court</option>
              <option>NCLT</option>
              <option>Income Tax Tribunal</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="">All Status</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Closed</option>
              <option>Archived</option>
            </select>
            <select value={practiceFilter} onChange={e => setPracticeFilter(e.target.value)} style={selectStyle}>
              <option value="">All Practice Areas</option>
              <option value="family">Family Law</option>
              <option value="civil">Civil Litigation</option>
              <option value="criminal">Criminal Law</option>
              <option value="corporate">Corporate</option>
              <option value="gst">GST</option>
              <option value="income tax">Income Tax</option>
              <option value="ni act">NI Act 138</option>
              <option value="arbitration">Arbitration</option>
            </select>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {search && <Chip label={`Search: "${search}"`} onRemove={() => setSearch('')} />}
              {courtFilter && <Chip label={`Court: ${courtFilter}`} onRemove={() => setCourtFilter('')} />}
              {statusFilter && <Chip label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter('')} />}
              {practiceFilter && <Chip label={`Practice: ${practiceFilter}`} onRemove={() => setPracticeFilter('')} />}
              <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>{filteredCases.length} results</span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ marginTop: 8 }}>
        <CaseStats cases={cases} />
      </div>

      {/* Practice areas */}
      <div style={{ marginTop: 28 }}>
        <PracticeAreas cases={cases} selected={practiceFilter} onSelect={v => { setPracticeFilter(v); setShowFilters(false) }} />
      </div>

      {/* Table */}
      <div style={{ marginTop: 28 }}>
        <CaseTable
          cases={filteredCases}
          loading={loading}
          error={error}
          onEdit={id => setEditCaseId(id)}
          onDelete={id => setDeleteCaseId(id)}
        />
      </div>

      {editCaseId && (
        <EditCaseModal caseId={editCaseId} onClose={() => setEditCaseId(null)} onSaved={handleSaved} />
      )}
      {deleteCaseId && (
        <DeleteCaseModal caseId={deleteCaseId} onClose={() => setDeleteCaseId(null)} onDeleted={handleSaved} />
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, fontSize: 11, color: '#1e40af', fontWeight: 600 }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e40af', fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%', height: 38, border: '1px solid #e2e8f0', borderRadius: 10,
  padding: '0 12px', fontSize: 13, background: '#f8fafc', color: '#0f172a',
  outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
}
