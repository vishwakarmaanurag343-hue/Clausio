'use client'

const stats = [
  {
    title: 'Revenue',
    value: '₹12.5L',
    change: '+18%',
    color: '#22c55e',
    icon: 'ti-chart-line',
  },
  {
    title: 'Outstanding',
    value: '₹2.4L',
    change: '12 Clients',
    color: '#f59e0b',
    icon: 'ti-alert-circle',
  },
  {
    title: 'Collected',
    value: '₹8.3L',
    change: '+11%',
    color: '#2563eb',
    icon: 'ti-cash',
  },
  {
    title: 'Expenses',
    value: '₹1.6L',
    change: '-4%',
    color: '#ef4444',
    icon: 'ti-wallet',
  },
  {
    title: 'Invoices',
    value: '142',
    change: '18 Pending',
    color: '#7c3aed',
    icon: 'ti-file-invoice',
  },
  {
    title: 'Collection Rate',
    value: '94%',
    change: '+2%',
    color: '#10b981',
    icon: 'ti-target',
  },
]

const invoices = [
  {
    client: 'Priya Sharma',
    invoice: 'INV-2401',
    amount: '₹45,000',
    status: 'Paid',
  },
  {
    client: 'Rohit Verma',
    invoice: 'INV-2402',
    amount: '₹18,000',
    status: 'Pending',
  },
  {
    client: 'Nirmal Parikh',
    invoice: 'INV-2403',
    amount: '₹60,000',
    status: 'Overdue',
  },
]

const payments = [
  {
    client: 'Priya Sharma',
    amount: '₹25,000',
    method: 'UPI',
  },
  {
    client: 'Amit Shah',
    amount: '₹40,000',
    method: 'Bank Transfer',
  },
  {
    client: 'Rahul Singh',
    amount: '₹18,000',
    method: 'Cheque',
  },
]

export default function BillingOverview() {
  return (
    <div>

      {/* KPI */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6,1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        {stats.map((item) => (
          <div
            key={item.title}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                {item.title}
              </span>

              <i
                className={`ti ${item.icon}`}
                style={{
                  color: item.color,
                  fontSize: 22,
                }}
              />
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {item.value}
            </div>

            <div
              style={{
                marginTop: 6,
                color: item.color,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {item.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            padding: 24,
            height: 320,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Monthly Revenue
          </h3>

          <div
            style={{
              height: 220,
              borderRadius: 12,
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            Revenue Chart
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            padding: 24,
            height: 320,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Financial Summary
          </h3>

          <Summary title="Revenue" value="₹12.5L" />
          <Summary title="Expenses" value="₹1.6L" />
          <Summary title="Profit" value="₹10.9L" />
          <Summary title="GST" value="₹84,000" />
          <Summary title="AI Cost" value="₹12,400" />
        </div>
      </div>

      {/* Tables */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}
      >
        <Table
          title="Recent Invoices"
          rows={invoices}
        />

        <PaymentTable
          rows={payments}
        />
      </div>

    </div>
  )
}

/* ---------------- Summary ---------------- */

function Summary({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '14px 0',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <span>{title}</span>

      <strong>{value}</strong>
    </div>
  )
}

/* ---------------- Invoice Table ---------------- */

function Table({
  title,
  rows,
}: any) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 22,
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        {title}
      </h3>

      {rows.map((row: any) => (
        <div
          key={row.invoice}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 0',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>
              {row.client}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              {row.invoice}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div>{row.amount}</div>

            <div
              style={{
                color:
                  row.status === 'Paid'
                    ? '#22c55e'
                    : row.status === 'Pending'
                    ? '#f59e0b'
                    : '#ef4444',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {row.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Payment Table ---------------- */

function PaymentTable({
  rows,
}: any) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 22,
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        Recent Payments
      </h3>

      {rows.map((row: any) => (
        <div
          key={row.client}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 0',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>
              {row.client}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              {row.method}
            </div>
          </div>

          <strong>{row.amount}</strong>
        </div>
      ))}
    </div>
  )
}