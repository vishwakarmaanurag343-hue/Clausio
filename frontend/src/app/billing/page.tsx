'use client'

import { useState, useEffect, useCallback } from 'react'
import { billingApi } from '@/lib/billingApi'
import BillingOverview from '@/components/billing/BillingOverview'
import InvoiceManager  from '@/components/billing/InvoiceManager'
import PaymentTracker  from '@/components/billing/PaymentTracker'
import ExpenseTracker  from '@/components/billing/ExpenseTracker'
import ClientBilling   from '@/components/billing/ClientBilling'
import Subscription    from '@/components/billing/Subscription'

const TABS = [
  { name: 'Overview',       icon: 'ti-layout-dashboard', live: true  },
  { name: 'Invoices',       icon: 'ti-receipt-2',        live: true  },
  { name: 'Payments',       icon: 'ti-credit-card',      live: true  },
  { name: 'Expenses',       icon: 'ti-cash',             live: true  },
  { name: 'Client Billing', icon: 'ti-users',            live: true  },
  { name: 'Subscription',   icon: 'ti-star',             live: true  },
]

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [cases,     setCases]     = useState<any[]>([])
  const [clients,   setClients]   = useState<any[]>([])
  const [stats,     setStats]     = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Load stats from billing API
      const st = await billingApi.getStats()
      setStats(st)

      // Load cases and clients from API — graceful fallback
      try {
        const { casesApi, clientsApi } = await import('@/lib/api')
        const [c, cl] = await Promise.all([casesApi.getAll(), clientsApi.getAll()])
        setCases(Array.isArray(c)  ? c  : [])
        setClients(Array.isArray(cl) ? cl : [])
      } catch {
        // Cases/clients not critical for billing — continue without them
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  // Deep-link support: /billing?tab=Subscription selects that tab on load.
  useEffect(() => {
    try {
      const tab = new URLSearchParams(window.location.search).get('tab')
      if (tab && TABS.some(t => t.name === tab && t.live)) setActiveTab(tab)
    } catch {}
  }, [])

  return (
    <div className="glass-panel mobile-billing-container" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>

      {/* ── DESKTOP BILLING VIEW ── */}
      <div className="desktop-billing-view" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Billing & Finance</h1>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
              Manage invoices, payments, expenses and client billing.
            </p>
          </div>
          {stats && !loading && (
            <div style={{ display: 'flex', gap: 12 }}>
              <Chip label="Billed"   value={`₹${Number(stats.totalBilled   ?? 0).toLocaleString('en-IN')}`} color="#2563eb" />
              <Chip label="Received" value={`₹${Number(stats.totalPaid     ?? 0).toLocaleString('en-IN')}`} color="#16a34a" />
              <Chip label="Pending"  value={`₹${Number(stats.totalPending  ?? 0).toLocaleString('en-IN')}`} color="#dc2626" />
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button onClick={reload} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Retry</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 24, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.name} onClick={() => tab.live && setActiveTab(tab.name)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', borderBottom: activeTab === tab.name ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -1, cursor: tab.live ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: 'transparent', whiteSpace: 'nowrap', color: activeTab === tab.name ? '#1e40af' : tab.live ? '#64748b' : '#94a3b8', transition: 'all 0.15s' }}>
              <i className={`ti ${tab.icon}`} style={{ fontSize: 15 }} />
              {tab.name}
              {!tab.live && <span style={{ fontSize: 9, padding: '1px 5px', background: '#fef3c7', color: '#d97706', borderRadius: 8, fontWeight: 700 }}>SOON</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'Overview'       && <BillingOverview cases={cases} clients={clients} stats={stats} loading={loading} onRefresh={reload} />}
        {activeTab === 'Invoices'       && <InvoiceManager  cases={cases} clients={clients} onRefresh={reload} />}
        {activeTab === 'Payments'       && <PaymentTracker  cases={cases} onRefresh={reload} />}
        {activeTab === 'Expenses'       && <ExpenseTracker  cases={cases} onRefresh={reload} />}
        {activeTab === 'Client Billing' && <ClientBilling   cases={cases} clients={clients} loading={loading} />}
        {activeTab === 'Subscription'   && <Subscription />}
      </div>

      {/* ── MOBILE BILLING VIEW ── */}
      <div className="mobile-billing-view" style={{ display: 'none', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: 30, padding: '6px 8px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button key={tab.name} onClick={() => tab.live && setActiveTab(tab.name)}
              style={{ padding: '8px 14px', borderRadius: 20, background: activeTab === tab.name ? '#cbd5e1' : 'transparent', color: '#0f172a', border: 'none', fontSize: 11, fontWeight: activeTab === tab.name ? 700 : 600, cursor: tab.live ? 'pointer' : 'default', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
              {tab.name}
              {!tab.live && ' 🔒'}
            </button>
          ))}
        </div>
        <div style={{ background: '#cbd5e1', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16, margin: '8px -16px 0 -16px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 2px 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Billing & Finance</h2>
              <p style={{ margin: '0 0 14px 6px', fontSize: 11, fontWeight: 600, color: '#475569' }}>{activeTab}</p>
            </div>
            <button onClick={reload} style={{ padding: '8px 14px', borderRadius: 20, background: '#0f172a', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Refresh</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activeTab === 'Overview'       && <BillingOverview cases={cases} clients={clients} stats={stats} loading={loading} onRefresh={reload} />}
            {activeTab === 'Invoices'       && <InvoiceManager  cases={cases} clients={clients} onRefresh={reload} />}
            {activeTab === 'Payments'       && <PaymentTracker  cases={cases} onRefresh={reload} />}
            {activeTab === 'Expenses'       && <ExpenseTracker  cases={cases} onRefresh={reload} />}
            {activeTab === 'Client Billing' && <ClientBilling   cases={cases} clients={clients} loading={loading} />}
            {activeTab === 'Subscription'   && <Subscription />}
          </div>
        </div>
      </div>

    </div>
  )
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '6px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

