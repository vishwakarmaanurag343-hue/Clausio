'use client'

import React from 'react'

const stats = [
  {
    title: 'Witnesses',
    value: '4',
    icon: 'ti-users',
    color: '#3b82f6',
  },
  {
    title: 'Contradictions',
    value: '12',
    icon: 'ti-alert-triangle',
    color: '#dc2626',
  },
  {
    title: 'Questions',
    value: '86',
    icon: 'ti-help',
    color: '#16a34a',
  },
  {
    title: 'Credibility',
    value: '74%',
    icon: 'ti-shield-check',
    color: '#f59e0b',
  },
]

export default function CrossExamination() {
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
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.3px', color: '#0f172a',
            }}
          >
            AI Cross Examination
          </h2>

          <p
            style={{
              marginTop: 8,
              color: '#64748b',
              lineHeight: 1.6,
            }}
          >
            Upload witness statements, detect contradictions and generate
            courtroom-ready cross-examination questions using AI.
          </p>
        </div>

        <button
          style={{
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <i
            className="ti ti-sparkles"
            style={{ marginRight: 8 }}
          />
          Analyze Witness
        </button>
      </div>

      {/* ================= DASHBOARD ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 28,
        }}
      >
        {stats.map((item) => (
          <div
            key={item.title}
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
                {item.title}
              </span>

              <i
                className={`ti ${item.icon}`}
                style={{
                  color: item.color,
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
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ================= WITNESS INFORMATION ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 22,
            }}
          >
            Witness Information
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 18,
            }}
          >
            <Field label="Witness Name">
              <input
                style={inputStyle}
                placeholder="Enter witness name"
              />
            </Field>

            <Field label="Witness Type">
              <select style={inputStyle}>
                <option>Petitioner</option>
                <option>Respondent</option>
                <option>Independent Witness</option>
                <option>Expert Witness</option>
              </select>
            </Field>

            <Field label="Relation to Case">
              <input
                style={inputStyle}
                placeholder="Father, Mother, Friend..."
              />
            </Field>

            <Field label="Statement Summary">
              <textarea
                rows={5}
                placeholder="Brief witness summary..."
                style={{
                  ...inputStyle,
                  height: 'auto',
                  paddingTop: 12,
                  resize: 'vertical',
                }}
              />
            </Field>
          </div>
        </div>

        {/* ================= UPLOAD ================= */}

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 22,
            }}
          >
            Upload Witness Documents
          </h3>

          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: 14,
              padding: 45,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.6)',
            }}
          >
            <i
              className="ti ti-cloud-upload"
              style={{
                fontSize: 48,
                color: '#3b82f6',
              }}
            />

            <h3
              style={{
                marginTop: 16,
              }}
            >
              Drag & Drop Files
            </h3>

            <p
              style={{
                color: '#64748b',
                lineHeight: 1.7,
              }}
            >
              Upload Affidavit, Police Statement,
              WhatsApp Chats, Audio Transcript,
              Evidence or Court Documents.
            </p>

            <button
              style={{
                marginTop: 18,
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                padding: '12px 22px',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Choose File
            </button>
          </div>
        </div>
      </div>
            {/* ================= AI ANALYSIS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr .8fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        {/* Contradictions */}

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3
              style={{
                margin: 0,
              }}
            >
              AI Contradiction Detection
            </h3>

            <span
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              12 Found
            </span>
          </div>

          {[
            {
              title: 'Timeline Mismatch',
              severity: 'High',
              statement:
                'Witness claims to be at home at 10:00 AM.',
              evidence:
                'Mobile tower records place the witness 18 km away.',
            },
            {
              title: 'Financial Contradiction',
              severity: 'Medium',
              statement:
                'Witness denies any monetary transaction.',
              evidence:
                'Bank statement shows multiple transfers.',
            },
            {
              title: 'Communication Conflict',
              severity: 'High',
              statement:
                'Witness denied any communication.',
              evidence:
                'WhatsApp chats show continuous conversation.',
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: 22,
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <strong>{item.title}</strong>

                <span
                  style={{
                    background:
                      item.severity === 'High'
                        ? '#fee2e2'
                        : '#fef3c7',

                    color:
                      item.severity === 'High'
                        ? '#dc2626'
                        : '#d97706',

                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {item.severity}
                </span>
              </div>

              <div
                style={{
                  marginBottom: 10,
                  color: '#475569',
                }}
              >
                <strong>Statement:</strong> {item.statement}
              </div>

              <div
                style={{
                  color: '#64748b',
                  lineHeight: 1.7,
                }}
              >
                <strong>Evidence:</strong> {item.evidence}
              </div>
            </div>
          ))}
        </div>

        {/* AI Score */}

        <div
          style={{
            display: 'grid',
            gap: 20,
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
                marginBottom: 18,
              }}
            >
              Credibility Score
            </h3>

            <div
              style={{
                width: 170,
                height: 170,
                margin: '0 auto',
                borderRadius: '50%',
                border: '12px solid #f59e0b',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                }}
              >
                74%
              </div>

              <div
                style={{
                  color: '#64748b',
                }}
              >
                Credible
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                display: 'grid',
                gap: 12,
              }}
            >
              <ScoreItem
                title="Statement Consistency"
                score="82%"
              />

              <ScoreItem
                title="Evidence Match"
                score="91%"
              />

              <ScoreItem
                title="Timeline Accuracy"
                score="69%"
              />

              <ScoreItem
                title="Behaviour Pattern"
                score="74%"
              />
            </div>
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
                marginBottom: 18,
              }}
            >
              AI Witness Insights
            </h3>

            <div
              style={{
                display: 'grid',
                gap: 16,
              }}
            >
              <Insight
                title="Confidence"
                value="Medium"
              />

              <Insight
                title="Behaviour"
                value="Defensive"
              />

              <Insight
                title="Weakest Area"
                value="Financial Records"
              />

              <Insight
                title="Pressure Response"
                value="Likely to contradict"
              />

              <Insight
                title="AI Advice"
                value="Begin with neutral questions before introducing documentary evidence."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= RISK ANALYSIS ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 22,
          marginBottom: 30,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 20,
          }}
        >
          Behaviour & Risk Analysis
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 18,
          }}
        >
          <RiskCard
            title="Risk of Evasion"
            value="High"
            color="#dc2626"
          />

          <RiskCard
            title="Confidence"
            value="Medium"
            color="#f59e0b"
          />

          <RiskCard
            title="Evidence Support"
            value="Strong"
            color="#16a34a"
          />

          <RiskCard
            title="Cross Strategy"
            value="Aggressive"
            color="#2563eb"
          />
        </div>
      </div>
            {/* ================= CROSS EXAMINATION QUESTIONS ================= */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              margin: 0,
            }}
          >
            AI Generated Cross Examination Questions
          </h3>

          <button
            style={{
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: 10,
              padding: '10px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Regenerate Questions
          </button>
        </div>

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {[
            {
              category: 'Timeline',
              question:
                'Can you explain why your affidavit mentions 10:00 AM while your phone location indicates you were elsewhere?',
            },
            {
              category: 'Financial',
              question:
                'Why did you state there were no financial transactions despite multiple bank transfers?',
            },
            {
              category: 'Communication',
              question:
                'Can you explain the WhatsApp conversations that occurred after you stated there was no contact?',
            },
            {
              category: 'Evidence',
              question:
                'Why does your statement differ from the documentary evidence submitted before the Court?',
            },
            {
              category: 'Behaviour',
              question:
                'Have you changed any part of your statement after reviewing the documents?',
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                padding: 22,
                borderBottom:
                  index !== 4
                    ? '1px solid #e2e8f0'
                    : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    color: '#3b82f6',
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {item.category}
                </span>

                <button
                  style={{
                    border: '1px solid rgba(0,0,0,0.05)',
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>

              <div
                style={{
                  fontWeight: 500,
                  color: '#0f172a',
                  lineHeight: 1.8,
                }}
              >
                {item.question}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= FOLLOW-UP & TRAP QUESTIONS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
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
              marginBottom: 18,
            }}
          >
            Follow-up Questions
          </h3>

          {[
            'Who else was present during the incident?',
            'Can anyone independently verify your version?',
            'Why was this omitted from your affidavit?',
            'Did you inform anyone immediately afterwards?',
            'Can you produce supporting evidence today?',
          ].map((question) => (
            <div
              key={question}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {question}
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
              marginBottom: 18,
            }}
          >
            Trap Questions
          </h3>

          {[
            'Would you like to correct your earlier statement?',
            'Are you absolutely certain about the timeline?',
            'Can you identify this bank transaction?',
            'Why should the Court believe this version?',
            'Would you like to explain this contradiction?',
          ].map((question) => (
            <div
              key={question}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {question}
            </div>
          ))}
        </div>
      </div>

      {/* ================= EVIDENCE MAPPING ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 22,
          marginBottom: 30,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          Evidence Mapping
        </h3>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr>
              <th style={tableHeader}>Evidence</th>
              <th style={tableHeader}>Supports</th>
              <th style={tableHeader}>Contradicts</th>
              <th style={tableHeader}>Strength</th>
            </tr>
          </thead>

          <tbody>
            {[
              [
                'Bank Statement',
                'Financial Claim',
                'Witness Statement',
                'High',
              ],
              [
                'Call Records',
                'Timeline',
                'Affidavit',
                'High',
              ],
              [
                'WhatsApp Chats',
                'Communication',
                'Oral Statement',
                'Medium',
              ],
              [
                'Photos',
                'Location',
                'Witness Version',
                'Strong',
              ],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td
                    key={cell}
                    style={tableCell}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
            {/* ================= COURTROOM STRATEGY ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
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
              marginBottom: 18,
            }}
          >
            AI Courtroom Strategy
          </h3>

          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              lineHeight: 2,
              color: '#334155',
            }}
          >
            <li>Start with basic identity questions.</li>
            <li>Allow the witness to repeat earlier statements.</li>
            <li>Introduce documentary evidence gradually.</li>
            <li>Challenge inconsistencies using objective records.</li>
            <li>Avoid revealing all evidence too early.</li>
            <li>Finish with credibility-based questions.</li>
          </ul>
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
              marginBottom: 18,
            }}
          >
            Recommended Question Order
          </h3>

          {[
            'Identity Verification',
            'Relationship with Parties',
            'Timeline',
            'Financial Records',
            'Electronic Evidence',
            'Contradictions',
            'Credibility',
          ].map((item, index) => (
            <div
              key={item}
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                padding: '12px 0',
                borderBottom:
                  index !== 6
                    ? '1px solid #e2e8f0'
                    : 'none',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#3b82f6',
                  color: '#fff',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </div>

              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ================= AI SUMMARY ================= */}

      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          borderRadius: 16,
          padding: 22,
          marginBottom: 30,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: '#1d4ed8',
          }}
        >
          AI Summary
        </h3>

        <p
          style={{
            color: '#334155',
            lineHeight: 1.8,
          }}
        >
          AI analysis indicates that the witness has several inconsistencies
          relating to the sequence of events, financial transactions and
          communication records. Documentary evidence appears stronger than
          the oral testimony. An evidence-first questioning strategy is
          recommended before moving to credibility-based questions.
        </p>
      </div>

      {/* ================= ACTIONS ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 22,
          marginBottom: 30,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
            }}
          >
            Export & Continue
          </h3>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
            }}
          >
            Save this analysis or export it for court preparation.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <button style={primaryButton}>
            <i className="ti ti-file-export" />
            Export PDF
          </button>

          <button style={primaryButton}>
            <i className="ti ti-file-text" />
            Export Word
          </button>

          <button style={primaryButton}>
            <i className="ti ti-device-floppy" />
            Save
          </button>

          <button style={primaryButton}>
            <i className="ti ti-microphone" />
            Mock Cross Exam
          </button>
        </div>
      </div>

    </div>
  )
}

/* ================= HELPERS ================= */

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          fontWeight: 600,
          fontSize: 13,
          color: '#334155',
        }}
      >
        {label}
      </label>

      {children}
    </div>
  )
}

function ScoreItem({
  title,
  score,
}: {
  title: string
  score: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <span>{title}</span>
      <strong>{score}</strong>
    </div>
  )
}

function Insight({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        paddingBottom: 12,
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 13,
        }}
      >
        {title}
      </div>

      <strong>{value}</strong>
    </div>
  )
}

function RiskCard({
  title,
  value,
  color,
}: {
  title: string
  value: string
  color: string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 12,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: '#64748b',
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 22,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: 10,
  padding: '0 14px',
  outline: 'none',
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const tableHeader: React.CSSProperties = {
  textAlign: 'left',
  padding: 14,
  background: 'rgba(255,255,255,0.6)',
  borderBottom: '1px solid rgba(0,0,0,0.05)',
  color: '#475569',
  fontWeight: 600,
}

const tableCell: React.CSSProperties = {
  padding: 14,
  borderBottom: '1px solid rgba(0,0,0,0.05)',
}

const primaryButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  border: 'none',
  background: '#3b82f6',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 18px',
  cursor: 'pointer',
  fontWeight: 600,
}