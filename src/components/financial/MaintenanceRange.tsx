'use client'

interface Factor {
  label: string
  value: string
}

const factors: Factor[] = [
  {
    label: 'Estimated Monthly Income',
    value: '₹3.35 Lakhs',
  },
  {
    label: 'Dependent Children',
    value: '1',
  },
  {
    label: 'Marriage Duration',
    value: '8 Years',
  },
  {
    label: 'Lifestyle Category',
    value: 'Upper Middle Class',
  },
]

export default function MaintenanceRange() {
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
          marginBottom: 24,
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
            Maintenance Range
          </h2>

          <p
            style={{
              marginTop: 6,
              fontSize: 14,
              color: '#64748b',
            }}
          >
            AI estimated maintenance recommendation.
          </p>
        </div>

        <div
          style={{
            background: '#dcfce7',
            color: '#15803d',
            padding: '8px 14px',
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          91% Confidence
        </div>
      </div>

      {/* Amount Cards */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 14,
          marginBottom: 26,
        }}
      >
        <AmountCard
          title="Minimum"
          amount="₹35,000"
          color="#2563eb"
          background="#eff6ff"
        />

        <AmountCard
          title="Recommended"
          amount="₹50,000"
          color="#16a34a"
          background="#f0fdf4"
          highlight
        />

        <AmountCard
          title="Maximum"
          amount="₹75,000"
          color="#d97706"
          background="#fff7ed"
        />
      </div>

      {/* Factors */}

      <div
        style={{
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: '#334155',
            fontSize: 16,
            marginBottom: 14,
          }}
        >
          Calculation Factors
        </div>

        {factors.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom:
                index !== factors.length - 1
                  ? '1px solid #e2e8f0'
                  : 'none',
            }}
          >
            <span
              style={{
                color: '#64748b',
                fontSize: 14,
              }}
            >
              {item.label}
            </span>

            <span
              style={{
                color: '#0f172a',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* AI Recommendation */}

      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 12,
          padding: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
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
              fontWeight: 700,
              color: '#2563eb',
            }}
          >
            AI Recommendation
          </span>
        </div>

        <div
          style={{
            fontSize: 14,
            color: '#334155',
            lineHeight: 1.8,
          }}
        >
          Based on the estimated annual income, lifestyle, child's educational
          expenses and marriage duration, the AI recommends seeking
          <strong> ₹50,000 per month</strong> as interim maintenance. The
          available financial indicators support this range.
        </div>
      </div>

      {/* Footer Buttons */}

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 22,
        }}
      >
        <button
          style={secondaryButton}
        >
          View Calculation
        </button>

        <button
          style={primaryButton}
        >
          Generate Draft
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------ */

function AmountCard({
  title,
  amount,
  color,
  background,
  highlight,
}: {
  title: string
  amount: string
  color: string
  background: string
  highlight?: boolean
}) {
  return (
    <div
      style={{
        background,
        border: highlight
          ? '2px solid #16a34a'
          : '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 18,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: '#64748b',
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color,
        }}
      >
        {amount}
      </div>
    </div>
  )
}

/* ------------------------------------------------ */

const secondaryButton: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  cursor: 'pointer',
  fontWeight: 600,
}

const primaryButton: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  borderRadius: 10,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
}