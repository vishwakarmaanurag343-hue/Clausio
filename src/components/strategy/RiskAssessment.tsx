'use client'

export default function RiskAssessment() {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: 20,
        boxShadow: '0 2px 8px rgba(15,23,42,.04)',
        height: '100%',
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <i
          className="ti ti-shield-check"
          style={{
            fontSize: 20,
            color: '#2563eb',
          }}
        />

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Risk Assessment
          </h2>

          <p
            style={{
              margin: '4px 0 0',
              fontSize: 13,
              color: '#64748b',
            }}
          >
            AI evaluation of current case strength
          </p>
        </div>
      </div>

      {/* Verdict Probability */}

      <div
        style={{
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: '#334155',
            marginBottom: 14,
          }}
        >
          Verdict Probability
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 12,
          }}
        >
          <ScoreCard
            color="#22c55e"
            value="75%"
            title="Favorable"
          />

          <ScoreCard
            color="#f59e0b"
            value="20%"
            title="Partial"
          />

          <ScoreCard
            color="#ef4444"
            value="5%"
            title="Adverse"
          />
        </div>
      </div>

      {/* Divider */}

      <div
        style={{
          height: 1,
          background: '#e2e8f0',
          margin: '20px 0',
        }}
      />

      {/* Case Killer */}

      <div>
        <div
          style={{
            fontWeight: 700,
            color: '#dc2626',
            marginBottom: 8,
          }}
        >
          Case Killer
        </div>

        <p
          style={{
            margin: 0,
            color: '#475569',
            lineHeight: 1.7,
            fontSize: 14,
          }}
        >
          If Dr. Mehta (Lavali Hospital) appears for testimony,
          the physical cruelty allegations become significantly
          stronger.
        </p>
      </div>

      {/* Divider */}

      <div
        style={{
          height: 1,
          background: '#e2e8f0',
          margin: '22px 0',
        }}
      />

      {/* AI Insight */}

      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 12,
          padding: 16,
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

        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: '#334155',
            lineHeight: 1.8,
          }}
        >
          Secure Dr. Mehta's witness commitment before the
          next hearing and prepare a corroborating medical
          record bundle. This could substantially increase
          the probability of success.
        </p>
      </div>
    </div>
  )
}

/* ========================================================= */

function ScoreCard({
  value,
  title,
  color,
}: {
  value: string
  title: string
  color: string
}) {
  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 16,
        textAlign: 'center',
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          fontWeight: 600,
          color: '#64748b',
        }}
      >
        {title}
      </div>
    </div>
  )
}