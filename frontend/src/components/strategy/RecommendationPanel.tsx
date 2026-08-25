'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, parseAiJson } from '@/lib/api'

interface CaseRecommendation {
  recommendation?: string
  addressesRisk?:  string | null
  reasoning?:      string
}

/** Extract the recommendations array from the model response. Returns null on ANY failure — callers must never render raw text. */
function extractRecommendations(raw: unknown): CaseRecommendation[] | null {
  let parsed: any = raw
  if (typeof raw === 'string') {
    if (!raw.trim()) return null
    parsed = parseAiJson<any>(raw.trim())
  }
  if (Array.isArray(parsed))                          return parsed.filter((r: any) => r && typeof r === 'object')
  if (parsed && Array.isArray(parsed.recommendations)) return parsed.recommendations.filter((r: any) => r && typeof r === 'object')
  return null
}

export default function RecommendationPanel() {
  const { selectedCaseId } = useCaseStore()
  const [recs,    setRecs]    = useState<CaseRecommendation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [loaded,  setLoaded]  = useState(false)
  const [copied,  setCopied]  = useState(false)

  function loadRecs() {
    if (!selectedCaseId) return
    setLoading(true); setError('')
    aiApi.getRecommendations(selectedCaseId)
      .then(res => {
        const parsed = extractRecommendations(res.recommendations ?? res.result ?? res)
        if (parsed) { setRecs(parsed); setLoaded(true) }
        else setError('The AI response could not be read as recommendation cards. Please retry.')
      })
      .catch(err => setError(err.message || 'Failed to generate recommendations'))
      .finally(() => setLoading(false))
  }

  function copyAll() {
    const text = recs?.map((r, i) =>
      `${i + 1}. ${r.recommendation ?? 'Untitled move'}${r.addressesRisk ? `\n   Counters risk: ${r.addressesRisk}` : '\n   Standalone strategic move'}\n   ${r.reasoning ?? ''}`
    ).join('\n\n') ?? ''
    navigator.clipboard.writeText(`AI Recommendations\n\n${text}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(15,23,42,.04)', overflowY: 'auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>AI Recommendations</h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Courtroom-grade moves for this case — risk-countering actions first</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {recs && recs.length > 0 && (
            <button onClick={copyAll} style={{ height: 36, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: copied ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: 13 }} />{copied ? 'Copied!' : 'Copy All'}
            </button>
          )}
          <button onClick={loadRecs} disabled={loading}
            style={{ height: 36, padding: '0 14px', border: 'none', borderRadius: 8, background: loading ? '#93c5fd' : '#2563eb', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-sparkles" style={{ fontSize: 13 }} />{loading ? 'Generating...' : loaded ? 'Refresh' : 'Generate'}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#7c3aed' }}>
          <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>AI is generating recommendations...</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>This reads the full case file — usually under a minute</div>
        </div>
      )}

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {!loading && !loaded && !error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <i className="ti ti-star" style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Not Generated Yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Click Generate to get AI recommendations grounded in this case file.</div>
          <button onClick={loadRecs} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
            <i className="ti ti-sparkles" style={{ marginRight: 6 }} />Generate Recommendations
          </button>
        </div>
      )}

      {/* Recommendation flashcards — PrepBriefCard visual grammar */}
      {!loading && !error && recs && recs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>No strategic moves are supported by this case file right now.</div>
      )}

      {!loading && !error && recs && recs.map((r, i) => {
        const counters = !!r.addressesRisk
        return (
          <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 10 }}>

            {/* Card header: number badge + icon + title + counters pill */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#2563eb', marginTop: 1 }}>{i + 1}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#0f172a', lineHeight: 1.6 }}>{r.recommendation || 'Untitled move'}</span>
              </div>
              <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10,
                background: counters ? '#fffbeb' : '#f1f5f9',
                border: `1px solid ${counters ? '#fde68a' : '#e2e8f0'}`,
                color: counters ? '#b45309' : '#64748b', maxWidth: '55%' }}>
                {counters ? `⚡ COUNTERS: ${r.addressesRisk}` : 'STRATEGIC MOVE'}
              </span>
            </div>

            {/* Why this is the right move — full reasoning paragraph */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <i className="ti ti-scale" style={{ fontSize: 11, color: '#2563eb' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', letterSpacing: 1 }}>WHY THIS IS THE RIGHT MOVE</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: '#1e3a8a', whiteSpace: 'pre-line' }}>{r.reasoning || '—'}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
