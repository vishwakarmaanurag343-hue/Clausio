'use client'

const integrations = [
  {
    icon: 'ti-brand-google',
    name: 'Google Calendar',
    description: 'Sync hearings, reminders and court dates.',
    status: 'Connected',
    color: '#22c55e',
  },
  {
    icon: 'ti-brand-google-drive',
    name: 'Google Drive',
    description: 'Backup case files and generated documents.',
    status: 'Not Connected',
    color: '#94a3b8',
  },
  {
    icon: 'ti-brand-dropbox',
    name: 'Dropbox',
    description: 'Store case files securely.',
    status: 'Not Connected',
    color: '#94a3b8',
  },
  {
    icon: 'ti-brand-onedrive',
    name: 'OneDrive',
    description: 'Sync legal documents with Microsoft.',
    status: 'Connected',
    color: '#22c55e',
  },
  {
    icon: 'ti-mail',
    name: 'Microsoft Outlook',
    description: 'Email hearings and client communication.',
    status: 'Not Connected',
    color: '#94a3b8',
  },
  {
    icon: 'ti-brand-whatsapp',
    name: 'WhatsApp Business',
    description: 'Send AI generated client updates.',
    status: 'Connected',
    color: '#22c55e',
  },
  {
    icon: 'ti-brain',
    name: 'OpenAI',
    description: 'AI drafting, analysis and legal research.',
    status: 'Connected',
    color: '#22c55e',
  },
  {
    icon: 'ti-sparkles',
    name: 'Claude',
    description: 'Advanced reasoning for legal strategy.',
    status: 'Connected',
    color: '#22c55e',
  },
  {
    icon: 'ti-stars',
    name: 'Google Gemini',
    description: 'Alternative AI model.',
    status: 'Not Connected',
    color: '#94a3b8',
  },
]

export default function IntegrationSettings() {
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
          Integrations
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Connect Clausio with your favourite productivity,
          cloud storage and AI services.
        </p>
      </div>

      {/* Cards */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))',
          gap: 20,
        }}
      >
        {integrations.map((item) => (
          <div
            key={item.name}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 22,
              background: '#fff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: '#eff6ff',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <i
                  className={`ti ${item.icon}`}
                  style={{
                    fontSize: 24,
                    color: '#2563eb',
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: '#0f172a',
                    fontSize: 16,
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: '#64748b',
                  }}
                >
                  {item.description}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: item.color,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                ● {item.status}
              </span>

              <button
                style={{
                  background:
                    item.status === 'Connected'
                      ? '#fee2e2'
                      : '#2563eb',
                  color:
                    item.status === 'Connected'
                      ? '#dc2626'
                      : '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {item.status === 'Connected'
                  ? 'Disconnect'
                  : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* API Keys */}

      <div
        style={{
          marginTop: 40,
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
          API Keys
        </h3>

        <p
          style={{
            color: '#64748b',
            marginBottom: 20,
          }}
        >
          Store API keys securely for external integrations.
        </p>

        <input
          placeholder="OpenAI API Key"
          style={inputStyle}
        />

        <input
          placeholder="Anthropic API Key"
          style={{
            ...inputStyle,
            marginTop: 14,
          }}
        />

        <input
          placeholder="Gemini API Key"
          style={{
            ...inputStyle,
            marginTop: 14,
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 24,
          }}
        >
          <button
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 20px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <i
              className="ti ti-device-floppy"
              style={{ marginRight: 8 }}
            />

            Save Integrations
          </button>
        </div>
      </div>

    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid #dbe3ef',
  borderRadius: 10,
  padding: '0 14px',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}