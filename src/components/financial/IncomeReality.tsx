'use client'

interface SuspiciousItem {
  title: string
  description: string
}

const suspicious: SuspiciousItem[] = [
  {
    title: 'BMW 3 Series Purchase',
    description: 'Purchased a luxury vehicle despite declaring ₹22L annual income.',
  },
  {
    title: 'Thailand Trip',
    description: 'Foreign travel worth approximately ₹6.2L not reflected in income records.',
  },
  {
    title: 'ESOP Holdings',
    description: 'Employee stock options not disclosed in the affidavit of income.',
  },
]

export default function IncomeReality() {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 22,
        boxShadow: '0 2px 8px rgba(15,23,42,.04)',
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 22,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Income Reality Check
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            AI comparison between declared and estimated income.
          </p>
        </div>

        <div
          style={{
            background: '#eff6ff',
            color: '#2563eb',
            padding: '8px 14px',
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          94% Confidence
        </div>
      </div>

      {/* Income Cards */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <IncomeCard
          title="Declared Income"
          value="₹22 Lakhs"
          color="#dc2626"
          background="#fef2f2"
        />

        <IncomeCard
          title="Estimated Income"
          value="₹40 Lakhs+"
          color="#d97706"
          background="#fff7ed"
        />
      </div>

      {/* Suspicious Patterns */}

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: '#334155',
            marginBottom: 14,
          }}
        >
          Suspicious Patterns
        </div>

        {suspicious.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 0',
              borderBottom:
                index !== suspicious.length - 1
                  ? '1px solid #e2e8f0'
                  : 'none',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ef4444',
                marginTop: 7,
                flexShrink: 0,
              }}
            />

            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: '#0f172a',
                  fontSize: 14,
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  marginTop: 5,
                  color: '#64748b',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insight */}

      <div
        style={{
          marginTop: 24,
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 10,
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
            AI Insight
          </span>
        </div>

        <div
          style={{
            color: '#334155',
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          Based on banking activity, luxury purchases, travel history and
          investments, AI estimates the respondent's annual income to be
          significantly higher than the declared affidavit. These
          inconsistencies may strengthen the maintenance claim.
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------ */

function IncomeCard({
  title,
  value,
  color,
  background,
}: {
  title: string
  value: string
  color: string
  background: string
}) {
  return (
    <div
      style={{
        background,
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 18,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 13,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color,
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  )
}