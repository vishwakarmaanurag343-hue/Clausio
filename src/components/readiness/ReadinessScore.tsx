'use client'

const metrics = [
  {
    label: 'Evidence Strength',
    value: 82,
    color: '#16a34a',
  },
  {
    label: 'Document Completeness',
    value: 56,
    color: '#f59e0b',
  },
  {
    label: 'Narrative Consistency',
    value: 78,
    color: '#16a34a',
  },
  {
    label: 'Financial Clarity',
    value: 65,
    color: '#f59e0b',
  },
]

export default function ReadinessScore() {
  return (
    <div
      className="glass-card"
      style={{
        padding: 20,
      }}
    >
      {/* ================= HEADER ================= */}

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
            Hearing Readiness
          </h2>

          <p
            style={{
              marginTop: 2,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            Overall preparation score.
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
          Good Shape
        </div>
      </div>

      {/* ================= SCORE ================= */}

      <div
        style={{
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#16a34a',
            lineHeight: 1,
            letterSpacing: '-1px'
          }}
        >
          72
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#334155',
          }}
        >
          Ready for Hearing
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: '#94a3b8',
          }}
        >
          Last Updated • 17 July 2024
        </div>
      </div>

      {/* ================= METRICS ================= */}

      {metrics.map((item) => (
        <MetricBar
          key={item.label}
          {...item}
        />
      ))}

      {/* ================= AI CARD ================= */}

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
            AI Recommendation
          </strong>
        </div>

        <div
          style={{
            lineHeight: 1.6,
            color: '#334155',
            fontSize: 12,
          }}
        >
          Overall case preparation is strong.
          Improve document completeness before the
          next hearing by filing the pending financial
          disclosure and confirming witness attendance.
        </div>
      </div>
    </div>
  )
}

/* ================================================= */

function MetricBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div
      style={{
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: '#334155',
          }}
        >
          {label}
        </span>

        <span
          style={{
            fontWeight: 700,
            color,
          }}
        >
          {value}/100
        </span>
      </div>

      <div
        style={{
          height: 10,
          background: '#e2e8f0',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  )
}