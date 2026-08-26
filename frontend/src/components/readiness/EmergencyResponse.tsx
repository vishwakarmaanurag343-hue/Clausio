'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, parseAiJson } from '@/lib/api'

const SUGGESTIONS = [
  'Urgent Custody',
  'Stay Order',
  'Interim Maintenance',
  'Passport Issue',
  'Domestic Violence',
  'Evidence Objection',
]

interface EmergencyAction { action?: string; why?: string; timeline?: string }
interface EmergencyPlan {
  severity?:          string
  headline?:          string
  immediateActions?:  EmergencyAction[]
  draftResponse?:     string
  legalGrounds?:      string[]
  documentsNeeded?:   string[]
  risksIfDelayed?:    string[]
}

function severityPill(s?: string) {
  const v = (s ?? '').toLowerCase()
  if (v === 'critical') return { bg: '#fef2f2', fg: '#b91c1c', bd: '#fecaca' }
  if (v === 'high')     return { bg: '#fff7ed', fg: '#c2410c', bd: '#fed7aa' }
  return                     { bg: '#fefce8', fg: '#a16207', bd: '#fde047' }   // Medium
}

/* PrepBriefCard idiom: white card, #e2e8f0 border, radius 10, ti-icon + uppercase accent title */
function Section({ icon, title, accent, children }: { icon: string; title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color: accent }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function EmergencyResponse() {
  const { selectedCaseId } = useCaseStore()
  const [query,      setQuery]      = useState('')
  const [response,   setResponse]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState('')
  const [copied,     setCopied]     = useState(false)

  async function handleGenerate() {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    if (!query.trim()) { setError('Describe the emergency situation first.'); return }
    setGenerating(true)
    setError('')
    setResponse('')
    setCopied(false)
    try {
      const res = await aiApi.getEmergency(selectedCaseId, { query })
      setResponse(res.response ?? res.result ?? '')
    } catch (err: any) {
      setError(err.message || 'Failed to generate emergency response')
    } finally {
      setGenerating(false)
    }
  }

  async function copyDraft(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — leave the text selectable */
    }
  }

  // Strict-JSON triage plan when the model honours the contract; null → raw-text fallback
  const plan: EmergencyPlan | null = response ? parseAiJson<EmergencyPlan>(response) : null

  return (
    <div
      className="glass-card"
      style={{
        border: '1px solid rgba(239, 68, 68, 0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.05)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.1)',
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-alert-triangle" />
        </div>

        <div>
          <div style={{ fontWeight: 600, color: '#991b1b', fontSize: 14 }}>Emergency Response</div>
          <div style={{ color: '#7f1d1d', fontSize: 12, marginTop: 2 }}>Generate an immediate legal response for urgent situations.</div>
        </div>
      </div>

      {/* Body */}

      <div style={{ padding: 16 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the emergency situation..."
          rows={3}
          style={{
            width: '100%',
            resize: 'vertical',
            padding: 12,
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.6)',
            outline: 'none',
            fontSize: 13,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            color: '#0f172a'
          }}
        />

        {/* Quick Suggestions */}

        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'rgba(255,255,255,0.6)',
                  color: '#334155',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, color: '#dc2626', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* ── Structured flashcards (strict-JSON plan) ── */}

        {response && plan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>

            {/* Headline + severity pill */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-bolt" /> EMERGENCY TRIAGE
                </span>
                {(() => {
                  const p = severityPill(plan.severity)
                  return (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: p.bg, border: `1px solid ${p.bd}`, color: p.fg, whiteSpace: 'nowrap' }}>
                      {(plan.severity ?? 'Medium').toUpperCase()}
                    </span>
                  )
                })()}
              </div>
              {plan.headline && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>{plan.headline}</div>
              )}
            </div>

            {/* Immediate actions */}
            {!!plan.immediateActions?.length && (
              <Section icon="ti-list-numbers" title="Immediate Actions" accent="#dc2626">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.immediateActions.map((a, i) => (
                    <div key={i} style={{ borderLeft: '3px solid #ef4444', paddingLeft: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', lineHeight: 1.45 }}>{i + 1}. {a.action}</div>
                        {a.timeline && (
                          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', whiteSpace: 'nowrap' }}>
                            ⏱ {a.timeline}
                          </span>
                        )}
                      </div>
                      {a.why && (
                        <div style={{ marginTop: 3, fontSize: 11.5, color: '#475569', lineHeight: 1.55 }}>{a.why}</div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Ready-to-use draft */}
            {plan.draftResponse && (
              <div style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.06), rgba(59,130,246,0.04))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-file-text" /> READY-TO-USE DRAFT
                  </span>
                  <button
                    onClick={() => copyDraft(plan.draftResponse!)}
                    style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 8, border: '1px solid #bfdbfe', background: '#ffffff', color: '#1d4ed8', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 12, fontStyle: 'italic', lineHeight: 1.7, color: '#1e3a8a', whiteSpace: 'pre-wrap' }}>“{plan.draftResponse}”</p>
              </div>
            )}

            {/* Legal grounds */}
            {!!plan.legalGrounds?.length && (
              <Section icon="ti-scale" title="Legal Grounds" accent="#15803d">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {plan.legalGrounds.map((g, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 600 }}>
                      ⚖ {g}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Documents needed */}
            {!!plan.documentsNeeded?.length && (
              <Section icon="ti-briefcase" title="Documents Needed" accent="#b45309">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {plan.documentsNeeded.map((d, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontWeight: 600 }}>
                      📄 {d}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Risks if delayed */}
            {!!plan.risksIfDelayed?.length && (
              <Section icon="ti-alert-triangle" title="If You Delay" accent="#dc2626">
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {plan.risksIfDelayed.map((r, i) => (
                    <li key={i} style={{ fontSize: 12, lineHeight: 1.55, color: '#991b1b' }}>{r}</li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}

        {/* ── Fallback: raw output when the model ignored the JSON contract ── */}

        {response && !plan && (
          <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, color: '#14532d', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {response}
          </div>
        )}

        {!response && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: 10,
              color: '#1e40af',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <strong>AI Notice:</strong> Clausio will prepare an emergency
            response, identify relevant provisions, suggest supporting
            judgments and generate a ready-to-file draft within seconds.
          </div>
        )}

        {/* Buttons */}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button
            className="glass-button"
            onClick={() => { setQuery(''); setResponse(''); setError('') }}
            style={{
              padding: '0 16px',
              height: 36,
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
              color: '#0f172a'
            }}
          >
            Clear
          </button>

          <button
            className="glass-button"
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: '0 16px',
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: generating ? '#f87171' : '#dc2626',
              color: '#fff',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            <i className="ti ti-bolt" style={{ marginRight: 6 }} />
            {generating ? 'Generating...' : 'Generate Response'}
          </button>
        </div>
      </div>
    </div>
  )
}
