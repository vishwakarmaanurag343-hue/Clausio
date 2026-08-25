'use client'

import { useState } from 'react'
import { meetingsApi } from '@/lib/api'

// ── "Schedule Client Meeting" — creates the meeting and auto-pushes it to Google Calendar ──
export default function ScheduleMeetingModal({ caseId, caseName, onClose, onSaved }: {
  caseId: string
  caseName?: string
  onClose: () => void
  onSaved?: () => void
}) {
  const [form, setForm]       = useState({ title: '', date: '', time: '', withPerson: '', location: '', notes: '' })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  // Local datetime → ISO for the API
  function toIso(date: string, time: string) {
    if (!date || !time) return ''
    return new Date(`${date}T${time}`).toISOString()
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Give the meeting a title.'); return }
    if (!toIso(form.date, form.time)) { setError('Pick a date and time.'); return }
    setSaving(true)
    try {
      await meetingsApi.create(caseId, {
        title: form.title.trim(),
        scheduledAt: toIso(form.date, form.time),
        withPerson: form.withPerson.trim() || null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      })
      onSaved?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not schedule the meeting.')
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 } as const

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onClick={e => e.stopPropagation()} onSubmit={save} style={{
        background: '#fff', borderRadius: 16, padding: 24, width: 480, maxWidth: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Schedule Client Meeting</h3>
            {caseName && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{caseName}</div>}
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-brand-google" /> It will be added to your connected Google Calendar automatically.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Title *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Client briefing before cross-examination" autoFocus style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Time *</label>
            <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>With</label>
            <input value={form.withPerson} onChange={e => setForm({ ...form, withPerson: e.target.value })} placeholder="Client / counsel…" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Chambers / Zoom…" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Notes</label>
          <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Agenda points…" style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {error && <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#93c5fd' : '#2563eb', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-calendar-plus" /> {saving ? 'Scheduling…' : 'Schedule & Add to Calendar'}
          </button>
        </div>
      </form>
    </div>
  )
}
