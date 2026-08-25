'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, parseAiJson } from '@/lib/api'

interface CaseRisk {
  risk?:       string
  category?:   string
  severity?:   string
  cause?:      string
  mitigation?: string
}

const SEVERITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 }

const SEVERITY_STYLE: Record<string, { bg: string; fg: string; bd: string; accent: string }> = {
  High:   { bg: '#fef2f2', fg: '#dc2626', bd: '#fecaca', accent: '#dc2626' },
  Medium: { bg: '#fffbeb', fg: '#b45309', bd: '#fde68a', accent: '#d97706' },
  Low:    { bg: '#f0fdf4', fg: '#15803d', bd: '#bbf7d0', accent: '#16a34a' },
}

const CATEGORY_STYLE: Record<string, { bg: string; fg: string; bd: string }> = {
  Procedural:  { bg: '#eff6ff', fg: '#1d4ed8', bd: '#bfdbfe' },
  Evidentiary: { bg: '#f5f3ff', fg: '#6d28d9', bd: '#ddd6fe' },
  Limitation:  { bg: '#fff7ed', fg: '#c2410c', bd: '#fed7aa' },
  Compliance:  { bg: '#f0fdfa', fg: '#0f766e', bd: '#99f6e4' },
}

function severityOf(r: CaseRisk)   { return SEVERITY_STYLE[r.severity ?? ''] ? r.severity! : 'Medium' }
function categoryStyle(c?: string) { return CATEGORY_STYLE[c ?? ''] ?? { bg: '#f1f5f9', fg: '#475569', bd: '#e2e8f0' } }

/** Extract the risks array from the model response. Returns null on ANY failure — callers must never render raw text. */
function extractRisks(raw: unknown): CaseRisk[] | null {
  let parsed: any = raw
  if (typeof raw === 'string') {
    if (!raw.trim()) return null
    parsed = parseAiJson<any>(raw.trim())
  }
  if (Array.isArray(parsed))                return parsed.filter((r: any) => r && typeof r === 'object')
  if (parsed && Array.isArray(parsed.risks)) return parsed.risks.filter((r: any) => r && typeof r === 'object')
  return null
}

export default function RiskAssessment() {
  const { selectedCaseId } = useCaseStore()
  const [risks,    setRisks]    = useState<CaseRisk[] | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [loaded,   setLoaded]   = useState(false)

  function loadRisks() {
    if (!selectedCaseId) return
    setLoading(true); setError('')
    aiApi.getRisks(selectedCaseId)
      .then(res => {
        const parsed = extractRisks(res.risks ?? res.result ?? res)
        if (parsed) { setRisks(parsed); setLoaded(true) }
        else setError('The AI response could not be read as risk cards. Please retry.')
      })
      .catch(err => setError(err.message || 'Failed to assess case risks'))
      .finally(() => setLoading(false))
  }

  const counts = risks?.reduce<Record<string, number>>((acc, r) => {
    const s = severityOf(r); acc[s] = (acc[s] ?? 0) + 1; return acc
  }, {}) ?? {}

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)', height: '100%', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ti ti-shield-check" style={{ fontSize: 20, color: '#2563eb' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Risk Assessment</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Courtroom-grade assessment of what could hurt this case — and how to defuse it</p>
          </div>
        </div>
        <button onClick={loadRisks} disabled={loading || !selectedCaseId}
          style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: loading ? '#f1f5f9' : '#fff', cursor: loading || !selectedCaseId ? 'not-allowed' : 'pointer', color: '#64748b', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="ti ti-refresh" style={{ fontSize: 13 }} />{loading ? 'Analysing...' : loaded ? 'Refresh' : 'Analyse'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 30, color: '#7c3aed' }}>
          <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>AI is assessing your case risks...</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>This reads the full case file — usually under a minute</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>
          {error} <button onClick={loadRisks} style={{ marginLeft: 8, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      {/* Not yet loaded */}
      {!loading && !loaded && !error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <i className="ti ti-shield" style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Not Analysed Yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Click Analyse to get an AI risk assessment grounded in this case file.</div>
          <button onClick={loadRisks} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
            <i className="ti ti-sparkles" style={{ marginRight: 6 }} />Analyse Case
          </button>
        </div>
      )}

      {/* Risk flashcards — PrepBriefCard visual grammar */}
      {!loading && !error && risks && (
        <>
          {/* Severity count strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {(['High', 'Medium', 'Low'] as const).map(s => (
              counts[s] ? (
                <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: SEVERITY_STYLE[s].bg, border: `1px solid ${SEVERITY_STYLE[s].bd}`, color: SEVERITY_STYLE[s].fg }}>
                  {counts[s]} {s}
                </span>
              ) : null
            ))}
            {risks.length === 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                No material risks found in the case file
              </span>
            )}
          </div>

          {risks.length > 1 && <div style={{ height: 1, background: '#e2e8f0', margin: '0 0 12px' }} />}

          {[...risks]
            .sort((a, b) => (SEVERITY_ORDER[severityOf(a)] ?? 9) - (SEVERITY_ORDER[severityOf(b)] ?? 9))
            .map((r, i) => {
              const sev = severityOf(r)
              const sevS = SEVERITY_STYLE[sev]
              const catS = categoryStyle(r.category)
              return (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 10 }}>

                  {/* Card header: icon + risk name + severity/category pills */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
                      <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: sevS.accent, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#0f172a', lineHeight: 1.6 }}>{r.risk || 'Unnamed risk'}</span>
                    </div>
                    <div style={{ display: 'flex', flexShrink: 0, gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: catS.bg, border: `1px solid ${catS.bd}`, color: catS.fg }}>{r.category || 'Uncategorised'}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: sevS.bg, border: `1px solid ${sevS.bd}`, color: sevS.fg }}>{sev}</span>
                    </div>
                  </div>

                  {/* Why it's a risk — full cause paragraph */}
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', letterSpacing: 1, marginBottom: 4 }}>WHY IT&apos;S A RISK IN THIS CASE</div>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: '#7f1d1d', whiteSpace: 'pre-line' }}>{r.cause || '—'}</p>
                  </div>

                  {/* What to do about it — full mitigation paragraph */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#15803d', letterSpacing: 1, marginBottom: 4 }}>WHAT TO DO ABOUT IT</div>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: '#14532d', whiteSpace: 'pre-line' }}>{r.mitigation || '—'}</p>
                  </div>
                </div>
              )
            })}
        </>
      )}
    </div>
  )
}
