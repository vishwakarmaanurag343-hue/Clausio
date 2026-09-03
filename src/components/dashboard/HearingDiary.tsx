// Hearing diary card — shows judge orders with OVERDUE badges
const ITEMS = [
  { text: 'Respondent reply to interim application', sub: 'Due 27 May · Respondent', dot: '#dc2626', overdue: true  },
  { text: 'File affidavit of assets',               sub: 'Due 1 Jun · Petitioner',  dot: '#dc2626', overdue: true  },
  { text: 'Cross-exam prep — Savitribai',           sub: 'Due 14 Jun · Lawyer',     dot: '#3b82f6', overdue: false },
  { text: 'Collect ITR copies from client',         sub: 'Due 15 Jun · Client',     dot: '#3b82f6', overdue: false },
]

export default function HearingDiary() {
  return (
    <div className="glass-card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
        <i className="ti ti-notebook" style={{ fontSize: 16, color: '#64748b' }} />
        Hearing diary
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>+ Add order</span>
      </div>
      {ITEMS.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < ITEMS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${item.dot}40` }} />
          <div>
            <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.4, fontWeight: 500 }}>
              {item.text}
              {item.overdue && <span className="glass-pill" style={{ fontSize: 9, padding: '2px 6px', marginLeft: 6, fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)' }}>OVERDUE</span>}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
