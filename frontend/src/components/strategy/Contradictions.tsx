'use client'
// src/components/strategy/Contradictions.tsx
// AI contradiction flashcards on top; persisted contradiction cards below (UI unchanged)

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, contradictionsApi, parseAiJson } from '@/lib/api'

interface Statement { text?: string; sourceDocument?: string; date?: string }
interface Contradiction {
  statementA?:                 Statement
  statementB?:                 Statement
  natureOfContradiction?:      string
  suggestedCrossExamQuestion?: string
  severity?:                   'High' | 'Medium' | 'Low'
}

/** Extract contradictions from the model response. Accepts {contradictions:[…]} or a bare array; tolerates legacy flat items. Returns null on ANY failure — callers must never render raw text. */
function extractContradictions(raw: unknown): Contradiction[] | null {
  let parsed: any = raw
  if (typeof raw === 'string') {
    if (!raw.trim()) return null
    parsed = parseAiJson<any>(raw.trim())
  }
  const list = Array.isArray(parsed) ? parsed : parsed?.contradictions
  if (!Array.isArray(list)) return null
  return list.filter((c: any) => c && typeof c === 'object')
}

const severityStyle = (s?: string) =>
  s === 'High'   ? { label: 'HIGH',   clr: '#dc2626', bg: '#fef2f2', border: '#fecaca' } :
  s === 'Medium' ? { label: 'MEDIUM', clr: '#d97706', bg: '#fffbeb', border: '#fde68a' } :
                   { label: 'LOW',    clr: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }

export default function Contradictions() {
  const { selectedCaseId } = useCaseStore()
  const [items,      setItems]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState('')
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [copied,     setCopied]     = useState<string | null>(null)

  // AI contradiction flashcards — separate from the saved list below
  const [matches,     setMatches]     = useState<Contradiction[] | null>(null)
  const [savedAll,    setSavedAll]    = useState(false)
  const [parseFailed, setParseFailed] = useState(false)

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
    if (!selectedCaseId || generating) return
    setGenerating(true); setError(''); setSavedAll(false); setMatches(null); setParseFailed(false)
    try {
      const res  = await aiApi.getContradictions(selectedCaseId)
      const list = extractContradictions(res.contradictions ?? res.result ?? res)
      if (!list) { setParseFailed(true); return }

      // Show as flashcards first; nothing touches the DB until the advocate approves.
      setMatches(list)

      // Persist in the same pass as before so the saved list stays current.
      await Promise.all(list.slice(0, 8).map((c: any) => {
        const a = c.statementA ?? {}
        const b = c.statementB ?? {}
        return contradictionsApi.create(selectedCaseId, {
          claim:          a.text ?? '',
          claimSource:    [a.sourceDocument, a.date].filter(Boolean).join(' · '),
          evidence:       b.text ?? '',
          evidenceSource: [b.sourceDocument, b.date].filter(Boolean).join(' · '),
          courtArgument:  [
            c.natureOfContradiction ?? '',
            c.suggestedCrossExamQuestion ? `Cross-examine: ${c.suggestedCrossExamQuestion}` : '',
          ].filter(Boolean).join('\n\n'),
          strength:       c.severity ?? 'Medium',
        })
      }))
      load()
    } catch (err: any) { setError(err.message) }
    finally { setGenerating(false) }
  }

  async function saveAllAgain() {
    if (!selectedCaseId || !matches?.length) return
    try {
      await Promise.all(matches.slice(0, 8).map((c: any) => {
        const a = c.statementA ?? {}
        const b = c.statementB ?? {}
        return contradictionsApi.create(selectedCaseId, {
          claim:          a.text ?? '',
          claimSource:    [a.sourceDocument, a.date].filter(Boolean).join(' · '),
          evidence:       b.text ?? '',
          evidenceSource: [b.sourceDocument, b.date].filter(Boolean).join(' · '),
          courtArgument:  [
            c.natureOfContradiction ?? '',
            c.suggestedCrossExamQuestion ? `Cross-examine: ${c.suggestedCrossExamQuestion}` : '',
          ].filter(Boolean).join('\n\n'),
          strength:       c.severity ?? 'Medium',
        })
      }))
      setSavedAll(true)
      load()
    } catch { setError('Failed to save contradictions.') }
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

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 2000)
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

      {/* Parse-failure panel — never dump raw model output */}
      {!generating && parseFailed && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
          The AI response could not be read as contradiction cards.
          <button onClick={runAI} style={{ marginLeft: 8, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      {/* ============ AI CONTRADICTION FLASHCARDS ============ */}
      {!generating && !parseFailed && matches && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '4px 12px' }}>
              ⚖ AI-detected contradictions — verify both sources before citing in court
            </span>
            {matches.length > 0 && (
              <button onClick={saveAllAgain} style={{ height: 30, padding: '0 12px', border: '1px solid #86efac', borderRadius: 8, background: '#f0fdf4', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: '#15803d', fontFamily: 'inherit' }}>
                <i className="ti ti-download" style={{ fontSize: 12, marginRight: 4 }} />{savedAll ? 'Saved ✓' : 'Save all to My Contradictions'}
              </button>
            )}
          </div>

          {matches.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
              No contradiction directly supported by two record sources was found — nothing invented to fill the gap.
            </div>
          )}

          {matches.map((c, i) => {
            const sev = severityStyle(c.severity)
            const a = c.statementA ?? {}
            const b = c.statementB ?? {}
            const questionKey = `q-${i}`
            return (
              <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 10 }}>

                {/* Card header: rank badge + severity pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: '#fef2f2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#dc2626' }}>{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#0f172a' }}>Contradiction</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.clr }}>{sev.label}</span>
                </div>

                {/* Conflicting statements side-by-side */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 10 }}>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#b91c1c', letterSpacing: 1, marginBottom: 4 }}>STATEMENT A</div>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: '#7f1d1d', whiteSpace: 'pre-line' }}>{a.text || '—'}</p>
                    {(a.sourceDocument || a.date) && (
                      <div style={{ marginTop: 6, fontSize: 10.5, fontWeight: 600, color: '#b91c1c', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {a.sourceDocument && <span>📄 {a.sourceDocument}</span>}
                        {a.date && <span>📅 {a.date}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px', minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#1d4ed8', letterSpacing: 1, marginBottom: 4 }}>STATEMENT B</div>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: '#1e3a8a', whiteSpace: 'pre-line' }}>{b.text || '—'}</p>
                    {(b.sourceDocument || b.date) && (
                      <div style={{ marginTop: 6, fontSize: 10.5, fontWeight: 600, color: '#1d4ed8', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {b.sourceDocument && <span>📄 {b.sourceDocument}</span>}
                        {b.date && <span>📅 {b.date}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Why it matters */}
                {c.natureOfContradiction && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e', letterSpacing: 1, marginBottom: 4 }}>WHAT CONFLICTS &amp; WHY IT MATTERS</div>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: '#92400e', whiteSpace: 'pre-line' }}>{c.natureOfContradiction}</p>
                  </div>
                )}

                {/* Cross-examination question */}
                {c.suggestedCrossExamQuestion && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', letterSpacing: 1 }}>✦ SUGGESTED CROSS-EXAMINATION</span>
                      <button onClick={() => copyText(questionKey, c.suggestedCrossExamQuestion!)}
                        style={{ height: 22, padding: '0 8px', border: '1px solid #bbf7d0', borderRadius: 6, background: copied === questionKey ? '#dcfce7' : '#fff', cursor: 'pointer', fontSize: 10.5, fontWeight: 700, color: copied === questionKey ? '#15803d' : '#16a34a', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <i className={`ti ${copied === questionKey ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: 11 }} />{copied === questionKey ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: '#14532d', whiteSpace: 'pre-line' }}>{c.suggestedCrossExamQuestion}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && !generating && !matches && items.length === 0 && (
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
