'use client'

interface Props {
  readiness: any
  loading:   boolean
}

export default function StrengthAnalysis({ readiness, loading }: Props) {
  // ✅ Use strengths from AI JSON first, then fall back to done checklist items
  const strengths: any[] = readiness?.strengths?.length
    ? readiness.strengths
    : (readiness?.checklistItems ?? []).filter((i: any) => i.done)

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Case Strengths</h2>
          <p style={{ marginTop: 2, color: '#64748b', fontSize: 12 }}>What is already working well in this case.</p>
        </div>
        {strengths.length > 0 && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#15803d', padding: '4px 10px', borderRadius: 20, fontWeight: 600, fontSize: 11 }}>
            {strengths.length} Strengths
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 12 }}>Loading...</div>
      )}

      {!loading && !readiness && (
        <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>No assessment yet. Click Generate AI Report.</div>
      )}

      {!loading && readiness && strengths.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>
          Generate AI Report to identify case strengths.
        </div>
      )}

      {strengths.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < strengths.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
          <i className="ti ti-circle-check" style={{ color: '#10b981', fontSize: 16, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>
            {typeof item === 'string' ? item : item.text ?? item.title ?? item.item ?? ''}
          </div>
        </div>
      ))}
    </div>
  )
}
