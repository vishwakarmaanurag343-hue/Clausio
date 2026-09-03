'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
}

export default function GenerateStrategyModal({
  onClose,
}: Props) {
  const [objective, setObjective] = useState('Win Interim Maintenance')
  const [depth, setDepth] = useState('Detailed')
  const [jurisdiction, setJurisdiction] = useState('Family Court')
  const [notes, setNotes] = useState('')

  const [includeCaseLaw, setIncludeCaseLaw] = useState(true)
  const [includeRisk, setIncludeRisk] = useState(true)
  const [includeCross, setIncludeCross] = useState(true)
  const [includeDocuments, setIncludeDocuments] = useState(true)

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
        zIndex: 999,
        padding: 24,
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
            padding: '22px 28px',
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
              Generate AI Strategy
            </h2>

            <p
              style={{
                marginTop: 6,
                fontSize: 14,
                color: '#64748b',
              }}
            >
              Configure the litigation strategy you want Clausio AI to prepare.
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
            gap: 22,
          }}
        >
          <Field label="Primary Objective">
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Analysis Depth">
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              style={inputStyle}
            >
              <option>Quick</option>
              <option>Detailed</option>
              <option>Senior Counsel Level</option>
            </select>
          </Field>

          <Field label="Court / Jurisdiction">
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              style={inputStyle}
            >
              <option>Family Court</option>
              <option>District Court</option>
              <option>High Court</option>
              <option>Supreme Court</option>
            </select>
          </Field>

          <Field label="Expected Outcome">
            <select style={inputStyle}>
              <option>Settlement</option>
              <option>Interim Relief</option>
              <option>Final Decree</option>
              <option>Dismissal</option>
            </select>
          </Field>

          <div
            style={{
              gridColumn: '1 / span 2',
            }}
          >
            <Field label="Include in Strategy">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <Check
                  checked={includeCaseLaw}
                  onChange={() => setIncludeCaseLaw(!includeCaseLaw)}
                  label="Relevant Case Laws"
                />

                <Check
                  checked={includeRisk}
                  onChange={() => setIncludeRisk(!includeRisk)}
                  label="Risk Assessment"
                />

                <Check
                  checked={includeCross}
                  onChange={() => setIncludeCross(!includeCross)}
                  label="Cross Examination"
                />

                <Check
                  checked={includeDocuments}
                  onChange={() => setIncludeDocuments(!includeDocuments)}
                  label="Document Checklist"
                />
              </div>
            </Field>
          </div>

          <div
            style={{
              gridColumn: '1 / span 2',
            }}
          >
            <Field label="Additional Instructions">
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: Focus on maintenance claim, anticipate Respondent's defence, identify missing evidence..."
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />
            </Field>
          </div>

          {/* AI Preview */}

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
              <li>Case Strength & Weakness Analysis</li>
              <li>Risk Assessment</li>
              <li>Winning Probability</li>
              <li>Recommended Next Steps</li>
              <li>Document Gaps</li>
              <li>Relevant Case Laws</li>
              <li>Cross Examination Suggestions</li>
              <li>30-Day Action Plan</li>
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
            ✨ Generate Strategy
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------- */

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
          fontWeight: 600,
          fontSize: 14,
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
        fontSize: 14,
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

/* -------------------------------- */

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