'use client'

import { useState, useEffect, useCallback } from 'react'
import { casesApi, clientsApi } from '@/lib/api'
import { billingApi } from '@/lib/billingApi'
import BillingOverview  from '@/components/billing/BillingOverview'
import InvoiceManager   from '@/components/billing/InvoiceManager'
import PaymentTracker   from '@/components/billing/PaymentTracker'
import ExpenseTracker   from '@/components/billing/ExpenseTracker'
import ClientBilling    from '@/components/billing/ClientBilling'

const TABS = [
  { name: 'Overview',       icon: 'ti-layout-dashboard', live: true  },
  { name: 'Invoices',       icon: 'ti-receipt-2',        live: true  },
  { name: 'Payments',       icon: 'ti-credit-card',      live: true  },
  { name: 'Expenses',       icon: 'ti-cash',             live: true  },
  { name: 'Client Billing', icon: 'ti-users',            live: true  },
  { name: 'Subscription',   icon: 'ti-star',             live: false },
]

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [cases,     setCases]     = useState<any[]>([])
  const [clients,   setClients]   = useState<any[]>([])
  const [stats,     setStats]     = useState<any>(null)
  const [loading,   setLoading]   = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [c, cl, st] = await Promise.all([
        casesApi.getAll(),
        clientsApi.getAll(),
        billingApi.getStats(),
      ])
      setCases(Array.isArray(c) ? c : [])
      setClients(Array.isArray(cl) ? cl : [])
      setStats(st)
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { reload() }, [reload])

  return (
    <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Billing & Finance</h1>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            Manage invoices, payments, expenses and client billing.
          </p>
        </div>
        {/* Quick stats in header */}
        {stats && !loading && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Chip label="Billed" value={`₹${Number(stats.totalBilled).toLocaleString('en-IN')}`} color="#2563eb" />
            <Chip label="Received" value={`₹${Number(stats.totalPaid).toLocaleString('en-IN')}`} color="#16a34a" />
            <Chip label="Pending" value={`₹${Number(stats.totalPending).toLocaleString('en-IN')}`} color="#dc2626" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.name} onClick={() => setActiveTab(tab.name)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', borderBottom: activeTab === tab.name ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: 'transparent', whiteSpace: 'nowrap', color: activeTab === tab.name ? '#1e40af' : '#64748b', transition: 'all 0.15s' }}>
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
      {activeTab === 'Subscription'   && <SubscriptionComingSoon />}
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

function SubscriptionComingSoon() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <i className="ti ti-star" style={{ fontSize: 36, color: '#d97706' }} />
      </div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Subscription Management</h2>
      <p style={{ marginTop: 8, color: '#64748b', fontSize: 14, maxWidth: 360, margin: '10px auto 0', lineHeight: 1.6 }}>
        Manage your Clausio plan, upgrade or download tax invoices.
      </p>
      <div style={{ marginTop: 24, padding: '10px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, display: 'inline-block', fontSize: 12, color: '#1e40af', fontWeight: 600 }}>
        Contact support@clausio.io to manage your subscription
      </div>
    </div>
  )
}
