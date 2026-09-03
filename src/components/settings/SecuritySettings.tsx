'use client'

export default function SecuritySettings() {
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
          Security Settings
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Protect your account, client data and legal documents with advanced security controls.
        </p>
      </div>

      {/* ================= PASSWORD ================= */}

      <Section title="Password">

        <Field
          label="Current Password"
          placeholder="••••••••••••"
        />

        <Field
          label="New Password"
          placeholder="Enter new password"
        />

        <Field
          label="Confirm Password"
          placeholder="Confirm password"
        />

        <button style={primaryButton}>
          Change Password
        </button>

      </Section>

      {/* ================= TWO FACTOR ================= */}

      <Section title="Two-Factor Authentication">

        <Toggle
          title="Enable Two-Factor Authentication"
          subtitle="Protect your account using an authenticator app."
          enabled
        />

        <Toggle
          title="Email Verification"
          subtitle="Require email verification for new logins."
          enabled
        />

        <Toggle
          title="SMS Verification"
          subtitle="Receive verification codes by SMS."
        />

      </Section>

      {/* ================= LOGIN SESSIONS ================= */}

      <Section title="Active Sessions">

        <Session
          device="MacBook Pro"
          browser="Chrome"
          location="Mumbai, India"
          status="Current Session"
        />

        <Session
          device="iPhone 15"
          browser="Safari"
          location="Mumbai, India"
          status="Active"
        />

        <Session
          device="Windows Laptop"
          browser="Edge"
          location="Delhi, India"
          status="Last Week"
        />

      </Section>

      {/* ================= API ================= */}

      <Section title="API Access">

        <Toggle
          title="Allow API Access"
          subtitle="Enable external integrations."
          enabled
        />

        <Toggle
          title="Allow Third-Party Plugins"
          subtitle="Permit approved third-party applications."
        />

      </Section>

      {/* ================= PRIVACY ================= */}

      <Section title="Privacy">

        <Toggle
          title="Encrypt Client Documents"
          subtitle="Encrypt uploaded case documents."
          enabled
        />

        <Toggle
          title="Encrypt AI Conversations"
          subtitle="Protect AI conversations with encryption."
          enabled
        />

        <Toggle
          title="Anonymous Analytics"
          subtitle="Help improve Clausio with anonymous usage data."
        />

      </Section>

      {/* ================= RECOVERY ================= */}

      <Section title="Recovery">

        <Field
          label="Recovery Email"
          placeholder="support@example.com"
        />

        <button
          style={{
            ...primaryButton,
            marginTop: 18,
          }}
        >
          Update Recovery Email
        </button>

      </Section>

      {/* ================= DANGER ================= */}

      <Section title="Danger Zone">

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
            Logout From All Devices
          </h3>

          <p
            style={{
              color: '#7f1d1d',
              marginBottom: 20,
            }}
          >
            Sign out from every active session. You will need to login again on all devices.
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
            Logout Everywhere
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
          color: '#0f172a',
          fontSize: 18,
        }}
      >
        {title}
      </h3>

      {children}
    </div>
  )
}

function Field({
  label,
  placeholder,
}: {
  label: string
  placeholder: string
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          fontWeight: 600,
          color: '#334155',
          fontSize: 13,
        }}
      >
        {label}
      </label>

      <input
        type="password"
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 42,
          border: '1px solid #dbe3ef',
          borderRadius: 10,
          padding: '0 14px',
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function Toggle({
  title,
  subtitle,
  enabled,
}: {
  title: string
  subtitle: string
  enabled?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 0',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <div>
        <div
          style={{
            fontWeight: 600,
            color: '#0f172a',
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 4,
            color: '#64748b',
            fontSize: 13,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          width: 46,
          height: 24,
          borderRadius: 999,
          background: enabled ? '#2563eb' : '#cbd5e1',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: enabled ? 25 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
          }}
        />
      </div>
    </div>
  )
}

function Session({
  device,
  browser,
  location,
  status,
}: {
  device: string
  browser: string
  location: string
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
          {device}
        </div>

        <div
          style={{
            marginTop: 4,
            color: '#64748b',
            fontSize: 13,
          }}
        >
          {browser} • {location}
        </div>
      </div>

      <span
        style={{
          background: '#eff6ff',
          color: '#2563eb',
          padding: '6px 12px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {status}
      </span>
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