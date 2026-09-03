'use client'

interface Props {
  onClose: () => void
}

export default function OutOfCreditsModal({ onClose }: Props) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 32px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>

        <h2 style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 8,
        }}>
          You have used all your credits
        </h2>

        <p style={{
          fontSize: 14,
          color: '#64748b',
          lineHeight: 1.6,
          marginBottom: 8,
        }}>
          Your 50 free AI credits are used up.
        </p>

        <p style={{
          fontSize: 14,
          color: '#64748b',
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          Paid plans are coming soon. For now contact us and we will
          add more credits to your account.
        </p>

        <a
          href="mailto:support@clausiotech.com?subject=More Credits Request — Clausio"
          style={{
            display: 'block',
            padding: '14px 0',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
            marginBottom: 10,
          }}
        >
          📧 Request More Credits
        </a>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '8px 0',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
