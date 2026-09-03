'use client'

import { useState } from 'react'

export default function WhatsAppPreview() {
  const [message] = useState(`Priya Ji,

Aaj Family Court mein hearing hui.

Judge ne Rohit ke vakil ko reply file karne ka final opportunity diya hai. Court ne clearly bola hai ki agar agli hearing tak reply file nahi hota hai to matter ex-parte proceed ho sakta hai.

Agli hearing:
24 June 2024

Aap se request hai ki last 3 months ke bank statements aur salary related documents ready rakhiye.

Koi bhi doubt ho to hume call ya WhatsApp kar sakti hain.

Regards,
Adv. Ram Pugalia`)

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 2px 8px rgba(15,23,42,.04)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            WhatsApp Preview
          </h2>

          <p
            style={{
              marginTop: 5,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            AI generated message ready to send
          </p>
        </div>

        <span
          style={{
            background: '#dcfce7',
            color: '#15803d',
            padding: '8px 14px',
            borderRadius: 20,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Ready
        </span>
      </div>

      {/* Phone */}

      <div
        style={{
          flex: 1,
          background: '#ece5dd',
          borderRadius: 18,
          padding: 20,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            background: '#dcf8c6',
            padding: 18,
            borderRadius: 12,
            maxWidth: '88%',
            marginLeft: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            fontSize: 14,
            color: '#111827',
            boxShadow: '0 2px 6px rgba(0,0,0,.08)',
          }}
        >
          {message}
        </div>
      </div>

      {/* Footer */}

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 20,
        }}
      >
        <button
          style={secondaryButton}
        >
          <i className="ti ti-refresh" />
          Regenerate
        </button>

        <button
          style={secondaryButton}
        >
          <i className="ti ti-language" />
          Translate
        </button>

        <button
          style={primaryButton}
        >
          <i className="ti ti-copy" />
          Copy for WhatsApp
        </button>
      </div>
    </div>
  )
}

const primaryButton: React.CSSProperties = {
  flex: 1,
  background: '#22c55e',
  color: '#ffffff',
  border: 'none',
  borderRadius: 12,
  padding: '14px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
}

const secondaryButton: React.CSSProperties = {
  background: '#f8fafc',
  color: '#334155',
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '14px 18px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
}