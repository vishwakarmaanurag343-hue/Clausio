'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'

interface Props { analysis: any; rawText: string; loading: boolean; caseId: string | null; caseType?: string }

function getCaseTypeConfig(ct: string) {
  const t = ct.toLowerCase()
  if (t.includes('gst'))        return { title: 'Tax Liability Range', rangeLabel: 'Tax + Penalty Range', highlight: 'Appeal Pre-deposit' }
  if (t.includes('income tax')) return { title: 'Tax Demand Range',    rangeLabel: 'Tax + Interest Range', highlight: 'Pre-deposit for Appeal' }
  if (t.includes('ni act'))     return { title: 'Compensation Range',  rangeLabel: 'Recovery Range',        highlight: 'Interim Compensation' }
  if (t.includes('criminal'))   return { title: 'Fine Range',          rangeLabel: 'Fine & Compensation',   highlight: 'Bail Amount' }
  if (t.includes('civil'))      return { title: 'Claim Range',         rangeLabel: 'Claim Amount Range',    highlight: 'Interim Relief' }
  if (t.includes('consumer'))   return { title: 'Compensation Range',  rangeLabel: 'Consumer Relief Range', highlight: 'Interim Compensation' }
  if (t.includes('labour'))     return { title: 'Dues Range',          rangeLabel: 'Labour Dues Range',     highlight: 'Interim Relief' }
  return { title: 'Maintenance Range', rangeLabel: 'Maintenance Range', highlight: 'Pendente Lite' }
}

export default function MaintenanceRange({ analysis, rawText, loading, caseId, caseType = 'Family' }: Props) {
  const [draft,      setDraft]      = useState('')
  const [drafting,   setDrafting]   = useState(false)
  const [draftError, setDraftError] = useState('')
  const [copied,     setCopied]     = useState(false)

  const config  = getCaseTypeConfig(caseType)
  const mc      = analysis?.maintenanceComputation
  const sc      = analysis?.settlementComputation
  const hasData = !!(analysis || rawText)
  const fmt     = (val: any) => val ? `₹${Number(val).toLocaleString('en-IN')}` : '—'

  // Determine draft type based on case type
  function getDraftType() {
    const t = caseType.toLowerCase()
    if (t.includes('gst'))        return 'Reply to Show Cause Notice and Appeal Memo'
    if (t.includes('income tax')) return 'Appeal before CIT(A) with stay application'
    if (t.includes('ni act'))     return 'Complaint under Section 138 NI Act with prayer for compensation'
    if (t.includes('criminal'))   return 'Bail Application with surety details'
    if (t.includes('civil'))      return 'Suit for recovery with interim injunction application'
    if (t.includes('consumer'))   return 'Consumer complaint with compensation prayer'
    if (t.includes('labour'))     return 'Labour court application for recovery of dues'
    return 'Interim Maintenance Application under Section 24 HMA'
  }

  async function generateDraft() {
    if (!caseId) { setDraftError('Select a case first.'); return }
    setDrafting(true); setDraftError('')
    try {
      const res = await aiApi.getDraft(caseId, {
        draftType: getDraftType(),
        instructions: mc
          ? `Recommended amount: ${fmt(mc.recommendedMaintenance ?? mc.recommended)}. Range: ${fmt(mc.minimumWeShouldAccept ?? mc.minimum)} to ${fmt(mc.maximumWeCanJustify ?? mc.maximum)}. Court argument: ${analysis?.courtArgument ?? ''}`
          : `Based on AI financial analysis for this ${caseType} case.`,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch (err: any) {
      setDraftError(err.message || 'Failed to generate draft')
    } finally { setDrafting(false) }
  }

  function copyDraft() { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{config.title}</h2>
        <p style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>AI-recommended range based on case facts and applicable law.</p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#7c3aed', fontSize: 13 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />Analysing...
        </div>
      )}

      {!loading && !hasData && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
          Run AI Analysis to see {config.rangeLabel.toLowerCase()}.
        </div>
      )}

      {!loading && hasData && (
        <>
          {mc && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{config.rangeLabel}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                <ACard title="Minimum"     value={fmt(mc.minimumWeShouldAccept ?? mc.minimum)} color="#2563eb" bg="#eff6ff" />
                <ACard title="Recommended" value={fmt(mc.recommendedMaintenance ?? mc.recommended)} color="#16a34a" bg="#f0fdf4" highlight />
                <ACard title="Maximum"     value={fmt(mc.maximumWeCanJustify ?? mc.maximum)}    color="#d97706" bg="#fff7ed" />
              </div>

              {(mc.pendenteLiteApplication ?? mc.interimAmount) && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d', marginBottom: 14, fontWeight: 500 }}>
                  <strong>{config.highlight}:</strong> {fmt(mc.pendenteLiteApplication ?? mc.interimAmount)}/month — file immediately
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                {[
                  { label: "Petitioner's Need",     value: fmt(mc.petitionerMonthlyNeeds)   },
                  { label: "Children's Need",        value: fmt(mc.childrenMonthlyNeeds)     },
                  { label: 'Total Monthly Need',     value: fmt(mc.totalNeed)                },
                  { label: "Respondent's Capacity",  value: fmt(mc.respondentPayingCapacity) },
                ].filter(r => r.value !== '—').map((row, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}

          {sc && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Settlement / One-Time Amount</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                <ACard title="Floor"       value={fmt(sc.negotiationFloor)}         color="#2563eb" bg="#eff6ff" />
                <ACard title="Recommended" value={fmt(sc.recommendedSettlementAsk)} color="#16a34a" bg="#f0fdf4" highlight />
                <ACard title="Ceiling"     value={fmt(sc.negotiationCeiling)}        color="#d97706" bg="#fff7ed" />
              </div>
            </div>
          )}

          {analysis?.keyJudgments?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Key Judgments</div>
              {analysis.keyJudgments.map((j: any, i: number) => (
                <div key={i} style={{ fontSize: 12, color: '#334155', padding: '5px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 6 }}>
                  <i className="ti ti-scale" style={{ color: '#2563eb', fontSize: 12, flexShrink: 0, marginTop: 1 }} />
                  {typeof j === 'string' ? j : `${j.citation ?? ''} — ${j.relevance ?? j.ratio ?? ''}`}
                </div>
              ))}
            </div>
          )}

          {analysis?.courtArgument && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <i className="ti ti-gavel" style={{ color: '#15803d' }} />
                <span style={{ fontWeight: 700, color: '#15803d', fontSize: 12 }}>Court Argument</span>
              </div>
              <div style={{ fontSize: 12, color: '#14532d', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{analysis.courtArgument}</div>
            </div>
          )}

          {draftError && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{draftError}</div>
          )}

          {draft && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>Generated Draft</div>
                <button onClick={copyDraft} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: copied ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />{copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 280, overflowY: 'auto' }}>{draft}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => window.print()} style={secBtn}>Export</button>
            <button onClick={generateDraft} disabled={drafting} style={{ ...priBtn, opacity: drafting ? 0.7 : 1, cursor: drafting ? 'not-allowed' : 'pointer' }}>
              {drafting ? 'Generating...' : 'Generate Draft'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ACard({ title, value, color, bg, highlight }: { title: string; value: string; color: string; bg: string; highlight?: boolean }) {
  return (
    <div style={{ background: bg, border: highlight ? `2px solid ${color}` : '1px solid #e2e8f0', borderRadius: 10, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

const secBtn: React.CSSProperties = { flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }
const priBtn: React.CSSProperties = { flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }
