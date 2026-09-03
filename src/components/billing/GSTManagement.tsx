'use client'

const gstCards = [
  {
    title: 'GST Collected',
    value: '₹2,84,500',
    color: '#2563eb',
    icon: 'ti-receipt-tax',
  },
  {
    title: 'GST Paid',
    value: '₹1,26,400',
    color: '#16a34a',
    icon: 'ti-cash',
  },
  {
    title: 'GST Liability',
    value: '₹1,58,100',
    color: '#dc2626',
    icon: 'ti-alert-circle',
  },
  {
    title: 'Invoices',
    value: '142',
    color: '#7c3aed',
    icon: 'ti-file-invoice',
  },
]

const invoices = [
  {
    invoice: 'INV-2026-001',
    client: 'Priya Sharma',
    taxable: '₹25,000',
    gst: '₹4,500',
    total: '₹29,500',
  },
  {
    invoice: 'INV-2026-002',
    client: 'Nirmal Parikh',
    taxable: '₹40,000',
    gst: '₹7,200',
    total: '₹47,200',
  },
  {
    invoice: 'INV-2026-003',
    client: 'Rahul Singh',
    taxable: '₹18,000',
    gst: '₹3,240',
    total: '₹21,240',
  },
]

export default function GSTManagement() {
  return (
    <div>

      {/* ================= HEADER ================= */}

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
              fontSize: 24,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            GST Management
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
            }}
          >
            Manage GST invoices and tax summaries.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
          }}
        >
          <button style={secondaryButton}>
            <i
              className="ti ti-download"
              style={{ marginRight: 8 }}
            />
            GST Report
          </button>

          <button style={primaryButton}>
            <i
              className="ti ti-file-export"
              style={{ marginRight: 8 }}
            />
            Export Returns
          </button>
        </div>
      </div>

      {/* ================= KPI ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        {gstCards.map((card) => (
          <div
            key={card.title}
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
                {card.title}
              </span>

              <i
                className={`ti ${card.icon}`}
                style={{
                  color: card.color,
                  fontSize: 22,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 16,
                fontSize: 28,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ================= GST TABLE ================= */}

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '160px 200px 140px 140px 140px 160px',
            background: '#f8fafc',
            padding: '16px 20px',
            fontWeight: 700,
            color: '#475569',
          }}
        >
          <div>Invoice</div>
          <div>Client</div>
          <div>Taxable</div>
          <div>GST</div>
          <div>Total</div>
          <div>Actions</div>
        </div>

        {invoices.map((invoice) => (
          <div
            key={invoice.invoice}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '160px 200px 140px 140px 140px 160px',
              padding: '18px 20px',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <strong>{invoice.invoice}</strong>

            <div>{invoice.client}</div>

            <div>{invoice.taxable}</div>

            <div
              style={{
                color: '#2563eb',
                fontWeight: 600,
              }}
            >
              {invoice.gst}
            </div>

            <div
              style={{
                fontWeight: 700,
              }}
            >
              {invoice.total}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <Action icon="ti-eye" />
              <Action icon="ti-download" />
              <Action icon="ti-file-export" />
            </div>
          </div>
        ))}
      </div>

      {/* ================= RETURNS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 18,
        }}
      >
        <ReturnCard
          title="GSTR-1"
          description="Outward Supplies"
        />

        <ReturnCard
          title="GSTR-3B"
          description="Monthly Return"
        />

        <ReturnCard
          title="Annual GST"
          description="Yearly Summary"
        />
      </div>

    </div>
  )
}

/* ---------- COMPONENTS ---------- */

function Action({ icon }: { icon: string }) {
  return (
    <button
      style={{
        width: 34,
        height: 34,
        border: '1px solid #dbe3ef',
        borderRadius: 8,
        background: '#fff',
        cursor: 'pointer',
      }}
    >
      <i className={`ti ${icon}`} />
    </button>
  )
}

function ReturnCard({
  title,
  description,
}: {
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
        className="ti ti-receipt-tax"
        style={{
          fontSize: 28,
          color: '#2563eb',
        }}
      />

      <h3
        style={{
          marginTop: 18,
          marginBottom: 8,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: '#64748b',
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