'use client'

interface Props {
  readiness: any
  loading:   boolean
  columns?:  1 | 2
}

export default function StrengthsGaps({ readiness, loading, columns = 2 }: Props) {
  const strengths: string[] = Array.isArray(readiness?.strengths) ? readiness.strengths : []
  const gaps: string[]      = Array.isArray(readiness?.gaps) ? readiness.gaps : []

  if (loading) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: columns === 2 ? '1fr 1fr' : '1fr', gap: 16 }}>
      {/* Strengths */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <i className="ti ti-circle-check" style={{ fontSize: 14, color: '#15803d' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: 1 }}>Strengths</span>
          {strengths.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d' }}>
              {strengths.length}
            </span>
          )}
        </div>
        {strengths.length === 0 ? (
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Nothing identified yet.</div>
        ) : strengths.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: i < strengths.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <i className="ti ti-check" style={{ color: '#10b981', fontSize: 14, flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.55 }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Gaps */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: '#dc2626' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1 }}>Gaps</span>
          {gaps.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
              {gaps.length}
            </span>
          )}
        </div>
        {gaps.length === 0 ? (
          <div style={{ fontSize: 12, color: '#16a34a' }}>None identified — good shape.</div>
        ) : gaps.map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: i < gaps.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <i className="ti ti-point" style={{ color: '#ef4444', fontSize: 14, flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.55 }}>{g}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
