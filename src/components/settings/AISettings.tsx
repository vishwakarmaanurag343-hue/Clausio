'use client'

export default function AISettings() {
  return (
    <div>

      {/* Header */}

      <div style={{ marginBottom: 30 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          AI Settings
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Configure Clausio AI, default models and drafting behaviour.
        </p>
      </div>

      {/* AI Provider */}

      <Section title="AI Provider">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          <Card
            icon="ti-brand-openai"
            title="OpenAI"
            subtitle="GPT-5.5"
            active
          />

          <Card
            icon="ti-brain"
            title="Claude"
            subtitle="Anthropic"
          />

          <Card
            icon="ti-sparkles"
            title="Gemini"
            subtitle="Google AI"
          />
        </div>

      </Section>

      {/* Default Model */}

      <Section title="Default AI Model">

        <select style={selectStyle}>
          <option>GPT-5.5</option>
          <option>GPT-4.1</option>
          <option>Claude Sonnet</option>
          <option>Claude Opus</option>
          <option>Gemini 2.5 Pro</option>
        </select>

      </Section>

      {/* Draft Style */}

      <Section title="Draft Style">

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Chip text="Professional" active />
          <Chip text="Aggressive" />
          <Chip text="Balanced" />
          <Chip text="Concise" />
          <Chip text="Detailed" />
        </div>

      </Section>

      {/* AI Features */}

      <Section title="AI Features">

        <Toggle
          title="Automatic Case Summary"
          subtitle="Generate summaries after document upload."
          enabled
        />

        <Toggle
          title="Legal Citation Suggestions"
          subtitle="Suggest relevant judgments while drafting."
          enabled
        />

        <Toggle
          title="AI Hearing Preparation"
          subtitle="Generate hearing preparation notes."
          enabled
        />

        <Toggle
          title="Financial Intelligence"
          subtitle="Estimate maintenance and settlement."
          enabled
        />

        <Toggle
          title="Client Communication"
          subtitle="Generate WhatsApp and email drafts."
        />

      </Section>

      {/* Temperature */}

      <Section title="AI Creativity">

        <input
          type="range"
          defaultValue={45}
          min={0}
          max={100}
          style={{
            width: '100%',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#64748b',
            marginTop: 8,
          }}
        >
          <span>Precise</span>

          <span>Balanced</span>

          <span>Creative</span>
        </div>

      </Section>

      {/* Save */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 34,
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

          Save AI Settings
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
        marginBottom: 34,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 16,
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

function Card({
  icon,
  title,
  subtitle,
  active,
}: {
  icon: string
  title: string
  subtitle: string
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
        background: active
          ? '#eff6ff'
          : '#fff',
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
          fontSize: 18,
          color: '#0f172a',
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: '#64748b',
          marginTop: 4,
        }}
      >
        {subtitle}
      </div>
    </div>
  )
}

function Chip({
  text,
  active,
}: {
  text: string
  active?: boolean
}) {
  return (
    <button
      style={{
        padding: '10px 18px',
        borderRadius: 999,
        border: active
          ? '2px solid #2563eb'
          : '1px solid #dbe3ef',
        background: active
          ? '#eff6ff'
          : '#fff',
        color: active
          ? '#2563eb'
          : '#475569',
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      {text}
    </button>
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
        padding: '16px 0',
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
          background: enabled
            ? '#2563eb'
            : '#cbd5e1',
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
            transition: '.2s',
          }}
        />
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  borderRadius: 10,
  border: '1px solid #dbe3ef',
  padding: '0 14px',
  fontSize: 14,
  outline: 'none',
  background: '#fff',
}