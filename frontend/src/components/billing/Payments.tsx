'use client'

const payments = [
  {
    id: 'PAY-001',
    client: 'Priya Sharma',
    invoice: 'INV-2026-001',
    amount: '₹45,000',
    method: 'UPI',
    date: '14 Jul 2026',
    status: 'Completed',
  },
  {
    id: 'PAY-002',
    client: 'Nirmal Parikh',
    invoice: 'INV-2026-002',
    amount: '₹25,000',
    method: 'Bank Transfer',
    date: '12 Jul 2026',
    status: 'Pending',
  },
  {
    id: 'PAY-003',
    client: 'Rahul Singh',
    invoice: 'INV-2026-003',
    amount: '₹18,000',
    method: 'Cheque',
    date: '09 Jul 2026',
    status: 'Completed',
  },
  {
    id: 'PAY-004',
    client: 'Amit Shah',
    invoice: 'INV-2026-004',
    amount: '₹12,500',
    method: 'Cash',
    date: '05 Jul 2026',
    status: 'Refunded',
  },
]

export default function Payments() {
  return (
    <div>

      {/* Search */}

      <div
        style={{
          display: 'flex',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <input
          placeholder="Search payment or client..."
          style={{
            flex: 1,
            height: 42,
            border: '1px solid #dbe3ef',
            borderRadius: 10,
            padding: '0 14px',
            fontSize: 14,
            outline: 'none',
          }}
        />

        <select style={selectStyle}>
          <option>All Methods</option>
          <option>UPI</option>
          <option>Bank Transfer</option>
          <option>Cash</option>
          <option>Cheque</option>
        </select>

        <button style={primaryButton}>
          <i className="ti ti-plus" style={{ marginRight: 8 }} />
          Record Payment
        </button>
      </div>

      {/* Table */}

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '130px 170px 150px 120px 140px 120px 160px',
            background: '#f8fafc',
            padding: '16px 20px',
            fontWeight: 700,
            fontSize: 13,
            color: '#475569',
          }}
        >
          <div>ID</div>
          <div>Client</div>
          <div>Invoice</div>
          <div>Amount</div>
          <div>Method</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {payments.map((payment) => (
          <div
            key={payment.id}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '130px 170px 150px 120px 140px 120px 160px',
              alignItems: 'center',
              padding: '18px 20px',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <strong>{payment.id}</strong>

            <div>
              <div style={{ fontWeight: 600 }}>
                {payment.client}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                }}
              >
                {payment.date}
              </div>
            </div>

            <div>{payment.invoice}</div>

            <div style={{ fontWeight: 600 }}>
              {payment.amount}
            </div>

            <MethodBadge method={payment.method} />

            <StatusBadge status={payment.status} />

            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <Action icon="ti-eye" />
              <Action icon="ti-pencil" />
              <Action icon="ti-download" />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginTop: 24,
        }}
      >
        <Summary
          title="Collected"
          value="₹8.3L"
        />

        <Summary
          title="Pending"
          value="₹2.4L"
        />

        <Summary
          title="Refunds"
          value="₹18,000"
        />

        <Summary
          title="Transactions"
          value="196"
        />
      </div>

    </div>
  )
}

/* ---------------- BADGES ---------------- */

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        background: '#eff6ff',
        color: '#2563eb',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {method}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'Completed'
      ? '#16a34a'
      : status === 'Pending'
      ? '#d97706'
      : '#dc2626'

  const background =
    status === 'Completed'
      ? '#dcfce7'
      : status === 'Pending'
      ? '#fef3c7'
      : '#fee2e2'

  return (
    <span
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        background,
        color,
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'center',
      }}
    >
      {status}
    </span>
  )
}

/* ---------------- ACTION ---------------- */

function Action({ icon }: { icon: string }) {
  return (
    <button
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        border: '1px solid #dbe3ef',
        background: '#fff',
        cursor: 'pointer',
      }}
    >
      <i className={`ti ${icon}`} />
    </button>
  )
}

/* ---------------- SUMMARY ---------------- */

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
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 13,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 26,
          fontWeight: 700,
          color: '#0f172a',
        }}
      >
        {value}
      </div>
    </div>
  )
}

/* ---------------- STYLES ---------------- */

const selectStyle: React.CSSProperties = {
  width: 180,
  height: 42,
  border: '1px solid #dbe3ef',
  borderRadius: 10,
  padding: '0 12px',
  outline: 'none',
}

const primaryButton: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '0 18px',
  height: 42,
  cursor: 'pointer',
  fontWeight: 600,
}