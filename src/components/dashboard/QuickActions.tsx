'use client'
// 6 quick action buttons — Emergency is visually distinct
const ACTIONS = [
  { icon: 'ti-alert-triangle', label: 'Emergency response', danger: true  },
  { icon: 'ti-clipboard-list', label: 'Hearing brief',      danger: false },
  { icon: 'ti-message',        label: 'Client update',      danger: false },
  { icon: 'ti-brain',          label: 'AI summary',         danger: false },
  { icon: 'ti-pencil',         label: 'Draft petition',     danger: false },
  { icon: 'ti-chart-bar',      label: 'Risk assessment',    danger: false },
]

export default function QuickActions() {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, paddingLeft: 4 }}>Quick actions</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {ACTIONS.map((a, i) => (
          <button key={i} className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: a.danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.6)', border: a.danger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.8)', borderRadius: 16, fontSize: 13, color: a.danger ? '#dc2626' : '#0f172a', cursor: 'pointer', fontFamily: 'inherit', fontWeight: a.danger ? 700 : 600, textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <i className={`ti ${a.icon}`} style={{ fontSize: 16, flexShrink: 0, color: a.danger ? '#dc2626' : '#64748b' }} />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
