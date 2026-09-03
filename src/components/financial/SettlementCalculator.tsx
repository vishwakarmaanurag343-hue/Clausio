'use client'

import { useState } from 'react'

export default function SettlementCalculator() {
  const [monthlyMaintenance, setMonthlyMaintenance] = useState(50000)
  const [durationYears, setDurationYears] = useState(10)
  const [inflationRate, setInflationRate] = useState(5)
  const [discountRate, setDiscountRate] = useState(8)
  const [legalExpense, setLegalExpense] = useState(400000)
  const [litigationYears, setLitigationYears] = useState(3)

  const [result, setResult] = useState({
    lifetimeCost: 6000000,
    suggestedSettlement: 4800000,
    savings: 1200000,
  })

  function calculateSettlement() {
    const totalMaintenance =
      monthlyMaintenance * 12 * durationYears

    const inflationImpact =
      totalMaintenance * (inflationRate / 100)

    const litigationCost =
      legalExpense

    const lifetime =
      totalMaintenance +
      inflationImpact +
      litigationCost

    const suggested =
      lifetime * 0.80

    setResult({
      lifetimeCost: Math.round(lifetime),
      suggestedSettlement: Math.round(suggested),
      savings: Math.round(lifetime - suggested),
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
      {/* ================= LEFT PANEL ================= */}

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
          Settlement Calculator
        </h2>

        <p
          style={{
            marginTop: 6,
            marginBottom: 24,
            color: '#64748b',
          }}
        >
          Compare long-term maintenance against a one-time settlement.
        </p>

        <Field label="Monthly Maintenance (₹)">
          <input
            type="number"
            value={monthlyMaintenance}
            onChange={(e) =>
              setMonthlyMaintenance(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        <Field label="Expected Duration (Years)">
          <input
            type="number"
            value={durationYears}
            onChange={(e) =>
              setDurationYears(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        <Field label="Expected Inflation (%)">
          <input
            type="number"
            value={inflationRate}
            onChange={(e) =>
              setInflationRate(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        <Field label="Discount Rate (%)">
          <input
            type="number"
            value={discountRate}
            onChange={(e) =>
              setDiscountRate(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        <Field label="Estimated Legal Expenses (₹)">
          <input
            type="number"
            value={legalExpense}
            onChange={(e) =>
              setLegalExpense(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        <Field label="Expected Litigation (Years)">
          <input
            type="number"
            value={litigationYears}
            onChange={(e) =>
              setLitigationYears(Number(e.target.value))
            }
            style={inputStyle}
          />
        </Field>

        <button
          onClick={calculateSettlement}
          style={{
            width: '100%',
            marginTop: 20,
            padding: '14px',
            border: 'none',
            borderRadius: 10,
            background: '#2563eb',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Calculate Settlement
        </button>
      </div>
            {/* ================= RIGHT PANEL ================= */}

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
            Settlement Recommendation
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
              marginBottom: 24,
            }}
          >
            AI estimated settlement based on maintenance liability.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 16,
            }}
          >
            <AmountCard
              title="Lifetime Cost"
              amount={result.lifetimeCost}
              color="#dc2626"
              bg="#fef2f2"
            />

            <AmountCard
              title="Suggested Settlement"
              amount={result.suggestedSettlement}
              color="#16a34a"
              bg="#f0fdf4"
              highlight
            />

            <AmountCard
              title="Estimated Savings"
              amount={result.savings}
              color="#2563eb"
              bg="#eff6ff"
            />
          </div>
        </div>

        {/* Comparison */}

        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 18,
              color: '#0f172a',
            }}
          >
            Cost Breakdown
          </h3>

          <Breakdown
            label="Monthly Maintenance"
            value={`₹${monthlyMaintenance.toLocaleString()}`}
          />

          <Breakdown
            label="Maintenance Duration"
            value={`${durationYears} Years`}
          />

          <Breakdown
            label="Inflation Rate"
            value={`${inflationRate}%`}
          />

          <Breakdown
            label="Discount Rate"
            value={`${discountRate}%`}
          />

          <Breakdown
            label="Legal Expenses"
            value={`₹${legalExpense.toLocaleString()}`}
          />

          <Breakdown
            label="Litigation Duration"
            value={`${litigationYears} Years`}
            last
          />
        </div>

        {/* AI Recommendation */}

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
              marginBottom: 12,
            }}
          >
            <i
              className="ti ti-sparkles"
              style={{ color: '#2563eb' }}
            />

            <strong
              style={{
                color: '#2563eb',
              }}
            >
              AI Recommendation
            </strong>
          </div>

          <div
            style={{
              color: '#334155',
              lineHeight: 1.8,
            }}
          >
            Continuing maintenance for
            <strong> {durationYears} years </strong>
            is estimated to cost approximately

            <strong>
              {' '}
              ₹{result.lifetimeCost.toLocaleString()}
            </strong>
            .

            <br />
            <br />

            Clausio AI recommends negotiating a one-time settlement
            close to

            <strong>
              {' '}
              ₹{result.suggestedSettlement.toLocaleString()}
            </strong>

            , potentially saving around

            <strong>
              {' '}
              ₹{result.savings.toLocaleString()}
            </strong>

            while avoiding prolonged litigation.
          </div>
        </div>

        {/* Strategy */}

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 14,
              color: '#0f172a',
            }}
          >
            Negotiation Strategy
          </h3>

          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              color: '#475569',
              lineHeight: 1.9,
            }}
          >
            <li>Start negotiation at ₹55 Lakhs.</li>

            <li>Ideal settlement range ₹48–50 Lakhs.</li>

            <li>Avoid accepting below ₹44 Lakhs.</li>

            <li>
              Highlight future litigation costs during mediation.
            </li>
          </ul>
        </div>

        {/* Footer */}

        <div
          style={{
            display: 'flex',
            gap: 14,
          }}
        >
          <button style={secondaryButton}>
            Export Report
          </button>

          <button style={primaryButton}>
            Generate Settlement Draft
          </button>
        </div>
      </div>
    </div>
  )
}

/* ====================================================== */

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          marginBottom: 8,
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
      <span style={{ color: '#64748b' }}>{label}</span>

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
          marginTop: 10,
          fontSize: 26,
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