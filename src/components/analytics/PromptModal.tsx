'use client'

import React from 'react'

interface PromptModalProps {
  open: boolean
  onClose: () => void
}

export default function PromptModal({
  open,
  onClose,
}: PromptModalProps) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 30,
      }}
    >
      <div
        style={{
          width: '1100px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: 18,
          boxShadow: '0 25px 60px rgba(0,0,0,.18)',
        }}
      >
        {/* ================= HEADER ================= */}

        <div
          style={{
            padding: '22px 28px',
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
              }}
            >
              🤖 Create AI Prompt
            </h2>

            <p
              style={{
                marginTop: 8,
                color: '#64748b',
                lineHeight: 1.6,
              }}
            >
              Create reusable AI prompts for drafting,
              research, strategy and litigation.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: '#f1f5f9',
              width: 42,
              height: 42,
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {/* ================= BODY ================= */}

        <div
          style={{
            padding: 28,
          }}
        >
          {/* ================= BASIC INFO ================= */}

          <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 20,
              }}
            >
              Basic Information
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
              }}
            >
              <Field label="Prompt Name">
                <input
                  style={inputStyle}
                  placeholder="Maintenance Petition Generator"
                />
              </Field>

              <Field label="Category">
                <select style={inputStyle}>
                  <option>Drafting</option>
                  <option>Legal Research</option>
                  <option>Cross Examination</option>
                  <option>Judge Insights</option>
                  <option>Strategy</option>
                  <option>Evidence Analysis</option>
                  <option>Client Communication</option>
                </select>
              </Field>

              <Field label="Prompt Type">
                <select style={inputStyle}>
                  <option>AI Prompt</option>
                  <option>System Prompt</option>
                  <option>Workflow Prompt</option>
                  <option>Assistant Prompt</option>
                </select>
              </Field>

              <Field label="Language">
                <select style={inputStyle}>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>English + Hindi</option>
                </select>
              </Field>
            </div>

            <div
              style={{
                marginTop: 20,
              }}
            >
              <Field label="Description">
                <textarea
                  rows={4}
                  placeholder="Describe what this prompt does..."
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

          {/* ================= PROMPT DETAILS ================= */}

          <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 20,
              }}
            >
              Prompt Information
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                gap: 18,
              }}
            >
              <InfoCard
                title="Estimated Tokens"
                value="1,250"
                icon="ti-bolt"
                color="#2563eb"
              />

              <InfoCard
                title="AI Quality"
                value="Excellent"
                icon="ti-stars"
                color="#16a34a"
              />

              <InfoCard
                title="Reuse Score"
                value="92%"
                icon="ti-refresh"
                color="#ea580c"
              />

              <InfoCard
                title="AI Accuracy"
                value="97%"
                icon="ti-brain"
                color="#7c3aed"
              />
            </div>
          </div>
                    {/* ================= PROMPT EDITOR ================= */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr .6fr',
              gap: 24,
              marginBottom: 24,
            }}
          >
            {/* Editor */}

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
                  marginBottom: 20,
                }}
              >
                ✍️ Prompt Editor
              </h3>

              <textarea
                rows={14}
                placeholder={`Example:

You are an expert Indian Family Court lawyer.

Draft an Interim Maintenance Petition considering:

• Client income
• Respondent income
• Assets
• Liabilities
• Rajnesh v. Neha
• Supreme Court Guidelines

Generate professional legal drafting with proper sections.`}
                style={{
                  ...inputStyle,
                  height: 'auto',
                  resize: 'vertical',
                  paddingTop: 14,
                  fontFamily: 'monospace',
                  lineHeight: 1.8,
                }}
              />

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 18,
                  flexWrap: 'wrap',
                }}
              >
                <button style={primaryButton}>
                  Improve Prompt
                </button>

                <button style={secondaryButton}>
                  Optimize
                </button>

                <button style={secondaryButton}>
                  AI Rewrite
                </button>

                <button style={secondaryButton}>
                  Check Quality
                </button>
              </div>
            </div>

            {/* Variables */}

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
                  marginBottom: 18,
                }}
              >
                🔗 Variables
              </h3>

              <div
                style={{
                  display: 'grid',
                  gap: 12,
                }}
              >
                <VariableChip variable="{{ClientName}}" />

                <VariableChip variable="{{CaseNumber}}" />

                <VariableChip variable="{{Court}}" />

                <VariableChip variable="{{Judge}}" />

                <VariableChip variable="{{Petitioner}}" />

                <VariableChip variable="{{Respondent}}" />

                <VariableChip variable="{{Income}}" />

                <VariableChip variable="{{Evidence}}" />

                <VariableChip variable="{{Relief}}" />

                <VariableChip variable="{{CaseSummary}}" />
              </div>

              <button
                style={{
                  ...primaryButton,
                  width: '100%',
                  marginTop: 20,
                }}
              >
                + Add Variable
              </button>
            </div>
          </div>

          {/* ================= AI PREVIEW ================= */}

          <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 18,
              }}
            >
              🤖 AI Preview
            </h3>

            <div
              style={{
                background: 'rgba(255,255,255,0.6)',
                borderRadius: 12,
                padding: 22,
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  color: '#64748b',
                  marginBottom: 14,
                  fontWeight: 600,
                }}
              >
                Preview Output
              </div>

              <p
                style={{
                  lineHeight: 1.9,
                  color: '#334155',
                  marginBottom: 18,
                }}
              >
                Draft an Interim Maintenance Petition on behalf of
                
                disclosures, liabilities, documentary evidence,
                applicable statutory provisions and recent Supreme
                Court judgments including Rajnesh v. Neha.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 18,
                }}
              >
                <PreviewCard
                  title="Prompt Score"
                  value="97%"
                  color="#16a34a"
                />

                <PreviewCard
                  title="Estimated Tokens"
                  value="1,245"
                  color="#2563eb"
                />

                <PreviewCard
                  title="Execution Time"
                  value="4 sec"
                  color="#7c3aed"
                />
              </div>
            </div>
          </div>
                    {/* ================= AI SETTINGS ================= */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              marginBottom: 24,
            }}
          >
            {/* Left */}

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
                  marginBottom: 20,
                }}
              >
                ⚙️ AI Settings
              </h3>

              <Field label="AI Model">
                <select style={inputStyle}>
                  <option>GPT-5.5</option>
                  <option>Claude</option>
                  <option>Gemini</option>
                  <option>Llama</option>
                </select>
              </Field>

              <Field label="Temperature">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.3"
                  style={{ width: '100%' }}
                />
              </Field>

              <Field label="Maximum Tokens">
                <input
                  type="number"
                  defaultValue="2000"
                  style={inputStyle}
                />
              </Field>

              <Field label="Response Style">
                <select style={inputStyle}>
                  <option>Professional Legal</option>
                  <option>Detailed</option>
                  <option>Concise</option>
                  <option>Court Ready</option>
                </select>
              </Field>
            </div>

            {/* Right */}

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
                  marginBottom: 20,
                }}
              >
                🔒 Visibility
              </h3>

              <ToggleRow
                title="Private Prompt"
                description="Visible only to you."
              />

              <ToggleRow
                title="Team Prompt"
                description="Share with your team."
              />

              <ToggleRow
                title="Public Library"
                description="Available for everyone."
              />

              <ToggleRow
                title="AI Optimisation"
                description="Allow AI to improve this prompt."
              />
            </div>
          </div>

          {/* ================= TAGS ================= */}

          <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 20,
              }}
            >
              🏷 Prompt Tags
            </h3>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <Tag text="Maintenance" />

              <Tag text="Drafting" />

              <Tag text="Family Court" />

              <Tag text="Legal Research" />

              <Tag text="Evidence" />

              <Tag text="Cross Examination" />

              <Tag text="Judge Insights" />

              <Tag text="Strategy" />

              <Tag text="AI" />

              <Tag text="Litigation" />
            </div>
          </div>

          {/* ================= FOOTER ================= */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(0,0,0,0.05)',
              paddingTop: 24,
            }}
          >
            <button
              onClick={onClose}
              style={secondaryButton}
            >
              Cancel
            </button>

            <div
              style={{
                display: 'flex',
                gap: 14,
              }}
            >
              <button style={secondaryButton}>
                Save Draft
              </button>

              <button style={primaryButton}>
                Create Prompt
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ================= HELPER COMPONENTS ================= */

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          fontWeight: 600,
          color: '#334155',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function InfoCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string
  icon: string
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
      <i
        className={`ti ${icon}`}
        style={{
          color,
          fontSize: 22,
        }}
      />
      <div
        style={{
          marginTop: 10,
          color: '#64748b',
          fontSize: 13,
        }}
      >
        {title}
      </div>
      <strong
        style={{
          fontSize: 22,
          color,
        }}
      >
        {value}
      </strong>
    </div>
  )
}

function VariableChip({
  variable,
}: {
  variable: string
}) {
  return (
    <div
      style={{
        padding: '10px 14px',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: 10,
        color: '#3b82f6',
        fontWeight: 600,
        fontFamily: 'monospace',
      }}
    >
      {variable}
    </div>
  )
}

function PreviewCard({
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
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        borderRadius: 10,
        padding: 16,
        textAlign: 'center',
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
          marginTop: 8,
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

function ToggleRow({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div
          style={{
            fontSize: 13,
            color: '#64748b',
          }}
        >
          {description}
        </div>
      </div>

      <input type="checkbox" />
    </div>
  )
}

function Tag({
  text,
}: {
  text: string
}) {
  return (
    <span
      style={{
        padding: '10px 16px',
        background: 'rgba(59, 130, 246, 0.05)',
        color: '#3b82f6',
        borderRadius: 999,
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {text}
    </span>
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
  outline: 'none',
  boxSizing: 'border-box',
}

const primaryButton: React.CSSProperties = {
  border: 'none',
  background: '#3b82f6',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 20px',
  cursor: 'pointer',
  fontWeight: 600,
}

const secondaryButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.05)',
  background: 'rgba(255,255,255,0.4)',
  color: '#334155',
  borderRadius: 10,
  padding: '10px 20px',
  cursor: 'pointer',
  fontWeight: 600,
}