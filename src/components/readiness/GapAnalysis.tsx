'use client'

interface Gap {
  title: string
  severity: 'High' | 'Medium' | 'Low'
  description: string
  effort: string
}

const gaps: Gap[] = [
  {
    title: 'Witness Confirmation Pending',
    severity: 'High',
    description:
      'Primary witness attendance has not been confirmed before the next hearing.',
    effort: '15 mins',
  },
  {
    title: 'Financial Disclosure Missing',
    severity: 'High',
    description:
      'Income affidavit and supporting bank statements are incomplete.',
    effort: '30 mins',
  },
  {
    title: 'Medical Evidence Incomplete',
    severity: 'Medium',
    description:
      'Latest hospital records have not yet been filed with the court.',
    effort: '20 mins',
  },
]

export default function GapAnalysis() {
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
            Top Gaps
          </h2>

          <p
            style={{
              marginTop: 2,
              color: '#64748b',
              fontSize: 12,
            }}
          >
            Issues requiring attention before the next hearing.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            color: '#dc2626',
            padding: '4px 10px',
            borderRadius: 20,
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          3 Critical
        </div>
      </div>

      {gaps.map((gap, index) => (
        <GapCard
          key={index}
          gap={gap}
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
            gap: 6,
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <i
            className="ti ti-sparkles"
            style={{
              color: '#2563eb',
              fontSize: 13
            }}
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
            fontSize: 12,
            color: '#334155',
            lineHeight: 1.6,
          }}
        >
          Resolving these three issues is estimated to improve your
          readiness score from <strong>72%</strong> to approximately
          <strong> 89%</strong>.
        </div>
      </div>
    </div>
  )
}

/* ================================================= */

function GapCard({
  gap,
}: {
  gap: Gap
}) {
  const badge =
    gap.severity === 'High'
      ? {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.2)',
          color: '#dc2626',
        }
      : gap.severity === 'Medium'
      ? {
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.2)',
          color: '#d97706',
        }
      : {
          bg: 'rgba(34, 197, 94, 0.1)',
          border: 'rgba(34, 197, 94, 0.2)',
          color: '#16a34a',
        }

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
          {gap.title}
        </div>

        <span
          style={{
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            color: badge.color,
            padding: '2px 8px',
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {gap.severity}
        </span>
      </div>

      <div
        style={{
          color: '#64748b',
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        {gap.description}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: '#475569',
          }}
        >
          Effort: <strong>{gap.effort}</strong>
        </span>

        <button
          className="glass-button"
          style={{
            padding: '4px 12px',
            borderRadius: 8,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 11,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          Resolve
        </button>
      </div>
    </div>
  )
}