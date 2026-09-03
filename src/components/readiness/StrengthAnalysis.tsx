'use client'

interface Strength {
  title: string
  confidence: number
  description: string
  strategy: string
}

const strengths: Strength[] = [
  {
    title: 'Medical Evidence',
    confidence: 97,
    description:
      'Hospital records clearly establish the injuries and treatment timeline.',
    strategy:
      'Use as primary evidence to establish cruelty and support oral testimony.',
  },
  {
    title: 'WhatsApp Conversations',
    confidence: 92,
    description:
      'Chat history contains admissions and consistent communication supporting your client',
    strategy:
      'Highlight key admissions during cross-examination and final arguments.',
  },
  {
    title: 'Financial Records',
    confidence: 89,
    description:
      'Bank statements and expenditure records indicate a higher standard of living than declared.',
    strategy:
      'Use these documents to challenge the respondent’s income disclosure.',
  },
]

export default function StrengthAnalysis() {
  return (
    <div
      className="glass-card"
      style={{
        padding: 20,
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            Top Strengths
          </h2>

          <p
            style={{
              marginTop: 2,
              color: '#64748b',
              fontSize: 12,
            }}
          >
            Strongest points supporting your case.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            color: '#15803d',
            padding: '4px 10px',
            borderRadius: 20,
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          3 Strong
        </div>
      </div>

      {strengths.map((item) => (
        <StrengthCard
          key={item.title}
          item={item}
        />
      ))}

      {/* AI Insight */}

      <div
        style={{
          marginTop: 16,
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          borderRadius: 10,
          padding: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
          }}
        >
          <i
            className="ti ti-sparkles"
            style={{ color: '#2563eb', fontSize: 13 }}
          />

          <strong
            style={{
              color: '#2563eb',
              fontSize: 12
            }}
          >
            AI Insight
          </strong>
        </div>

        <div
          style={{
            color: '#334155',
            lineHeight: 1.6,
            fontSize: 12,
          }}
        >
          Your strongest evidence is documentary and digital.
          Begin the hearing with medical records, then reinforce
          them using WhatsApp conversations and financial
          inconsistencies to build a consistent narrative.
        </div>
      </div>
    </div>
  )
}

/* ===================================================== */

function StrengthCard({
  item,
}: {
  item: Strength
}) {
  return (
    <div
      style={{
        border: '1px solid rgba(0,0,0,0.05)',
        background: 'rgba(255,255,255,0.4)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: '#0f172a',
            fontSize: 13,
          }}
        >
          {item.title}
        </div>

        <span
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            color: '#15803d',
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 10,
          }}
        >
          {item.confidence}% Confidence
        </span>
      </div>

      <div
        style={{
          color: '#64748b',
          fontSize: 12,
          lineHeight: 1.5,
          marginBottom: 10,
        }}
      >
        {item.description}
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 8,
          padding: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#2563eb',
            marginBottom: 4,
          }}
        >
          Court Strategy
        </div>

        <div
          style={{
            fontSize: 11,
            color: '#475569',
            lineHeight: 1.5,
          }}
        >
          {item.strategy}
        </div>
      </div>

      <button
        className="glass-button"
        style={{
          width: '100%',
          padding: '6px 0',
          borderRadius: 8,
          border: 'none',
          background: '#16a34a',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 12,
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
        }}
      >
        Use in Arguments
      </button>
    </div>
  )
}