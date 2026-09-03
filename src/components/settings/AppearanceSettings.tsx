'use client'

export default function AppearanceSettings() {
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
          Appearance
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Personalize the appearance and layout of your Clausio workspace.
        </p>
      </div>

      {/* ================= THEME ================= */}

      <Section title="Theme">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          <ThemeCard
            title="Light"
            icon="ti-sun"
            active
          />

          <ThemeCard
            title="Dark"
            icon="ti-moon"
          />

          <ThemeCard
            title="System"
            icon="ti-device-desktop"
          />
        </div>

      </Section>

      {/* ================= LAYOUT ================= */}

      <Section title="Workspace Layout">

        <Toggle
          title="Compact Mode"
          subtitle="Reduce spacing for more content."
        />

        <Toggle
          title="Show Sidebar Labels"
          subtitle="Always display sidebar labels."
          enabled
        />

        <Toggle
          title="Sticky Header"
          subtitle="Keep top navigation visible."
          enabled
        />

        <Toggle
          title="Animations"
          subtitle="Enable interface animations."
          enabled
        />

      </Section>

      {/* ================= DISPLAY ================= */}

      <Section title="Display Preferences">

        <Grid>

          <Field
            label="Font Size"
            value="14 px"
          />

          <Field
            label="Sidebar Width"
            value="Expanded"
          />

          <Field
            label="Accent Color"
            value="Blue"
          />

          <Field
            label="Border Radius"
            value="12 px"
          />

        </Grid>

      </Section>

      {/* ================= DASHBOARD ================= */}

      <Section title="Default Dashboard">

        <Grid>

          <Field
            label="Opening Screen"
            value="Dashboard"
          />

          <Field
            label="Default Tab"
            value="Overview"
          />

        </Grid>

      </Section>

      {/* ================= SAVE ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 35,
        }}
      >
        <button
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 22px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <i
            className="ti ti-device-floppy"
            style={{ marginRight: 8 }}
          />

          Save Appearance
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

function Grid({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
      }}
    >
      {children}
    </div>
  )
}

function ThemeCard({
  title,
  icon,
  active,
}: {
  title: string
  icon: string
  active?: boolean
}) {
  return (
    <div
      style={{
        border: active
          ? '2px solid #2563eb'
          : '1px solid #e2e8f0',
        borderRadius: 14,
        padding: 22,
        cursor: 'pointer',
        background: active ? '#eff6ff' : '#fff',
        textAlign: 'center',
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{
          fontSize: 34,
          color: '#2563eb',
        }}
      />

      <div
        style={{
          marginTop: 14,
          fontWeight: 700,
          fontSize: 17,
          color: '#0f172a',
        }}
      >
        {title}
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
          fontSize: 13,
          fontWeight: 600,
          color: '#334155',
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