'use client'

// In-app Calendar tab — renders the lawyer's real Google Calendar inline via the
// Clausio proxy API. Clausio-synced events (hearings / deadlines / meetings) are
// colour-coded; everything else shows as personal. Slot clicks open a quick
// "Add Event" form; event clicks open edit/delete — no reload, no external tab.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCaseStore } from '@/lib/store'
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
  const router = useRouter()
  const { setSelectedCase } = useCaseStore()
  const calRef = useRef<FullCalendar>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [cases, setCases] = useState<any[]>([])
  const [viewTitle, setViewTitle] = useState('')
  const [activeView, setActiveView] = useState('dayGridMonth')

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── APPLE GLASS TOOLBAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 18px',
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
        flexWrap: 'wrap',
      }}>
        {/* Left: Nav (Prev, Today, Next) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: 'rgba(241, 245, 249, 0.8)', padding: 3, borderRadius: 12, border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <button onClick={() => calRef.current?.getApi().prev()} style={{ border: 'none', background: 'transparent', width: 32, height: 32, borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
              <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />
            </button>
            <button onClick={() => calRef.current?.getApi().next()} style={{ border: 'none', background: 'transparent', width: 32, height: 32, borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
              <i className="ti ti-chevron-right" style={{ fontSize: 16 }} />
            </button>
          </div>
          <button onClick={() => calRef.current?.getApi().today()} style={{ padding: '6px 14px', borderRadius: 12, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
            Today
          </button>
        </div>

        {/* Center: Title (Month Year) */}
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
          {viewTitle}
        </h2>

        {/* Right: View Switcher (Month / Week / Day) + Add Event */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', background: 'rgba(241, 245, 249, 0.8)', padding: 3, borderRadius: 14, border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            {[
              { id: 'dayGridMonth', label: 'Month' },
              { id: 'timeGridWeek', label: 'Week' },
              { id: 'timeGridDay', label: 'Day' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => calRef.current?.getApi().changeView(v.id)}
                style={{
                  border: 'none',
                  background: activeView === v.id ? '#ffffff' : 'transparent',
                  color: activeView === v.id ? '#2563eb' : '#64748b',
                  padding: '6px 14px',
                  borderRadius: 10,
                  fontWeight: activeView === v.id ? 700 : 600,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  boxShadow: activeView === v.id ? '0 2px 8px rgba(15,23,42,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setModal({ mode: 'create', title: '', start: toLocalInput(new Date()), end: toLocalInput(new Date(Date.now() + 3600000)), location: '', notes: '', caseId: '' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 14,
              background: '#2563eb', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 12.5,
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)', fontFamily: 'inherit',
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 15 }} /> Add Event
          </button>
        </div>
      </div>

      {/* legend bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', background: 'rgba(255,255,255,0.4)', padding: '8px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {legend.map(([key, c]) => (
            <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#334155', fontWeight: 600, background: 'rgba(255,255,255,0.85)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(226,232,240,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block', boxShadow: `0 0 6px ${c.color}88` }} />
              {c.label}
            </span>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
          ✨ Click slot to add · Click event to edit
        </span>
      </div>

      <div className="cal-wrap">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          height="auto"
          firstDay={1}
          nowIndicator
          selectable={false}
          dateClick={onDateClick}
          eventClick={onEventClick}
          events={eventsSource as any}
          datesSet={(dateInfo) => {
            setViewTitle(dateInfo.view.title)
            setActiveView(dateInfo.view.type)
          }}
          eventContent={(eventInfo) => {
            const e = eventInfo.event.extendedProps as CalEvent
            const c = colorOf(e.clausioType)
            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  borderRadius: 8,
                  background: c.bg,
                  color: c.color,
                  border: `1px solid ${c.color}35`,
                  fontSize: 11.5,
                  fontWeight: 600,
                  width: '100%',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0, boxShadow: `0 0 4px ${c.color}aa` }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {eventInfo.event.title}
                </span>
                {eventInfo.timeText && (
                  <span style={{ fontSize: 10, opacity: 0.8, flexShrink: 0, fontWeight: 500 }}>
                    {eventInfo.timeText}
                  </span>
                )}
              </div>
            )
          }}
          dayMaxEventRows={3}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: true }}
          slotMinTime="06:00:00"
          expandRows
        />
      </div>

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(16px)', color: '#fff', padding: '10px 22px', borderRadius: 16, fontSize: 13, fontWeight: 600, zIndex: 60, boxShadow: '0 12px 32px rgba(15,23,42,0.3)' }}>
          ✓ {toast}
        </div>
      )}

      {/* add / edit modal */}
      {modal && (
        <div onClick={() => !saving && setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(32px)',
            borderRadius: 24, width: '100%', maxWidth: 480,
            maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
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

            {/* Synced case event — jump straight to the case or its hearing prep */}
            {modal.mode === 'edit' && isSynced && modal.caseId && (() => {
              const linked = (cases as any[]).find(c => c.id === modal.caseId)
              const goToCase = () => {
                if (linked) setSelectedCase(linked.id, linked.name)
                setModal(null)
                router.push(`/dashboard?case=${modal.caseId}`)
              }
              const prepBrief = () => {
                if (linked) setSelectedCase(linked.id, linked.name)
                setModal(null)
                router.push('/readiness')
              }
              return (
                <div style={{ marginTop: 14, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                  {linked && (
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                      {linked.name}{linked.caseNumber ? <span style={{ color: '#64748b', fontWeight: 500 }}> · {linked.caseNumber}</span> : null}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={goToCase} style={{ ...ghostBtn, padding: '7px 12px', fontSize: 12.5, color: '#1d4ed8', borderColor: '#bfdbfe', background: '#eff6ff' }}>
                      <i className="ti ti-folder" style={{ marginRight: 5 }} />Go to Case
                    </button>
                    <button onClick={prepBrief} style={{ ...ghostBtn, padding: '7px 12px', fontSize: 12.5, color: '#7c3aed', borderColor: '#ddd6fe', background: '#f5f3ff' }}>
                      <i className="ti ti-file-text" style={{ marginRight: 5 }} />Prepare Brief
                    </button>
                  </div>
                </div>
              )
            })()}

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
