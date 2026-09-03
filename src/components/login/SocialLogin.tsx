'use client'

import Link from 'next/link'

export default function SocialLogin() {
  return (
    <div>
      {/* Divider */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: '30px 0',
        }}
      >
        <div
          style={{
            flex: 1,
            height: 1,
            background: '#e2e8f0',
          }}
        />

        <span
          style={{
            margin: '0 18px',
            color: '#94a3b8',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          OR CONTINUE WITH
        </span>

        <div
          style={{
            flex: 1,
            height: 1,
            background: '#e2e8f0',
          }}
        />
      </div>

      {/* Google */}

      <Link
        href="/dashboard"
        style={{
          ...buttonStyle,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 20,
          }}
        >
          🌐
        </span>

        Continue with Google
      </Link>

      {/* Microsoft */}

      <Link
        href="/dashboard"
        style={buttonStyle}
      >
        <span
          style={{
            fontSize: 20,
          }}
        >
          🪟
        </span>

        Continue with Microsoft
      </Link>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  height: 52,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  borderRadius: 12,
  border: '1px solid #dbe3ef',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 15,
  transition: 'all .2s ease',
  boxSizing: 'border-box',
}
