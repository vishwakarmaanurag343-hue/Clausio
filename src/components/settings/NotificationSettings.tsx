'use client'

export default function NotificationSettings() {
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
          Notification Settings
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Manage how Clausio keeps you informed about hearings, deadlines and AI activity.
        </p>
      </div>

      {/* ================= DELIVERY CHANNELS ================= */}

      <Section title="Delivery Channels">

        <Toggle
          title="Email Notifications"
          subtitle="Receive updates via email."
          enabled
        />

        <Toggle
          title="Desktop Notifications"
          subtitle="Show notifications inside Clausio."
          enabled
        />

        <Toggle
          title="WhatsApp Notifications"
          subtitle="Receive important alerts on WhatsApp."
          enabled
        />

        <Toggle
          title="SMS Notifications"
          subtitle="Receive urgent alerts by SMS."
        />

      </Section>

      {/* ================= CASE EVENTS ================= */}

      <Section title="Case Events">

        <Toggle
          title="Upcoming Hearings"
          subtitle="Notify before every scheduled hearing."
          enabled
        />

        <Toggle
          title="Deadline Reminders"
          subtitle="Receive reminders for filing deadlines."
          enabled
        />

        <Toggle
          title="New Case Assignment"
          subtitle="Notify when a new case is assigned."
          enabled
        />

        <Toggle
          title="Document Upload"
          subtitle="Notify when documents are added."
        />

      </Section>

      {/* ================= AI EVENTS ================= */}

      <Section title="AI Notifications">

        <Toggle
          title="Draft Completed"
          subtitle="Notify when AI drafting finishes."
          enabled
        />

        <Toggle
          title="Strategy Generated"
          subtitle="Notify after AI litigation strategy is ready."
          enabled
        />

        <Toggle
          title="Financial Analysis"
          subtitle="Notify after maintenance analysis completes."
        />

        <Toggle
          title="Readiness Report"
          subtitle="Notify when readiness report is generated."
          enabled
        />

      </Section>

      {/* ================= CLIENT COMMUNICATION ================= */}

      <Section title="Client Communication">

        <Toggle
          title="Client Message"
          subtitle="Notify when clients send messages."
          enabled
        />

        <Toggle
          title="WhatsApp Delivery"
          subtitle="Notify when WhatsApp updates are delivered."
        />

        <Toggle
          title="Client Portal Activity"
          subtitle="Notify when clients upload documents."
          enabled
        />

      </Section>

      {/* ================= BILLING ================= */}

      <Section title="Billing">

        <Toggle
          title="Invoice Generated"
          subtitle="Notify when invoices are created."
          enabled
        />

        <Toggle
          title="Payment Received"
          subtitle="Notify after receiving payments."
          enabled
        />

        <Toggle
          title="Subscription Renewal"
          subtitle="Reminder before subscription renewal."
          enabled
        />

      </Section>

      {/* ================= DIGEST ================= */}

      <Section title="Daily Summary">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          <Field
            label="Digest Frequency"
            value="Daily"
          />

          <Field
            label="Reminder Time"
            value="09:00 AM"
          />
        </div>

      </Section>

      {/* ================= SAVE ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 35,
        }}
      >
        <button style={buttonStyle}>
          <i
            className="ti ti-device-floppy"
            style={{ marginRight: 8 }}
          />
          Save Notification Settings
        </button>
      </div>

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

function Field({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
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
        defaultValue={value}
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

const buttonStyle: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 22px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 14,
}