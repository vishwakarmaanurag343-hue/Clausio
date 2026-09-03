'use client'

export default function TeamSettings() {
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
          Team Management
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Invite advocates, associates and interns to collaborate securely.
        </p>
      </div>

      {/* ================= TEAM OVERVIEW ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 34,
        }}
      >
        <StatCard title="Members" value="18" icon="ti-users" />
        <StatCard title="Advocates" value="8" icon="ti-scale" />
        <StatCard title="Associates" value="6" icon="ti-briefcase" />
        <StatCard title="Interns" value="4" icon="ti-school" />
      </div>

      {/* ================= INVITE ================= */}

      <Section title="Invite New Member">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr auto',
            gap: 16,
            alignItems: 'end',
          }}
        >
          <Field
            label="Email Address"
            placeholder="advocate@example.com"
          />

          <SelectField
            label="Role"
            options={[
              'Administrator',
              'Senior Advocate',
              'Advocate',
              'Associate',
              'Intern',
              'Accountant',
            ]}
          />

          <button style={primaryButton}>
            Invite
          </button>
        </div>

      </Section>

      {/* ================= MEMBERS ================= */}

      <Section title="Team Members">

        <Member
          initials="PB"
          name="Parth Bindra"
          role="Administrator"
          email="parth@clausio.ai"
          status="Online"
        />

        <Member
          initials="RP"
          name="Ram Pugalia"
          role="Senior Advocate"
          email="ram@clausio.ai"
          status="Online"
        />

        <Member
          initials="AK"
          name="Amit Kumar"
          role="Associate"
          email="amit@clausio.ai"
          status="Away"
        />

        <Member
          initials="SN"
          name="Sneha Nair"
          role="Intern"
          email="sneha@clausio.ai"
          status="Offline"
        />

      </Section>

      {/* ================= PERMISSIONS ================= */}

      <Section title="Permissions">

        <Toggle
          title="Allow Case Creation"
          subtitle="Members can create new cases."
          enabled
        />

        <Toggle
          title="Allow AI Drafting"
          subtitle="Members can use AI drafting."
          enabled
        />

        <Toggle
          title="Allow Billing Access"
          subtitle="Access to invoices and subscription."
        />

        <Toggle
          title="Allow Settings Access"
          subtitle="Modify workspace settings."
        />

        <Toggle
          title="Allow Member Invitations"
          subtitle="Invite additional team members."
          enabled
        />

      </Section>

      {/* ================= ROLES ================= */}

      <Section title="Role Permissions">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          <RoleCard
            title="Administrator"
            users="2 Members"
            color="#2563eb"
          />

          <RoleCard
            title="Advocate"
            users="8 Members"
            color="#22c55e"
          />

          <RoleCard
            title="Associate"
            users="8 Members"
            color="#f59e0b"
          />
        </div>

      </Section>

      {/* ================= SAVE ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 34,
        }}
      >
        <button style={primaryButton}>
          <i
            className="ti ti-device-floppy"
            style={{ marginRight: 8 }}
          />
          Save Team Settings
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
    <div style={{ marginBottom: 38 }}>
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

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: string
}) {
  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: 20,
        background: '#fff',
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{
          fontSize: 26,
          color: '#2563eb',
        }}
      />

      <div
        style={{
          marginTop: 14,
          fontSize: 24,
          fontWeight: 700,
          color: '#0f172a',
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 4,
          color: '#64748b',
          fontSize: 13,
        }}
      >
        {title}
      </div>
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
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      <input
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}

function SelectField({
  label,
  options,
}: {
  label: string
  options: string[]
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      <select style={inputStyle}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  )
}

function Member({
  initials,
  name,
  role,
  email,
  status,
}: {
  initials: string
  name: string
  role: string
  email: string
  status: string
}) {
  const statusColor =
    status === 'Online'
      ? '#22c55e'
      : status === 'Away'
      ? '#f59e0b'
      : '#94a3b8'

  return (
    <div
      style={{
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 0',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#2563eb',
          color: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 700,
        }}
      >
        {initials}
      </div>

      <div style={{ marginLeft: 16, flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{name}</div>
        <div
          style={{
            fontSize: 13,
            color: '#64748b',
            marginTop: 2,
          }}
        >
          {role} • {email}
        </div>
      </div>

      <span
        style={{
          color: statusColor,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        ● {status}
      </span>
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
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            color: '#64748b',
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

function RoleCard({
  title,
  users,
  color,
}: {
  title: string
  users: string
  color: string
}) {
  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: color,
          marginBottom: 14,
        }}
      />

      <div
        style={{
          fontWeight: 700,
          fontSize: 17,
          color: '#0f172a',
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 6,
          color: '#64748b',
        }}
      >
        {users}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  border: '1px solid #dbe3ef',
  borderRadius: 10,
  padding: '0 14px',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
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