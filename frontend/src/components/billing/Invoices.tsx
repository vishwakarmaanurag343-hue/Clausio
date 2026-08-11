'use client'

const invoices = [
  {
    number: 'INV-2026-001',
    client: 'Priya Sharma',
    matter: 'Divorce Petition',
    amount: '₹45,000',
    due: '20 Jul 2026',
    status: 'Paid',
  },
  {
    number: 'INV-2026-002',
    client: 'Nirmal Parikh',
    matter: 'Custody Case',
    amount: '₹75,000',
    due: '25 Jul 2026',
    status: 'Pending',
  },
  {
    number: 'INV-2026-003',
    client: 'Rahul Singh',
    matter: 'Property Dispute',
    amount: '₹28,000',
    due: '15 Jul 2026',
    status: 'Overdue',
  },
  {
    number: 'INV-2026-004',
    client: 'Amit Shah',
    matter: 'Maintenance',
    amount: '₹32,500',
    due: '30 Jul 2026',
    status: 'Draft',
  },
]

export default function Invoices() {
  return (
    <div>

      {/* Search + Filter */}

      <div
        style={{
          display: 'flex',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <input
          placeholder="Search invoice, client..."
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
          <option>All Status</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
          <option>Draft</option>
        </select>

        <button style={buttonStyle}>
          <i className="ti ti-filter" style={{ marginRight: 8 }} />
          Filters
        </button>
      </div>

      {/* Invoice Table */}

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Header */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '170px 180px 180px 140px 120px 120px 180px',
            padding: '16px 20px',
            background: '#f8fafc',
            fontWeight: 700,
            color: '#475569',
            fontSize: 13,
          }}
        >
          <div>Invoice</div>
          <div>Client</div>
          <div>Matter</div>
          <div>Amount</div>
          <div>Due Date</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {invoices.map((invoice) => (
          <div
            key={invoice.number}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '170px 180px 180px 140px 120px 120px 180px',
              padding: '18px 20px',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <strong>{invoice.number}</strong>

            <div>{invoice.client}</div>

            <div>{invoice.matter}</div>

            <div
              style={{
                fontWeight: 600,
              }}
            >
              {invoice.amount}
            </div>

            <div>{invoice.due}</div>

            <Status status={invoice.status} />

            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <IconButton icon="ti-eye" />
              <IconButton icon="ti-pencil" />
              <IconButton icon="ti-download" />
              <IconButton icon="ti-send" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Summary */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginTop: 24,
        }}
      >
        <Summary
          title="Total Invoices"
          value="142"
        />

        <Summary
          title="Outstanding"
          value="₹2.4L"
        />

        <Summary
          title="Paid This Month"
          value="₹8.3L"
        />

        <Summary
          title="Overdue"
          value="₹78,000"
        />
      </div>

    </div>
  )
}

/* ---------------- Components ---------------- */

function Status({
  status,
}: {
  status: string
}) {
  const color =
    status === 'Paid'
      ? '#16a34a'
      : status === 'Pending'
      ? '#d97706'
      : status === 'Overdue'
      ? '#dc2626'
      : '#64748b'

  const background =
    status === 'Paid'
      ? '#dcfce7'
      : status === 'Pending'
      ? '#fef3c7'
      : status === 'Overdue'
      ? '#fee2e2'
      : '#f1f5f9'

  return (
    <span
      style={{
        display: 'inline-block',
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

function IconButton({
  icon,
}: {
  icon: string
}) {
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

const selectStyle: React.CSSProperties = {
  width: 170,
  height: 42,
  border: '1px solid #dbe3ef',
  borderRadius: 10,
  padding: '0 12px',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  height: 42,
  border: '1px solid #dbe3ef',
  borderRadius: 10,
  padding: '0 18px',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
}