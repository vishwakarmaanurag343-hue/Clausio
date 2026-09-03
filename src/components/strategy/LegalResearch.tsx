'use client'

interface ResearchResult {
  id: number
  title: string
  citation: string
  relevance: number
  summary: string
  section: string
}

const research: ResearchResult[] = [
  {
    id: 1,
    title: 'Rajnesh v. Neha',
    citation: '(2021) 2 SCC 324',
    relevance: 96,
    section: 'Maintenance',
    summary:
      'Supreme Court laid down comprehensive guidelines regarding interim maintenance, disclosure of income and timelines.',
  },
  {
    id: 2,
    title: 'Vimla Devi v. Mahesh Sharma',
    citation: 'Delhi HC',
    relevance: 89,
    section: 'Cruelty',
    summary:
      'Mental cruelty through continuous harassment and humiliation was held sufficient for matrimonial relief.',
  },
  {
    id: 3,
    title: 'Section 24 - Hindu Marriage Act',
    citation: 'Statutory Provision',
    relevance: 100,
    section: 'Maintenance',
    summary:
      'Interim maintenance and litigation expenses during pendency of matrimonial proceedings.',
  },
  {
    id: 4,
    title: 'Section 13(1)(ia) - Hindu Marriage Act',
    citation: 'Statutory Provision',
    relevance: 94,
    section: 'Cruelty',
    summary:
      'Defines cruelty as a valid ground for divorce including both physical and mental cruelty.',
  },
]

export default function LegalResearch() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: 24,
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
            Legal Research
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            AI identified the most relevant authorities.
          </p>
        </div>

        <button
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Run AI Research
        </button>
      </div>

      {research.map((item) => (
        <ResearchCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function ResearchCard({
  item,
}: {
  item: ResearchResult
}) {
  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 18,
        marginBottom: 18,
        background: '#ffffff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 17,
              color: '#0f172a',
            }}
          >
            {item.title}
          </div>

          <div
            style={{
              marginTop: 5,
              fontSize: 13,
              color: '#64748b',
            }}
          >
            {item.citation}
          </div>
        </div>

        <span
          style={{
            background: '#dcfce7',
            color: '#15803d',
            padding: '6px 12px',
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {item.relevance}% Match
        </span>
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: 14,
          color: '#334155',
          lineHeight: 1.7,
        }}
      >
        {item.summary}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
        }}
      >
        <span
          style={{
            background: '#eff6ff',
            color: '#2563eb',
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {item.section}
        </span>

        <button
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: '8px 14px',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#334155',
          }}
        >
          View Judgment
        </button>
      </div>
    </div>
  )
}