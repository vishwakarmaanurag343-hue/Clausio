'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { integrationsApi } from '@/lib/api'

// ── Settings → Integrations: connect / status / re-sync / disconnect ──
export default function IntegrationsSettings() {
  const searchParams = useSearchParams()
  const [status, setStatus]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const autoOpened = useRef(false)

  const load = useCallback(() => {
    integrationsApi.getStatus()
      .then(setStatus)
      .catch(err => setMessage({ kind: 'err', text: err.message }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Surface OAuth callback results (?connected=1 / ?error=...) and clear them from the URL.
  useEffect(() => {
    if (searchParams.get('connected')) {
      setMessage({ kind: 'ok', text: 'Google Calendar connected. Your hearings and deadlines are syncing.' })
      window.history.replaceState({}, '', '/settings?section=Integrations')
      setLoading(true)
      load()
    }
    const err = searchParams.get('error')
    if (err) {
      setMessage({ kind: 'err', text: decodeURIComponent(err).replace(/_/g, ' ') })
      window.history.replaceState({}, '', '/settings?section=Integrations')
    }
  }, [searchParams, load])

  async function connect() {
    setBusy(true)
    try {
      const res = await integrationsApi.getAuthUrl()
      if (!res?.url) throw new Error(res?.error || 'Could not start the connection.')
      // Remember to reopen this section after Google redirects back.
      try { localStorage.setItem('clausio_settings_section', 'Integrations') } catch {}
      window.location.href = res.url
    } catch (err: any) {
      setMessage({ kind: 'err', text: err.message })
      setBusy(false)
    }
  }

  async function resync() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await integrationsApi.resync()
      setMessage({ kind: 'ok', text: `Re-sync complete — ${res.pushed ?? 0} event${res.pushed === 1 ? '' : 's'} on your calendar.` })
      load()
    } catch (err: any) {
      setMessage({ kind: 'err', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect Google Calendar? Events already on your calendar stay there.')) return
    setBusy(true)
    try {
      await integrationsApi.disconnect()
      setMessage({ kind: 'ok', text: 'Google Calendar disconnected.' })
      load()
    } catch (err: any) {
      setMessage({ kind: 'err', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const connected = !!status?.connected

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Integrations</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
        Connect your Google Calendar so upcoming hearings, court-order deadlines and client meetings appear
        automatically — with reminders — even when you're not in Clausio.
      </p>

      {/* Status card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        border: `1px solid ${connected ? '#a7f3d0' : '#e2e8f0'}`,
        background: connected ? '#f0fdf4' : '#f8fafc',
        borderRadius: 12, padding: 18, marginBottom: 16,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: connected ? '#dcfce7' : '#f1f5f9',
        }}>
          <i className="ti ti-brand-google" style={{ fontSize: 22, color: connected ? '#059669' : '#94a3b8' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: loading ? '#cbd5e1' : connected ? '#10b981' : '#cbd5e1', boxShadow: connected ? '0 0 0 3px #d1fae5' : 'none' }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Google Calendar</span>
            {!loading && <span style={{ fontSize: 11, fontWeight: 700, color: connected ? '#059669' : '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{connected ? 'Connected' : 'Not connected'}</span>}
          </div>
          <div style={{ marginTop: 3, fontSize: 12, color: '#64748b' }}>
            {loading
              ? 'Checking connection…'
              : connected
                ? status.lastSyncedAt
                  ? `Last synced ${new Date(status.lastSyncedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
                  : 'Connected — sync will run with your next change.'
                : 'Hearings within 30 days, open deadlines and client meetings get pushed automatically.'}
          </div>
          {!loading && connected && status.lastSyncError && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#dc2626' }}>⚠ Last sync error: {status.lastSyncError}</div>
          )}
        </div>

        {!loading && !connected && (
          <button onClick={connect} disabled={busy} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            border: 'none', borderRadius: 10, background: busy ? '#93c5fd' : '#2563eb',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', whiteSpace: 'nowrap',
          }}>
            <i className="ti ti-brand-google" /> Connect Google Calendar
          </button>
        )}
        {!loading && connected && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={resync} disabled={busy} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#334155',
              fontWeight: 600, fontSize: 12, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}>
              <i className="ti ti-refresh" style={{ fontSize: 13 }} /> {busy ? 'Syncing…' : 'Re-sync now'}
            </button>
            <button onClick={disconnect} disabled={busy} style={{
              padding: '8px 14px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
              background: 'rgba(239,68,68,0.06)', color: '#dc2626', fontWeight: 600, fontSize: 12,
              cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              Disconnect
            </button>
          </div>
        )}
      </div>

      {message && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14,
          background: message.kind === 'ok' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${message.kind === 'ok' ? '#bbf7d0' : '#fca5a5'}`,
          color: message.kind === 'ok' ? '#15803d' : '#dc2626',
        }}>{message.text}</div>
      )}

      {/* What gets synced */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { icon: 'ti-gavel', color: '#2563eb', title: 'Upcoming hearings (30-day window)', desc: 'Day-before + morning-of pop-up reminders. Reschedules and adjournments update the same event automatically.' },
          { icon: 'ti-clock-due', color: '#d97706', title: 'Court-order deadlines', desc: 'Reminder 3 days before each deadline; marked [COMPLETED] on your calendar once done.' },
          { icon: 'ti-users-group', color: '#7c3aed', title: 'Client meetings', desc: 'Scheduled from inside a case — pushed instantly with location and notes.' },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
            <i className={`ti ${row.icon}`} style={{ fontSize: 17, color: row.color, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{row.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{row.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
