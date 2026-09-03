// AI Insights — right panel with recommendations and ask AI
const URGENT = [
  { dot: '#ef4444', text: 'Income proof missing — weakens maintenance claim', btn: 'Fix now',  bBg: '#fef2f2', bClr: '#991b1b' },
  { dot: '#f59e0b', text: 'Limitation expires in 14 days',                   btn: 'Draft',    bBg: '#fef3c7', bClr: '#92400e' },
]
const RECS = [
  { dot: '#10b981', text: 'Similar SC judgment supports cruelty ground',    btn: 'View',     bBg: '#f0fdf4', bClr: '#15803d' },
  { dot: '#3b82f6', text: 'Generate written statement — respondent overdue', btn: 'Generate', bBg: '#eff6ff', bClr: '#1e40af' },
]
const STRATEGY = ['Push for ex-parte maintenance at next hearing', 'Secure Dr. Mehta witness before 20 Jun']

export default function AIInsights() {
  return (
    <div className="glass-panel" style={{ height: 'calc(100% - 16px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'rgba(255,255,255,0.4)' }}>
        <i className="ti ti-brain" style={{ fontSize: 16, color: '#7c3aed' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', flex: 1 }}>AI insights</span>
        <span className="glass-pill" style={{ fontSize: 10, background: 'rgba(255,255,255,0.8)', color: '#7c3aed', padding: '4px 8px', fontWeight: 700, border: '1px solid rgba(124, 58, 237, 0.2)' }}>5 new</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Success probability */}
        <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 16, padding: '12px 16px', marginBottom: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 4 }}>Case success probability</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>78%</div>
          <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 4, marginTop: 8, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '78%', height: 6, background: '#10b981', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, fontWeight: 500 }}>Strong evidence · 3 SC precedents found</div>
        </div>

        <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700 }}>Urgent</p>
        {URGENT.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < URGENT.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.dot, flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${r.dot}40` }} />
            <div>
              <p style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.5, fontWeight: 500 }}>{r.text}</p>
              <button className="glass-button" style={{ marginTop: 6, fontSize: 11, padding: '4px 10px', border: 'none', background: r.bBg, color: r.bClr, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{r.btn}</button>
            </div>
          </div>
        ))}

        <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700, marginTop: 16 }}>Recommended</p>
        {RECS.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < RECS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.dot, flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${r.dot}40` }} />
            <div>
              <p style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.5, fontWeight: 500 }}>{r.text}</p>
              <button className="glass-button" style={{ marginTop: 6, fontSize: 11, padding: '4px 10px', border: 'none', background: r.bBg, color: r.bClr, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>{r.btn}</button>
            </div>
          </div>
        ))}

        <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700, marginTop: 16 }}>Strategy</p>
        {STRATEGY.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < STRATEGY.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginTop: 4, boxShadow: '0 0 8px rgba(124, 58, 237, 0.4)' }} />
            <p style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.5, fontWeight: 500 }}>{s}</p>
          </div>
        ))}
      </div>

      {/* Ask AI */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.5)' }}>
        <input type="text" placeholder="Ask Clausio AI about this case..." style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.7)', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} />
      </div>
    </div>
  )
}
