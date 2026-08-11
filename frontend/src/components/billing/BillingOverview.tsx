'use client'

interface Props { cases: any[]; clients: any[]; stats: any; loading: boolean; onRefresh: () => void }

export default function BillingOverview({ cases, clients, stats, loading, onRefresh }: Props) {
  const fmt = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

  const activeCases  = cases.filter(c => c.status !== 'Closed').length
  const casesByType: Record<string, number> = {}
  cases.forEach(c => { const t = c.caseType ?? c.type ?? 'Unknown'; casesByType[t] = (casesByType[t] ?? 0) + 1 })

  return (
    <div>
      {/* Financial stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Billed',    value: fmt(stats?.totalBilled),    icon: 'ti-receipt-2',    color: '#2563eb', bg: '#eff6ff'  },
          { label: 'Amount Received', value: fmt(stats?.totalPaid),      icon: 'ti-circle-check', color: '#16a34a', bg: '#f0fdf4'  },
          { label: 'Pending',         value: fmt(stats?.totalPending),   icon: 'ti-clock',        color: '#dc2626', bg: '#fef2f2'  },
          { label: 'Expenses',        value: fmt(stats?.totalExpenses),  icon: 'ti-cash',         color: '#d97706', bg: '#fff7ed'  },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 6 }}>{loading ? '—' : s.value}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 22, color: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Invoice status + Case stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Invoices', value: stats?.invoiceCount ?? 0,  color: '#2563eb' },
          { label: 'Paid Invoices',  value: stats?.paidCount    ?? 0,  color: '#16a34a' },
          { label: 'Unpaid',         value: stats?.unpaidCount  ?? 0,  color: '#dc2626' },
          { label: 'Active Cases',   value: activeCases,                color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Cases by type */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 16 }}>Cases by Practice Area</div>
          {Object.keys(casesByType).length === 0
            ? <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>No cases yet</div>
            : Object.entries(casesByType).sort((a, b) => b[1] - a[1]).map(([type, count], i) => {
                const pct = Math.round((count / cases.length) * 100)
                const colors = ['#2563eb','#7c3aed','#16a34a','#d97706','#dc2626','#0891b2']
                return (
                  <div key={type} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: '#334155', fontWeight: 500 }}>{type}</span>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: 4 }} />
                    </div>
                  </div>
                )
              })
          }
        </div>

        {/* Recent activity */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 16 }}>Recent Cases</div>
          {cases.length === 0
            ? <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>No cases yet</div>
            : cases.slice(0, 6).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{c.caseType ?? c.type ?? '—'}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: c.status === 'Active' ? '#f0fdf4' : '#f8fafc', color: c.status === 'Active' ? '#15803d' : '#64748b' }}>
                    {c.status ?? 'Active'}
                  </span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
