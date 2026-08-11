'use client'

const expenses = [
  {
    id: 'EXP-001',
    category: 'Office Rent',
    description: 'July Office Rent',
    amount: '₹75,000',
    date: '01 Jul 2026',
    payment: 'Bank Transfer',
  },
  {
    id: 'EXP-002',
    category: 'Court Fees',
    description: 'Family Court Filing',
    amount: '₹8,500',
    date: '05 Jul 2026',
    payment: 'Cash',
  },
  {
    id: 'EXP-003',
    category: 'AI Services',
    description: 'OpenAI API',
    amount: '₹12,400',
    date: '08 Jul 2026',
    payment: 'Credit Card',
  },
  {
    id: 'EXP-004',
    category: 'Travel',
    description: 'Mumbai High Court',
    amount: '₹3,800',
    date: '10 Jul 2026',
    payment: 'UPI',
  },
  {
    id: 'EXP-005',
    category: 'Salary',
    description: 'Associate Salary',
    amount: '₹60,000',
    date: '12 Jul 2026',
    payment: 'Bank Transfer',
  },
]

export default function Expenses() {
  return (
    <div>

      {/* ================= TOP ACTIONS ================= */}

      <div
        style={{
          display: 'flex',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <input
          placeholder="Search expense..."
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
          <option>All Categories</option>
          <option>Office Rent</option>
          <option>Salary</option>
          <option>Court Fees</option>
          <option>Travel</option>
          <option>AI Services</option>
          <option>Marketing</option>
        </select>

        <button style={primaryButton}>
          <i className="ti ti-plus" style={{ marginRight: 8 }} />
          Add Expense
        </button>
      </div>

      {/* ================= SUMMARY CARDS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        <SummaryCard
          title="This Month"
          value="₹1.59L"
          color="#dc2626"
        />

        <SummaryCard
          title="Court Fees"
          value="₹28,400"
          color="#2563eb"
        />

        <SummaryCard
          title="AI Services"
          value="₹12,400"
          color="#7c3aed"
        />

        <SummaryCard
          title="Travel"
          value="₹18,700"
          color="#f59e0b"
        />
      </div>

      {/* ================= TABLE ================= */}

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
              '120px 170px 220px 120px 140px 140px 160px',
            padding: '16px 20px',
            background: '#f8fafc',
            fontWeight: 700,
            color: '#475569',
            fontSize: 13,
          }}
        >
          <div>ID</div>
          <div>Category</div>
          <div>Description</div>
          <div>Amount</div>
          <div>Date</div>
          <div>Payment</div>
          <div>Actions</div>
        </div>

        {expenses.map((expense) => (
          <div
            key={expense.id}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '120px 170px 220px 120px 140px 140px 160px',
              alignItems: 'center',
              padding: '18px 20px',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <strong>{expense.id}</strong>

            <CategoryBadge category={expense.category} />

            <div>{expense.description}</div>

            <div
              style={{
                color: '#dc2626',
                fontWeight: 700,
              }}
            >
              {expense.amount}
            </div>

            <div>{expense.date}</div>

            <div>{expense.payment}</div>

            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <ActionButton icon="ti-eye" />
              <ActionButton icon="ti-pencil" />
              <ActionButton icon="ti-trash" />
            </div>
          </div>
        ))}
      </div>

      {/* ================= CATEGORY ANALYSIS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 20,
          marginTop: 24,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            height: 320,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Expense Trend
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
            Expense Chart
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
            Top Categories
          </h3>

          <CategoryRow title="Office Rent" value="₹75,000" />
          <CategoryRow title="Salary" value="₹60,000" />
          <CategoryRow title="Court Fees" value="₹28,400" />
          <CategoryRow title="AI Services" value="₹12,400" />
          <CategoryRow title="Travel" value="₹18,700" />
        </div>
      </div>

    </div>
  )
}

/* ---------------- COMPONENTS ---------------- */

function SummaryCard({
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
      <div style={{ color: '#64748b', fontSize: 13 }}>
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

function CategoryBadge({
  category,
}: {
  category: string
}) {
  return (
    <span
      style={{
        background: '#eff6ff',
        color: '#2563eb',
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {category}
    </span>
  )
}

function ActionButton({
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

function CategoryRow({
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