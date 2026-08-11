'use client'

interface AutomationModalProps {
  onClose: () => void
}

export default function AutomationModal({
  onClose,
}: AutomationModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 900,
          maxWidth: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: 18,
          boxShadow: '0 25px 60px rgba(0,0,0,.25)',
        }}
      >
        {/* ================= HEADER ================= */}

        <div
          style={{
            padding: '22px 26px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
              Create AI Automation
            </h2>

            <p
              style={{
                marginTop: 6,
                fontSize: 14,
                color: '#64748b',
              }}
            >
              Automate repetitive legal workflows using AI.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 18,
              cursor: 'pointer',
              color: '#94a3b8',
            }}
          >
            ×
          </button>
        </div>

        {/* ================= BODY ================= */}

        <div
          style={{
            padding: 24,
          }}
        >
          {/* Workflow Information */}

          <div
            style={{
              marginBottom: 28,
            }}
          >
            <h3
              style={{
                marginBottom: 18,
                color: '#0f172a',
              }}
            >
              Workflow Information
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 18,
              }}
            >
              <Field label="Workflow Name">
                <input
                  placeholder="Generate Hearing Brief"
                  style={inputStyle}
                />
              </Field>

              <Field label="Category">
                <select style={inputStyle}>
                  <option>AI Workflow</option>
                  <option>Hearings</option>
                  <option>Drafting</option>
                  <option>Research</option>
                  <option>Client Communication</option>
                </select>
              </Field>

              <Field label="Status">
                <select style={inputStyle}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </Field>

              <Field label="Priority">
                <select style={inputStyle}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </Field>

              <div
                style={{
                  gridColumn: '1 / span 2',
                }}
              >
                <Field label="Description">
                  <textarea
                    rows={4}
                    placeholder="Describe this automation..."
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
          </div>

          {/* Automation Preview */}

          <div
            style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: 14,
              padding: 20,
              marginBottom: 30,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#1d4ed8',
                marginBottom: 12,
              }}
            >
              Workflow Preview
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <Step title="Trigger" />

              <Arrow />

              <Step title="AI Action" />

              <Arrow />

              <Step title="Notify" />
            </div>
          </div>
                    {/* ================= TRIGGER ================= */}

          <div
            style={{
              marginBottom: 30,
            }}
          >
            <h3
              style={{
                marginBottom: 18,
                color: '#0f172a',
              }}
            >
              Trigger
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 18,
              }}
            >
              <Field label="When">
                <select style={inputStyle}>
                  <option>New Hearing Added</option>
                  <option>Document Uploaded</option>
                  <option>Case Created</option>
                  <option>Case Updated</option>
                  <option>Deadline Missed</option>
                  <option>Invoice Generated</option>
                  <option>Payment Received</option>
                  <option>Client Added</option>
                </select>
              </Field>

              <Field label="Run">
                <select style={inputStyle}>
                  <option>Immediately</option>
                  <option>After 5 Minutes</option>
                  <option>After 1 Hour</option>
                  <option>Every Day</option>
                  <option>Manual Approval</option>
                </select>
              </Field>
            </div>
          </div>

          {/* ================= AI ACTIONS ================= */}

          <div
            style={{
              marginBottom: 30,
            }}
          >
            <h3
              style={{
                marginBottom: 18,
              }}
            >
              AI Actions
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 16,
              }}
            >
              {[
                'Generate Case Summary',
                'Generate Chronology',
                'Analyze Evidence',
                'Legal Research',
                'Draft Hearing Brief',
                'Generate Client Update',
                'Cross Examination',
                'Strategy Analysis',
              ].map((action) => (
                <label
                  key={action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 16,
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                >
                  <input type="checkbox" />

                  <span>{action}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ================= CONDITIONS ================= */}

          <div
            style={{
              marginBottom: 30,
            }}
          >
            <h3
              style={{
                marginBottom: 18,
              }}
            >
              Conditions
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 120px',
                gap: 16,
              }}
            >
              <select style={inputStyle}>
                <option>Case Type</option>
                <option>Court</option>
                <option>Priority</option>
                <option>Judge</option>
                <option>Client</option>
              </select>

              <input
                placeholder="Value"
                style={inputStyle}
              />

              <button
                style={{
                  border: 'none',
                  background: 'rgba(59, 130, 246, 0.05)',
                  color: '#3b82f6',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* ================= WORKFLOW ================= */}

          <div
            style={{
              marginBottom: 30,
            }}
          >
            <h3
              style={{
                marginBottom: 18,
              }}
            >
              Workflow Steps
            </h3>

            <div
              style={{
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              {[
                '📄 Detect Trigger',
                '🤖 AI Analysis',
                '📚 Legal Research',
                '📝 Generate Draft',
                '📨 Send Client Update',
              ].map((step, index) => (
                <div
                  key={step}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom:
                      index !== 4
                        ? '1px solid #e2e8f0'
                        : 'none',
                  }}
                >
                  <strong>{step}</strong>

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                    }}
                  >
                    <button
                      style={{
                        border: 'none',
                        background: 'rgba(59, 130, 246, 0.05)',
                        color: '#3b82f6',
                        borderRadius: 8,
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>

                    <button
                      style={{
                        border: 'none',
                        background: '#fef2f2',
                        color: '#dc2626',
                        borderRadius: 8,
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
                    {/* ================= NOTIFICATIONS ================= */}

          <div
            style={{
              marginBottom: 30,
            }}
          >
            <h3
              style={{
                marginBottom: 18,
                color: '#0f172a',
              }}
            >
              Notifications
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 16,
              }}
            >
              {[
                'Notify Assigned Lawyer',
                'Notify Client',
                'Send WhatsApp Update',
                'Send Email',
                'Create Calendar Event',
                'Create Internal Task',
              ].map((item) => (
                <label
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 14,
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: 10,
                    cursor: 'pointer',
                  }}
                >
                  <input type="checkbox" />

                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ================= ASSIGN ================= */}

          <div
            style={{
              marginBottom: 30,
            }}
          >
            <h3
              style={{
                marginBottom: 18,
              }}
            >
              Assign Workflow
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 18,
              }}
            >
              <Field label="Assigned To">
                <select style={inputStyle}>
                  <option>Current User</option>
                  <option>Senior Lawyer</option>
                  <option>Associate</option>
                  <option>Case Manager</option>
                </select>
              </Field>

              <Field label="Department">
                <select style={inputStyle}>
                  <option>Family Law</option>
                  <option>Civil</option>
                  <option>Criminal</option>
                  <option>Corporate</option>
                </select>
              </Field>
            </div>
          </div>

          {/* ================= SUMMARY ================= */}

          <div
            style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: 14,
              padding: 20,
              marginBottom: 30,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: '#1d4ed8',
              }}
            >
              Automation Summary
            </h3>

            <ul
              style={{
                marginTop: 14,
                lineHeight: 2,
                color: '#334155',
              }}
            >
              <li>Trigger → New Hearing Added</li>
              <li>Run AI Hearing Analysis</li>
              <li>Generate Hearing Brief</li>
              <li>Generate Client Update</li>
              <li>Notify Assigned Lawyer</li>
              <li>Create Calendar Reminder</li>
            </ul>
          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <div
          style={{
            padding: 24,
            borderTop: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            style={{
              border: '1px solid rgba(0,0,0,0.05)',
              background: 'rgba(255,255,255,0.4)',
              borderRadius: 10,
              padding: '11px 22px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Save as Draft
          </button>

          <div
            style={{
              display: 'flex',
              gap: 12,
            }}
          >
            <button
              onClick={onClose}
              style={{
                border: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(255,255,255,0.4)',
                borderRadius: 10,
                padding: '11px 22px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>

            <button
              style={{
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                borderRadius: 10,
                padding: '11px 24px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <i
                className="ti ti-device-floppy"
                style={{ marginRight: 8 }}
              />
              Save Automation
            </button>
          </div>
        </div>

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
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

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
          color: '#334155',
          fontSize: 13,
        }}
      >
        {label}
      </label>

      {children}
    </div>
  )
}

function Step({
  title,
}: {
  title: string
}) {
  return (
    <div
      style={{
        padding: '10px 18px',
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        borderRadius: 10,
        color: '#3b82f6',
        fontWeight: 600,
      }}
    >
      {title}
    </div>
  )
}

function Arrow() {
  return (
    <i
      className="ti ti-arrow-right"
      style={{
        color: '#3b82f6',
        fontSize: 14,
      }}
    />
  )
}