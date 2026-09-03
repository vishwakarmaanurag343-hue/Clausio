'use client'

interface Hearing {
  id: number
  date: string
  stage: string
  description: string
  latest?: boolean
}

const hearings: Hearing[] = [
  {
    id: 1,
    date: '17 Jun 2024',
    stage: 'Interim Application',
    latest: true,
    description:
      'Judge expressed strong displeasure over repeated delays. Final opportunity granted to Respondent.',
  },
  {
    id: 2,
    date: '6 May 2024',
    stage: 'Interim Application',
    description:
      'Respondent requested additional time for filing reply. Matter adjourned.',
  },
  {
    id: 3,
    date: '4 Mar 2024',
    stage: 'Written Statement',
    description:
      'Written Statement filed. Replication directed within 30 days.',
  },
  {
    id: 4,
    date: '16 Jan 2024',
    stage: 'First Appearance',
    description:
      'Both parties appeared before the Court. Notice confirmed.',
  },
]

export default function HearingHistory() {
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            Hearing History
          </h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
            Previous hearing records
          </p>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {hearings.map((hearing, index) => (
          <div key={hearing.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
            {/* Timeline */}
            <div style={{ width: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: hearing.latest ? '#3b82f6' : '#cbd5e1', border: '3px solid #ffffff', boxShadow: hearing.latest ? '0 0 0 2px #3b82f6' : '0 0 0 2px #e2e8f0', zIndex: 2 }} />
              {index !== hearings.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 70, background: 'rgba(0,0,0,0.05)', marginTop: 4 }} />
              )}
            </div>

            {/* Card */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{hearing.date}</div>
                  <div style={{ marginTop: 2, color: '#2563eb', fontWeight: 600, fontSize: 12 }}>{hearing.stage}</div>
                </div>
                {hearing.latest && (
                  <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    LATEST
                  </span>
                )}
              </div>
              <p style={{ margin: 0, lineHeight: 1.5, color: '#475569', fontSize: 13 }}>
                {hearing.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Summary */}
      <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Total Hearings</div>
          <div style={{ marginTop: 2, fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{hearings.length}</div>
        </div>
        <button className="glass-button" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#ffffff', cursor: 'pointer', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
          View Complete Diary
        </button>
      </div>
    </div>
  )
}