'use client'

import { useState, type FormEvent } from 'react'

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5123'
const APP =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // Account exists but email not verified → the backend re-sent an OTP.
        // Send the user to the signup page's OTP step.
        if (
          typeof data?.message === 'string' &&
          data.message.startsWith('EMAIL_NOT_VERIFIED:')
        ) {
          const unverifiedEmail = data.message.split(':')[1] || email
          window.location.href = `/signup?email=${encodeURIComponent(
            unverifiedEmail
          )}&step=otp`
          return
        }
        setError(
          data?.message || data?.error || 'Invalid email or password.'
        )
        return
      }

      const token =
        data?.token ||
        data?.accessToken ||
        data?.data?.accessToken ||
        data?.data?.token ||
        ''

      if (!token) {
        setError('Login failed. Please try again.')
        return
      }

      window.location.href =
        `${APP}/auth/callback` +
        `?token=${encodeURIComponent(token)}` +
        `&email=${encodeURIComponent(email)}`
    } catch {
      setError('Cannot connect to server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F6FC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: 'sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              fontFamily: 'monospace',
              letterSpacing: '0.2em',
            }}>
              ⚖️ CLAUSIO
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              AI Litigation Intelligence
            </div>
          </a>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}>
          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 4,
            textAlign: 'center',
          }}>
            Welcome back
          </h1>
          <p style={{
            fontSize: 13,
            color: '#64748b',
            textAlign: 'center',
            marginBottom: 28,
          }}>
            Sign in to your Clausio account
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6,
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advocate@example.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}>
                <label style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                }}>
                  Password
                </label>
                <a
                  href="/forgot-password"
                  style={{
                    fontSize: 12,
                    color: '#2563eb',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 8,
                fontSize: 13,
                color: '#dc2626',
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 10,
                border: 'none',
                background: loading
                  ? '#93c5fd'
                  : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#64748b',
            marginTop: 20,
          }}>
            New to Clausio?{' '}
            <a href="/signup" style={{
              color: '#2563eb',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Create free account
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
