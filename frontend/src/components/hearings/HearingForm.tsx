'use client'

import { useEffect, useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { hearingsApi, integrationsApi } from '@/lib/api'

const stages = [
  'First Appearance',
  'Interim Application',
  'Written Statement',
  'Evidence',
  'Cross Examination',
  'Arguments',
  'Judgment',
]

interface Props {
  onSaved?: () => void
}

interface OrderRow {
  text:        string
  responsible: string
  deadline:    string
}

const emptyOrderRow: OrderRow = { text: '', responsible: '', deadline: '' }

export default function HearingForm({ onSaved }: Props) {
  const { selectedCaseId } = useCaseStore()

  const [hearingDate,      setHearingDate]      = useState('')
  const [stage,            setStage]            = useState('Interim Application')
  const [whatHappened,     setWhatHappened]     = useState('')
  const [judgeObservation, setJudgeObservation] = useState('')
  const [nextHearingDate,  setNextHearingDate]  = useState('')
  const [orders,           setOrders]           = useState<OrderRow[]>([{ ...emptyOrderRow }])
  const [saving,           setSaving]           = useState(false)
  const [success,          setSuccess]          = useState(false)
  const [error,            setError]            = useState('')
  const [calConnected,     setCalConnected]     = useState<boolean | null>(null)

  useEffect(() => {
    integrationsApi.getStatus()
      .then((s: any) => setCalConnected(!!s?.connected))
      .catch(() => setCalConnected(false))
  }, [])

  function updateOrder(index: number, key: keyof OrderRow, value: string) {
    setOrders(prev => prev.map((o, i) => (i === index ? { ...o, [key]: value } : o)))
  }
  function addOrderRow()      { setOrders(prev => [...prev, { ...emptyOrderRow }]) }
  function removeOrderRow(i: number) { setOrders(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)) }

  async function handleSave() {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    if (!hearingDate || !whatHappened) {
      setError('Please fill Hearing Date and What Happened')
      return
    }

    // Keep only rows where an order was actually typed
    const cleanOrders = orders
      .filter(o => o.text.trim())
      .map(o => ({
        text:        o.text.trim(),
        responsible: o.responsible.trim(),
        deadline:    o.deadline ? new Date(o.deadline).toISOString() : '',
      }))
    if (cleanOrders.some(o => !o.deadline)) {
      setError('Each court order needs a deadline date (or remove the empty order row).')
      return
    }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      await hearingsApi.create(selectedCaseId, {
        hearingDate:   new Date(hearingDate).toISOString(),
        stage,
        whatHappened,
        judgeObservation,
        nextObjective: nextHearingDate ? `Next hearing: ${nextHearingDate}` : '',
        orders:        cleanOrders,
      })

      setSuccess(true)
      setHearingDate('')
      setWhatHappened('')
      setJudgeObservation('')
      setNextHearingDate('')
      setOrders([{ ...emptyOrderRow }])
      onSaved?.()

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error saving hearing. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card" style={{ padding: 20 }}>

      {/* Header — UNCHANGED */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            Record Hearing
          </h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
            Record today's proceedings
          </p>
        </div>
      </div>

      {/* Success message — with calendar auto-sync status */}
      {success && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <i className="ti ti-calendar-check" style={{ fontSize: 15, flexShrink: 0 }} />
          {calConnected
            ? 'Hearing saved and synced to Google Calendar automatically.'
            : <span>Hearing saved · <a href="/settings?section=Integrations" style={{ color: '#15803d', fontWeight: 700 }}>Connect Google Calendar</a> in Settings to auto-sync hearings.</span>}
        </div>
      )}

      {/* Error message — NEW */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* Date + Stage — UNCHANGED */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Field label="Hearing Date" required>
          <input type="date" value={hearingDate} onChange={(e) => setHearingDate(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Stage" required>
          <select value={stage} onChange={(e) => setStage(e.target.value)} style={inputStyle}>
            {stages.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* What happened — UNCHANGED */}
      <Field label="What happened today?" required>
        <textarea rows={4} value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)} placeholder="Describe the hearing..." style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
      </Field>

      {/* Judge — UNCHANGED */}
      <Field label="Judge's Observation">
        <textarea rows={3} value={judgeObservation} onChange={(e) => setJudgeObservation(e.target.value)} placeholder="Judge's remarks..." style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} />
      </Field>

      {/* Next Hearing Date — UNCHANGED */}
      <Field label="Next Hearing Date">
        <input type="date" value={nextHearingDate} onChange={(e) => setNextHearingDate(e.target.value)} style={inputStyle} />
      </Field>

      {/* Court orders passed at this hearing — saved to the case's Court Orders & Diary */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
            Court Orders Passed <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span>
          </label>
          <button
            onClick={addOrderRow}
            className="glass-button"
            style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)', color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            + Add Order
          </button>
        </div>

        {orders.map((order, i) => (
          <div key={i} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: 10, marginBottom: 8, background: 'rgba(248,250,252,0.6)' }}>
            <input
              value={order.text}
              onChange={(e) => updateOrder(i, 'text', e.target.value)}
              placeholder="Order text (e.g. Submit written statement)"
              style={{ ...inputStyle, marginBottom: 6 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 6, marginBottom: 6 }}>
              <input
                value={order.responsible}
                onChange={(e) => updateOrder(i, 'responsible', e.target.value)}
                placeholder="Responsible"
                style={inputStyle}
              />
              <input
                type="date"
                value={order.deadline}
                onChange={(e) => updateOrder(i, 'deadline', e.target.value)}
                title="Deadline"
                style={inputStyle}
              />
            </div>
            {orders.length > 1 && (
              <button
                onClick={() => removeOrderRow(i)}
                style={{ padding: '2px 8px', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                ✕ Remove order
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Save Button — UNCHANGED UI, fixed onClick */}
      <button
        className="glass-button"
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', marginTop: 12, background: saving ? '#93c5fd' : '#3b82f6', color: '#ffffff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
      >
        {saving ? 'Saving...' : 'Save Hearing Record'}
      </button>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '8px 12px',
  borderRadius: 8,
  border:       '1px solid rgba(0,0,0,0.1)',
  background:   'rgba(255,255,255,0.6)',
  fontSize:     13,
  color:        '#0f172a',
  fontFamily:   'inherit',
  outline:      'none',
  boxSizing:    'border-box',
}
