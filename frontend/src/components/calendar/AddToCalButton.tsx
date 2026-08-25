'use client'

import { useState } from 'react'
import { calendarApi } from '@/lib/api'

// ── Manual "Add to Google Calendar" icon-button for a hearing or a court-order deadline ──
export default function AddToCalButton({ kind, caseId, id, title }: {
  kind: 'hearing' | 'order'
  caseId: string
  id: string
  title?: string
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')

  async function push() {
    if (state === 'busy') return
    setState('busy')
    try {
      const res = kind === 'hearing'
        ? await calendarApi.pushHearing(caseId, id)
        : await calendarApi.pushOrder(caseId, id)
      if (res?.eventUrl) window.open(res.eventUrl, '_blank', 'noopener')
      setState('done')
      setTimeout(() => setState('idle'), 4000)
    } catch (err) {
      // Not connected / server not configured — send the user to Settings → Integrations.
      try { localStorage.setItem('clausio_settings_section', 'Integrations') } catch {}
      if (confirm(title ? `Could not add "${title}" to your calendar. Open Settings to connect Google Calendar?` : 'Could not add to your calendar. Open Settings to connect Google Calendar?')) {
        window.location.href = '/settings?section=Integrations'
      }
      setState('idle')
    }
  }

  return (
    <button
      onClick={push}
      title={state === 'done' ? 'Added to Google Calendar ✓' : title ?? 'Add to Google Calendar'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 24, height: 24, borderRadius: 6,
        border: state === 'done' ? '1px solid rgba(5,150,105,0.3)' : '1px solid #e2e8f0',
        background: state === 'done' ? '#ecfdf5' : '#fff',
        color: state === 'done' ? '#059669' : '#94a3b8',
        cursor: state === 'busy' ? 'wait' : 'pointer',
        fontSize: 13, flexShrink: 0,
      }}
    >
      {state === 'busy'
        ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', fontSize: 12 }} />
        : <i className={state === 'done' ? 'ti ti-check' : 'ti ti-calendar-plus'} style={{ fontSize: 12 }} />}
    </button>
  )
}
