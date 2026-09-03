// 4 metric cards at the top of the dashboard
const METRICS = [
  { value: '14',  label: 'Hearing entries', trend: 'Next in 6 days', tClr: '#10b981', top: '#10b981' },
  { value: '8',   label: 'Evidence items',  trend: '3 docs missing',  tClr: '#f59e0b', top: '#3b82f6' },
  { value: '72%', label: 'Case readiness',  trend: '+8% this week',   tClr: '#10b981', top: '#f59e0b' },
  { value: '2',   label: 'Overdue items',   trend: 'Act now',         tClr: '#ef4444', top: '#ef4444' },
]

export default function MetricsRow() {
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
