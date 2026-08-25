'use client'

// In-app Calendar tab — renders the lawyer's real Google Calendar inline via the
// Clausio proxy API. Clausio-synced events (hearings / deadlines / meetings) are
// colour-coded; everything else shows as personal. Slot clicks open a quick
// "Add Event" form; event clicks open edit/delete — no reload, no external tab.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction'
import { EventClickArg, EventSourceFuncArg } from '@fullcalendar/core'
import { userCalendarApi, integrationsApi, casesApi } from '@/lib/api'

type CalEvent = {
  id: string
  title: string
  start: string
  end?: string | null
  allDay?: boolean
  location?: string | null
  notes?: string | null
  clausioType?: string | null   // hearing | deadline | meeting | null (personal)
  caseId?: string | null
}

const COLORS: Record<string, { color: string; bg: string; label: string }> = {
  hearing:   { color: '#2563eb', bg: '#dbeafe', label: 'Hearing' },
  deadline:  { color: '#d97706', bg: '#fef3c7', label: 'Deadline' },
  meeting:   { color: '#7c3aed', bg: '#ede9fe', label: 'Client meeting' },
  personal:  { color: '#64748b', bg: '#f1f5f9', label: 'Personal' },
}
const colorOf = (t?: string | null) => COLORS[t ?? 'personal'] ?? COLORS.personal

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CalendarView() {
  const calRef = useRef<FullCalendar>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [cases, setCases] = useState<any[]>([])

  // modal state: mode 'create' | 'edit' | null
  const [modal, setModal] = useState<null | {
    mode: 'create' | 'edit'
    eventId?: string
    title: string
    start: string      // datetime-local value
    end: string
    location: string
    notes: string
    caseId: string
    clausioType?: string | null
  }>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    integrationsApi.getStatus()
      .then((s: any) => setConnected(!!s?.connected))
      .catch(() => setConnected(false))
    casesApi.getAll().then(setCases).catch(() => {})
  }, [])

  const refetch = useCallback(() => calRef.current?.getApi().refetchEvents(), [])

  // ── event source ──
  const eventsSource = useCallback(async (info: EventSourceFuncArg) => {
    try {
      const raw: CalEvent[] = await userCalendarApi.events(
        info.start.toISOString(), info.end.toISOString())
      return raw.map(e => ({
        id: e.id,
        title: e.title,
        start: e.allDay ? e.start.slice(0, 10) : e.start,
        end: e.allDay ? undefined : e.end ?? undefined,
        allDay: !!e.allDay,
        extendedProps: e,
        backgroundColor: colorOf(e.clausioType).color,
        borderColor: 'transparent',
      }))
    } catch (err: any) {
      if (/not connected|Connect your/i.test(err?.message ?? '')) setConnected(false)
      throw err
    }
  }, [])

  // ── interactions ──
  const onDateClick = (arg: DateClickArg) => {
    const base = arg.date < new Date(Date.now() - 60_000) ? arg.date : arg.date
    setModal({
      mode: 'create',
      title: '',
      start: toLocalInput(base),
      end: toLocalInput(new Date(base.getTime() + 60 * 60_000)),
      location: '', notes: '', caseId: '',
    })
  }

  const onEventClick = (arg: EventClickArg) => {
    const e = arg.event.extendedProps as CalEvent
    const start = arg.event.start
    const end = arg.event.end
    setModal({
      mode: 'edit',
      eventId: arg.event.id,
      title: e.title === '(untitled)' ? '' : e.title,
      start: start ? toLocalInput(start) : '',
      end: end ? toLocalInput(end) : start ? toLocalInput(new Date(start.getTime() + 3600_000)) : '',
      location: e.location ?? '',
      notes: e.notes ?? '',
      caseId: e.caseId ?? '',
      clausioType: e.clausioType ?? null,
    })
  }

  const save = async () => {
    if (!modal) return
    setSaving(true); setError('')
    try {
      const payload = {
        title: modal.title.trim(),
        start: modal.start ? new Date(modal.start).toISOString() : '',
        end: modal.end ? new Date(modal.end).toISOString() : undefined,
        location: modal.location.trim() || undefined,
        notes: modal.notes.trim() || undefined,
      }
      if (!payload.title) throw new Error('Please give the event a title.')
      if (!payload.start) throw new Error('Please pick a start time.')

      if (modal.mode === 'create') {
        await userCalendarApi.create({ ...payload, caseId: modal.caseId || undefined })
        setToast('Event added to your Google Calendar')
      } else {
        await userCalendarApi.update(modal.eventId!, payload)
        setToast('Event updated')
      }
      setModal(null)
      refetch()
      setTimeout(() => setToast(''), 2500)
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!modal?.eventId) return
    setSaving(true); setError('')
    try {
      await userCalendarApi.remove(modal.eventId)
      setModal(null)
      refetch()
      setToast('Event deleted from your Google Calendar')
      setTimeout(() => setToast(''), 2500)
    } catch (e: any) {
      setError(e?.message ?? 'Could not delete this event')
    } finally {
      setSaving(false)
    }
  }

  const connect = async () => {
    try {
      const res: any = await integrationsApi.getAuthUrl()
      localStorage.setItem('clausio_settings_section', 'Integrations')
      window.location.href = res.url
    } catch (e: any) {
      setError(e?.message ?? 'Could not start Google connection')
    }
  }

  const legend = useMemo(() => Object.entries(COLORS), [])
  const isSynced = !!modal?.clausioType && modal.clausioType !== 'personal'

  // ── still checking connection → quiet loader ──
  if (connected === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px', color: '#94a3b8', fontSize: 13.5 }}>
        Loading your calendar…
      </div>
    )
  }

  // ── not connected → invite card ──
  if (connected === false) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>📅</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Bring your Google Calendar in here</h2>
        <p style={{ maxWidth: 440, color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 auto 24px' }}>
          Connect once and your hearings, deadlines and client meetings appear right here next to
          the rest of your schedule — viewable, editable and creatable without leaving Clausio.
        </p>
        <button onClick={connect} className="btn btn-primary" style={{ padding: '12px 28px' }}>
          Connect Google Calendar
        </button>
        {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 14 }}>{error}</p>}
      </div>
    )
  }

  return (
    <div style={{ flex: 1 }}>
      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10, alignItems: 'center' }}>
        {legend.map(([key, c]) => (
          <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, display: 'inline-block' }} />
            {c.label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
          Click any slot to add · click an event to edit
        </span>
      </div>

      <div className="cal-wrap" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
          height="auto"
          firstDay={1}
          nowIndicator
          selectable={false}
          dateClick={onDateClick}
          eventClick={onEventClick}
          events={eventsSource as any}
          loading={(isLoading) => { /* could wire a spinner */ }}
          dayMaxEventRows={4}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: true }}
          slotMinTime="06:00:00"
          expandRows
          eventDisplay="block"
          displayEventTime
          eventClassNames={(arg) => (arg.event.extendedProps as CalEvent).clausioType ? ['clausio-event'] : []}
        />
      </div>

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, zIndex: 60, boxShadow: '0 8px 24px rgba(15,23,42,.25)' }}>
          ✓ {toast}
        </div>
      )}

      {/* add / edit modal */}
      {modal && (
        <div onClick={() => !saving && setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
            maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(15,23,42,.25)',
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
              {modal.mode === 'create' ? 'Add Event' : 'Edit Event'}
            </h3>
            {modal.mode === 'edit' && (
              <p style={{ margin: '0 0 12px', fontSize: 12, color: colorOf(modal.clausioType).color, fontWeight: 600 }}>
                {isSynced ? `Synced from Clausio (${COLORS[modal.clausioType!]?.label ?? modal.clausioType})` : 'Personal calendar event'}
              </p>
            )}

            <label style={lbl}>Title</label>
            <input autoFocus value={modal.title} onChange={e => setModal({ ...modal, title: e.target.value })}
              placeholder="e.g. Client call — property papers" style={inp} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>From</label>
                <input type="datetime-local" value={modal.start} onChange={e => setModal({ ...modal, start: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>To</label>
                <input type="datetime-local" value={modal.end} onChange={e => setModal({ ...modal, end: e.target.value })} style={inp} />
              </div>
            </div>

            <label style={lbl}>Location (optional)</label>
            <input value={modal.location} onChange={e => setModal({ ...modal, location: e.target.value })}
              placeholder="Chamber, court, video call…" style={inp} />

            {modal.mode === 'create' && (
              <>
                <label style={lbl}>Link to a case (optional)</label>
                <select value={modal.caseId} onChange={e => setModal({ ...modal, caseId: e.target.value })} style={inp}>
                  <option value="">— No case —</option>
                  {(cases as any[]).map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.caseNumber ? ` (${c.caseNumber})` : ''}</option>
                  ))}
                </select>
                {modal.caseId && (
                  <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#64748b' }}>
                    The event description will include the case name and a note pointing back to it in Clausio.
                  </p>
                )}
              </>
            )}

            {modal.mode === 'edit' && (
              <>
                <label style={lbl}>Notes</label>
                <textarea rows={3} value={modal.notes} onChange={e => setModal({ ...modal, notes: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
              </>
            )}

            {error && <p style={{ color: '#dc2626', fontSize: 13, margin: '10px 0 0' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center' }}>
              <button disabled={saving || !modal.title.trim()} onClick={save} className="btn btn-primary" style={{ flex: 1, opacity: saving || !modal.title.trim() ? .6 : 1 }}>
                {saving ? 'Saving…' : modal.mode === 'create' ? 'Add to Calendar' : 'Save changes'}
              </button>
              {modal.mode === 'edit' && !isSynced && (
                <button disabled={saving} onClick={remove} style={{ ...ghostBtn, color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}>
                  Delete
                </button>
              )}
              <button disabled={saving} onClick={() => setModal(null)} style={ghostBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── shared styles ──
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', margin: '14px 0 6px' }
const inp: React.CSSProperties = {
  width: '100%', border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 12px',
  fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
}
const ghostBtn: React.CSSProperties = {
  border: '1px solid #e2e8f0', background: '#fff', color: '#475569',
  borderRadius: 10, padding: '10px 16px', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
}
