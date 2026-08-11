'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, parseAiJson } from '@/lib/api'

export default function RecommendationPanel() {
  const { selectedCaseId } = useCaseStore()
  const [recs,    setRecs]    = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [loaded,  setLoaded]  = useState(false)
  const [copied,  setCopied]  = useState(false)

  function loadRecs() {
    if (!selectedCaseId) return
    setLoading(true); setError('')
    aiApi.getSummary(selectedCaseId)
      .then(res => {
        const parsed = parseAiJson<any>(res.summary ?? res.result ?? '')
        const steps  = parsed?.nextSteps ?? []
        setRecs(steps.map((s: any, i: number) => {
          const text = typeof s === 'string' ? s : s.action ?? s.step ?? JSON.stringify(s)
          return {
            title:       text.split(' ').slice(0, 5).join(' ') + (text.split(' ').length > 5 ? '...' : ''),
            description: text,
            priority:    i === 0 ? 'Critical' : i <= 2 ? 'High' : 'Medium',
            impact:      i === 0 ? 'Very High' : i <= 2 ? 'High' : 'Medium',
            timeframe:   i === 0 ? 'Today' : i === 1 ? '2 Days' : i === 2 ? '1 Week' : '2 Weeks',
          }
        }))
        setLoaded(true)
      })
      .catch(err => setError(err.message || 'Failed to load recommendations'))
      .finally(() => setLoading(false))
  }

  function copyAll() {
    const text = recs.map((r, i) => `${i + 1}. [${r.priority}] ${r.description}\n   Impact: ${r.impact} · Time: ${r.timeframe}`).join('\n\n')
    navigator.clipboard.writeText(`AI Recommendations\n\n${text}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function getColor(p: string) {
    if (p === 'Critical') return { clr: '#dc2626', bg: '#fef2f2' }
    if (p === 'High')     return { clr: '#d97706', bg: '#fff7ed' }
    return { clr: '#16a34a', bg: '#f0fdf4' }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>AI Recommendations</h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Prioritised next actions for this case.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {recs.length > 0 && (
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
        </div>
      )}

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {!loading && !loaded && !error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <i className="ti ti-star" style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Not Generated Yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Click Generate to get AI recommendations for this case.</div>
          <button onClick={loadRecs} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
            <i className="ti ti-sparkles" style={{ marginRight: 6 }} />Generate Recommendations
          </button>
        </div>
      )}

      {!loading && recs.length === 0 && loaded && (
        <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>No recommendations found for this case.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {recs.map((item, i) => {
          const p = getColor(item.priority)
          return (
            <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: p.clr }}>{i + 1}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, flex: 1 }}>{item.title}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: p.clr, background: p.bg, flexShrink: 0, marginLeft: 8 }}>{item.priority}</span>
              </div>
              <div style={{ color: '#475569', lineHeight: 1.7, fontSize: 13, marginBottom: 12, paddingLeft: 38 }}>{item.description}</div>
              <div style={{ display: 'flex', gap: 10, paddingLeft: 38 }}>
                <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Impact</div>
                  <div style={{ marginTop: 3, fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{item.impact}</div>
                </div>
                <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Do By</div>
                  <div style={{ marginTop: 3, fontWeight: 700, color: '#2563eb', fontSize: 13 }}>{item.timeframe}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
