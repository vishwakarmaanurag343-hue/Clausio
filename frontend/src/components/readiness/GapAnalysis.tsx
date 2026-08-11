'use client'

interface Props {
  readiness: any
  loading:   boolean
}

export default function GapAnalysis({ readiness, loading }: Props) {
  const gaps: any[] = readiness?.gaps ?? readiness?.checklistItems ?? []

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      {/* Header */}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Outstanding Items</h2>
          <p style={{ marginTop: 2, color: '#64748b', fontSize: 12 }}>Issues requiring attention before the next hearing.</p>
        </div>

        {gaps.length > 0 && (
          <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: '#dc2626', padding: '4px 10px', borderRadius: 20, fontWeight: 600, fontSize: 11 }}>
            {gaps.length} Pending
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 12 }}>Loading...</div>
      )}

      {!loading && !readiness && (
        <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>No assessment yet.</div>
      )}

      {!loading && readiness && gaps.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#16a34a', fontSize: 12 }}>No outstanding items — great shape!</div>
      )}

      {gaps.map((gap) => (
        <GapCard key={gap.id} gap={gap} />
      ))}
    </div>
  )
}

/* ================================================= */

function GapCard({ gap }: { gap: any }) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
            {gap.title ?? gap.text ?? 'Unknown gap'}
          </div>
          {(gap.severity ?? gap.category) && (
            <span style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#d97706', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {gap.severity ?? gap.category}
            </span>
          )}
                </div>
    </div>
  )
}
