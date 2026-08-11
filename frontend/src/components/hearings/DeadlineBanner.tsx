'use client'

import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'
import { hearingsApi } from '@/lib/api'

export default function DeadlineBanner() {
  const { selectedCaseId } = useCaseStore()
  const [overdueOrders, setOverdueOrders] = useState<any[]>([])

  useEffect(() => {
    if (!selectedCaseId) { setOverdueOrders([]); return }
    hearingsApi.getByCaseId(selectedCaseId)
      .then(hearings => {
        const overdue = (Array.isArray(hearings) ? hearings : [])
          .flatMap((h: any) => h.orders ?? [])
          .filter((o: any) => !o.done && new Date(o.deadline) < new Date())
        setOverdueOrders(overdue)
      })
      .catch(err => console.error(err))
  }, [selectedCaseId])

  // Hide banner if no overdue orders
  if (overdueOrders.length === 0) return null

  // Build deadline text from real orders
  const deadlineText = overdueOrders
    .slice(0, 2)
    .map(o => `${o.text} was due on ${new Date(o.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`)
    .join(' | ')

  return (
    // EXACT SAME UI as original — just real data
    <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(254, 242, 242, 0.5)', border: '1px solid rgba(239, 68, 68, 0.2)', borderLeft: '4px solid #ef4444', padding: '12px 16px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: '#dc2626' }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14 }}>
            {overdueOrders.length} Overdue {overdueOrders.length === 1 ? 'Deadline' : 'Deadlines'}
          </div>
          <div style={{ marginTop: 2, fontSize: 13, color: '#7f1d1d' }}>
            {deadlineText}
          </div>
        </div>
      </div>
    </div>
  )
}
