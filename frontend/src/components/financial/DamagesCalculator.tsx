'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'

interface Props { caseId: string | null; caseType: string; label?: string }

export default function DamagesCalculator({ caseId, caseType, label = 'Damages Calculator' }: Props) {
  const ct = caseType.toLowerCase()

  const [actualLoss,   setActualLoss]   = useState(500000)
  const [mentalAgony,  setMentalAgony]  = useState(100000)
  const [legalCosts,   setLegalCosts]   = useState(50000)
  const [interestRate, setInterestRate] = useState(12)
  const [monthsDelay,  setMonthsDelay]  = useState(18)
  const [punitive,     setPunitive]     = useState(false)
  const [calculated,   setCalculated]   = useState(false)
  const [result,       setResult]       = useState({ interest: 0, punitiveDmg: 0, total: 0, minimum: 0, maximum: 0 })
  const [draft,        setDraft]        = useState('')
  const [drafting,     setDrafting]     = useState(false)
  const [copied,       setCopied]       = useState(false)

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  function calculate() {
    const interest    = Math.round(actualLoss * (interestRate / 100) * (monthsDelay / 12))
    const punitiveDmg = punitive ? Math.round(actualLoss * 0.5) : 0
    const base        = actualLoss + mentalAgony + legalCosts + interest + punitiveDmg
    setResult({ interest, punitiveDmg, total: base, minimum: Math.round(base * 0.6), maximum: Math.round(base * 1.5) })
    setCalculated(true)
  }

  function getDraftType() {
    if (ct.includes('consumer')) return 'Consumer Complaint with compensation prayer under Consumer Protection Act 2019'
    if (ct.includes('labour'))   return 'Labour Court application for recovery of dues and compensation'
    if (ct.includes('civil'))    return 'Suit for damages and compensation'
    if (ct.includes('rera'))     return 'Complaint before RERA for compensation and refund'
    return 'Application for damages and compensation'
  }

  async function generateDraft() {
    if (!caseId) return
    setDrafting(true)
    try {
      const res = await aiApi.getDraft(caseId, {
        draftType: getDraftType(),
        instructions: `Actual loss: ${fmt(actualLoss)}. Mental agony: ${fmt(mentalAgony)}. Legal costs: ${fmt(legalCosts)}. Interest @${interestRate}% for ${monthsDelay} months: ${fmt(result.interest)}. ${punitive ? `Punitive damages: ${fmt(result.punitiveDmg)}.` : ''} Total claimed: ${fmt(result.total)}. Range: ${fmt(result.minimum)} to ${fmt(result.maximum)}.`,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch { } finally { setDrafting(false) }
  }

  function copyDraft() { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const getStrategyText = () => {
    if (ct.includes('consumer')) return `Under Consumer Protection Act 2019, the consumer is entitled to actual loss ${fmt(actualLoss)} + compensation for mental agony ${fmt(mentalAgony)} + cost of litigation ${fmt(legalCosts)}. The District Commission can award up to ${fmt(result.maximum)}.`
    if (ct.includes('labour')) return `Under the relevant labour legislation, claim back wages, gratuity and compensation from the date of wrongful termination. Interest at 12% per annum adds ${fmt(result.interest)} to the total claim.`
    if (ct.includes('rera'))   return `RERA Authority can award interest at SBI MCLR + 2% on the invested amount, refund + compensation. Total relief sought: ${fmt(result.total)}.`
    return `Total damages claimed: ${fmt(result.total)} (${fmt(result.minimum)} to ${fmt(result.maximum)} range). Compensation is based on actual loss, mental agony, and interest on delayed payment.`
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{label}</h2>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>Calculate total compensation and damages for {caseType} matter.</p>

        <Field label="Actual / Quantified Loss (₹)">
          <input type="number" value={actualLoss} onChange={e => { setActualLoss(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>
        <Field label="Mental Agony & Harassment (₹)">
          <input type="number" value={mentalAgony} onChange={e => { setMentalAgony(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>
        <Field label="Litigation Costs (₹)">
          <input type="number" value={legalCosts} onChange={e => { setLegalCosts(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>
        <Field label="Interest Rate (% per annum)">
          <select value={interestRate} onChange={e => { setInterestRate(Number(e.target.value)); setCalculated(false) }} style={inputSt}>
            <option value={9}>9% — Decree rate</option>
            <option value={12}>12% — Standard commercial</option>
            <option value={18}>18% — Agreed rate</option>
          </select>
        </Field>
        <Field label="Delay Period (Months)">
          <input type="number" value={monthsDelay} onChange={e => { setMonthsDelay(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={punitive} onChange={() => { setPunitive(!punitive); setCalculated(false) }} />
            Claim Punitive / Exemplary Damages
          </label>
        </div>

        <button onClick={calculate} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Calculate Damages
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Damages Estimate</h2>
          {!calculated ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
              <i className="ti ti-calculator" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }} />Fill the form and click Calculate
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                <ACard title="Minimum"     value={fmt(result.minimum)} color="#2563eb" bg="#eff6ff" />
                <ACard title="Claimed"     value={fmt(result.total)}   color="#16a34a" bg="#f0fdf4" highlight />
                <ACard title="Maximum"     value={fmt(result.maximum)} color="#d97706" bg="#fff7ed" />
              </div>

              <div style={{ marginBottom: 16 }}>
                {[
                  { label: 'Actual Loss',          value: fmt(actualLoss)          },
                  { label: 'Mental Agony',          value: fmt(mentalAgony)         },
                  { label: 'Legal Costs',           value: fmt(legalCosts)          },
                  { label: `Interest @${interestRate}% for ${monthsDelay} months`, value: fmt(result.interest) },
                  punitive ? { label: 'Punitive Damages', value: fmt(result.punitiveDmg) } : null,
                  { label: 'Total',                 value: fmt(result.total)        },
                ].filter(Boolean).map((r: any, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <strong>{r.value}</strong>
                  </div>
                ))}
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
                {getStrategyText()}
              </div>

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
                  {drafting ? 'Generating...' : 'Generate Application Draft'}
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
const inputSt: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
const secBtn:  React.CSSProperties = { flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }
const priBtn:  React.CSSProperties = { flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }
