'use client'

import { useState } from 'react'

interface AnalysisOptions {
  analysisType: string
  occupation:   string
  incomeSource: string
  caseFocus:    string
  notes:        string
  documents:    string[]
}

interface Props {
  onClose:    () => void
  onAnalyse:  (options: AnalysisOptions) => Promise<void>
}

export default function AnalyzeFinancialModal({ onClose, onAnalyse }: Props) {
  const [analysisType, setAnalysisType] = useState('Maintenance Analysis')
  const [occupation,   setOccupation]   = useState('Business Owner')
  const [incomeSource, setIncomeSource] = useState('Salary + Business')
  const [caseFocus,    setCaseFocus]    = useState('Interim Maintenance')
  const [notes,        setNotes]        = useState('')
  const [bank,         setBank]         = useState(true)
  const [itr,          setItr]          = useState(true)
  const [salary,       setSalary]       = useState(true)
  const [property,     setProperty]     = useState(false)
  const [gst,          setGst]          = useState(false)
  const [analysing,    setAnalysing]    = useState(false)

  async function handleAnalyse() {
    setAnalysing(true)
    const docs: string[] = []
    if (bank)     docs.push('Bank Statements')
    if (itr)      docs.push('Income Tax Returns')
    if (salary)   docs.push('Salary Slips')
    if (property) docs.push('Property Records')
    if (gst)      docs.push('GST Returns')

    try {
      await onAnalyse({ analysisType, occupation, incomeSource, caseFocus, notes, documents: docs })
    } finally {
      setAnalysing(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>

        {/* Header */}
        <div style={{ padding: '22px 26px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>AI Financial Analysis</h2>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Configure and run AI analysis for this case.</p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, border: 'none', borderRadius: 8, background: '#f1f5f9', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <Field label="Analysis Type">
            <select value={analysisType} onChange={e => setAnalysisType(e.target.value)} style={inputSt}>
              <option>Maintenance Analysis</option>
              <option>Income Verification</option>
              <option>Asset Investigation</option>
              <option>Lifestyle Analysis</option>
              <option>Full Financial Investigation</option>
            </select>
          </Field>

          <Field label="Respondent's Occupation">
            <select value={occupation} onChange={e => setOccupation(e.target.value)} style={inputSt}>
              <option>Business Owner</option>
              <option>Salaried Employee</option>
              <option>Doctor</option>
              <option>Lawyer</option>
              <option>Chartered Accountant</option>
              <option>Self Employed</option>
              <option>Government Employee</option>
            </select>
          </Field>

          <Field label="Primary Income Source">
            <select value={incomeSource} onChange={e => setIncomeSource(e.target.value)} style={inputSt}>
              <option>Salary + Business</option>
              <option>Salary Only</option>
              <option>Business Only</option>
              <option>Rental Income</option>
              <option>Professional Fees</option>
              <option>Investments</option>
            </select>
          </Field>

          <Field label="Case Focus">
            <select value={caseFocus} onChange={e => setCaseFocus(e.target.value)} style={inputSt}>
              <option>Interim Maintenance</option>
              <option>Permanent Alimony</option>
              <option>Child Maintenance</option>
              <option>Asset Disclosure</option>
              <option>Settlement Negotiation</option>
            </select>
          </Field>

          {/* Documents */}
          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Available Documents (select all that apply)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Bank Statements',       val: bank,     set: setBank     },
                  { label: 'Income Tax Returns',    val: itr,      set: setItr      },
                  { label: 'Salary Slips',          val: salary,   set: setSalary   },
                  { label: 'Property Records',      val: property, set: setProperty },
                  { label: 'GST Returns',           val: gst,      set: setGst      },
                ].map(({ label, val, set }) => (
                  <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', padding: '8px 12px', background: val ? '#eff6ff' : '#f8fafc', border: `1px solid ${val ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 8, transition: 'all 0.15s' }}>
                    <input type="checkbox" checked={val} onChange={() => set(!val)} />
                    {label}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Notes */}
          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Additional Instructions (optional)">
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="E.g. Focus on undisclosed business income. Respondent owns BMW X5 but declares Rs 22,000/month income..."
                style={{ ...inputSt, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
              />
            </Field>
          </div>

          {/* What AI will generate */}
          <div style={{ gridColumn: '1 / span 2', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 10, fontSize: 13 }}>AI will generate:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Declared vs Estimated Income', 'Hidden Income Indicators', 'Maintenance Range (Min/Max/Recommended)', 'Pendente Lite Amount', 'Asset Summary', 'Suspicious Transactions', 'Settlement Range', 'Court Argument Strategy'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
                  <i className="ti ti-check" style={{ color: '#2563eb', fontSize: 12 }} />{item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '18px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={handleAnalyse} disabled={analysing} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: analysing ? '#93c5fd' : '#2563eb', color: '#fff', cursor: analysing ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-sparkles" />
            {analysing ? 'Analysing...' : 'Run AI Analysis'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 7, fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</div>
      {children}
    </div>
  )
}

const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 13,
  fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', background: '#f8fafc', color: '#0f172a',
}
