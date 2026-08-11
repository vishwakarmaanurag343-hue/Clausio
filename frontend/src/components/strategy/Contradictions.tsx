'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, contradictionsApi, parseAiJson } from '@/lib/api'

export default function Contradictions() {
  const { selectedCaseId } = useCaseStore()
  const [items,      setItems]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState('')
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [copied,     setCopied]     = useState<string | null>(null)

  const load = useCallback(() => {
    if (!selectedCaseId) return
    setLoading(true); setError('')
    contradictionsApi.getByCaseId(selectedCaseId)
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedCaseId])

  useEffect(() => { load() }, [load])

  async function runAI() {
    if (!selectedCaseId) return
    setGenerating(true); setError('')
    try {
      const res  = await aiApi.getContradictions(selectedCaseId)
      const raw  = res.contradictions ?? res.result ?? ''
      const list = parseAiJson<any[]>(raw) ?? []
      await Promise.all(list.slice(0, 8).map((c: any) =>
        contradictionsApi.create(selectedCaseId, {
          claim:          c.claim          ?? '',
          claimSource:    c.claimSource    ?? '',
          evidence:       c.evidence       ?? '',
          evidenceSource: c.evidenceSource ?? '',
          courtArgument:  c.courtArgument  ?? '',
          strength:       c.strength       ?? 'Medium',
        })
      ))
      load()
    } catch (err: any) { setError(err.message) }
    finally { setGenerating(false) }
  }

  async function deleteItem(id: string) {
    if (!selectedCaseId || !confirm('Delete this contradiction?')) return
    try { await contradictionsApi.remove(selectedCaseId, id); load() }
    catch { setError('Failed to delete') }
  }

  function copyArgument(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(id); setTimeout(() => setCopied(null), 2000)
  }

  function strengthColor(s: string) {
    if (s === 'High' || s === 'Strong')    return { clr: '#dc2626', bg: '#fef2f2', label: 'Strong' }
    if (s === 'Medium' || s === 'Moderate') return { clr: '#d97706', bg: '#fff7ed', label: 'Moderate' }
    return { clr: '#16a34a', bg: '#f0fdf4', label: 'Mild' }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Contradiction Analysis</h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>AI finds gaps between opposing claims and evidence. Use in cross-examination.</p>
        </div>
        <button onClick={runAI} disabled={generating}
          style={{ height: 36, padding: '0 14px', border: 'none', borderRadius: 8, background: generating ? '#93c5fd' : '#2563eb', color: '#fff', cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="ti ti-sparkles" style={{ fontSize: 13 }} />{generating ? 'Analysing...' : 'Run AI Analysis'}
        </button>
      </div>

      {(loading || generating) && (
        <div style={{ textAlign: 'center', padding: 40, color: '#7c3aed' }}>
          <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>{generating ? 'Finding contradictions...' : 'Loading...'}</div>
        </div>
      )}

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {!loading && !generating && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>No Contradictions Found Yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Click Run AI Analysis to find inconsistencies in opposing claims.</div>
          <button onClick={runAI} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
            <i className="ti ti-sparkles" style={{ marginRight: 6 }} />Find Contradictions
          </button>
        </div>
      )}

      {/* Stats */}
      {items.length > 0 && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Found',  value: items.length,                                            color: '#2563eb' },
            { label: 'Strong',       value: items.filter(i => strengthColor(i.strength).label === 'Strong').length,   color: '#dc2626' },
            { label: 'Moderate',     value: items.filter(i => strengthColor(i.strength).label === 'Moderate').length, color: '#d97706' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map(item => {
          const sc = strengthColor(item.strength)
          const isOpen = expanded === item.id
          return (
            <div key={item.id} style={{ border: `1px solid ${isOpen ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 12, overflow: 'hidden', background: isOpen ? '#fafcff' : '#fff', transition: 'all 0.2s' }}>

              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : item.id)}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.clr, flexShrink: 0 }} />
                <div style={{ flex: 1, fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{item.claim}</div>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: sc.clr, background: sc.bg, flexShrink: 0 }}>{sc.label}</span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); deleteItem(item.id) }} style={{ width: 26, height: 26, border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-trash" style={{ fontSize: 12, color: '#dc2626' }} />
                  </button>
                  <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 16, color: '#94a3b8', padding: 4 }} />
                </div>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e2e8f0' }}>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                    {/* What they claim */}
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Their Claim</div>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{item.claim}</div>
                      {item.claimSource && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 6 }}>Source: {item.claimSource}</div>}
                    </div>

                    {/* Our evidence */}
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Our Evidence</div>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{item.evidence}</div>
                      {item.evidenceSource && <div style={{ fontSize: 11, color: '#15803d', marginTop: 6 }}>Source: {item.evidenceSource}</div>}
                    </div>
                  </div>

                  {/* Court argument */}
                  {item.courtArgument && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          <i className="ti ti-gavel" style={{ marginRight: 4 }} />Court Argument
                        </div>
                        <button onClick={() => copyArgument(item.id, item.courtArgument)}
                          style={{ height: 24, padding: '0 8px', border: '1px solid #bfdbfe', borderRadius: 6, background: copied === item.id ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied === item.id ? '#15803d' : '#2563eb', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <i className={`ti ${copied === item.id ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: 11 }} />{copied === item.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7 }}>{item.courtArgument}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
