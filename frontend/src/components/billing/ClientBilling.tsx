'use client'

import { useState, useEffect } from 'react'
import { billingApi } from '@/lib/billingApi'

interface Props { cases: any[]; clients: any[]; loading: boolean }

export default function ClientBilling({ cases, clients, loading }: Props) {
  const [invoices,  setInvoices]  = useState<any[]>([])
  const [payments,  setPayments]  = useState<any[]>([])
  const [expenses,  setExpenses]  = useState<any[]>([])
  const [search,    setSearch]    = useState('')

  useEffect(() => {
    Promise.all([billingApi.getInvoices(), billingApi.getPayments(), billingApi.getExpenses()])
      .then(([inv, pay, exp]) => { setInvoices(inv); setPayments(pay); setExpenses(exp) })
      .catch(() => {})
  }, [])

  const fmt = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

  const clientData = clients.map(cl => {
    const name         = `${cl.firstName} ${cl.lastName}`.trim()
    const clientCases  = cases.filter(c => c.clientId === cl.id || c.client === name)
    const caseIds      = clientCases.map(c => c.id)
    const clientInv    = invoices.filter(i => caseIds.includes(i.caseId))
    const clientPay    = payments.filter(p => caseIds.includes(p.caseId))
    const clientExp    = expenses.filter(e => caseIds.includes(e.caseId))
    const totalBilled  = clientInv.reduce((s, i) => s + (i.totalAmount ?? 0), 0)
    const totalPaid    = clientPay.reduce((s, p) => s + (p.amount ?? 0), 0)
    const totalExp     = clientExp.reduce((s, e) => s + (e.amount ?? 0), 0)
    return {
      id: cl.id, name, phone: cl.phone ?? '—', email: cl.email ?? '—',
      totalCases: clientCases.length,
      activeCases: clientCases.filter(c => c.status !== 'Closed').length,
      totalBilled, totalPaid,
      pending: totalBilled - totalPaid,
      totalExpenses: totalExp,
      caseTypes: [...new Set(clientCases.map(c => c.caseType ?? c.type).filter(Boolean))],
    }
  }).filter(cl => cl.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.totalBilled - a.totalBilled)

  const grandBilled  = clientData.reduce((s, c) => s + c.totalBilled,  0)
  const grandPaid    = clientData.reduce((s, c) => s + c.totalPaid,    0)
  const grandPending = clientData.reduce((s, c) => s + c.pending,      0)

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Clients',   value: clients.length,     color: '#2563eb' },
          { label: 'Total Billed',    value: fmt(grandBilled),   color: '#7c3aed' },
          { label: 'Total Received',  value: fmt(grandPaid),     color: '#16a34a' },
          { label: 'Total Pending',   value: fmt(grandPending),  color: '#dc2626' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
          style={{ width: '100%', height: 42, border: '1px solid #e2e8f0', borderRadius: 10, paddingLeft: 40, fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Loading...</div>
      : clientData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <i className="ti ti-users" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>No Clients Found</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <div>Client</div><div style={{ textAlign: 'center' }}>Cases</div><div>Billed</div><div>Received</div><div style={{ color: '#dc2626' }}>Pending</div><div>Practice</div>
          </div>
          {clientData.map((cl, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{cl.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{cl.phone}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>{cl.totalCases}</span>
                {cl.activeCases > 0 && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>{cl.activeCases} active</div>}
              </div>
              <div style={{ fontWeight: 600, color: '#7c3aed' }}>{cl.totalBilled > 0 ? fmt(cl.totalBilled) : '—'}</div>
              <div style={{ fontWeight: 600, color: '#16a34a' }}>{cl.totalPaid > 0 ? fmt(cl.totalPaid) : '—'}</div>
              <div style={{ fontWeight: cl.pending > 0 ? 700 : 400, color: cl.pending > 0 ? '#dc2626' : '#94a3b8' }}>
                {cl.pending > 0 ? fmt(cl.pending) : '—'}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {cl.caseTypes.slice(0, 2).map((t: string, j: number) => (
                  <span key={j} style={{ fontSize: 10, padding: '2px 7px', background: '#eff6ff', color: '#2563eb', borderRadius: 10, fontWeight: 600 }}>{t}</span>
                ))}
                {cl.caseTypes.length > 2 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{cl.caseTypes.length - 2}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
