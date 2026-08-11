'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'

interface Props { caseId: string | null }

export default function SettlementCalculator({ caseId }: Props) {
  const [monthly,     setMonthly]     = useState(50000)
  const [years,       setYears]       = useState(10)
  const [inflation,   setInflation]   = useState(5)
  const [legalCost,   setLegalCost]   = useState(400000)
  const [litigYears,  setLitigYears]  = useState(3)
  const [calculated,  setCalculated]  = useState(false)

  const [result, setResult] = useState({ lifetime: 0, settlement: 0, savings: 0, annualEquiv: 0 })

  const [draft,      setDraft]      = useState('')
  const [drafting,   setDrafting]   = useState(false)
  const [draftError, setDraftError] = useState('')
  const [copied,     setCopied]     = useState(false)

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  function calculate() {
    const totalMaintenance  = monthly * 12 * years
    const inflationImpact   = totalMaintenance * (inflation / 100)
    const litigationCost    = legalCost + (monthly * 12 * litigYears * 0.3) // partial maintenance during litigation
    const lifetime          = totalMaintenance + inflationImpact + litigationCost
    const settlement        = lifetime * 0.78
    const savings           = lifetime - settlement
    const annualEquiv       = settlement / years
    setResult({ lifetime, settlement, savings, annualEquiv })
    setCalculated(true)
  }

  async function generateDraft() {
    if (!caseId) { setDraftError('Select a case from the dashboard first.'); return }
    setDrafting(true); setDraftError('')
    try {
      const res = await aiApi.getDraft(caseId, {
        draftType: 'Consent Terms / Settlement Agreement',
        instructions: `One-time settlement amount: ${fmt(result.settlement)} in full and final settlement of all maintenance claims. This is in lieu of ${fmt(monthly)}/month for ${years} years (estimated lifetime cost: ${fmt(result.lifetime)}, estimated savings to respondent: ${fmt(result.savings)}). Annual equivalent: ${fmt(result.annualEquiv)}.`,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch (err: any) {
      setDraftError(err.message || 'Failed to generate draft')
    } finally { setDrafting(false) }
  }

  function copyDraft() { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }}>

      {/* Left — Input */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Settlement Calculator</h2>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 13 }}>Compare long-term maintenance cost vs. one-time settlement amount.</p>

        {[
          { label: 'Monthly Maintenance (₹)',     val: monthly,    set: setMonthly    },
          { label: 'Expected Duration (Years)',    val: years,      set: setYears      },
          { label: 'Expected Inflation (%)',       val: inflation,  set: setInflation  },
          { label: 'Estimated Legal Expenses (₹)', val: legalCost, set: setLegalCost  },
          { label: 'Expected Litigation (Years)',  val: litigYears, set: setLitigYears },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <label style={labelSt}>{f.label}</label>
            <input type="number" value={f.val} onChange={e => { f.set(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
          </div>
        ))}

        <button onClick={calculate} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
          Calculate Settlement
        </button>
      </div>

      {/* Right — Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Settlement Recommendation</h2>
          <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>
            {calculated ? 'One-time settlement vs lifetime maintenance cost analysis.' : 'Enter details and click Calculate.'}
          </p>

          {!calculated ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
              <i className="ti ti-calculator" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }} />
              Fill the form and click Calculate Settlement
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <ACard title="Lifetime Cost"        value={fmt(result.lifetime)}    color="#dc2626" bg="#fef2f2" />
              <ACard title="Suggested Settlement" value={fmt(result.settlement)}  color="#16a34a" bg="#f0fdf4" highlight />
              <ACard title="Respondent Saves"     value={fmt(result.savings)}     color="#2563eb" bg="#eff6ff" />
            </div>
          )}
        </div>

        {calculated && (
          <>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>Cost Breakdown</div>
              {[
                { label: 'Monthly Maintenance',    value: fmt(monthly)                                },
                { label: 'Duration',               value: `${years} years`                            },
                { label: 'Total Maintenance',      value: fmt(monthly * 12 * years)                   },
                { label: 'Inflation Impact',       value: fmt(monthly * 12 * years * (inflation/100)) },
                { label: 'Legal Expenses',         value: fmt(legalCost)                              },
                { label: 'Litigation Duration',    value: `${litigYears} years`                       },
                { label: 'Annual Equivalent',      value: `${fmt(result.annualEquiv)}/year`            },
              ].map((r, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>{r.label}</span>
                  <strong>{r.value}</strong>
                </div>
              ))}
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <i className="ti ti-sparkles" style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}>Settlement Strategy</span>
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
                The estimated lifetime maintenance liability is <strong>{fmt(result.lifetime)}</strong> over {years} years at {fmt(monthly)}/month (including {inflation}% inflation and {fmt(legalCost)} legal costs).
                <br /><br />
                A one-time settlement of <strong>{fmt(result.settlement)}</strong> saves the respondent approximately <strong>{fmt(result.savings)}</strong> and provides the petitioner immediate financial security without the uncertainty of prolonged litigation.
                <br /><br />
                <strong>Negotiation strategy:</strong> Start at {fmt(result.lifetime)} (full lifetime cost) and settle at {fmt(result.settlement)} — position it as a {Math.round((result.savings/result.lifetime)*100)}% discount for immediate payment.
              </div>
            </div>

            {draftError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{draftError}</div>
            )}

            {draft && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>Generated Consent Terms</div>
                  <button onClick={copyDraft} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: copied ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit' }}>
                    <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ marginRight: 4 }} />{copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>{draft}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => window.print()} style={secBtn}>Export Report</button>
              <button onClick={generateDraft} disabled={drafting} style={{ ...priBtn, opacity: drafting ? 0.7 : 1, cursor: drafting ? 'not-allowed' : 'pointer' }}>
                {drafting ? 'Generating...' : 'Generate Consent Terms'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ACard({ title, value, color, bg, highlight }: { title: string; value: string; color: string; bg: string; highlight?: boolean }) {
  return (
    <div style={{ background: bg, border: highlight ? `2px solid ${color}` : '1px solid #e2e8f0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

const labelSt: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inputSt:  React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
const secBtn:   React.CSSProperties = { flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }
const priBtn:   React.CSSProperties = { flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }
