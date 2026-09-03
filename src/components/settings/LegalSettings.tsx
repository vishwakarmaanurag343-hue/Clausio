'use client'

export default function LegalSettings() {
  return (
    <div>

      {/* ================= Header ================= */}

      <div style={{ marginBottom: 30 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Legal Preferences
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Configure courts, jurisdictions, drafting standards and legal AI behaviour.
        </p>
      </div>

      {/* ================= Court Settings ================= */}

      <Section title="Default Court">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          <Field
            label="Court Type"
            value="Family Court"
          />

          <Field
            label="Jurisdiction"
            value="Mumbai"
          />

          <Field
            label="State"
            value="Maharashtra"
          />

          <Field
            label="Country"
            value="India"
          />
        </div>

      </Section>

      {/* ================= Drafting ================= */}

      <Section title="Drafting Preferences">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          <Field
            label="Drafting Language"
            value="English"
          />

          <Field
            label="Legal Tone"
            value="Professional"
          />

          <Field
            label="Citation Style"
            value="Indian Legal Citation"
          />

          <Field
            label="Default Petition"
            value="Family Petition"
          />
        </div>

      </Section>

      {/* ================= AI Behaviour ================= */}

      <Section title="Legal AI Behaviour">

        <Toggle
          title="Suggest Case Laws"
          subtitle="AI recommends relevant precedents while drafting."
          enabled
        />

        <Toggle
          title="Automatic Citation Formatting"
          subtitle="Format judgments using standard Indian citation style."
          enabled
        />

        <Toggle
          title="Generate Alternative Arguments"
          subtitle="Suggest additional legal arguments automatically."
          enabled
        />

        <Toggle
          title="Judge Behaviour Analysis"
          subtitle="Analyse judge history before hearings."
          enabled
        />

        <Toggle
          title="Risk Prediction"
          subtitle="Estimate litigation risks using AI."
        />

      </Section>

      {/* ================= Templates ================= */}

      <Section title="Default Templates">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          <Field
            label="Petition Template"
            value="Standard Family Court"
          />

          <Field
            label="Affidavit Template"
            value="General Affidavit"
          />

          <Field
            label="Notice Template"
            value="Legal Notice"
          />

          <Field
            label="Reply Template"
            value="Written Statement"
          />
        </div>

      </Section>

      {/* ================= Numbering ================= */}

      <Section title="Case Number Format">

        <Field
          label="Case Prefix"
          value="FC"
        />

        <Field
          label="Default Format"
          value="FC/0000/2026"
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

          Save Legal Settings
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
    <div
      style={{
        marginBottom: 36,
      }}
    >
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
          borderRadius: 10,
          border: '1px solid #dbe3ef',
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