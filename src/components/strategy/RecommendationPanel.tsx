'use client'

interface Recommendation {
  id: number
  title: string
  description: string
  priority: 'Critical' | 'High' | 'Medium'
  impact: string
  time: string
}

const recommendations: Recommendation[] = [
  {
    id: 1,
    title: 'File Affidavit of Evidence',
    description:
      'Prepare and file the affidavit of evidence before the next hearing to strengthen the cruelty allegations.',
    priority: 'Critical',
    impact: 'Very High',
    time: '2 Days',
  },
  {
    id: 2,
    title: 'Summon Dr. Mehta',
    description:
      'Issue witness summons for Dr. Mehta from Lavali Hospital to corroborate the medical records.',
    priority: 'High',
    impact: 'High',
    time: '1 Day',
  },
  {
    id: 3,
    title: 'Collect Bank Statements',
    description:
      'Gather the last six months of financial records to support the maintenance claim.',
    priority: 'High',
    impact: 'Medium',
    time: '3 Days',
  },
  {
    id: 4,
    title: 'Prepare Cross Questions',
    description:
      'Draft focused cross-examination questions for the Respondent based on contradictions.',
    priority: 'Medium',
    impact: 'Medium',
    time: '2 Days',
  },
]

export default function RecommendationPanel() {
  return (
    <div
      style={{
        background: '#fff',
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
            AI Recommendations
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            Suggested next actions for this case.
          </p>
        </div>

        <button
          style={{
            padding: '10px 18px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Refresh AI
        </button>
      </div>

      {recommendations.map((item) => (
        <RecommendationCard
          key={item.id}
          item={item}
        />
      ))}
    </div>
  )
}

function RecommendationCard({
  item,
}: {
  item: Recommendation
}) {
  const color =
    item.priority === 'Critical'
      ? '#dc2626'
      : item.priority === 'High'
      ? '#d97706'
      : '#16a34a'

  const bg =
    item.priority === 'Critical'
      ? '#fef2f2'
      : item.priority === 'High'
      ? '#fff7ed'
      : '#f0fdf4'

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 18,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 17,
            color: '#0f172a',
          }}
        >
          {item.title}
        </div>

        <span
          style={{
            background: bg,
            color,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {item.priority}
        </span>
      </div>

      <div
        style={{
          marginTop: 12,
          color: '#475569',
          lineHeight: 1.7,
          fontSize: 14,
        }}
      >
        {item.description}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 16,
        }}
      >
        <InfoCard
          title="Impact"
          value={item.impact}
        />

        <InfoCard
          title="Time"
          value={item.time}
        />
      </div>

      <button
        style={{
          marginTop: 18,
          padding: '10px 18px',
          borderRadius: 10,
          border: 'none',
          background: '#2563eb',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Apply Recommendation
      </button>
    </div>
  )
}

function InfoCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        flex: 1,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#64748b',
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 5,
          fontWeight: 700,
          color: '#0f172a',
        }}
      >
        {value}
      </div>
    </div>
  )
}