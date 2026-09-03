'use client'

import { useState } from 'react'

import BillingTabs from '@/components/billing/BillingTabs'

import BillingOverview from '@/components/billing/BillingOverview'
import Invoices from '@/components/billing/Invoices'
import Payments from '@/components/billing/Payments'
import Expenses from '@/components/billing/Expenses'
import ClientBilling from '@/components/billing/ClientBilling'
import TrustAccounts from '@/components/billing/TrustAccounts'
import FinancialReports from '@/components/billing/FinancialReports'
import Subscription from '@/components/billing/Subscription'
import GSTManagement from '@/components/billing/GSTManagement'

import GenerateInvoiceModal from '@/components/billing/GenerateInvoiceModal'

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [showModal, setShowModal] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <BillingOverview />

      case 'Invoices':
        return <Invoices />

      case 'Payments':
        return <Payments />

      case 'Expenses':
        return <Expenses />

      case 'Client Billing':
        return <ClientBilling />

      case 'Trust Accounts':
        return <TrustAccounts />

      case 'Reports':
        return <FinancialReports />

      case 'Subscription':
        return <Subscription />

      case 'GST':
        return <GSTManagement />

      default:
        return <BillingOverview />
    }
  }

  return (
    <>
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>
        {/* ================= HEADER ================= */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Billing & Finance
            </h1>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
              Manage invoices, payments, subscriptions and law firm finances.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="glass-button"
              style={{ height: 38, padding: '0 16px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="ti ti-download" />
              Export
            </button>
            <button
              className="glass-button"
              onClick={() => setShowModal(true)}
              style={{ height: 38, padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            >
              <i className="ti ti-plus" />
              Generate Invoice
            </button>
          </div>
        </div>

        {/* ================= TABS ================= */}

        <BillingTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* ================= CONTENT ================= */}

        <div
          style={{
            marginTop: 24,
          }}
        >
          {renderContent()}
        </div>
      </div>

      {showModal && (
        <GenerateInvoiceModal
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}