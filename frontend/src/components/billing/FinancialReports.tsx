'use client'

const reports = [
  {
    title: 'Monthly Revenue',
    value: '₹12.5L',
    change: '+18%',
    color: '#16a34a',
    icon: 'ti-chart-line',
  },
  {
    title: 'Monthly Expenses',
    value: '₹1.6L',
    change: '-4%',
    color: '#dc2626',
    icon: 'ti-wallet',
  },
  {
    title: 'Net Profit',
    value: '₹10.9L',
    change: '+22%',
    color: '#2563eb',
    icon: 'ti-currency-rupee',
  },
  {
    title: 'Collection Rate',
    value: '94%',
    change: '+2%',
    color: '#7c3aed',
    icon: 'ti-target',
  },
]

const monthlyData = [
  ['Jan', '₹8.2L'],
  ['Feb', '₹9.4L'],
  ['Mar', '₹10.1L'],
  ['Apr', '₹11.3L'],
  ['May', '₹12.0L'],
  ['Jun', '₹12.5L'],
]

export default function FinancialReports() {
  return (
    <div>

      {/* Header Actions */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              color: '#0f172a',
            }}
          >
            Financial Reports
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
            }}
          >
            Revenue, expenses and profitability insights.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
          }}
        >
          <button style={secondaryButton}>
            <i className="ti ti-file-download" style={{ marginRight: 8 }} />
            PDF
          </button>

          <button style={secondaryButton}>
            <i className="ti ti-table-export" style={{ marginRight: 8 }} />
            Excel
          </button>

          <button style={primaryButton}>
            <i className="ti ti-chart-bar" style={{ marginRight: 8 }} />
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        {reports.map((item) => (
          <div
            key={item.title}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
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
                  fontSize: 22,
                  color: item.color,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 14,
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
            height: 350,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Revenue vs Expenses
          </h3>

          <div
            style={{
              height: 250,
              background: '#f8fafc',
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            Revenue / Expense Chart
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Monthly Revenue
          </h3>

          {monthlyData.map(([month, value]) => (
            <div
              key={month}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <span>{month}</span>

              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Report Cards */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 18,
        }}
      >
        <ReportCard
          icon="ti-calendar-month"
          title="Monthly Report"
          description="Revenue, invoices and expenses."
        />

        <ReportCard
          icon="ti-calendar-stats"
          title="Quarterly Report"
          description="Financial performance analysis."
        />

        <ReportCard
          icon="ti-calendar-event"
          title="Yearly Report"
          description="Annual accounting summary."
        />

        <ReportCard
          icon="ti-receipt-tax"
          title="GST Report"
          description="GST filing report."
        />

        <ReportCard
          icon="ti-users"
          title="Client Revenue"
          description="Revenue generated client-wise."
        />

        <ReportCard
          icon="ti-chart-pie"
          title="Profit Analysis"
          description="Net margin & profitability."
        />
      </div>

    </div>
  )
}

/* ---------- COMPONENT ---------- */

function ReportCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 22,
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{
          fontSize: 28,
          color: '#2563eb',
        }}
      />

      <h3
        style={{
          marginTop: 18,
          marginBottom: 8,
          color: '#0f172a',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: '#64748b',
          fontSize: 13,
          minHeight: 42,
        }}
      >
        {description}
      </p>

      <button style={primaryButton}>
        Generate
      </button>
    </div>
  )
}

const primaryButton: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  cursor: 'pointer',
  fontWeight: 600,
}

const secondaryButton: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dbe3ef',
  borderRadius: 10,
  padding: '10px 18px',
  cursor: 'pointer',
  fontWeight: 600,
}