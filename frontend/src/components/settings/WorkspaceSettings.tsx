'use client'

export default function WorkspaceSettings() {
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
          Workspace Settings
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Configure your law firm's identity, branding and workspace preferences.
        </p>
      </div>

      {/* ================= Firm Branding ================= */}

      <Section title="Firm Branding">

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 25,
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 14,
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            C
          </div>

          <div>
            <button style={primaryButton}>
              <i className="ti ti-upload" style={{ marginRight: 8 }} />
              Upload Logo
            </button>

            <p
              style={{
                marginTop: 10,
                color: '#64748b',
                fontSize: 13,
              }}
            >
              PNG, JPG or SVG. Recommended 512 × 512 px.
            </p>
          </div>
        </div>

        <Grid>

          <Field
            label="Law Firm Name"
            value="Clausio Technologies"
          />

          <Field
            label="Workspace Name"
            value="Parth Bindra Workspace"
          />

          <Field
            label="Company Email"
            value="info@clausio.ai"
          />

          <Field
            label="Support Email"
            value="support@clausio.ai"
          />

        </Grid>

      </Section>

      {/* ================= Regional Settings ================= */}

      <Section title="Regional Preferences">

        <Grid>

          <Field
            label="Country"
            value="India"
          />

          <Field
            label="State"
            value="Maharashtra"
          />

          <Field
            label="Time Zone"
            value="Asia/Kolkata"
          />

          <Field
            label="Currency"
            value="INR (₹)"
          />

          <Field
            label="Date Format"
            value="DD/MM/YYYY"
          />

          <Field
            label="Time Format"
            value="24 Hours"
          />

        </Grid>

      </Section>

      {/* ================= Case Preferences ================= */}

      <Section title="Case Preferences">

        <Grid>

          <Field
            label="Default Case Prefix"
            value="FC"
          />

          <Field
            label="Case Number Format"
            value="FC/0001/2026"
          />

          <Field
            label="Default Dashboard"
            value="Overview"
          />

          <Field
            label="Opening Screen"
            value="Dashboard"
          />

        </Grid>

      </Section>

      {/* ================= Branding ================= */}

      <Section title="Branding">

        <Toggle
          title="Show Firm Logo on Reports"
          subtitle="Display your firm logo on generated reports."
          enabled
        />

        <Toggle
          title="Show Firm Logo on Drafts"
          subtitle="Include logo in legal documents."
          enabled
        />

        <Toggle
          title="Use Clausio Branding"
          subtitle="Display Clausio branding inside exported files."
        />

      </Section>

      {/* ================= Save ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 35,
        }}
      >
        <button style={primaryButton}>
          <i
            className="ti ti-device-floppy"
            style={{ marginRight: 8 }}
          />

          Save Workspace
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
          boxSizing: 'border-box',
          outline: 'none',
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