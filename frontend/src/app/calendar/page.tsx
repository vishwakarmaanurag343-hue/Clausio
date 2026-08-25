'use client'

import { useEffect, useState } from 'react'
import CalendarView from '@/components/calendar/CalendarView'

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>📅 Calendar</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Your real Google Calendar — hearings, deadlines, meetings and everything else, in one place.
          </p>
        </div>
        <a href="/settings?section=Integrations" style={{
          fontSize: 12.5, fontWeight: 600, color: '#2563eb', textDecoration: 'none',
          border: '1px solid #dbeafe', background: '#eff6ff', padding: '9px 14px', borderRadius: 10,
        }}>
          ⚙ Calendar settings
        </a>
      </div>

      {mounted && <CalendarView />}
    </div>
  )
}
