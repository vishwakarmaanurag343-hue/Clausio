'use client'

export default function BillingSettings() {
  return (
    <div>

      {/* ================= HEADER ================= */}

      <div style={{ marginBottom: 30 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Billing & Subscription
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Manage your subscription, invoices, AI credits and payment methods.
        </p>
      </div>

      {/* ================= CURRENT PLAN ================= */}

      <Section title="Current Plan">

        <div
          style={{
            border: '1px solid #dbeafe',
            background: '#eff6ff',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>

              <h3
                style={{
                  margin: 0,
                  color: '#1e40af',
                  fontSize: 22,
                }}
              >
                Clausio Professional
              </h3>

              <p
                style={{
                  marginTop: 8,
                  color: '#475569',
                }}
              >
                ₹4,999 / month
              </p>

            </div>

            <button style={primaryButton}>
              Upgrade Plan
            </button>

          </div>
        </div>

      </Section>

      {/* ================= AI CREDITS ================= */}

      <Section title="AI Credits">

        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: 22,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span style={{ fontWeight: 600 }}>
              Credits Remaining
            </span>

            <span
              style={{
                color: '#2563eb',
                fontWeight: 700,
              }}
            >
              847 / 1000
            </span>
          </div>

          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: '#e2e8f0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '84%',
                height: '100%',
                background: '#2563eb',
              }}
            />
          </div>

          <button
            style={{
              ...primaryButton,
              marginTop: 20,
            }}
          >
            Buy More Credits
          </button>
        </div>

      </Section>

      {/* ================= PAYMENT METHOD ================= */}

      <Section title="Payment Method">

        <InfoCard
          title="Primary Card"
          value="Visa •••• 4589"
        />

        <InfoCard
          title="Billing Email"
          value="parth@clausio.ai"
        />

        <InfoCard
          title="Billing Address"
          value="Mumbai, Maharashtra, India"
        />

        <button
          style={{
            ...primaryButton,
            marginTop: 20,
          }}
        >
          Update Payment Method
        </button>

      </Section>

      {/* ================= BILLING HISTORY ================= */}

      <Section title="Recent Invoices">

        <Invoice
          invoice="INV-2026-001"
          amount="₹4,999"
          date="15 July 2026"
          status="Paid"
        />

        <Invoice
          invoice="INV-2026-002"
          amount="₹4,999"
          date="15 June 2026"
          status="Paid"
        />

        <Invoice
          invoice="INV-2026-003"
          amount="₹4,999"
          date="15 May 2026"
          status="Paid"
        />

      </Section>

      {/* ================= DANGER ================= */}

      <Section title="Subscription">

        <div
          style={{
            border: '1px solid #fecaca',
            background: '#fef2f2',
            borderRadius: 14,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: '#dc2626',
            }}
          >
            Cancel Subscription
          </h3>

          <p
            style={{
              color: '#7f1d1d',
              marginBottom: 18,
            }}
          >
            Your subscription will remain active until the current billing period ends.
          </p>

          <button
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancel Subscription
          </button>
        </div>

      </Section>

    </div>
  )
}

/* ---------------------------------------------------------------- */

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: 18,
          fontSize: 18,
          color: '#0f172a',
        }}
      >
        {title}
      </h3>

      {children}
    </div>
  )
}

function InfoCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          color: '#94a3b8',
          fontSize: 12,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontWeight: 600,
          color: '#0f172a',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Invoice({
  invoice,
  amount,
  date,
  status,
}: {
  invoice: string
  amount: string
  date: string
  status: string
}) {
  return (
    <div
      style={{
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div
          style={{
            fontWeight: 600,
            color: '#0f172a',
          }}
        >
          {invoice}
        </div>

        <div
          style={{
            marginTop: 4,
            color: '#64748b',
            fontSize: 13,
          }}
        >
          {date}
        </div>
      </div>

      <div
        style={{
          textAlign: 'right',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          {amount}
        </div>

        <div
          style={{
            marginTop: 4,
            color: '#22c55e',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {status}
        </div>
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
  fontSize: 14,
}