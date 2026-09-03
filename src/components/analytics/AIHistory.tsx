'use client'

const stats = [
  {
    title: 'Total Conversations',
    value: '486',
    icon: 'ti-message-chatbot',
    color: '#3b82f6',
  },
  {
    title: 'Research Sessions',
    value: '128',
    icon: 'ti-scale',
    color: '#16a34a',
  },
  {
    title: 'Drafts Generated',
    value: '92',
    icon: 'ti-file-text',
    color: '#7c3aed',
  },
  {
    title: 'AI Credits Used',
    value: '18,450',
    icon: 'ti-bolt',
    color: '#ea580c',
  },
]

export default function AIHistory() {
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
            AI History
          </h2>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            View every AI conversation, research session and generated document.
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
              background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 10,
              padding: '11px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <i
              className="ti ti-download"
              style={{ marginRight: 8 }}
            />
            Export History
          </button>

          <button
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '11px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <i
              className="ti ti-plus"
              style={{ marginRight: 8 }}
            />
            New Chat
          </button>
        </div>
      </div>

      {/* ================= OVERVIEW CARDS ================= */}

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
                  color: card.color,
                  fontSize: 22,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 18,
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

      {/* ================= SEARCH & FILTER ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 280,
              position: 'relative',
            }}
          >
            <i
              className="ti ti-search"
              style={{
                position: 'absolute',
                left: 14,
                top: 13,
                color: '#94a3b8',
              }}
            />

            <input
              placeholder="Search conversations..."
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.05)',
                paddingLeft: 42,
                paddingRight: 14,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <select style={selectStyle}>
            <option>All Types</option>
            <option>AI Chat</option>
            <option>Research</option>
            <option>Draft</option>
            <option>Strategy</option>
          </select>

          <select style={selectStyle}>
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>All Time</option>
          </select>
        </div>
      </div>
            {/* ================= CONVERSATION HISTORY ================= */}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          marginBottom: 28,
        }}
      >
        {[
          {
            title: 'Divorce Petition Analysis',
            type: 'AI Chat',
            date: 'Today • 10:42 AM',
            credits: '42 Credits',
            icon: 'ti-message-chatbot',
            color: '#3b82f6',
          },
          {
            title: 'Maintenance Case Research',
            type: 'Legal Research',
            date: 'Today • 9:15 AM',
            credits: '86 Credits',
            icon: 'ti-scale',
            color: '#16a34a',
          },
          {
            title: 'Cross Examination Questions',
            type: 'Cross Examination',
            date: 'Yesterday • 5:08 PM',
            credits: '55 Credits',
            icon: 'ti-users',
            color: '#7c3aed',
          },
          {
            title: 'Litigation Strategy',
            type: 'Strategy Assistant',
            date: 'Yesterday • 2:40 PM',
            credits: '74 Credits',
            icon: 'ti-bulb',
            color: '#ea580c',
          },
          {
            title: 'Judge Profile Analysis',
            type: 'Judge Insights',
            date: 'Monday • 11:20 AM',
            credits: '29 Credits',
            icon: 'ti-gavel',
            color: '#dc2626',
          },
        ].map((item) => (
          <div
            key={item.title}
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
            <div
              style={{
                display: 'flex',
                gap: 18,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: `${item.color}15`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <i
                  className={`ti ${item.icon}`}
                  style={{
                    fontSize: 18,
                    color: item.color,
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'rgba(59, 130, 246, 0.05)',
                      color: '#3b82f6',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {item.type}
                  </span>

                  <span
                    style={{
                      color: '#64748b',
                      fontSize: 13,
                    }}
                  >
                    {item.date}
                  </span>

                  <span
                    style={{
                      color: '#64748b',
                      fontSize: 13,
                    }}
                  >
                    • {item.credits}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
              }}
            >
              <button style={iconButton}>
                <i className="ti ti-star" />
              </button>

              <button style={iconButton}>
                <i className="ti ti-download" />
              </button>

              <button style={iconButton}>
                <i className="ti ti-copy" />
              </button>

              <button style={iconButton}>
                <i className="ti ti-trash" />
              </button>

              <button
                style={{
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
            {/* ================= AI ACTIVITY ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 24,
          marginBottom: 28,
        }}
      >
        {/* Weekly Activity */}

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
              color: '#0f172a',
            }}
          >
            Weekly AI Activity
          </h3>

          {[
            ['Monday', 18],
            ['Tuesday', 22],
            ['Wednesday', 15],
            ['Thursday', 31],
            ['Friday', 28],
            ['Saturday', 12],
            ['Sunday', 9],
          ].map(([day, value]) => (
            <div
              key={day}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 90,
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                {day}
              </div>

              <div
                style={{
                  flex: 1,
                  height: 10,
                  background: '#e2e8f0',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Number(value) * 3}%`,
                    height: '100%',
                    background: '#3b82f6',
                  }}
                />
              </div>

              <strong
                style={{
                  width: 30,
                }}
              >
                {value}
              </strong>
            </div>
          ))}
        </div>

        {/* Most Used */}

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
            'AI Chat',
            'Legal Research',
            'Strategy Assistant',
            'Cross Examination',
            'Judge Insights',
          ].map((item, index) => (
            <div
              key={item}
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
              <span>{item}</span>

              <strong>{95 - index * 15}%</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ================= FOOTER ACTIONS ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 22,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: '#0f172a',
            }}
          >
            Manage AI History
          </h3>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            Export, archive or permanently delete your AI conversation history.
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
            <i
              className="ti ti-archive"
              style={{ marginRight: 8 }}
            />
            Archive
          </button>

          <button
            style={{
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: 10,
              padding: '11px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <i
              className="ti ti-trash"
              style={{ marginRight: 8 }}
            />
            Clear History
          </button>
        </div>
      </div>

    </div>
  )
}

/* ================= STYLES ================= */

const selectStyle: React.CSSProperties = {
  height: 44,
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: 10,
  padding: '0 14px',
  fontSize: 14,
  background: 'rgba(255,255,255,0.4)',
  outline: 'none',
  fontFamily: 'inherit',
}

const iconButton: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.05)',
  background: 'rgba(255,255,255,0.4)',
  cursor: 'pointer',
  color: '#475569',
}