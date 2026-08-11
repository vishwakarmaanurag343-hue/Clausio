'use client'
// Hearing diary card — shows real judge orders with OVERDUE badges
import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { hearingsApi } from '@/lib/api'

interface Props {
  hearings: any[]
  onChanged?: () => void
}

export default function HearingDiary({ hearings, onChanged }: Props) {
  const { selectedCaseId } = useCaseStore()
  const [markingId, setMarkingId] = useState<string | null>(null)

  const orders = hearings
    .flatMap(h => (h.orders ?? []).map((o: any) => ({ ...o, hearingId: h.id })))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  async function markDone(hearingId: string, orderId: string) {
    if (!selectedCaseId) return
    setMarkingId(orderId)
    try {
      await hearingsApi.markOrderDone(selectedCaseId, hearingId, orderId)
      onChanged?.()
    } catch (err) {
      console.error(err)
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <div className="glass-card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
        <i className="ti ti-notebook" style={{ fontSize: 16, color: '#64748b' }} />
        Hearing diary
      </div>

      {orders.length === 0 && (
        <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>No orders recorded yet.</div>
      )}

      {orders.map((item, i) => {
        const overdue = !item.done && new Date(item.deadline) < new Date()
        return (
          <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < orders.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.done ? '#10b981' : overdue ? '#dc2626' : '#3b82f6', flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${item.done ? '#10b981' : overdue ? '#dc2626' : '#3b82f6'}40` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: item.done ? '#94a3b8' : '#0f172a', lineHeight: 1.4, fontWeight: 500, textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.text}
                {overdue && <span className="glass-pill" style={{ fontSize: 9, padding: '2px 6px', marginLeft: 6, fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)' }}>OVERDUE</span>}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Due {new Date(item.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {item.responsible}
              </div>
            </div>
            {!item.done && (
              <button
                onClick={() => markDone(item.hearingId, item.id)}
                disabled={markingId === item.id}
                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', cursor: markingId === item.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}
              >
                {markingId === item.id ? '...' : 'Mark done'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
