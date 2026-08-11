'use client'

interface BillingTabsProps {
  activeTab: string
  onChange: (tab: string) => void
}

const tabs = [
  'Overview',
  'Invoices',
  'Payments',
  'Expenses',
  'Client Billing',
  'Trust Accounts',
  'Reports',
  'Subscription',
  'GST',
]

export default function BillingTabs({
  activeTab,
  onChange,
}: BillingTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 4,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '10px 18px',
            border: activeTab === tab
              ? '1px solid #2563eb'
              : '1px solid #e2e8f0',
            borderRadius: 10,
            background: activeTab === tab
              ? '#2563eb'
              : '#ffffff',
            color: activeTab === tab
              ? '#ffffff'
              : '#475569',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            whiteSpace: 'nowrap',
            transition: '.2s',
            fontFamily: 'inherit',
            boxShadow: activeTab === tab
              ? '0 6px 16px rgba(37,99,235,.18)'
              : 'none',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}