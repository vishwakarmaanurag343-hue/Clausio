'use client'

import { useEffect, useState } from 'react'
import CalendarView from '@/components/calendar/CalendarView'

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="glass-panel mobile-calendar-container" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>📅 Calendar</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            Your real Google Calendar — hearings, deadlines, meetings and everything else, in one place.
          </p>
        </div>
        <a href="/settings?section=Integrations" className="glass-button" style={{
          fontSize: 12.5, fontWeight: 600, color: '#2563eb', textDecoration: 'none',
          padding: '9px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⚙ Calendar settings
        </a>
      </div>

      {mounted && <CalendarView />}
    </div>
  )
}
