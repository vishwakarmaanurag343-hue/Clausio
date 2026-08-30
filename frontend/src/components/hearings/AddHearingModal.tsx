'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { hearingsApi } from '@/lib/api'

interface Props {
  onClose: () => void
  onSaved?: () => void
}

interface OrderRow {
  text:        string
  responsible: string
  deadline:    string
}

const emptyOrderRow: OrderRow = { text: '', responsible: '', deadline: '' }

const hearingStages = [
  'First Appearance',
  'Interim Application',
  'Written Statement',
  'Evidence',
  'Cross Examination',
  'Arguments',
  'Judgment',
]

export default function AddHearingModal({ onClose, onSaved }: Props) {
  const { selectedCaseId } = useCaseStore()

  const [hearingDate,      setHearingDate]      = useState('')
  const [stage,            setStage]            = useState('Interim Application')
  const [whatHappened,     setWhatHappened]     = useState('')
  const [judgeObservation, setJudgeObservation] = useState('')
  const [nextHearingDate,  setNextHearingDate]  = useState('')
  const [orders,           setOrders]           = useState<OrderRow[]>([{ ...emptyOrderRow }])
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState('')

  function updateOrder(index: number, key: keyof OrderRow, value: string) {
    setOrders(prev => prev.map((o, i) => (i === index ? { ...o, [key]: value } : o)))
  }
  function addOrderRow()      { setOrders(prev => [...prev, { ...emptyOrderRow }]) }
  function removeOrderRow(i: number) { setOrders(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)) }

  async function saveHearing() {
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

    try {
      await hearingsApi.create(selectedCaseId, {
        hearingDate:   new Date(hearingDate).toISOString(),
        stage,
        whatHappened,
        judgeObservation,
        nextObjective: nextHearingDate ? `Next hearing: ${nextHearingDate}` : '',
        orders:        cleanOrders,
      })

      onSaved?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error saving hearing. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(15,23,42,0.45)',
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'flex-start',
        overflowY:      'auto',
        zIndex:         999,
        padding:        24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width:         '100%',
          maxWidth:      700,
          maxHeight:     'calc(100vh - 48px)',
          background:    '#ffffff',
          borderRadius:  16,
          overflow:      'hidden',
          display:       'flex',
          flexDirection: 'column',
          boxShadow:     '0 20px 60px rgba(0,0,0,.25)',
        }}
      >
        {/* Header — fixed */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
              Record Hearing
            </h2>
            <p style={{ marginTop: 5, marginBottom: 0, color: '#64748b', fontSize: 13 }}>
              Add today's hearing notes
            </p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 18 }}>
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22, flex: 1, minHeight: 0, overflowY: 'auto' }}>

          {/* Error message — NEW */}
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Field label="Hearing Date" required>
              <input type="date" value={hearingDate} onChange={(e) => setHearingDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Stage" required>
              <select value={stage} onChange={(e) => setStage(e.target.value)} style={inputStyle}>
                {hearingStages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="What happened today?" required>
            <textarea
              rows={6}
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              placeholder="Describe the hearing, arguments made, submissions, observations and overall outcome..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 140 }}
            />
          </Field>

          <Field label="Judge's Observation">
            <textarea
              rows={4}
              value={judgeObservation}
              onChange={(e) => setJudgeObservation(e.target.value)}
              placeholder="Mention any important observations or warnings given by the Judge..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
            <Field label="Next Hearing Date">
              <input type="date" value={nextHearingDate} onChange={(e) => setNextHearingDate(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          {/* Court orders passed at this hearing — saved to the case's Court Orders & Diary */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                Court Orders Passed <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span>
              </label>
              <button
                onClick={addOrderRow}
                className="glass-button"
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                + Add Order
              </button>
            </div>

            {orders.map((order, i) => (
              <div
                key={i}
                style={{
                  display:       'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 170px 32px',
                  gap:           10,
                  marginBottom:  10,
                  alignItems:    'start',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    value={order.text}
                    onChange={(e) => updateOrder(i, 'text', e.target.value)}
                    placeholder="Order text (e.g. Submit written statement)"
                    style={inputStyle}
                  />
                  <input
                    value={order.responsible}
                    onChange={(e) => updateOrder(i, 'responsible', e.target.value)}
                    placeholder="Responsible (who must comply)"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Deadline *</label>
                  <input
                    type="date"
                    value={order.deadline}
                    onChange={(e) => updateOrder(i, 'deadline', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <button
                  onClick={() => removeOrderRow(i)}
                  title="Remove this order"
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: orders.length > 1 ? '#fef2f2' : '#f1f5f9', color: orders.length > 1 ? '#dc2626' : '#cbd5e1', cursor: orders.length > 1 ? 'pointer' : 'not-allowed', fontSize: 14 }}
                >
                  ✕
                </button>
              </div>
            ))}
            {orders.length === 0 && (
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>No orders added — click "+ Add Order" if the court passed any directions.</p>
            )}
          </div>

          {/* Footer — UNCHANGED except button shows loading */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 22 }}>
            <button
              onClick={onClose}
              style={{ padding: '11px 22px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={saveHearing}
              disabled={saving}
              style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: saving ? '#93c5fd' : '#2563eb', color: '#ffffff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, boxShadow: '0 8px 20px rgba(37,99,235,.25)' }}
            >
              {saving ? 'Saving...' : 'Save Hearing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width:       '100%',
  padding:     '12px 14px',
  borderRadius: 10,
  border:      '1px solid #d1d5db',
  fontSize:    14,
  fontFamily:  'inherit',
  color:       '#0f172a',
  background:  '#ffffff',
  outline:     'none',
  boxSizing:   'border-box',
}
