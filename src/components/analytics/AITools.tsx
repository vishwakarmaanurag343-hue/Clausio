'use client'

const stats = [
  {
    title: 'AI Tools',
    value: '28',
    icon: 'ti-tool',
    color: '#3b82f6',
  },
  {
    title: 'Tools Used Today',
    value: '16',
    icon: 'ti-bolt',
    color: '#16a34a',
  },
  {
    title: 'Documents Processed',
    value: '182',
    icon: 'ti-file-text',
    color: '#7c3aed',
  },
  {
    title: 'Time Saved',
    value: '12.4 hrs',
    icon: 'ti-clock-hour-4',
    color: '#ea580c',
  },
]

const documentTools = [
  {
    icon: 'ti-scan',
    title: 'OCR Scanner',
    description: 'Extract text from scanned PDFs and images.',
  },
  {
    icon: 'ti-file-search',
    title: 'PDF Summarizer',
    description: 'Generate AI summaries from legal documents.',
  },
  {
    icon: 'ti-files',
    title: 'Merge PDF',
    description: 'Combine multiple legal documents.',
  },
  {
    icon: 'ti-cut',
    title: 'Split PDF',
    description: 'Split petitions, annexures or judgments.',
  },
  {
    icon: 'ti-arrows-diff',
    title: 'Compare PDFs',
    description: 'Identify differences between documents.',
  },
  {
    icon: 'ti-file-export',
    title: 'PDF Converter',
    description: 'Convert PDF to Word, Excel or Text.',
  },
]

export default function AITools() {
  return (
    <div>

      {/* ================= HEADER ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.3px', color: '#0f172a',
            }}
          >
            AI Tools
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
            }}
          >
            Powerful AI utilities to automate your legal workflow.
          </p>
        </div>

        <button
          style={{
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            borderRadius: 10,
            padding: '11px 20px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <i
            className="ti ti-sparkles"
            style={{ marginRight: 8 }}
          />
          AI Assistant
        </button>
      </div>

      {/* ================= OVERVIEW ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 24,
        }}
      >
        {stats.map((card) => (
          <div
            key={card.title}
            style={{
              background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: '#64748b',
                }}
              >
                {card.title}
              </span>

              <i
                className={`ti ${card.icon}`}
                style={{
                  fontSize: 22,
                  color: card.color,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 16,
                fontSize: 30,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ================= SEARCH ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            position: 'relative',
          }}
        >
          <i
            className="ti ti-search"
            style={{
              position: 'absolute',
              left: 16,
              top: 14,
              color: '#94a3b8',
            }}
          />

          <input
            placeholder="Search AI tools..."
            style={{
              width: '100%',
              height: 46,
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.05)',
              paddingLeft: 46,
              paddingRight: 16,
              outline: 'none',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* ================= DOCUMENT TOOLS ================= */}

      <div
        style={{
          marginBottom: 32,
        }}
      >
        <h3
          style={{
            marginBottom: 18,
            color: '#0f172a',
          }}
        >
          📄 Document Intelligence
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          {documentTools.map((tool) => (
            <div
              key={tool.title}
              style={{
                background: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: 16,
                padding: 22,
                cursor: 'pointer',
                transition: '.2s',
              }}
            >
              <i
                className={`ti ${tool.icon}`}
                style={{
                  fontSize: 18,
                  color: '#3b82f6',
                }}
              />

              <div
                style={{
                  marginTop: 18,
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                {tool.title}
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: '#64748b',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {tool.description}
              </div>

              <button
                style={{
                  marginTop: 20,
                  width: '100%',
                  border: 'none',
                  background: 'rgba(59, 130, 246, 0.05)',
                  color: '#3b82f6',
                  borderRadius: 10,
                  padding: '10px 0',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Open Tool
              </button>
            </div>
          ))}
        </div>
      </div>
            {/* ================= LEGAL INTELLIGENCE ================= */}

      <div
        style={{
          marginBottom: 32,
        }}
      >
        <h3
          style={{
            marginBottom: 18,
            color: '#0f172a',
          }}
        >
          ⚖️ Legal Intelligence
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          {[
            {
              icon: 'ti-scale',
              title: 'Extract Legal Sections',
              description:
                'Automatically identify Acts, Sections and Rules.',
            },
            {
              icon: 'ti-gavel',
              title: 'Citation Finder',
              description:
                'Find legal citations and precedent references.',
            },
            {
              icon: 'ti-search',
              title: 'Contradiction Detector',
              description:
                'Detect conflicting statements in documents.',
            },
            {
              icon: 'ti-file-alert',
              title: 'Missing Documents',
              description:
                'Identify missing pleadings and annexures.',
            },
            {
              icon: 'ti-notes',
              title: 'Judgment Summary',
              description:
                'Generate concise summaries of judgments.',
            },
            {
              icon: 'ti-file-description',
              title: 'Extract Case Numbers',
              description:
                'Extract suit numbers, FIRs and references.',
            },
          ].map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </div>

      {/* ================= TIMELINE & CASE TOOLS ================= */}

      <div
        style={{
          marginBottom: 32,
        }}
      >
        <h3
          style={{
            marginBottom: 18,
            color: '#0f172a',
          }}
        >
          📅 Timeline & Case Tools
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          {[
            {
              icon: 'ti-calendar-event',
              title: 'Extract Dates',
              description:
                'Identify important legal dates automatically.',
            },
            {
              icon: 'ti-timeline',
              title: 'Generate Chronology',
              description:
                'Create a complete case timeline.',
            },
            {
              icon: 'ti-clock-hour-4',
              title: 'Deadline Detector',
              description:
                'Find limitation periods and upcoming deadlines.',
            },
            {
              icon: 'ti-calendar-time',
              title: 'Hearing Summary',
              description:
                'Summarize hearing notes instantly.',
            },
            {
              icon: 'ti-map-route',
              title: 'Timeline Builder',
              description:
                'Visual AI-generated chronology.',
            },
            {
              icon: 'ti-list-check',
              title: 'Pending Tasks',
              description:
                'Generate next legal actions automatically.',
            },
          ].map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </div>

      {/* ================= CLIENT COMMUNICATION ================= */}

      <div
        style={{
          marginBottom: 32,
        }}
      >
        <h3
          style={{
            marginBottom: 18,
            color: '#0f172a',
          }}
        >
          👥 Client Communication
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          {[
            {
              icon: 'ti-language',
              title: 'Translate',
              description:
                'Translate legal documents into multiple languages.',
            },
            {
              icon: 'ti-message-chatbot',
              title: 'Client Summary',
              description:
                'Generate easy-to-understand case summaries.',
            },
            {
              icon: 'ti-brand-whatsapp',
              title: 'WhatsApp Update',
              description:
                'Create professional WhatsApp updates.',
            },
            {
              icon: 'ti-mail',
              title: 'Email Draft',
              description:
                'Generate client emails instantly.',
            },
            {
              icon: 'ti-users-group',
              title: 'Meeting Summary',
              description:
                'Summarize client meetings with AI.',
            },
            {
              icon: 'ti-phone-call',
              title: 'Call Notes',
              description:
                'Convert call recordings into structured notes.',
            },
          ].map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </div>

      {/* ---------- REUSABLE TOOL CARD ---------- */}

      {/* Place this helper ABOVE the style constants at the bottom of the file */}

      {/*

function ToolCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 16,
        padding: 22,
        cursor: 'pointer',
        transition: '.2s',
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{
          fontSize: 18,
          color: '#3b82f6',
        }}
      />

      <div
        style={{
          marginTop: 18,
          fontSize: 17,
          fontWeight: 700,
          color: '#0f172a',
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          color: '#64748b',
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {description}
      </div>

      <button
        style={{
          marginTop: 20,
          width: '100%',
          border: 'none',
          background: 'rgba(59, 130, 246, 0.05)',
          color: '#3b82f6',
          borderRadius: 10,
          padding: '10px 0',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Open Tool
      </button>
    </div>
  )
}

      */}
            {/* ================= AI UTILITIES ================= */}

      <div
        style={{
          marginBottom: 32,
        }}
      >
        <h3
          style={{
            marginBottom: 18,
            color: '#0f172a',
          }}
        >
          🧠 AI Utilities
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          {[
            {
              icon: 'ti-microphone',
              title: 'Voice to Text',
              description: 'Convert legal dictation into text.',
            },
            {
              icon: 'ti-speakerphone',
              title: 'Text to Speech',
              description: 'Listen to judgments and documents.',
            },
            {
              icon: 'ti-spell-check',
              title: 'Grammar Check',
              description: 'Improve legal writing quality.',
            },
            {
              icon: 'ti-pencil',
              title: 'Rewrite Document',
              description: 'Rewrite in a professional legal tone.',
            },
            {
              icon: 'ti-language',
              title: 'Simplify Language',
              description: 'Convert legal language into plain English.',
            },
            {
              icon: 'ti-world',
              title: 'Language Translation',
              description: 'Translate documents into multiple languages.',
            },
          ].map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </div>

      {/* ================= RECENTLY USED ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 20,
            }}
          >
            Recently Used Tools
          </h3>

          {[
            'OCR Scanner',
            'Legal Research',
            'Generate Chronology',
            'Judgment Summary',
            'WhatsApp Update',
            'Cross Examination',
          ].map((tool, index) => (
            <div
              key={tool}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom:
                  index !== 5
                    ? '1px solid #e2e8f0'
                    : 'none',
              }}
            >
              <span>{tool}</span>

              <span
                style={{
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                Today
              </span>
            </div>
          ))}
        </div>

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 20,
            }}
          >
            Most Used
          </h3>

          {[
            ['OCR', '95%'],
            ['Research', '91%'],
            ['Summary', '88%'],
            ['Timeline', '76%'],
            ['Translation', '62%'],
          ].map(([name, value], index) => (
            <div
              key={name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom:
                  index !== 4
                    ? '1px solid #e2e8f0'
                    : 'none',
              }}
            >
              <span>{name}</span>

              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ================= FOOTER ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: '#0f172a',
            }}
          >
            AI Toolkit
          </h3>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            Access all AI-powered legal utilities from one place.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          <button
            style={{
              border: '1px solid rgba(0,0,0,0.05)',
              background: 'rgba(255,255,255,0.4)',
              borderRadius: 10,
              padding: '11px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            View Usage
          </button>

          <button
            style={{
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: 10,
              padding: '11px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Explore All Tools
          </button>
        </div>
      </div>

    </div>
  )
}

/* ================= REUSABLE TOOL CARD ================= */

function ToolCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 16,
        padding: 22,
        cursor: 'pointer',
        transition: '.2s',
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{
          fontSize: 18,
          color: '#3b82f6',
        }}
      />

      <div
        style={{
          marginTop: 18,
          fontSize: 17,
          fontWeight: 700,
          color: '#0f172a',
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          color: '#64748b',
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {description}
      </div>

      <button
        style={{
          marginTop: 20,
          width: '100%',
          border: 'none',
          background: 'rgba(59, 130, 246, 0.05)',
          color: '#3b82f6',
          borderRadius: 10,
          padding: '10px 0',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Open Tool
      </button>
    </div>
  )
}