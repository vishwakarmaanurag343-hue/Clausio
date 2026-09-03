'use client'

export default function AboutClausio() {
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
          About Clausio
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Product information, version details and support resources.
        </p>
      </div>

      {/* ================= APP CARD ================= */}

      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 28,
          background: '#fff',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 30,
            }}
          >
            C
          </div>

          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 24,
                color: '#0f172a',
              }}
            >
              Clausio
            </h3>

            <p
              style={{
                marginTop: 6,
                color: '#64748b',
              }}
            >
              AI Operating System for Lawyers
            </p>

            <span
              style={{
                display: 'inline-block',
                marginTop: 8,
                padding: '6px 12px',
                borderRadius: 999,
                background: '#eff6ff',
                color: '#2563eb',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              Version 1.0.0 Beta
            </span>
          </div>
        </div>
      </div>

      {/* ================= INFORMATION ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 22,
        }}
      >
        <InfoCard
          title="Application"
          value="Clausio"
        />

        <InfoCard
          title="Version"
          value="1.0.0 Beta"
        />

        <InfoCard
          title="Build"
          value="2026.07.15"
        />

        <InfoCard
          title="License"
          value="Commercial"
        />

        <InfoCard
          title="Developed By"
          value="Clausio Technologies Pvt. Ltd."
        />

        <InfoCard
          title="Founder"
          value="Parth Bindra"
        />

        <InfoCard
          title="Support Email"
          value="support@clausio.ai"
        />

        <InfoCard
          title="Website"
          value="www.clausio.ai"
        />
      </div>

      {/* ================= FEATURES ================= */}

      <div
        style={{
          marginTop: 34,
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: '#0f172a',
          }}
        >
          Core Modules
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: 12,
            marginTop: 18,
          }}
        >
          <Feature text="AI Drafting" />
          <Feature text="Legal Research" />
          <Feature text="Strategy Engine" />
          <Feature text="Financial Intelligence" />
          <Feature text="Case Readiness" />
          <Feature text="Client Communication" />
          <Feature text="AI Analysis" />
          <Feature text="Hearings Management" />
        </div>
      </div>

      {/* ================= LINKS ================= */}

      <div
        style={{
          marginTop: 34,
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: '#0f172a',
          }}
        >
          Resources
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 18,
          }}
        >
          <Resource text="Documentation" />
          <Resource text="Release Notes" />
          <Resource text="Privacy Policy" />
          <Resource text="Terms of Service" />
          <Resource text="Report a Bug" />
          <Resource text="Contact Support" />
        </div>
      </div>

      {/* ================= FOOTER ================= */}

      <div
        style={{
          marginTop: 36,
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 13,
        }}
      >
        © 2026 Clausio Technologies Pvt. Ltd.
        <br />
        Every Clause. Intelligently Handled.
      </div>

    </div>
  )
}

/* ---------------------------------------------------------------- */

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
          color: '#0f172a',
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Feature({
  text,
}: {
  text: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <i
        className="ti ti-circle-check"
        style={{
          color: '#22c55e',
          fontSize: 18,
        }}
      />

      <span
        style={{
          color: '#334155',
          fontSize: 14,
        }}
      >
        {text}
      </span>
    </div>
  )
}

function Resource({
  text,
}: {
  text: string
}) {
  return (
    <button
      style={{
        border: '1px solid #e2e8f0',
        background: '#fff',
        borderRadius: 10,
        padding: '12px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14,
        color: '#334155',
      }}
    >
      {text}

      <i className="ti ti-chevron-right" />
    </button>
  )
}