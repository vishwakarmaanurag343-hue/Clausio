'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
}

export default function AnalyzeFinancialModal({
  onClose,
}: Props) {
  const [analysisType, setAnalysisType] = useState('Maintenance Analysis')
  const [occupation, setOccupation] = useState('Business Owner')
  const [incomeSource, setIncomeSource] = useState('Salary + Business')
  const [notes, setNotes] = useState('')

  const [bank, setBank] = useState(true)
  const [itr, setItr] = useState(true)
  const [salary, setSalary] = useState(true)
  const [property, setProperty] = useState(false)
  const [gst, setGst] = useState(false)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 760,
          background: '#fff',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        }}
      >
        {/* Header */}

        <div
          style={{
            padding: '22px 26px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              AI Financial Analysis
            </h2>

            <p
              style={{
                marginTop: 6,
                color: '#64748b',
                fontSize: 14,
              }}
            >
              Analyse income, maintenance and financial inconsistencies.
            </p>
          </div>

          <button
            onClick={onClose}
            style={closeButton}
          >
            ✕
          </button>
        </div>

        {/* Body */}

        <div
          style={{
            padding: 28,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          <Field label="Analysis Type">
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              style={inputStyle}
            >
              <option>Maintenance Analysis</option>
              <option>Income Verification</option>
              <option>Asset Investigation</option>
              <option>Lifestyle Analysis</option>
            </select>
          </Field>

          <Field label="Occupation">
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              style={inputStyle}
            >
              <option>Business Owner</option>
              <option>Salaried Employee</option>
              <option>Doctor</option>
              <option>Lawyer</option>
              <option>CA</option>
              <option>Self Employed</option>
            </select>
          </Field>

          <Field label="Income Source">
            <select
              value={incomeSource}
              onChange={(e) => setIncomeSource(e.target.value)}
              style={inputStyle}
            >
              <option>Salary + Business</option>
              <option>Salary</option>
              <option>Business</option>
              <option>Rental Income</option>
              <option>Investments</option>
            </select>
          </Field>

          <Field label="Case Focus">
            <select style={inputStyle}>
              <option>Interim Maintenance</option>
              <option>Permanent Alimony</option>
              <option>Child Maintenance</option>
              <option>Asset Disclosure</option>
            </select>
          </Field>

          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Available Documents">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <Check checked={bank} onChange={() => setBank(!bank)} label="Bank Statements" />
                <Check checked={itr} onChange={() => setItr(!itr)} label="Income Tax Returns" />
                <Check checked={salary} onChange={() => setSalary(!salary)} label="Salary Slips" />
                <Check checked={property} onChange={() => setProperty(!property)} label="Property Records" />
                <Check checked={gst} onChange={() => setGst(!gst)} label="GST Returns" />
              </div>
            </Field>
          </div>

          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Additional Instructions">
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: Compare declared income with lifestyle, identify hidden assets, estimate maintenance..."
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />
            </Field>
          </div>

          <div
            style={{
              gridColumn: '1 / span 2',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#1d4ed8',
                marginBottom: 10,
              }}
            >
              AI will generate
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                lineHeight: 1.8,
                color: '#334155',
              }}
            >
              <li>Estimated Actual Income</li>
              <li>Hidden Income Indicators</li>
              <li>Maintenance Range</li>
              <li>Lifestyle Analysis</li>
              <li>Asset Summary</li>
              <li>Cross Examination Questions</li>
              <li>Financial Red Flags</li>
            </ul>
          </div>
        </div>

        {/* Footer */}

        <div
          style={{
            padding: 22,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={secondaryButton}
          >
            Cancel
          </button>

          <button
            style={primaryButton}
          >
            ✨ Analyse Financials
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- */

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        style={{
          marginBottom: 8,
          fontSize: 14,
          fontWeight: 600,
          color: '#334155',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const closeButton: React.CSSProperties = {
  width: 36,
  height: 36,
  border: 'none',
  borderRadius: 8,
  background: '#f1f5f9',
  cursor: 'pointer',
}

const secondaryButton: React.CSSProperties = {
  padding: '12px 22px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
}

const primaryButton: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 10,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
}