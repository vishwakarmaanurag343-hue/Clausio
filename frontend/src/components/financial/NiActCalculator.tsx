'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'

interface Props { caseId: string | null }

export default function NiActCalculator({ caseId }: Props) {
  const [chequeAmount,  setChequeAmount]  = useState(500000)
  const [returnDate,    setReturnDate]    = useState('')
  const [noticeSent,    setNoticeSent]    = useState(true)
  const [noticeDate,    setNoticeDate]    = useState('')
  const [repaymentMade, setRepaymentMade] = useState(false)
  const [interestRate,  setInterestRate]  = useState(12)
  const [calculated,    setCalculated]    = useState(false)
  const [result,        setResult]        = useState({ interest: 0, compensation: 0, courtFee: 0, totalRecovery: 0, daysFromReturn: 0, withinLimitation: true })
  const [draft,         setDraft]         = useState('')
  const [drafting,      setDrafting]      = useState(false)
  const [copied,        setCopied]        = useState(false)

  const fmt  = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  function calculate() {
    const today         = new Date()
    const returnDateObj = returnDate ? new Date(returnDate) : new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
    const daysFromReturn = Math.floor((today.getTime() - returnDateObj.getTime()) / (1000 * 60 * 60 * 24))
    const withinLimitation = daysFromReturn <= 365 // 1 year limitation for filing complaint

    const interest    = Math.round(chequeAmount * (interestRate / 100) * (daysFromReturn / 365))
    const compensation = Math.round(chequeAmount * 2) // Section 138 allows up to 2x as fine
    const courtFee    = Math.min(Math.round(chequeAmount * 0.02), 5000) // court fee capped
    const totalRecovery = chequeAmount + interest + courtFee

    setResult({ interest, compensation, courtFee, totalRecovery, daysFromReturn, withinLimitation })
    setCalculated(true)
  }

  async function generateDraft() {
    if (!caseId) return
    setDrafting(true)
    try {
      const res = await aiApi.getDraft(caseId, {
        draftType: 'Complaint under Section 138 Negotiable Instruments Act',
        instructions: `Cheque amount: ${fmt(chequeAmount)}. Returned dishonoured. Notice sent: ${noticeSent ? 'Yes, on ' + noticeDate : 'No'}. Days from return: ${result.daysFromReturn}. Limitation status: ${result.withinLimitation ? 'Within 1 year' : 'EXPIRED — urgently file'}.  Total recovery sought: ${fmt(result.totalRecovery)} + ${fmt(result.compensation)} compensation u/s 357 CrPC.`,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch { } finally { setDrafting(false) }
  }

  function copyDraft() { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const noticeDue = returnDate ? new Date(new Date(returnDate).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN') : '—'
  const complaintDue = noticeDate ? new Date(new Date(noticeDate).getTime() + 45 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN') : '—'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>NI Act 138 Calculator</h2>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>Section 138 cheque bounce — recovery and limitation analysis.</p>

        <Field label="Cheque Amount (₹)">
          <input type="number" value={chequeAmount} onChange={e => { setChequeAmount(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>
        <Field label="Cheque Return Date">
          <input type="date" value={returnDate} onChange={e => { setReturnDate(e.target.value); setCalculated(false) }} style={inputSt} />
        </Field>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={noticeSent} onChange={() => setNoticeSent(!noticeSent)} />Legal Notice Sent?
          </label>
        </div>
        {noticeSent && (
          <Field label="Notice Date">
            <input type="date" value={noticeDate} onChange={e => setNoticeDate(e.target.value)} style={inputSt} />
          </Field>
        )}
        <Field label="Interest Rate (% per annum)">
          <select value={interestRate} onChange={e => { setInterestRate(Number(e.target.value)); setCalculated(false) }} style={inputSt}>
            <option value={9}>9% — Judgement rate</option>
            <option value={12}>12% — Standard</option>
            <option value={18}>18% — Agreed rate</option>
          </select>
        </Field>

        <button onClick={calculate} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
          Analyse Case
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Section 138 Analysis</h2>
          {!calculated ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
              <i className="ti ti-calculator" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }} />Fill the form and click Analyse
            </div>
          ) : (
            <>
              {/* Limitation Alert */}
              <div style={{ padding: '10px 14px', background: result.withinLimitation ? '#f0fdf4' : '#fef2f2', border: `1px solid ${result.withinLimitation ? '#86efac' : '#fca5a5'}`, borderRadius: 8, fontSize: 13, color: result.withinLimitation ? '#15803d' : '#dc2626', marginBottom: 16, fontWeight: 600 }}>
                {result.withinLimitation
                  ? `✓ Within 1 year limitation — ${result.daysFromReturn} days since return`
                  : `⚠ LIMITATION EXPIRED — ${result.daysFromReturn} days since return. File condonation of delay immediately.`}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
                <ACard title="Cheque Amount"   value={fmt(chequeAmount)}        color="#0f172a" bg="#f8fafc" />
                <ACard title="Interest"        value={fmt(result.interest)}      color="#d97706" bg="#fff7ed" />
                <ACard title="Max Compensation" value={fmt(result.compensation)}  color="#7c3aed" bg="#f5f3ff" />
                <ACard title="Total Recovery"  value={fmt(result.totalRecovery)} color="#16a34a" bg="#f0fdf4" highlight />
              </div>

              {/* Important Deadlines */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Critical Deadlines</div>
                {[
                  { label: 'Notice to be sent by', value: noticeDue, urgent: false },
                  { label: 'Complaint to be filed by (15 days after notice period)', value: complaintDue, urgent: true },
                  { label: 'Limitation for complaint (1 year from return)', value: returnDate ? new Date(new Date(returnDate).getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN') : '—', urgent: true },
                ].map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{d.label}</span>
                    <strong style={{ color: d.urgent ? '#dc2626' : '#0f172a' }}>{d.value}</strong>
                  </div>
                ))}
              </div>

              {draft && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>Generated Section 138 Complaint</div>
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
                  {drafting ? 'Generating...' : 'Draft Section 138 Complaint'}
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
