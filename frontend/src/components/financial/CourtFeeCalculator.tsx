'use client'

import { useState, useEffect } from 'react'
import { aiApi } from '@/lib/api'
import { HBars } from '@/components/financial/FinancialCharts'

interface Props { caseId: string | null; caseType: string; initialValues?: Record<string, number | null | undefined> }

const numOrNull = (v: any) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : null)

const COURT_FEE_SLABS = [
  { from: 0,       to: 50000,   label: '₹0 – ₹50,000',       rate: 0.08  },
  { from: 50000,   to: 200000,  label: '₹50,001 – ₹2,00,000', rate: 0.06  },
  { from: 200000,  to: 500000,  label: '₹2,00,001 – ₹5,00,000', rate: 0.04 },
  { from: 500000,  to: 1000000, label: '₹5,00,001 – ₹10,00,000', rate: 0.03 },
  { from: 1000000, to: Infinity, label: 'Above ₹10,00,000',   rate: 0.025 },
]

function calculateCourtFee(amount: number): number {
  let fee = 0; let remaining = amount; let prev = 0
  for (const slab of COURT_FEE_SLABS) {
    const slabAmt = Math.min(remaining, slab.to - prev)
    fee += slabAmt * slab.rate
    remaining -= slabAmt; prev = slab.to
    if (remaining <= 0) break
  }
  return Math.round(fee)
}

function getActiveSlab(amount: number): number {
  for (let i = 0; i < COURT_FEE_SLABS.length; i++) {
    if (amount <= COURT_FEE_SLABS[i].to) return i
  }
  return COURT_FEE_SLABS.length - 1
}

export default function CourtFeeCalculator({ caseId, caseType, initialValues }: Props) {
  const [claimAmount,   setClaimAmount]   = useState(1000000)
  const [courtType,     setCourtType]     = useState('District Court')
  const [processSheets, setProcessSheets] = useState(3)
  const [miscFees,      setMiscFees]      = useState(500)
  const [calculated,    setCalculated]    = useState(false)
  const [result,        setResult]        = useState({ courtFee: 0, process: 0, total: 0 })
  const [draft,         setDraft]         = useState('')
  const [drafting,      setDrafting]      = useState(false)
  const [copied,        setCopied]        = useState(false)

  const [autoFilled, setAutoFilled] = useState<string[]>([])
  useEffect(() => {
    if (!initialValues) return
    const applied: string[] = []
    if (numOrNull(initialValues.claimAmount)) { setClaimAmount(numOrNull(initialValues.claimAmount)!); applied.push('Claim / Relief Amount') }
    setAutoFilled(applied)
  }, [initialValues])

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  function calculate() {
    const courtFee = calculateCourtFee(claimAmount)
    const process  = processSheets * 200
    setResult({ courtFee, process, total: courtFee + process + miscFees })
    setCalculated(true)
  }

  async function generateDraft() {
    if (!caseId) return
    setDrafting(true)
    try {
      const res = await aiApi.getDraft(caseId, {
        draftType: `Plaint / Petition for ${caseType} matter`,
        instructions: `Claim amount: ${fmt(claimAmount)}. Court fee payable: ${fmt(result.courtFee)}. Court: ${courtType}. Total filing cost: ${fmt(result.total)}.`,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch { } finally { setDrafting(false) }
  }

  function copyDraft() { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const activeSlab = getActiveSlab(claimAmount)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Court Fee Calculator</h2>
        <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 13 }}>Ad valorem court fee calculation for {caseType} matter.</p>

        {autoFilled.length > 0 && (
          <div style={{ marginBottom: 18, padding: '9px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 11.5, color: '#1d4ed8', lineHeight: 1.5 }}>
            <i className="ti ti-bolt" /> <strong>{autoFilled.length} value{autoFilled.length > 1 ? 's' : ''} auto-filled</strong> from AI document analysis ({autoFilled.join(', ')}). Edit any field to override.
          </div>
        )}

        <Field label="Claim / Relief Amount (₹)">
          <input type="number" value={claimAmount} onChange={e => { setClaimAmount(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>
        <Field label="Court">
          <select value={courtType} onChange={e => { setCourtType(e.target.value); setCalculated(false) }} style={inputSt}>
            {['District Court','High Court','Commercial Court','Consumer Forum','Labour Court','NCLT','Family Court'].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Number of Process Sheets (Service of Summons)">
          <input type="number" value={processSheets} onChange={e => { setProcessSheets(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>
        <Field label="Misc Fees (Vakalatnama, Filing, etc.) (₹)">
          <input type="number" value={miscFees} onChange={e => { setMiscFees(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
        </Field>

        <button onClick={calculate} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
          Calculate Court Fee
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Filing Cost Breakdown</h2>
          {!calculated ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
              <i className="ti ti-calculator" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }} />Fill the form and click Calculate
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                <ACard title="Court Fee"    value={fmt(result.courtFee)} color="#2563eb" bg="#eff6ff" />
                <ACard title="Process Fees" value={fmt(result.process)}  color="#d97706" bg="#fff7ed" />
                <ACard title="Total Filing" value={fmt(result.total)}    color="#16a34a" bg="#f0fdf4" highlight />
              </div>

              {/* Active slab ladder */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Fee Slab Ladder — your claim falls in the highlighted slab:</div>
                {COURT_FEE_SLABS.filter(s => s.to !== Infinity || claimAmount > s.from).map((slab, i) => {
                  const isActive = i === activeSlab
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', marginBottom: 4, borderRadius: 7, background: isActive ? '#eff6ff' : '#f8fafc', border: `1px solid ${isActive ? '#93c5fd' : '#e2e8f0'}`, fontSize: 12 }}>
                      <span style={{ color: isActive ? '#1d4ed8' : '#64748b', fontWeight: isActive ? 700 : 400 }}>{slab.label}</span>
                      <span style={{ color: isActive ? '#1d4ed8' : '#94a3b8', fontWeight: isActive ? 700 : 400 }}>@ {(slab.rate * 100).toFixed(1)}% {isActive ? '✓' : ''}</span>
                    </div>
                  )
                })}
              </div>

              {/* HBars chart */}
              <HBars title="Filing Cost Breakdown" items={[
                { label: 'Ad Valorem Court Fee',      value: result.courtFee, color: '#2563eb' },
                { label: 'Process Fees',              value: result.process,  color: '#d97706' },
                { label: 'Misc (Vakalatnama etc.)',   value: miscFees,        color: '#64748b' },
              ]} />

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12, marginTop: 16, marginBottom: 16, fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                <strong>Note:</strong> Court fee rates vary by state — verify with the court registry before filing. High Court rates are typically higher.
              </div>

              {draft && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>Generated Plaint Draft</div>
                    <button onClick={copyDraft} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: copied ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />{copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, maxHeight: 300, overflowY: 'auto' }}>{draft}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => window.print()} style={secBtn}>Export</button>
                <button onClick={generateDraft} disabled={drafting} style={{ ...priBtn, opacity: drafting ? 0.7 : 1, cursor: drafting ? 'not-allowed' : 'pointer' }}>
                  {drafting ? 'Generating...' : 'Draft Plaint'}
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
