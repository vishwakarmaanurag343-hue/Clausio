'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api'

interface Props { caseId: string | null }

export default function MaintenanceCalculator({ caseId }: Props) {
  const [husbandIncome, setHusbandIncome] = useState(250000)
  const [wifeIncome,    setWifeIncome]    = useState(30000)
  const [children,      setChildren]      = useState(1)
  const [rent,          setRent]          = useState(25000)
  const [education,     setEducation]     = useState(18000)
  const [medical,       setMedical]       = useState(8000)
  const [otherExpense,  setOtherExpense]  = useState(12000)
  const [marriageYears, setMarriageYears] = useState(8)
  const [lifestyle,     setLifestyle]     = useState('Upper Middle')
  const [calculated,    setCalculated]    = useState(false)

  const [result, setResult] = useState({ recommended: 0, minimum: 0, maximum: 0, pendenteLite: 0 })

  const [draft,      setDraft]      = useState('')
  const [drafting,   setDrafting]   = useState(false)
  const [draftError, setDraftError] = useState('')
  const [copied,     setCopied]     = useState(false)

  function fmt(n: number) { return `₹${n.toLocaleString('en-IN')}` }

  function calculate() {
    const disposable = husbandIncome - rent - education - medical - otherExpense
    const wifeDeficit = Math.max(0, 40000 - wifeIncome) // standard of living baseline
    const base = Math.round((disposable * 0.28) + (wifeDeficit * 0.5))
    const childFactor = children * 8000
    const yearsFactor = Math.min(marriageYears * 500, 5000)
    const lifestyleFactor = lifestyle === 'Luxury' ? 1.4 : lifestyle === 'Upper Middle' ? 1.2 : lifestyle === 'Middle' ? 1.0 : 0.8
    const recommended = Math.round((base + childFactor + yearsFactor) * lifestyleFactor)
    setResult({
      recommended,
      minimum:     Math.round(recommended * 0.7),
      maximum:     Math.round(recommended * 1.5),
      pendenteLite: Math.round(recommended * 0.75),
    })
    setCalculated(true)
  }

  async function generateDraft() {
    if (!caseId) { setDraftError('Select a case from the dashboard first.'); return }
    setDrafting(true); setDraftError('')
    try {
      const res = await aiApi.getDraft(caseId, {
        draftType: 'Maintenance Application under Section 24 HMA',
        instructions: `Recommended monthly maintenance: ${fmt(result.recommended)} (range ${fmt(result.minimum)}–${fmt(result.maximum)}). Husband income: ${fmt(husbandIncome)}/month. Wife income: ${fmt(wifeIncome)}/month. Children: ${children}. Marriage: ${marriageYears} years. Lifestyle: ${lifestyle}. Rent: ${fmt(rent)}. Education: ${fmt(education)}/month. Medical: ${fmt(medical)}/month. Pendente lite amount: ${fmt(result.pendenteLite)}/month.`,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch (err: any) {
      setDraftError(err.message || 'Failed to generate draft')
    } finally { setDrafting(false) }
  }

  function copyDraft() {
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }}>

      {/* Left — Input form */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Maintenance Calculator</h2>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 13 }}>Enter financial details to calculate recommended maintenance.</p>

        {[
          { label: 'Husband Monthly Income (₹)', val: husbandIncome, set: setHusbandIncome },
          { label: 'Wife Monthly Income (₹)',    val: wifeIncome,    set: setWifeIncome    },
          { label: 'Number of Children',         val: children,      set: setChildren      },
          { label: 'Monthly Rent (₹)',           val: rent,          set: setRent          },
          { label: 'Education Expense/mo (₹)',   val: education,     set: setEducation     },
          { label: 'Medical Expense/mo (₹)',     val: medical,       set: setMedical       },
          { label: 'Other Monthly Expenses (₹)', val: otherExpense,  set: setOtherExpense  },
          { label: 'Marriage Duration (Years)',   val: marriageYears, set: setMarriageYears },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={labelSt}>{f.label}</label>
            <input type="number" value={f.val} onChange={e => { f.set(Number(e.target.value)); setCalculated(false) }} style={inputSt} />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={labelSt}>Standard of Living</label>
          <select value={lifestyle} onChange={e => { setLifestyle(e.target.value); setCalculated(false) }} style={inputSt}>
            {['Low', 'Middle', 'Upper Middle', 'Luxury'].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <button onClick={calculate} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Calculate Maintenance
        </button>
      </div>

      {/* Right — Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Amount cards */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Calculation Result</h2>
          <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>
            {calculated ? 'Based on Rajnesh v. Neha standard and entered financial details.' : 'Enter details and click Calculate.'}
          </p>
          {!calculated ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
              <i className="ti ti-calculator" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }} />
              Fill the form and click Calculate Maintenance
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                <ACard title="Minimum"     value={fmt(result.minimum)}     color="#2563eb" bg="#eff6ff" />
                <ACard title="Recommended" value={fmt(result.recommended)} color="#16a34a" bg="#f0fdf4" highlight />
                <ACard title="Maximum"     value={fmt(result.maximum)}     color="#d97706" bg="#fff7ed" />
              </div>
              <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d', marginBottom: 8 }}>
                <strong>Pendente Lite (Section 24 HMA):</strong> {fmt(result.pendenteLite)}/month — file interim application immediately
              </div>
            </>
          )}
        </div>

        {/* Breakdown */}
        {calculated && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>Financial Breakdown</div>
            {[
              { label: 'Husband Income',     value: fmt(husbandIncome) },
              { label: 'Wife Income',        value: fmt(wifeIncome)    },
              { label: 'Children',           value: String(children)   },
              { label: 'Rent',               value: fmt(rent)          },
              { label: 'Education',          value: fmt(education)     },
              { label: 'Medical',            value: fmt(medical)       },
              { label: 'Other Expenses',     value: fmt(otherExpense)  },
              { label: 'Marriage Duration',  value: `${marriageYears} years` },
              { label: 'Standard of Living', value: lifestyle          },
            ].map((r, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{r.label}</span>
                <strong>{r.value}</strong>
              </div>
            ))}
          </div>
        )}

        {/* AI explanation */}
        {calculated && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <i className="ti ti-sparkles" style={{ color: '#2563eb' }} />
              <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}>Legal Basis (Rajnesh v. Neha Standard)</span>
            </div>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
              Based on the husband's monthly income of <strong>{fmt(husbandIncome)}</strong> and after deducting essential expenses (rent {fmt(rent)}, education {fmt(education)}, medical {fmt(medical)}, other {fmt(otherExpense)}), the disposable income is <strong>{fmt(Math.max(0, husbandIncome - rent - education - medical - otherExpense))}</strong>/month.
              <br /><br />
              Applying the Rajnesh v. Neha (2020) 14 SCC 1 standard of living test with {lifestyle.toLowerCase()} lifestyle, {children} child{children > 1 ? 'ren' : ''} and {marriageYears} years of marriage, a maintenance of <strong>{fmt(result.recommended)}/month</strong> is reasonable and justifiable before court.
              <br /><br />
              File a Section 24 HMA pendente lite application for <strong>{fmt(result.pendenteLite)}/month</strong> immediately to secure interim maintenance during the proceedings.
            </div>
          </div>
        )}

        {draftError && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{draftError}</div>
        )}

        {draft && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>Generated Draft Application</div>
              <button onClick={copyDraft} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: copied ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit' }}>
                <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ marginRight: 4 }} />{copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>{draft}</div>
          </div>
        )}

        {calculated && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => window.print()} style={secBtn}>Export Report</button>
            <button onClick={generateDraft} disabled={drafting} style={{ ...priBtn, opacity: drafting ? 0.7 : 1, cursor: drafting ? 'not-allowed' : 'pointer' }}>
              {drafting ? 'Generating...' : 'Generate Application Draft'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ACard({ title, value, color, bg, highlight }: { title: string; value: string; color: string; bg: string; highlight?: boolean }) {
  return (
    <div style={{ background: bg, border: highlight ? `2px solid ${color}` : '1px solid #e2e8f0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

const labelSt: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inputSt:  React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
const secBtn:   React.CSSProperties = { flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }
const priBtn:   React.CSSProperties = { flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }
