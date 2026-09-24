'use client'
export default function CalendarPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16, textAlign: 'center', padding: 40 }}>
      <i className="ti ti-calendar" style={{ fontSize: 64, color: '#cbd5e1' }} />
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Calendar — Coming Soon</h2>
      <p style={{ fontSize: 15, color: '#64748b', maxWidth: 400, lineHeight: 1.7, margin: 0 }}>
        Google Calendar integration is coming soon. Your hearings and deadlines will sync automatically once available.
      </p>
      <div style={{ marginTop: 8, padding: '8px 20px', background: '#f1f5f9', borderRadius: 20, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
        🚧 Under Development
      </div>
    </div>
  )
}
