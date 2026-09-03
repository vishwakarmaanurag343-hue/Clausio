'use client'

import { useState } from 'react'

export default function MaintenanceCalculator() {
  const [husbandIncome, setHusbandIncome] = useState(250000)
  const [wifeIncome, setWifeIncome] = useState(30000)
  const [children, setChildren] = useState(1)
  const [rent, setRent] = useState(25000)
  const [education, setEducation] = useState(18000)
  const [medical, setMedical] = useState(8000)
  const [otherExpense, setOtherExpense] = useState(12000)
  const [marriageYears, setMarriageYears] = useState(8)

  const [livingStandard, setLivingStandard] =
    useState('Upper Middle')

  const [result, setResult] = useState({
    recommended: 50000,
    minimum: 35000,
    maximum: 75000,
  })

  function calculateMaintenance() {
    const disposableIncome =
      husbandIncome -
      rent -
      education -
      medical -
      otherExpense

    const suggested =
      Math.round(disposableIncome * 0.28)

    setResult({
      recommended: suggested,
      minimum: Math.round(suggested * 0.7),
      maximum: Math.round(suggested * 1.5),
    })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '420px 1fr',
        gap: 24,
      }}
    >
      {/* ================================================= */}

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 2px 8px rgba(15,23,42,.04)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Maintenance Calculator
        </h2>

        <p
          style={{
            marginTop: 6,
            marginBottom: 24,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Enter the financial details to estimate maintenance.
        </p>

        {/* Husband Income */}

        <Field label="Husband Monthly Income (₹)">
          <input
            type="number"
            value={husbandIncome}
            onChange={(e) =>
              setHusbandIncome(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        {/* Wife */}

        <Field label="Wife Monthly Income (₹)">
          <input
            type="number"
            value={wifeIncome}
            onChange={(e) =>
              setWifeIncome(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        {/* Children */}

        <Field label="Children">
          <input
            type="number"
            value={children}
            onChange={(e) =>
              setChildren(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        {/* Rent */}

        <Field label="Monthly Rent (₹)">
          <input
            type="number"
            value={rent}
            onChange={(e) =>
              setRent(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        {/* Education */}

        <Field label="Education Expense (₹)">
          <input
            type="number"
            value={education}
            onChange={(e) =>
              setEducation(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        {/* Medical */}

        <Field label="Medical Expense (₹)">
          <input
            type="number"
            value={medical}
            onChange={(e) =>
              setMedical(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        {/* Other */}

        <Field label="Other Monthly Expenses (₹)">
          <input
            type="number"
            value={otherExpense}
            onChange={(e) =>
              setOtherExpense(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        {/* Marriage */}

        <Field label="Marriage Duration">
          <input
            type="number"
            value={marriageYears}
            onChange={(e) =>
              setMarriageYears(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        {/* Lifestyle */}

        <Field label="Lifestyle">
          <select
            value={livingStandard}
            onChange={(e) =>
              setLivingStandard(e.target.value)
            }
            style={inputStyle}
          >
            <option>Low</option>
            <option>Middle</option>
            <option>Upper Middle</option>
            <option>Luxury</option>
          </select>
        </Field>

        <button
          onClick={calculateMaintenance}
          style={{
            width: '100%',
            marginTop: 18,
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Calculate Maintenance
        </button>
      </div>
            {/* ================= RESULTS PANEL ================= */}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Summary */}

        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 2px 8px rgba(15,23,42,.04)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            AI Recommendation
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
              marginBottom: 24,
            }}
          >
            Estimated maintenance based on financial information.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 16,
            }}
          >
            <AmountCard
              title="Minimum"
              amount={result.minimum}
              color="#2563eb"
              bg="#eff6ff"
            />

            <AmountCard
              title="Recommended"
              amount={result.recommended}
              color="#16a34a"
              bg="#f0fdf4"
              highlight
            />

            <AmountCard
              title="Maximum"
              amount={result.maximum}
              color="#d97706"
              bg="#fff7ed"
            />
          </div>
        </div>

        {/* Breakdown */}

        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 2px 8px rgba(15,23,42,.04)',
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 18,
              color: '#0f172a',
            }}
          >
            Financial Breakdown
          </h3>

          <Breakdown
            label="Husband Income"
            value={`₹${husbandIncome.toLocaleString()}`}
          />

          <Breakdown
            label="Wife Income"
            value={`₹${wifeIncome.toLocaleString()}`}
          />

          <Breakdown
            label="Children"
            value={children.toString()}
          />

          <Breakdown
            label="Rent"
            value={`₹${rent.toLocaleString()}`}
          />

          <Breakdown
            label="Education"
            value={`₹${education.toLocaleString()}`}
          />

          <Breakdown
            label="Medical"
            value={`₹${medical.toLocaleString()}`}
          />

          <Breakdown
            label="Other Expenses"
            value={`₹${otherExpense.toLocaleString()}`}
          />

          <Breakdown
            label="Marriage Duration"
            value={`${marriageYears} Years`}
          />

          <Breakdown
            label="Lifestyle"
            value={livingStandard}
            last
          />
        </div>

        {/* AI Analysis */}

        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <i
              className="ti ti-sparkles"
              style={{
                color: '#2563eb',
              }}
            />

            <span
              style={{
                color: '#2563eb',
                fontWeight: 700,
              }}
            >
              AI Analysis
            </span>
          </div>

          <div
            style={{
              lineHeight: 1.8,
              color: '#334155',
            }}
          >
            Considering the declared income, family lifestyle,
            education expenses, medical costs and marriage
            duration, Clausio AI estimates that a maintenance
            claim around
            <strong>
              {' '}
              ₹{result.recommended.toLocaleString()}
            </strong>{' '}
            per month is reasonable.

            <br />
            <br />

            The current financial profile indicates that the
            respondent has sufficient disposable income to
            support this amount without creating financial
            hardship.
          </div>
        </div>

        {/* Footer */}

        <div
          style={{
            display: 'flex',
            gap: 14,
          }}
        >
          <button
            style={secondaryButton}
          >
            Export Report
          </button>

          <button
            style={primaryButton}
          >
            Generate Draft
          </button>
        </div>
      </div>
    </div>
  )
}

/* ========================================================= */

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        marginBottom: 18,
      }}
    >
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

function Breakdown({
  label,
  value,
  last,
}: {
  label: string
  value: string
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: last
          ? 'none'
          : '1px solid #e2e8f0',
      }}
    >
      <span
        style={{
          color: '#64748b',
        }}
      >
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  )
}

function AmountCard({
  title,
  amount,
  color,
  bg,
  highlight,
}: {
  title: string
  amount: number
  color: string
  bg: string
  highlight?: boolean
}) {
  return (
    <div
      style={{
        background: bg,
        border: highlight
          ? '2px solid #16a34a'
          : '1px solid #e2e8f0',
        borderRadius: 14,
        padding: 18,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 13,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 28,
          fontWeight: 700,
          color,
        }}
      >
        ₹{amount.toLocaleString()}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const secondaryButton: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
}

const primaryButton: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  borderRadius: 10,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
}