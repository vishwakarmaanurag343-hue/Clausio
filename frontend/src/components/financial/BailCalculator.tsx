'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'

interface Props { caseId: string | null }

export default function BailCalculator({ caseId }: Props) {
  const [offenceType,  setOffenceType]  = useState('Bailable')
  const [section,      setSection]      = useState('498A IPC')
  const [prisonDays,   setPrisonDays]   = useState(30)
  const [propertyVal,  setPropertyVal]  = useState(500000)
  const [noSureties,   setNoSureties]   = useState(1)
  const [accused,      setAccused]      = useState('No prior conviction')
  const [calculated,   setCalculated]   = useState(false)
  const [result,       setResult]       = useState({ bailAmount: 0, suretiesAmt: 0, legalFee: 0, totalCost: 0 })
  const [draft,        setDraft]        = useState('')
  const [drafting,     setDrafting]     = useState(false)
  const [copied,       setCopied]       = useState(false)

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  function calculate() {
    const base = offenceType === 'Bailable' ? 25000 : offenceType === 'Non-Bailable' ? 100000 : 500000
    const propertyFactor = Math.min(propertyVal * 0.1, 200000)
    const bailAmount  = Math.round(base + propertyFactor)
    const suretiesAmt = Math.round(bailAmount * noSureties)
    const legalFee    = Math.round(bailAmount * 0.05 + 15000)
    setResult({ bailAmount, suretiesAmt, legalFee, totalCost: suretiesAmt + legalFee })
    setCalculated(true)
  }

  async function generateDraft() {
    if (!caseId) return
    setDrafting(true)
    try {
      const res = await aiApi.getDraft(caseId, {
        draftType: offenceType === 'Non-Bailable' ? 'Bail Application under Section 439 CrPC / BNSS' : 'Bail Application under Section 436 CrPC / BNSS',
        instructions: `Offence: ${offenceType} under ${section}. In custody: ${prisonDays} days. Bail bond: ${fmt(result.bailAmount)}. Sureties: ${noSureties} x ${fmt(result.bailAmount)} = ${fmt(result.suretiesAmt)}. Accused background: ${accused}. Apply triple test: flight risk, tampering with evidence, repeat offence.`,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch { } finally { setDrafting(false) }
  }

  function copyDraft() { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Bail Calculator</h2>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>Estimate bail bond amount and prepare application.</p>

        {[
          { label: 'Offence Type', type: 'select', val: offenceType, set: setOffenceType, options: ['Bailable', 'Non-Bailable', 'Special Act (NDPS/PMLA/POCSO)'] },
          { label: 'Section / Offence', type: 'select', val: section, set: setSection, options: ['498A IPC', '302 IPC', '376 IPC', '420 IPC', '406 IPC', '307 IPC', 'NDPS Act', 'PMLA', 'POCSO'] },
          { label: 'Days in Custody', type: 'number', val: prisonDays, set: setPrisonDays },
          { label: 'Surety Property Value (₹)', type: 'number', val: propertyVal, set: setPropertyVal },
          { label: 'Number of Sureties', type: 'number', val: noSureties, set: setNoSureties },
        ].map((f: any) => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={labelSt}>{f.label}</label>
            {f.type === 'select'
              ? <select value={f.val} onChange={e => { f.set(e.target.value); setCalculated(false) }} style={inputSt}>{f.options.map((o: string) => <option key={o}>{o}</option>)}</select>
              : <input type="number" value={f.val} onChange={e => { f.set(Number(e.target.value)); setCalculated(false) }} style={inputSt} />}
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={labelSt}>Accused Background</label>
          <select value={accused} onChange={e => { setAccused(e.target.value); setCalculated(false) }} style={inputSt}>
            <option>No prior conviction</option>
            <option>Prior conviction — bailable</option>
            <option>Prior conviction — non-bailable</option>
            <option>Repeat offender</option>
          </select>
        </div>

        <button onClick={calculate} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Calculate Bail Amount
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Bail Estimate</h2>
          {!calculated ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
              <i className="ti ti-calculator" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }} />Fill the form and click Calculate
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
                <ACard title="Bail Bond"   value={fmt(result.bailAmount)}  color="#2563eb" bg="#eff6ff" />
                <ACard title="Total Sureties" value={fmt(result.suretiesAmt)} color="#7c3aed" bg="#f5f3ff" />
                <ACard title="Legal Fee (est.)" value={fmt(result.legalFee)}  color="#d97706" bg="#fff7ed" />
                <ACard title="Total Cost"  value={fmt(result.totalCost)}   color="#0f172a" bg="#f8fafc" highlight />
              </div>

              {offenceType !== 'Bailable' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13, color: '#7f1d1d', lineHeight: 1.8 }}>
                  <strong>Triple Test (Arnesh Kumar Guidelines):</strong> Must satisfy: (1) Not likely to abscond, (2) No tampering with evidence, (3) No danger of repeat offence. After {prisonDays} days custody, file application before Sessions Court / High Court.
                </div>
              )}

              {draft && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>Generated Bail Application</div>
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
                  {drafting ? 'Generating...' : 'Draft Bail Application'}
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
