'use client'

export default function DeadlineBanner() {
  return (
    <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(254, 242, 242, 0.5)', border: '1px solid rgba(239, 68, 68, 0.2)', borderLeft: '4px solid #ef4444', padding: '12px 16px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: '#dc2626' }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14 }}>
            2 Overdue Deadlines
          </div>
          <div style={{ marginTop: 2, fontSize: 13, color: '#7f1d1d' }}>
            Respondent Reply was due on <b>27 May</b>. <span style={{ opacity: 0.5 }}>|</span> Petitioner Affidavit was due on <b>1 June</b>.
          </div>
        </div>
      </div>
      <button className="glass-button" style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
        Resolve
      </button>
    </div>
  )
}