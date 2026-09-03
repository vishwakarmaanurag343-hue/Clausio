'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LoginForm() {
  const [rememberMe, setRememberMe] = useState(true)

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
      }}
    >
      {/* Logo */}

      <div
        style={{
          marginBottom: 40,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: '#2563eb',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            fontSize: 34,
            fontWeight: 700,
            boxShadow: '0 10px 30px rgba(37,99,235,.25)',
          }}
        >
          C
        </div>

        <h1
          style={{
            marginTop: 28,
            marginBottom: 8,
            fontSize: 38,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Welcome Back 👋
        </h1>

        <p
          style={{
            color: '#64748b',
            lineHeight: 1.8,
            fontSize: 16,
          }}
        >
          Sign in to access your AI-powered legal workspace
          and manage your cases from one place.
        </p>
      </div>

      {/* Login Card */}

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 22,
          padding: 32,
          boxShadow: '0 20px 45px rgba(15,23,42,.08)',
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 26,
            color: '#0f172a',
          }}
        >
          Sign In
        </h2>

        {/* Email */}

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Email Address
          </label>

          <input
            type="email"
            placeholder="lawyer@clausio.ai"
            style={inputStyle}
          />
        </div>

        {/* Password */}

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Password
          </label>

          <input
            type="password"
            placeholder="••••••••••"
            style={inputStyle}
          />
        </div>

        {/* Remember */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 30,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() =>
                setRememberMe(!rememberMe)
              }
            />

            <span
              style={{
                fontSize: 14,
              }}
            >
              Remember Me
            </span>
          </label>

          <Link
            href="/forgot-password"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login */}

        <Link
          href="/dashboard"
          style={{
            width: '100%',
            height: 52,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            textDecoration: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Login
        </Link>

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
            }}
          >
            OR
          </span>

          <div
            style={{
              flex: 1,
              height: 1,
              background: '#e2e8f0',
            }}
          />
        </div>
                {/* ================= SOCIAL LOGIN ================= */}

        <Link
          href="/dashboard"
          style={{
            ...socialButton,
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

        <Link
          href="/dashboard"
          style={socialButton}
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

        {/* ================= REGISTER ================= */}

        <div
          style={{
            marginTop: 28,
            textAlign: 'center',
            color: '#64748b',
            fontSize: 15,
          }}
        >
          Don't have an account?{' '}

          <Link
            href="/register"
            style={{
              color: '#2563eb',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Create Account
          </Link>
        </div>

        {/* ================= FOOTER ================= */}

        <div
          style={{
            marginTop: 30,
            paddingTop: 22,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            color: '#94a3b8',
            fontSize: 13,
          }}
        >
          <span>Terms</span>

          <span>Privacy</span>

          <span>Support</span>

          <span>v1.0</span>
        </div>
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 52,
  border: '1px solid #dbe3ef',
  borderRadius: 12,
  padding: '0 16px',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all .2s ease',
}

const socialButton: React.CSSProperties = {
  width: '100%',
  height: 52,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  border: '1px solid #dbe3ef',
  borderRadius: 12,
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 15,
  boxSizing: 'border-box',
}