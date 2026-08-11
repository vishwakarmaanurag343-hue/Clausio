'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
  onGenerate: (tone: string, language: string) => Promise<void>
}

export default function GenerateUpdateModal({
  onClose,
  onGenerate,
}: Props) {
  const [language, setLanguage] = useState('Hinglish')
  const [tone, setTone] = useState('Reassuring')
  const [length, setLength] = useState('Medium')
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      await onGenerate(tone, language)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 720,
          background: '#ffffff',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        }}
      >
        {/* Header */}

        <div
          style={{
            padding: '22px 26px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              AI WhatsApp Generator
            </h2>

            <p
              style={{
                marginTop: 6,
                color: '#64748b',
                fontSize: 14,
              }}
            >
              Configure your client update
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}

        <div
          style={{
            padding: 26,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          <Field label="Language">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={inputStyle}
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Hinglish</option>
              <option>Gujarati</option>
              <option>Marathi</option>
            </select>
          </Field>

          <Field label="Tone">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={inputStyle}
            >
              <option>Professional</option>
              <option>Friendly</option>
              <option>Reassuring</option>
              <option>Formal</option>
            </select>
          </Field>

          <Field label="Message Length">
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              style={inputStyle}
            >
              <option>Short</option>
              <option>Medium</option>
              <option>Detailed</option>
            </select>
          </Field>

          <Field label="Client Emotion">
            <select style={inputStyle}>
              <option>Calm</option>
              <option>Concerned</option>
              <option>Happy</option>
              <option>Urgent</option>
            </select>
          </Field>

          <div
            style={{
              gridColumn: '1 / span 2',
            }}
          >
            <Field label="Additional Instructions">
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: Mention that documents should be brought on the next hearing. Keep the tone positive."
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />
            </Field>
          </div>

          <div
            style={{
              gridColumn: '1 / span 2',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#1d4ed8',
                marginBottom: 10,
              }}
            >
              AI will include
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: '#334155',
                lineHeight: 1.9,
                fontSize: 14,
              }}
            >
              <li>Today's hearing summary</li>
              <li>Judge's observations</li>
              <li>Next hearing date</li>
              <li>Action items for the client</li>
              <li>Simple language without legal jargon</li>
            </ul>
          </div>
        </div>

        {/* Footer */}

        <div
          style={{
            padding: 24,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={cancelButton}
          >
            Cancel
          </button>

          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{ ...generateButton, opacity: generating ? 0.7 : 1, cursor: generating ? 'not-allowed' : 'pointer' }}
          >
            {generating ? '✨ Generating...' : '✨ Generate AI Update'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- */

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        style={{
          marginBottom: 8,
          fontWeight: 600,
          color: '#334155',
          fontSize: 14,
        }}
      >
        {label}
      </div>

      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const cancelButton: React.CSSProperties = {
  padding: '12px 22px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  cursor: 'pointer',
  fontWeight: 600,
}

const generateButton: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 10,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
}