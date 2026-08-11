'use client'

const trustAccounts = [
  {
    client: 'Priya Sharma',
    account: 'TR-1001',
    balance: '₹1,25,000',
    held: '₹25,000',
    available: '₹1,00,000',
    status: 'Active',
  },
  {
    client: 'Nirmal Parikh',
    account: 'TR-1002',
    balance: '₹75,000',
    held: '₹15,000',
    available: '₹60,000',
    status: 'Active',
  },
  {
    client: 'Rahul Singh',
    account: 'TR-1003',
    balance: '₹40,000',
    held: '₹10,000',
    available: '₹30,000',
    status: 'Review',
  },
]

const transactions = [
  {
    date: '14 Jul 2026',
    client: 'Priya Sharma',
    type: 'Deposit',
    amount: '₹50,000',
  },
  {
    date: '12 Jul 2026',
    client: 'Nirmal Parikh',
    type: 'Withdrawal',
    amount: '₹15,000',
  },
  {
    date: '10 Jul 2026',
    client: 'Rahul Singh',
    type: 'Court Fee',
    amount: '₹5,000',
  },
]

export default function TrustAccounts() {
  return (
    <div>

      {/* Header */}

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
            Trust Accounts
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
            }}
          >
            Manage client retainers, escrow balances and trust transactions.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          <button style={secondaryButton}>
            <i
              className="ti ti-download"
              style={{ marginRight: 8 }}
            />
            Export
          </button>

          <button style={primaryButton}>
            <i
              className="ti ti-plus"
              style={{ marginRight: 8 }}
            />
            New Deposit
          </button>
        </div>
      </div>

      {/* Summary */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        <Summary title="Total Trust Balance" value="₹2,40,000" color="#2563eb" />
        <Summary title="Held Funds" value="₹50,000" color="#dc2626" />
        <Summary title="Available Funds" value="₹1,90,000" color="#16a34a" />
        <Summary title="Active Accounts" value="18" color="#7c3aed" />
      </div>

      {/* Accounts */}

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
              '200px 130px 140px 140px 140px 120px 160px',
            background: '#f8fafc',
            padding: '16px 20px',
            fontWeight: 700,
            color: '#475569',
          }}
        >
          <div>Client</div>
          <div>Account</div>
          <div>Balance</div>
          <div>Held</div>
          <div>Available</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {trustAccounts.map((account) => (
          <div
            key={account.account}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '200px 130px 140px 140px 140px 120px 160px',
              padding: '18px 20px',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <strong>{account.client}</strong>

            <div>{account.account}</div>

            <div>{account.balance}</div>

            <div style={{ color: '#dc2626', fontWeight: 600 }}>
              {account.held}
            </div>

            <div style={{ color: '#16a34a', fontWeight: 600 }}>
              {account.available}
            </div>

            <Status status={account.status} />

            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <Icon icon="ti-eye" />
              <Icon icon="ti-arrows-transfer-up" />
              <Icon icon="ti-download" />
            </div>
          </div>
        ))}
      </div>

      {/* Transactions */}

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 22,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          Recent Transactions
        </h3>

        {transactions.map((transaction, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom:
                index !== transactions.length - 1
                  ? '1px solid #e2e8f0'
                  : 'none',
            }}
          >
            <div>
              <strong>{transaction.client}</strong>

              <div
                style={{
                  color: '#64748b',
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                {transaction.date}
              </div>
            </div>

            <div>{transaction.type}</div>

            <strong>{transaction.amount}</strong>
          </div>
        ))}
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
        borderRadius: 16,
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
          fontSize: 28,
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
    status === 'Active'
      ? '#dcfce7'
      : '#fef3c7'

  const color =
    status === 'Active'
      ? '#15803d'
      : '#b45309'

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
      }}
    >
      {status}
    </span>
  )
}

function Icon({
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

const primaryButton: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '11px 18px',
  cursor: 'pointer',
  fontWeight: 600,
}

const secondaryButton: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dbe3ef',
  borderRadius: 10,
  padding: '11px 18px',
  cursor: 'pointer',
  fontWeight: 600,
}