'use client'

interface Props {
  readiness: any
  loading:   boolean
}

function scoreLabel(score: number) {
  if (score >= 80) return { text: 'Ready for Hearing',  badge: 'Good Shape',  color: '#16a34a' }
  if (score >= 50) return { text: 'Needs Attention',    badge: 'In Progress', color: '#d97706' }
  return               { text: 'Not Ready',             badge: 'At Risk',     color: '#dc2626' }
}

export default function ReadinessScore({ readiness, loading }: Props) {
  const score = readiness?.score ?? readiness?.readinessScore ?? 0
  const label = scoreLabel(score)

  // ✅ Use dimension scores from AI if available, otherwise derive from score
  const dimensionScores = readiness?.dimensionScores ?? null
  const evidence   = dimensionScores?.evidence   ?? Math.round(score * 0.30)
  const witnesses  = dimensionScores?.witnesses  ?? Math.round(score * 0.20)
  const research   = dimensionScores?.research   ?? Math.round(score * 0.20)
  const procedural = dimensionScores?.procedural ?? Math.round(score * 0.20)
  const strategy   = dimensionScores?.strategy   ?? Math.round(score * 0.10)

  const dimensions = [
    { label: 'Evidence',    value: evidence,   max: 30 },
    { label: 'Witnesses',   value: witnesses,  max: 20 },
    { label: 'Research',    value: research,   max: 20 },
    { label: 'Procedural',  value: procedural, max: 20 },
    { label: 'Strategy',    value: strategy,   max: 10 },
  ]

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Hearing Readiness</h2>
          <p style={{ marginTop: 2, fontSize: 12, color: '#64748b' }}>Overall preparation score.</p>
        </div>
        {readiness && (
          <div style={{ background: `${label.color}1a`, border: `1px solid ${label.color}33`, color: label.color, padding: '4px 10px', borderRadius: 20, fontWeight: 600, fontSize: 11 }}>
            {label.badge}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading...</div>
      )}

      {!loading && !readiness && (
        <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
          Click Generate AI Report to assess this case.
        </div>
      )}

      {!loading && readiness && (
        <>
          {/* Big score number */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64, fontWeight: 700, color: label.color, lineHeight: 1, letterSpacing: '-2px' }}>
              {score}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>out of 100</div>
            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>{label.text}</div>
          </div>

          {/* Overall progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ height: 12, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${score}%`, height: '100%', background: label.color, borderRadius: 999, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Dimension breakdown */}
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Breakdown
          </div>
          {dimensions.map(d => (
            <MetricBar
              key={d.label}
              label={d.label}
              value={d.value}
              max={d.max}
              color={d.value >= d.max * 0.7 ? '#16a34a' : d.value >= d.max * 0.4 ? '#f59e0b' : '#ef4444'}
            />
          ))}
        </>
      )}
    </div>
  )
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}/{max}</span>
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  )
}
