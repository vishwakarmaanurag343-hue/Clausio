'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'

interface Props { caseType: string; caseId: string | null }

export default function TaxDemandCalculator({ caseType, caseId }: Props) {
  const isGST   = caseType.toLowerCase().includes('gst')
  const isIT    = caseType.toLowerCase().includes('income tax')

  const [taxDemand,      setTaxDemand]      = useState(500000)
  const [interestRate,   setInterestRate]   = useState(isGST ? 18 : 12)
  const [penaltyPct,     setPenaltyPct]     = useState(isGST ? 100 : 50)
  const [months,         setMonths]         = useState(12)
  const [isFraud,        setIsFraud]        = useState(false)
  const [calculated,     setCalculated]     = useState(false)

  const [result, setResult] = useState({ interest: 0, penalty: 0, total: 0, preDeposit10: 0, preDeposit20: 0 })
  const [draft,  setDraft]  = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState('')
  const [copied, setCopied] = useState(false)

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  function calculate() {
    const interest   = Math.round(taxDemand * (interestRate / 100) * (months / 12))
    const penalty    = Math.round(taxDemand * (isFraud ? 2 : penaltyPct / 100))
    const total      = taxDemand + interest + penalty
    const preDeposit10 = Math.round(taxDemand * 0.10)
    const preDeposit20 = Math.round(taxDemand * 0.20)
    setResult({ interest, penalty, total, preDeposit10, preDeposit20 })
    setCalculated(true)
  }

  async function generateDraft() {
    if (!caseId) { setDraftError('Select a case first.'); return }
    setDrafting(true); setDraftError('')
    try {
      const res = await aiApi.getDraft(caseId, {
        draftType: isGST ? 'Reply to Show Cause Notice under CGST Act' : 'Appeal before CIT(A) under Income Tax Act',
        instructions: `Tax demand: ${fmt(taxDemand)}. Interest @${interestRate}% for ${months} months: ${fmt(result.interest)}. Penalty @${penaltyPct}%${isFraud ? ' (fraud)' : ''}: ${fmt(result.penalty)}. Total liability: ${fmt(result.total)}. Pre-deposit for appeal: ${fmt(result.preDeposit10)} (10%) or ${fmt(result.preDeposit20)} (20%).`,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch (err: any) {
      setDraftError(err.message || 'Failed to generate draft')
    } finally { setDrafting(false) }
  }

  function copyDraft() { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      {/* Input */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Tax Demand Calculator</h2>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>
          {isGST ? 'CGST/SGST demand with interest and penalty under GST Act.' : 'Income tax demand with Section 234 interest and penalty.'}
        </p>

        <Field label="Tax Demand Amount (₹)">
          <input type="number" value={taxDemand} onChange={e => { setTaxDemand(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>
        <Field label={`Interest Rate (% per annum) ${isGST ? '— 18% or 24% for fraud' : '— 234A/B/C'}`}>
          <select value={interestRate} onChange={e => { setInterestRate(Number(e.target.value)); setCalculated(false) }} style={inputSt}>
            {isGST ? [
              <option key="18" value={18}>18% — Normal cases</option>,
              <option key="24" value={24}>24% — Fraud / wilful evasion</option>,
            ] : [
              <option key="12" value={12}>12% — Section 234A/B</option>,
              <option key="15" value={15}>15% — Section 234C</option>,
            ]}
          </select>
        </Field>
        <Field label="Period of Default (Months)">
          <input type="number" value={months} onChange={e => { setMonths(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>
        <Field label={isGST ? 'Penalty (% of tax)' : 'Penalty under Section 271/270A (%)'}>
          <select value={penaltyPct} onChange={e => { setPenaltyPct(Number(e.target.value)); setCalculated(false) }} style={inputSt}>
            {isGST ? [
              <option key="10" value={10}>10% — Genuine error</option>,
              <option key="100" value={100}>100% — Tax short paid</option>,
              <option key="200" value={200}>200% — Fraud / suppression</option>,
            ] : [
              <option key="50" value={50}>50% — Under-reporting</option>,
              <option key="200" value={200}>200% — Misreporting</option>,
            ]}
          </select>
        </Field>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input type="checkbox" checked={isFraud} onChange={() => { setIsFraud(!isFraud); setCalculated(false) }} />
            {isGST ? 'Fraud / Wilful suppression case' : 'Misreporting / Underreporting case'}
          </label>
        </div>

        <button onClick={calculate} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Calculate Total Liability
        </button>
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
            {calculated ? 'Tax Liability Breakdown' : 'Enter details and calculate'}
          </h2>
          {!calculated ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
              <i className="ti ti-calculator" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }} />Fill the form and click Calculate
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
                <ACard title="Tax Demand"  value={fmt(taxDemand)}       color="#dc2626" bg="#fef2f2" />
                <ACard title="Interest"   value={fmt(result.interest)}  color="#d97706" bg="#fff7ed" />
                <ACard title="Penalty"    value={fmt(result.penalty)}   color="#7c3aed" bg="#f5f3ff" />
                <ACard title="Total"      value={fmt(result.total)}     color="#0f172a" bg="#f8fafc" highlight />
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 13, marginBottom: 8 }}>Pre-deposit for Appeal</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ fontSize: 13 }}><strong>{fmt(result.preDeposit10)}</strong> — 10% (First Appeal)</div>
                  <div style={{ fontSize: 13 }}><strong>{fmt(result.preDeposit20)}</strong> — 20% (Second Appeal)</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                {[
                  { label: 'Tax Demand',          value: fmt(taxDemand)          },
                  { label: `Interest @${interestRate}% for ${months} months`, value: fmt(result.interest) },
                  { label: `Penalty @${penaltyPct}%${isFraud ? ' (fraud)' : ''}`, value: fmt(result.penalty) },
                  { label: 'Total Liability',      value: fmt(result.total)       },
                ].map((r, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <strong>{r.value}</strong>
                  </div>
                ))}
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
                <strong style={{ color: '#1d4ed8' }}>{isGST ? 'GST Strategy:' : 'Income Tax Strategy:'}</strong><br />
                {isGST
                  ? `Total demand of ${fmt(result.total)} can be challenged by filing a detailed reply to the SCN within 30 days. File an appeal with ${fmt(result.preDeposit10)} pre-deposit (10%) before the Appellate Authority. If penalty is for "willful suppression" — challenge the allegation specifically.`
                  : `Total demand of ${fmt(result.total)} should be challenged before CIT(A) within 30 days. File a stay application with ${fmt(result.preDeposit20)} pre-deposit (20% of disputed demand). File Rectification under Section 154 if there are arithmetic errors.`}
              </div>

              {draftError && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{draftError}</div>}

              {draft && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>Generated Draft</div>
                    <button onClick={copyDraft} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: copied ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />{copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>{draft}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => window.print()} style={secBtn}>Export</button>
                <button onClick={generateDraft} disabled={drafting} style={{ ...priBtn, opacity: drafting ? 0.7 : 1, cursor: drafting ? 'not-allowed' : 'pointer' }}>
                  {drafting ? 'Generating...' : isGST ? 'Draft SCN Reply' : 'Draft CIT(A) Appeal'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={labelSt}>{label}</label>{children}</div>
}
function ACard({ title, value, color, bg, highlight }: { title: string; value: string; color: string; bg: string; highlight?: boolean }) {
  return (
    <div style={{ background: bg, border: highlight ? `2px solid ${color}` : '1px solid #e2e8f0', borderRadius: 10, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

const labelSt: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inputSt: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc', marginBottom: 0 }
const secBtn:  React.CSSProperties = { flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }
const priBtn:  React.CSSProperties = { flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }
