'use client'

const clients = [
  {
    name: 'Priya Sharma',
    matter: 'Divorce Petition',
    total: '₹1,20,000',
    paid: '₹90,000',
    pending: '₹30,000',
    invoices: 4,
    status: 'Active',
  },
  {
    name: 'Nirmal Parikh',
    matter: 'Custody Case',
    total: '₹2,50,000',
    paid: '₹1,75,000',
    pending: '₹75,000',
    invoices: 6,
    status: 'Pending',
  },
  {
    name: 'Rahul Singh',
    matter: 'Property Dispute',
    total: '₹80,000',
    paid: '₹80,000',
    pending: '₹0',
    invoices: 3,
    status: 'Completed',
  },
  {
    name: 'Amit Shah',
    matter: 'Maintenance',
    total: '₹60,000',
    paid: '₹32,500',
    pending: '₹27,500',
    invoices: 2,
    status: 'Active',
  },
]

export default function ClientBilling() {
  return (
    <div>

      {/* ================= SEARCH ================= */}

      <div
        style={{
          display: 'flex',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <input
          placeholder="Search client..."
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

        <button style={primaryButton}>
          <i
            className="ti ti-plus"
            style={{ marginRight: 8 }}
          />
          Generate Invoice
        </button>
      </div>

      {/* ================= SUMMARY ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        <Summary title="Clients" value="48" color="#2563eb" />
        <Summary title="Outstanding" value="₹2.4L" color="#dc2626" />
        <Summary title="Collected" value="₹8.3L" color="#16a34a" />
        <Summary title="Invoices" value="142" color="#7c3aed" />
      </div>

      {/* ================= CLIENT TABLE ================= */}

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '200px 180px 120px 120px 120px 100px 120px 180px',
            background: '#f8fafc',
            padding: '16px 20px',
            fontWeight: 700,
            fontSize: 13,
            color: '#475569',
          }}
        >
          <div>Client</div>
          <div>Matter</div>
          <div>Total</div>
          <div>Paid</div>
          <div>Pending</div>
          <div>Invoices</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {clients.map((client) => (
          <div
            key={client.name}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '200px 180px 120px 120px 120px 100px 120px 180px',
              padding: '18px 20px',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <strong>{client.name}</strong>

            <div>{client.matter}</div>

            <div>{client.total}</div>

            <div
              style={{
                color: '#16a34a',
                fontWeight: 600,
              }}
            >
              {client.paid}
            </div>

            <div
              style={{
                color: '#dc2626',
                fontWeight: 600,
              }}
            >
              {client.pending}
            </div>

            <div>{client.invoices}</div>

            <Status status={client.status} />

            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <IconButton icon="ti-eye" />
              <IconButton icon="ti-file-invoice" />
              <IconButton icon="ti-send" />
              <IconButton icon="ti-cash" />
            </div>
          </div>
        ))}
      </div>

      {/* ================= TOP OUTSTANDING ================= */}

      <div
        style={{
          marginTop: 24,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 20,
          }}
        >
          Top Outstanding Clients
        </h3>

        <Outstanding client="Nirmal Parikh" amount="₹75,000" />
        <Outstanding client="Priya Sharma" amount="₹30,000" />
        <Outstanding client="Amit Shah" amount="₹27,500" />
      </div>

    </div>
  )
}

/* ---------------- COMPONENTS ---------------- */

function Summary({
  title,
  value,
  color,
}: {
  title: string
  value: string
  color: string
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
          fontSize: 13,
          color: '#64748b',
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 26,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Status({
  status,
}: {
  status: string
}) {
  const background =
    status === 'Completed'
      ? '#dcfce7'
      : status === 'Pending'
      ? '#fef3c7'
      : '#dbeafe'

  const color =
    status === 'Completed'
      ? '#15803d'
      : status === 'Pending'
      ? '#b45309'
      : '#1d4ed8'

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

function Outstanding({
  client,
  amount,
}: {
  client: string
  amount: string
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
      <span>{client}</span>

      <strong
        style={{
          color: '#dc2626',
        }}
      >
        {amount}
      </strong>
    </div>
  )
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