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
    <div className="glass-panel mobile-cases-container" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>

      {/* ── DESKTOP HEADER & FILTERS ── */}
      <div className="desktop-cases-view" style={{ display: 'flex', flexDirection: 'column' }}>
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

        {/* Desktop Filter panel */}
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

        {/* Desktop Stats */}
        <div style={{ marginTop: 8 }}>
          <CaseStats cases={cases} />
        </div>

        {/* Desktop Practice areas */}
        <div style={{ marginTop: 28 }}>
          <PracticeAreas cases={cases} selected={practiceFilter} onSelect={v => { setPracticeFilter(v); setShowFilters(false) }} />
        </div>

        {/* Desktop Table */}
        <div style={{ marginTop: 28 }}>
          <CaseTable
            cases={filteredCases}
            loading={loading}
            error={error}
            onEdit={id => setEditCaseId(id)}
            onDelete={id => setDeleteCaseId(id)}
          />
        </div>
      </div>

      {/* ── MOBILE CASES VIEW (Matching Mobile Prototype) ── */}
      <div className="mobile-cases-view" style={{ display: 'none', flexDirection: 'column', gap: 16 }}>
        
        {/* Floating Top Filter & Action Pill Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: 30,
            padding: '6px 8px 6px 14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            gap: 8,
          }}
        >
          <i className="ti ti-search" style={{ fontSize: 16, color: '#0f172a', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filters......"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              color: '#0f172a',
              fontWeight: 500,
              minWidth: 0,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleExport}
            style={{
              padding: '8px 14px',
              borderRadius: 20,
              background: '#cbd5e1',
              border: 'none',
              fontSize: 11,
              fontWeight: 700,
              color: '#0f172a',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}
          >
            Export CSV
          </button>
          <CasesHeader
            onSaved={handleSaved}
            buttonText="NEW CASE"
            buttonStyle={{
              height: 'auto',
              padding: '8px 14px',
              borderRadius: 20,
              background: '#cbd5e1',
              color: '#0f172a',
              fontSize: 11,
              fontWeight: 700,
              boxShadow: 'none',
              whiteSpace: 'nowrap',
            }}
          />
        </div>

        {/* Main Solid Grey Section with Rounded Top & Bottom extending full width */}
        <div
          style={{
            background: '#cbd5e1',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            padding: '24px 16px 40px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            margin: '8px -16px 0 -16px',
            flex: 1,
          }}
        >
          {/* Section: Cases */}
          <div>
            <h2 style={{ margin: '0 0 12px 6px', fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Cases
            </h2>
            
            {/* 3 Top Cards for Cases */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 12,
              }}
            >
              {[
                { title: 'Total', count: cases.length, icon: 'ti-folder', color: '#0f172a' },
                { title: 'Active', count: cases.filter(c => c.status === 'Active').length, icon: 'ti-briefcase', color: '#0f172a' },
                { title: 'Today', count: cases.filter(c => c.nextHearing && new Date(c.nextHearing).toDateString() === new Date().toDateString()).length, icon: 'ti-calendar-event', color: '#0f172a' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#e2e8f0',
                    borderRadius: 22,
                    padding: '16px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: 110,
                  }}
                >
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{item.count}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 4 }}>{item.title}</span>
                </div>
              ))}
            </div>

            {/* Cases Big Summary Card / Recent Matters */}
            <div
              style={{
                background: '#e2e8f0',
                borderRadius: 24,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Recent Matters</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{filteredCases.length} matters</span>
              </div>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: '#64748b' }}>Loading cases...</div>
              ) : filteredCases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: '#64748b' }}>No cases found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {filteredCases.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setEditCaseId(c.id)}
                      style={{
                        background: '#f8fafc',
                        borderRadius: 16,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                          {c.court} · {c.caseType}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: '#cbd5e1', color: '#1e293b' }}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section: Practice Area */}
          <div>
            <h2 style={{ margin: '0 0 12px 6px', fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Practice Area
            </h2>

            {/* 3 Top Practice Area Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 12,
              }}
            >
              {[
                { title: 'Family Law', match: 'family' },
                { title: 'Civil Law', match: 'civil' },
                { title: 'Criminal', match: 'criminal' },
              ].map((area, idx) => {
                const count = cases.filter(c => c.caseType?.toLowerCase().includes(area.match)).length
                const isSelected = practiceFilter === area.match
                return (
                  <div
                    key={idx}
                    onClick={() => setPracticeFilter(isSelected ? '' : area.match)}
                    style={{
                      background: isSelected ? '#ffffff' : '#e2e8f0',
                      outline: isSelected ? '2px solid #0f172a' : 'none',
                      borderRadius: 22,
                      padding: '16px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      minHeight: 110,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{count}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 4, whiteSpace: 'nowrap' }}>{area.title}</span>
                  </div>
                )
              })}
            </div>

            {/* Practice Areas Details / More Practice Areas Card */}
            <div
              style={{
                background: '#e2e8f0',
                borderRadius: 24,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>All Practice Disciplines</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 4 }}>
                {[
                  { title: 'Corporate', match: 'corporate', icon: 'ti-building-bank' },
                  { title: 'GST', match: 'gst', icon: 'ti-receipt-tax' },
                  { title: 'Income Tax', match: 'income tax', icon: 'ti-cash-banknote' },
                  { title: 'Arbitration', match: 'arbitration', icon: 'ti-gavel' },
                ].map((item, idx) => {
                  const count = cases.filter(c => c.caseType?.toLowerCase().includes(item.match)).length
                  const isSelected = practiceFilter === item.match
                  return (
                    <button
                      key={idx}
                      onClick={() => setPracticeFilter(isSelected ? '' : item.match)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: isSelected ? '#0f172a' : '#f8fafc',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        border: 'none',
                        borderRadius: 14,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className={`ti ${item.icon}`} /> {item.title}
                      </span>
                      <span style={{ opacity: 0.8, fontSize: 11, fontWeight: 700 }}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

        </div>

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
