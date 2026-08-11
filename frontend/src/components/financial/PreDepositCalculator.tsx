'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'

interface Props { caseType: string; caseId: string | null }

export default function PreDepositCalculator({ caseType, caseId }: Props) {
  const isGST = caseType.toLowerCase().includes('gst')

  const [taxAmount,    setTaxAmount]    = useState(500000)
  const [interestAmt,  setInterestAmt]  = useState(90000)
  const [penaltyAmt,   setPenaltyAmt]   = useState(500000)
  const [level,        setLevel]        = useState('first')
  const [calculated,   setCalculated]   = useState(false)
  const [result,       setResult]       = useState({ preDeposit: 0, total: 0, balance: 0 })
  const [draft,        setDraft]        = useState('')
  const [drafting,     setDrafting]     = useState(false)
  const [copied,       setCopied]       = useState(false)

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  function calculate() {
    const total      = taxAmount + interestAmt + penaltyAmt
    const pct        = level === 'first' ? 0.10 : 0.20
    const preDeposit = Math.round(taxAmount * pct) // pre-deposit is on tax only, not penalty/interest
    const balance    = total - preDeposit
    setResult({ preDeposit, total, balance })
    setCalculated(true)
  }

  async function generateDraft() {
    if (!caseId) return
    setDrafting(true)
    try {
      const res = await aiApi.getDraft(caseId, {
        draftType: isGST ? 'Stay Application before Appellate Authority under CGST Act' : 'Stay Petition before ITAT',
        instructions: `Tax: ${fmt(taxAmount)}, Interest: ${fmt(interestAmt)}, Penalty: ${fmt(penaltyAmt)}. Total: ${fmt(result.total)}. Pre-deposit: ${fmt(result.preDeposit)} (${level === 'first' ? '10%' : '20%'} of tax). Balance stayed: ${fmt(result.balance)}.`,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch { } finally { setDrafting(false) }
  }

  function copyDraft() { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Pre-deposit Calculator</h2>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>
          {isGST ? 'Pre-deposit required under Section 107/112 CGST Act for appeal.' : 'Pre-deposit for appeal to ITAT / High Court.'}
        </p>

        {[
          { label: 'Tax Amount (₹)', val: taxAmount, set: setTaxAmount },
          { label: 'Interest Amount (₹)', val: interestAmt, set: setInterestAmt },
          { label: 'Penalty Amount (₹)', val: penaltyAmt, set: setPenaltyAmt },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={labelSt}>{f.label}</label>
            <input type="number" value={f.val} onChange={e => { f.set(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={labelSt}>Appeal Level</label>
          <select value={level} onChange={e => { setLevel(e.target.value); setCalculated(false) }} style={inputSt}>
            <option value="first">{isGST ? 'First Appeal — Appellate Authority (10%)' : 'CIT(A) — First Appeal (20%)'}</option>
            <option value="second">{isGST ? 'Second Appeal — Appellate Tribunal (20%)' : 'ITAT — Second Appeal (20%)'}</option>
          </select>
        </div>

        <button onClick={calculate} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Calculate Pre-deposit
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Pre-deposit Calculation</h2>
          {!calculated ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
              <i className="ti ti-calculator" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }} />Fill the form and click Calculate
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                <ACard title="Total Demand" value={fmt(result.total)}      color="#dc2626" bg="#fef2f2" />
                <ACard title="Pre-deposit"  value={fmt(result.preDeposit)} color="#16a34a" bg="#f0fdf4" highlight />
                <ACard title="Balance Stayed" value={fmt(result.balance)}  color="#2563eb" bg="#eff6ff" />
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, color: '#14532d', lineHeight: 1.8 }}>
                <strong>Action:</strong> Deposit {fmt(result.preDeposit)} ({level === 'first' ? '10%' : '20%'} of tax demand of {fmt(taxAmount)}) with the {isGST ? 'department' : 'Income Tax department'} before filing the appeal. This stays recovery of the balance {fmt(result.balance)}.
              </div>

              {draft && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>Generated Stay Application</div>
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
                  {drafting ? 'Generating...' : 'Draft Stay Application'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
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
