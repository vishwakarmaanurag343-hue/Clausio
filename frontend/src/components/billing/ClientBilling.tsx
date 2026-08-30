'use client'

import { useState, useEffect } from 'react'
import { billingApi } from '@/lib/billingApi'

interface Props { cases: any[]; clients: any[]; loading: boolean }

export default function ClientBilling({ cases, clients, loading }: Props) {
  const [invoices,  setInvoices]  = useState<any[]>([])
  const [payments,  setPayments]  = useState<any[]>([])
  const [expenses,  setExpenses]  = useState<any[]>([])
  const [search,    setSearch]    = useState('')
  const [expanded,  setExpanded]  = useState<string|null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    setDataLoading(true)
    Promise.all([billingApi.getInvoices(), billingApi.getPayments(), billingApi.getExpenses()])
      .then(([inv, pay, exp]) => {
        setInvoices(Array.isArray(inv) ? inv : [])
        setPayments(Array.isArray(pay) ? pay : [])
        setExpenses(Array.isArray(exp) ? exp : [])
      })
      .catch(() => {})
      .finally(() => setDataLoading(false))
  }, [])

  const fmt = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

  const clientData = clients.map(cl => {
    const name        = `${cl.firstName ?? ''} ${cl.lastName ?? ''}`.trim() || cl.name || 'Unknown'
    const clientCases = cases.filter(c => c.clientId === cl.id || c.client === name)
    const caseIds     = clientCases.map(c => c.id)
    const clientInv   = invoices.filter(i => caseIds.includes(i.caseId))
    const clientPay   = payments.filter(p => caseIds.includes(p.caseId))
    const clientExp   = expenses.filter(e => caseIds.includes(e.caseId))
    const totalBilled = clientInv.reduce((s, i) => s + (i.totalAmount ?? 0), 0)
    const totalPaid   = clientPay.reduce((s, p) => s + (p.amount ?? 0), 0)
    const totalExp    = clientExp.reduce((s, e) => s + (e.amount ?? 0), 0)
    return {
      id: cl.id, name, phone: cl.phone ?? '—', email: cl.email ?? '—',
      totalCases:   clientCases.length,
      activeCases:  clientCases.filter(c => c.status !== 'Closed').length,
      totalBilled, totalPaid,
      pending:      Math.max(0, totalBilled - totalPaid),
      totalExpenses: totalExp,
      invoices:     clientInv,
      caseTypes:    [...new Set(clientCases.map(c => c.caseType ?? c.type).filter(Boolean))],
    }
  })
  .filter(cl => cl.name.toLowerCase().includes(search.toLowerCase()))
  .sort((a, b) => b.totalBilled - a.totalBilled)

  const grandBilled  = clientData.reduce((s, c) => s + c.totalBilled,  0)
  const grandPaid    = clientData.reduce((s, c) => s + c.totalPaid,    0)
  const grandPending = clientData.reduce((s, c) => s + c.pending,      0)

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Clients',  value: clients.length,    color: '#2563eb' },
          { label: 'Total Billed',   value: fmt(grandBilled),  color: '#7c3aed' },
          { label: 'Total Received', value: fmt(grandPaid),    color: '#16a34a' },
          { label: 'Total Pending',  value: fmt(grandPending), color: '#dc2626' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{loading || dataLoading ? '—' : s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
          style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, paddingLeft: 40, fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      {loading || dataLoading
        ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Loading client billing data...</div>
        : clientData.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <i className="ti ti-users" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>No Clients Found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Add cases with clients to see billing data here.</div>
          </div>
        )
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clientData.map((cl, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === cl.id ? null : cl.id)}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {cl.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{cl.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{cl.phone} · {cl.totalCases} case{cl.totalCases !== 1 ? 's' : ''}{cl.activeCases > 0 ? ` (${cl.activeCases} active)` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>{cl.totalBilled > 0 ? fmt(cl.totalBilled) : '—'}</div>
                    {cl.pending > 0 && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>{fmt(cl.pending)} pending</div>}
                    {cl.pending === 0 && cl.totalBilled > 0 && <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Fully paid ✓</div>}
                  </div>
                  <i className={`ti ${expanded === cl.id ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 16, color: '#94a3b8' }} />
                </div>

                {expanded === cl.id && (
                  <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 16px', background: '#f8fafc' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
                      {[
                        { label: 'Billed',    value: fmt(cl.totalBilled),   color: '#7c3aed' },
                        { label: 'Received',  value: fmt(cl.totalPaid),     color: '#16a34a' },
                        { label: 'Pending',   value: fmt(cl.pending),       color: cl.pending > 0 ? '#dc2626' : '#94a3b8' },
                        { label: 'Expenses',  value: fmt(cl.totalExpenses), color: '#d97706' },
                      ].map((s, j) => (
                        <div key={j} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {cl.caseTypes.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {cl.caseTypes.map((t: string, j: number) => (
                          <span key={j} style={{ fontSize: 11, padding: '3px 9px', background: '#eff6ff', color: '#2563eb', borderRadius: 20, fontWeight: 600 }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {cl.invoices.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Invoices</div>
                        {cl.invoices.map((inv: any, j: number) => (
                          <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                            <span style={{ color: '#2563eb', fontWeight: 600 }}>{inv.invoiceNumber}</span>
                            <span style={{ color: '#0f172a', fontWeight: 700 }}>{fmt(inv.totalAmount)}</span>
                            <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: inv.status==='Paid'?'#f0fdf4':inv.status==='Partial'?'#fffbeb':'#fef2f2', color: inv.status==='Paid'?'#15803d':inv.status==='Partial'?'#d97706':'#dc2626' }}>
                              {inv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
