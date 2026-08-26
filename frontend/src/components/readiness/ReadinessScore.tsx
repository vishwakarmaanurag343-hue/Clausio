'use client'

interface Props {
  readiness: any
  loading:   boolean
}

function band(score: number) {
  if (score >= 80) return { color: '#16a34a', badge: 'Ready for Hearing' }
  if (score >= 50) return { color: '#d97706', badge: 'Needs Attention' }
  return               { color: '#dc2626', badge: 'Not Ready' }
}

export default function ReadinessScore({ readiness, loading }: Props) {
  const score = Math.max(0, Math.min(100, readiness?.overallScore ?? readiness?.score ?? 0))
  const hasScore = !!readiness && (readiness.overallScore > 0 || readiness.score > 0)
  const label = band(score)
  const summary: string = readiness?.scoreSummary ?? readiness?.summary ?? ''

  const R = 74
  const CIRC = 2 * Math.PI * R

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Hearing Readiness</h2>
          <p style={{ marginTop: 2, fontSize: 12, color: '#64748b' }}>Overall preparation for the next hearing.</p>
        </div>
        {hasScore && (
          <div style={{ background: `${label.color}1a`, border: `1px solid ${label.color}33`, color: label.color, padding: '4px 10px', borderRadius: 20, fontWeight: 600, fontSize: 11 }}>
            {label.badge}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 13 }}>Loading...</div>
      )}

      {!loading && !hasScore && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
          Click Generate AI Report to assess this case.
        </div>
      )}

      {!loading && hasScore && (
        <>
          {/* Ring gauge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <svg width="190" height="190" viewBox="0 0 190 190">
              <circle cx="95" cy="95" r={R} fill="none" stroke="#e2e8f0" strokeWidth="13" />
              <circle cx="95" cy="95" r={R} fill="none" stroke={label.color} strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - score / 100)}
                transform="rotate(-90 95 95)"
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }} />
              <text x="95" y="92" textAnchor="middle" fontSize="46" fontWeight="700" fill={label.color} letterSpacing="-1">{score}</text>
              <text x="95" y="116" textAnchor="middle" fontSize="12" fontWeight="600" fill="#94a3b8">out of 100</text>
            </svg>
          </div>

          {summary && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                What&apos;s Driving This Score
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: '#334155' }}>{summary}</p>
            </>
          )}
        </>
      )}
    </div>
  )
}
