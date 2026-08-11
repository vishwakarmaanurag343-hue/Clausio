'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore, useCaseStore } from '@/lib/store'
import { authApi, casesApi } from '@/lib/api'

const LANGUAGES: Record<string, string> = {
  en: 'English', hi: 'हिंदी', mr: 'मराठी', gu: 'ગુજરાતી', ta: 'தமிழ்', te: 'తెలుగు',
}

export default function Header() {
  const router = useRouter()
  const { sidebarExpanded, caseListVisible, aiPanelVisible, language, toggleSidebar, toggleCaseList, toggleAIPanel, setLanguage } = useUIStore()
  const { setSelectedCase } = useCaseStore()

  const [user,        setUser]        = useState<any>(null)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [allCases,    setAllCases]    = useState<any[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { setUser(authApi.getUser()) }, [])

  // Load cases for search
  useEffect(() => {
    const token = localStorage.getItem('clausio_token')
    if (!token) return
    casesApi.getAll()
      .then(data => setAllCases(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Filter cases on search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    setSearchResults(
      allCases.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.caseNumber?.toLowerCase().includes(q) ||
        c.caseType?.toLowerCase().includes(q) ||
        `${c.client?.firstName ?? ''} ${c.client?.lastName ?? ''}`.toLowerCase().includes(q)
      ).slice(0, 6)
    )
  }, [searchQuery, allCases])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Cmd+K shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function handleSelectCase(c: any) {
    setSelectedCase(c.id, c.name)
    setSearchOpen(false)
    setSearchQuery('')
    router.push('/dashboard')
  }

  const pill = (active: boolean, icon: string, label: string, onClick: () => void) => (
    <button onClick={onClick} className="glass-pill" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: active ? 600 : 500, color: active ? '#0f172a' : '#475569', background: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', border: active ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 14 }} />{label}
    </button>
  )

  const fullName = user ? `${user.firstName ?? ''} ${(user.lastName ?? '').charAt(0)}${user.lastName ? '.' : ''}`.trim() : 'Guest'
  const initials = user ? `${(user.firstName ?? '')[0] ?? ''}${(user.lastName ?? '')[0] ?? ''}`.toUpperCase() : '—'
  const role     = user?.role ?? 'Guest'

  return (
    <header className="glass-panel" style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0, margin: '16px 16px 0 16px', position: 'relative', zIndex: 100 }}>

      {/* Logo */}
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Clausio</span>

      {/* Panel toggles */}
      <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
        {pill(sidebarExpanded, 'ti-layout-sidebar', 'Sidebar',  toggleSidebar)}
        {pill(caseListVisible,  'ti-list',           'Cases',    toggleCaseList)}
        {pill(aiPanelVisible,   'ti-brain',          'AI',       toggleAIPanel)}
      </div>

      {/* ✅ Search bar — now fully functional */}
      <div ref={searchRef} style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <div
          style={{ width: '100%', maxWidth: 420, display: 'flex', alignItems: 'center', gap: 8, background: searchOpen ? '#fff' : 'rgba(255,255,255,0.5)', border: `1px solid ${searchOpen ? '#3b82f6' : 'rgba(255,255,255,0.8)'}`, borderRadius: 16, padding: '8px 16px', boxShadow: searchOpen ? '0 0 0 3px rgba(59,130,246,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.02)', cursor: 'text', transition: 'all 0.15s' }}
          onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        >
          <i className="ti ti-search" style={{ fontSize: 14, color: '#64748b', flexShrink: 0 }} />
          {searchOpen ? (
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cases, clients, case numbers..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#0f172a', fontFamily: 'inherit' }}
              autoFocus
            />
          ) : (
            <span style={{ fontSize: 13, color: '#64748b', flex: 1, fontWeight: 500 }}>Search cases, clients...</span>
          )}
          <kbd style={{ fontSize: 10, background: 'rgba(255,255,255,0.8)', color: '#475569', padding: '2px 6px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>⌘K</kbd>
        </div>

        {/* Search results dropdown */}
        {searchOpen && (
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden', zIndex: 200 }}>
            {searchQuery === '' && (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Recent Cases</div>
                {allCases.slice(0, 4).map(c => (
                  <CaseResult key={c.id} c={c} onSelect={handleSelectCase} />
                ))}
                {allCases.length === 0 && (
                  <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>No cases found</div>
                )}
              </div>
            )}

            {searchQuery !== '' && searchResults.length === 0 && (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No cases found for "{searchQuery}"
              </div>
            )}

            {searchQuery !== '' && searchResults.length > 0 && (
              <div style={{ padding: '8px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', padding: '4px 16px 8px', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {searchResults.length} result{searchResults.length > 1 ? 's' : ''}
                </div>
                {searchResults.map(c => (
                  <CaseResult key={c.id} c={c} onSelect={handleSelectCase} query={searchQuery} />
                ))}
              </div>
            )}

            <div style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>↵ Select</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Esc Close</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>⌘K Open</span>
            </div>
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="glass-pill"
          style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, padding: '6px 10px', border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.6)', borderRadius: 20, cursor: 'pointer' }}
        >
          {Object.entries(LANGUAGES).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>

        <button onClick={() => router.push('/settings')} className="glass-button" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer' }}>
          <i className="ti ti-bell" style={{ fontSize: 18 }} />
        </button>

        <button onClick={() => router.push('/settings')} className="glass-button" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer' }}>
          <i className="ti ti-settings" style={{ fontSize: 18 }} />
        </button>

        <div onClick={() => router.push('/settings')} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{fullName}</span>
            <span style={{ fontSize: 10, color: '#64748b' }}>{role}</span>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}

function CaseResult({ c, onSelect, query }: { c: any; onSelect: (c: any) => void; query?: string }) {
  const clientName = c.client ? `${c.client.firstName ?? ''} ${c.client.lastName ?? ''}`.trim() : ''
  return (
    <div
      onClick={() => onSelect(c)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className="ti ti-folder" style={{ fontSize: 14, color: '#3b82f6' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{c.caseNumber} · {c.caseType}{clientName ? ` · ${clientName}` : ''}</div>
      </div>
      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: c.status === 'Active' ? '#f0fdf4' : '#f1f5f9', color: c.status === 'Active' ? '#15803d' : '#64748b', fontWeight: 600, flexShrink: 0 }}>{c.status}</span>
    </div>
  )
}
