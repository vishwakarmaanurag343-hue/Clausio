'use client'

const plans = [
  {
    name: 'Starter',
    price: '₹999/mo',
    active: false,
    color: '#64748b',
  },
  {
    name: 'Professional',
    price: '₹2,999/mo',
    active: true,
    color: '#2563eb',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    active: false,
    color: '#7c3aed',
  },
]

const usage = [
  {
    title: 'AI Credits',
    used: 847,
    total: 1000,
    color: '#2563eb',
  },
  {
    title: 'Documents',
    used: 382,
    total: 500,
    color: '#16a34a',
  },
  {
    title: 'Cases',
    used: 54,
    total: 100,
    color: '#f59e0b',
  },
]

export default function Subscription() {
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
            Subscription
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
            }}
          >
            Manage your Clausio subscription and AI usage.
          </p>
        </div>

        <button style={primaryButton}>
          Upgrade Plan
        </button>
      </div>

      {/* Current Plan */}

      <div
        style={{
          background: '#2563eb',
          color: '#fff',
          borderRadius: 18,
          padding: 28,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 13,
            opacity: .8,
          }}
        >
          Current Plan
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          Professional
        </div>

        <div
          style={{
            marginTop: 10,
            opacity: .9,
          }}
        >
          ₹2,999 / month
        </div>

        <div
          style={{
            marginTop: 18,
          }}
        >
          Next Renewal: 12 Aug 2026
        </div>
      </div>

      {/* Plans */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              background: '#fff',
              border: plan.active
                ? '2px solid #2563eb'
                : '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 22,
            }}
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              {plan.name}
            </h3>

            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: plan.color,
              }}
            >
              {plan.price}
            </div>

            <ul
              style={{
                marginTop: 20,
                color: '#64748b',
                lineHeight: '30px',
                paddingLeft: 18,
              }}
            >
              <li>AI Drafting</li>
              <li>Unlimited Cases</li>
              <li>Legal Research</li>
              <li>WhatsApp Updates</li>
              <li>Financial Dashboard</li>
            </ul>

            <button
              style={{
                marginTop: 20,
                width: '100%',
                height: 42,
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: plan.active
                  ? '#16a34a'
                  : '#2563eb',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              {plan.active ? 'Current Plan' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>

      {/* Usage */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        {usage.map((item) => {
          const percent = (item.used / item.total) * 100

          return (
            <div
              key={item.title}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 22,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <strong>{item.title}</strong>

                <span
                  style={{
                    color: '#64748b',
                  }}
                >
                  {item.used}/{item.total}
                </span>
              </div>

              <div
                style={{
                  marginTop: 18,
                  height: 10,
                  borderRadius: 999,
                  background: '#e2e8f0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: item.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Billing History */}

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
              '200px 150px 180px 160px 180px',
            padding: '16px 20px',
            background: '#f8fafc',
            fontWeight: 700,
            color: '#475569',
          }}
        >
          <div>Date</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Invoice</div>
          <div>Action</div>
        </div>

        {[
          ['12 Jul 2026', '₹2,999', 'Paid', 'INV-001'],
          ['12 Jun 2026', '₹2,999', 'Paid', 'INV-002'],
          ['12 May 2026', '₹2,999', 'Paid', 'INV-003'],
        ].map((item) => (
          <div
            key={item[3]}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '200px 150px 180px 160px 180px',
              padding: '18px 20px',
              borderTop: '1px solid #e2e8f0',
              alignItems: 'center',
            }}
          >
            <div>{item[0]}</div>

            <strong>{item[1]}</strong>

            <span
              style={{
                color: '#16a34a',
                fontWeight: 600,
              }}
            >
              {item[2]}
            </span>

            <div>{item[3]}</div>

            <button style={secondaryButton}>
              Download
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}

const primaryButton: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 22px',
  cursor: 'pointer',
  fontWeight: 600,
}

const secondaryButton: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dbe3ef',
  borderRadius: 8,
  padding: '8px 14px',
  cursor: 'pointer',
  fontWeight: 600,
}