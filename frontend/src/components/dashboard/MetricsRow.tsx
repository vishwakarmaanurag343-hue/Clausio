// 4 metric cards at the top of the dashboard — real counts for the selected case
interface Props {
  hearings: any[]
  documents: any[]
  caseData: any
  overdueCount: number
}

export default function MetricsRow({ hearings, documents, caseData, overdueCount }: Props) {
  const missingDocs = documents.filter(d => d.status === 'Missing').length
  const readiness   = caseData?.readinessScore ?? 0

  const METRICS = [
    { value: hearings.length.toString(), label: 'Hearing entries', trend: hearings.length > 0 ? 'Recorded' : 'None yet', tClr: '#10b981', top: '#10b981' },
    { value: documents.length.toString(), label: 'Evidence items',  trend: missingDocs > 0 ? `${missingDocs} docs missing` : 'All present', tClr: missingDocs > 0 ? '#f59e0b' : '#10b981', top: '#3b82f6' },
    { value: `${readiness}%`, label: 'Case readiness',  trend: 'Current score',   tClr: '#10b981', top: '#f59e0b' },
    { value: overdueCount.toString(), label: 'Overdue items',   trend: overdueCount > 0 ? 'Act now' : 'All clear', tClr: overdueCount > 0 ? '#ef4444' : '#10b981', top: '#ef4444' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
      {METRICS.map((m, i) => (
        <div key={i} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, letterSpacing: '0.2px' }}>{m.label}</div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.top, opacity: 0.8, boxShadow: `0 0 8px ${m.top}80` }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', marginTop: 8 }}>{m.value}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: m.tClr, marginTop: 4 }}>{m.trend}</div>
        </div>
      ))}
    </div>
  )
}
