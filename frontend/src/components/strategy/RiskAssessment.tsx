'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, parseAiJson } from '@/lib/api'

export default function RiskAssessment() {
  const { selectedCaseId } = useCaseStore()
  const [data,    setData]    = useState<any>(null)
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [loaded,  setLoaded]  = useState(false)

  function loadSummary() {
    if (!selectedCaseId) return
    setLoading(true); setError('')
    aiApi.getSummary(selectedCaseId)
      .then(res => {
        const raw    = res.summary ?? res.result ?? ''
        const parsed = parseAiJson<any>(raw)
        if (parsed) { setData(parsed); setRawText('') }
        else { setData(null); setRawText(raw) }
        setLoaded(true)
      })
      .catch(err => setError(err.message || 'Failed to analyse case'))
      .finally(() => setLoading(false))
  }

  const strengthCount = data?.keyStrengths?.length ?? 0
  const weaknessCount = data?.keyWeaknesses?.length ?? 0
  const total         = strengthCount + weaknessCount
  const favorable     = total > 0 ? Math.round((strengthCount / total) * 100) : null
  const adverse       = total > 0 ? Math.round((weaknessCount / total) * 100) : null
  const partial       = favorable !== null && adverse !== null ? 100 - favorable - adverse : null

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ti ti-shield-check" style={{ fontSize: 20, color: '#2563eb' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Risk Assessment</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>AI evaluation of current case strength</p>
          </div>
        </div>
        <button onClick={loadSummary} disabled={loading || !selectedCaseId}
          style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: loading ? '#f1f5f9' : '#fff', cursor: loading || !selectedCaseId ? 'not-allowed' : 'pointer', color: '#64748b', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="ti ti-refresh" style={{ fontSize: 13 }} />{loading ? 'Analysing...' : loaded ? 'Refresh' : 'Analyse'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 30, color: '#7c3aed' }}>
          <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>AI is analysing your case...</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>15-20 seconds</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>
          {error} <button onClick={loadSummary} style={{ marginLeft: 8, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      {/* Not yet loaded */}
      {!loading && !loaded && !error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <i className="ti ti-shield" style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Not Analysed Yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Click Analyse to get AI risk assessment for this case.</div>
          <button onClick={loadSummary} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
            <i className="ti ti-sparkles" style={{ marginRight: 6 }} />Analyse Case
          </button>
        </div>
      )}

      {/* Raw text fallback */}
      {!loading && !error && rawText && !data && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: '#334155', marginBottom: 12, fontSize: 13 }}>Verdict Probability</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <ScoreCard color="#22c55e" value="—" title="Favorable" />
              <ScoreCard color="#f59e0b" value="—" title="Partial"   />
              <ScoreCard color="#ef4444" value="—" title="Adverse"   />
            </div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <i className="ti ti-sparkles" style={{ color: '#2563eb' }} />
              <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}>AI Analysis</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{rawText}</p>
          </div>
        </>
      )}

      {/* Structured JSON data */}
      {!loading && !error && data && (
        <>
          {/* Verdict probability */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, color: '#334155', marginBottom: 12, fontSize: 13 }}>Verdict Probability</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <ScoreCard color="#22c55e" value={favorable !== null ? `${favorable}%` : '—'} title="Favorable" />
              <ScoreCard color="#f59e0b" value={partial   !== null ? `${partial}%`   : '—'} title="Partial"   />
              <ScoreCard color="#ef4444" value={adverse   !== null ? `${adverse}%`   : '—'} title="Adverse"   />
            </div>
          </div>

          <Divider />

          {/* Case Killer */}
          {data?.keyWeaknesses?.[0] && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8, fontSize: 13 }}>⚠ Key Weakness</div>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.7, fontSize: 13 }}>
                {typeof data.keyWeaknesses[0] === 'string' ? data.keyWeaknesses[0] : data.keyWeaknesses[0]?.weakness ?? JSON.stringify(data.keyWeaknesses[0])}
              </p>
            </div>
          )}

          <Divider />

          {/* AI Recommendation */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <i className="ti ti-sparkles" style={{ color: '#2563eb' }} />
              <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}>AI Recommendation</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
              {data?.nextSteps?.[0] ?? 'No recommendation available.'}
            </p>
          </div>

          {/* Key Strengths */}
          {data?.keyStrengths?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 8, fontSize: 13 }}>Key Strengths</div>
              {data.keyStrengths.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#374151', marginBottom: 6, lineHeight: 1.5 }}>
                  <i className="ti ti-circle-check" style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
                  {typeof s === 'string' ? s : s?.strength ?? JSON.stringify(s)}
                </div>
              ))}
            </div>
          )}

          {/* Core Facts */}
          {data?.coreFacts && (
            <>
              <Divider />
              <div>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: 8, fontSize: 13 }}>Core Facts</div>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{data.coreFacts}</p>
              </div>
            </>
          )}

          {/* Next Steps */}
          {data?.nextSteps?.length > 1 && (
            <>
              <Divider />
              <div>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: 8, fontSize: 13 }}>Next Steps</div>
                {data.nextSteps.slice(1).map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                    <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>{i + 2}.</span>
                    {typeof s === 'string' ? s : s?.action ?? JSON.stringify(s)}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function ScoreCard({ value, title, color }: { value: string; title: string; color: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, textAlign: 'center', background: '#f8fafc' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: '#64748b' }}>{title}</div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />
}
