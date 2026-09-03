'use client'

const prompts = [
  {
    icon: 'ti-file-text',
    title: 'Summarize Case',
    description: 'Generate an AI case summary',
  },
  {
    icon: 'ti-scale',
    title: 'Legal Research',
    description: 'Search judgments & precedents',
  },
  {
    icon: 'ti-users',
    title: 'Cross Examination',
    description: 'Generate witness questions',
  },
  {
    icon: 'ti-bulb',
    title: 'Strategy',
    description: 'Suggest litigation strategy',
  },
  {
    icon: 'ti-shield-check',
    title: 'Evidence Review',
    description: 'Analyze evidence strength',
  },
]

export default function AIChat() {
  return (
    <div>

      {/* ================= HEADER ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            AI Chat
          </h2>
          <p style={{ marginTop: 2, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            Ask Clausio anything about your cases, legal research or court documents.
          </p>
        </div>

        <button
          className="glass-button"
          style={{ height: 38, padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
        >
          <i className="ti ti-plus" />
          New Conversation
        </button>
      </div>

      {/* ================= SUGGESTED PROMPTS ================= */}

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12, color: '#0f172a', fontSize: 14, fontWeight: 600 }}>
          Suggested Prompts
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {prompts.map((item) => (
            <div
              key={item.title}
              className="glass-card"
              style={{
                padding: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.4)'
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: '#3b82f6' }} />
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= CONVERSATION ================= */}
      <div
        className="glass-card"
        style={{
          padding: 20,
          minHeight: 420,
        }}
      >
        {/* AI Message */}

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 28,
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
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="ti ti-robot" />
          </div>

          <div
            style={{
              background: '#f8fafc',
              borderRadius: 14,
              padding: 18,
              flex: 1,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 10,
                color: '#0f172a',
              }}
            >
              Clausio AI
            </div>

            <div
              style={{
                color: '#334155',
                lineHeight: 1.8,
              }}
            >
              Hello 👋

              <br />
              <br />

              I'm your AI legal assistant.

              <br />
              <br />

              I can help you with:

              <ul
                style={{
                  marginTop: 12,
                }}
              >
                <li>Legal Research</li>
                <li>Case Analysis</li>
                <li>Cross Examination</li>
                <li>Evidence Review</li>
                <li>Strategy Suggestions</li>
                <li>Document Understanding</li>
                <li>Court Judgments</li>
                <li>Client Communication</li>
              </ul>

              Start by asking me a question below.
            </div>
          </div>
        </div>
        {/* ================= AI RESPONSE CARDS ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { icon: 'ti-file-text', title: 'Case Summary', value: 'Generated', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
            { icon: 'ti-scale', title: 'Relevant Judgments', value: '18 Found', color: '#16a34a', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' },
            { icon: 'ti-alert-triangle', title: 'Risk Score', value: 'Medium', color: '#d97706', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
          ].map((card) => (
            <div key={card.title} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: card.color, fontSize: 11, fontWeight: 600 }}>{card.title}</span>
                <i className={`ti ${card.icon}`} style={{ color: card.color, fontSize: 16 }} />
              </div>
              <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* ================= FOLLOW-UP QUESTIONS ================= */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12, color: '#0f172a', fontSize: 13, fontWeight: 600 }}>
            Suggested Follow-up Questions
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              'Summarize this petition',
              'Find contradictory statements',
              'Suggest cross examination questions',
              'Research similar judgments',
              'Explain Section 125 CrPC',
              'Generate litigation strategy',
            ].map((question) => (
              <button
                key={question}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: '#334155',
                  fontSize: 11
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* ================= RECENT CONVERSATIONS ================= */}
        <div>
          <h3 style={{ marginBottom: 12, color: '#0f172a', fontSize: 13, fontWeight: 600 }}>
            Recent Conversations
          </h3>

          {[
            { title: 'Divorce Petition Summary', time: 'Today • 10:42 AM' },
            { title: 'Maintenance Case Research', time: 'Yesterday • 4:18 PM' },
            { title: 'Cross Examination Preparation', time: 'Yesterday • 11:25 AM' },
          ].map((chat, idx) => (
            <div
              key={chat.title}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderBottom: idx < 2 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                  {chat.title}
                </div>
                <div style={{ marginTop: 2, color: '#64748b', fontSize: 11 }}>
                  {chat.time}
                </div>
              </div>

              <button
                style={{
                  border: 'none',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb',
                  borderRadius: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 11
                }}
              >
                Open
              </button>
            </div>
          ))}
        </div>
                {/* ================= INPUT AREA ================= */}
        <div style={{ marginTop: 24, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 16 }}>
          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button style={actionButton}><i className="ti ti-paperclip" />Attach PDF</button>
            <button style={actionButton}><i className="ti ti-photo" />Upload Image</button>
            <button style={actionButton}><i className="ti ti-microphone" />Voice</button>
            <button style={actionButton}><i className="ti ti-world-search" />Research</button>
            <button style={actionButton}><i className="ti ti-download" />Export Chat</button>
            <button style={actionButton}><i className="ti ti-trash" />Clear</button>
          </div>

          {/* Chat Input */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              placeholder="Ask Clausio anything... (e.g. Summarize this petition, find relevant judgments, generate cross-examination questions...)"
              rows={3}
              style={{
                flex: 1, resize: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10,
                padding: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'rgba(255,255,255,0.6)',
                color: '#0f172a', boxSizing: 'border-box'
              }}
            />

            <button
              className="glass-button"
              style={{
                height: 48, padding: '0 20px', border: 'none', borderRadius: 10, background: '#3b82f6', color: '#fff',
                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              <i className="ti ti-send" />
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ================= BUTTON STYLE ================= */

const actionButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  background: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 500,
  color: '#334155',
  fontSize: 11,
}