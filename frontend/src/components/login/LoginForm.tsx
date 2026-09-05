'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

type ViewMode = 'login' | 'forgot' | 'reset'

export default function LoginForm({ initialViewMode = 'login' }: { initialViewMode?: ViewMode }) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 1. Direct Login via Backend
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await authApi.login(email, password)
      if (res?.token) {
        const isMobile = window.innerWidth <= 768
        router.push(isMobile ? '/chat' : '/dashboard')
      }
    } catch (err: any) {
      if (typeof err?.message === 'string' && err.message.includes('EMAIL_NOT_VERIFIED')) {
        const unverifiedEmail = err.message.includes(':')
          ? err.message.split(':').slice(1).join(':')
          : email
        window.location.href = `/signup?email=${encodeURIComponent(unverifiedEmail.trim())}&step=otp`
        return
      }
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Request Password Reset OTP
  async function handleForgotPasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setViewMode('reset')
      setSuccess(`Password reset code sent to ${email}. Please check your inbox.`)
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  // 4. Submit Reset Password with OTP & New Password
  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({ email, otp: resetOtp, newPassword })
      setViewMode('login')
      setPassword('')
      setSuccess('Password updated successfully! Please sign in with your new password.')
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      {/* Header Logo */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            fontSize: 30,
            fontWeight: 800,
            boxShadow: '0 10px 30px rgba(37,99,235,.25)',
          }}
        >
          ⚖️
        </div>

        <h1
          style={{
            marginTop: 24,
            marginBottom: 8,
            fontSize: 32,
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}
        >
          {viewMode === 'login' && 'Welcome Back 👋'}
          {viewMode === 'forgot' && 'Reset Password 🔑'}
          {viewMode === 'reset' && 'Set New Password 🔒'}
        </h1>

        <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: 15, margin: 0 }}>
          {viewMode === 'login' && 'Sign in to access your AI-powered legal workspace.'}
          {viewMode === 'forgot' && 'Enter your registered email to receive a password reset OTP.'}
          {viewMode === 'reset' && 'Enter the OTP sent to your email and your new password.'}
        </p>
      </div>

      {/* Main Card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 22,
          padding: 32,
          boxShadow: '0 20px 45px rgba(15,23,42,.08)',
        }}
      >
        {/* Status Alerts */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              color: '#dc2626',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px 16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              color: '#166534',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>✅</span> {success}
          </div>
        )}

        {/* ── MODE 1: LOGIN FORM ── */}
        {viewMode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advocate@clausio.ai"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 28,
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  style={{ borderRadius: 4, width: 16, height: 16 }}
                />
                <span style={{ fontSize: 14, color: '#475569' }}>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setViewMode('forgot')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── MODE 2: FORGOT PASSWORD ── */}
        {viewMode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Registered Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advocate@clausio.ai"
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Sending Reset Code...' : 'Send Password Reset Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setError('')
                setSuccess('')
                setViewMode('login')
              }}
              style={secondaryLinkStyle}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* ── MODE 4: RESET PASSWORD WITH OTP ── */}
        {viewMode === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Verification OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP code"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 chars, 1 Upper, 1 Lower, 1 Num"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Resetting Password...' : 'Update Password & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setError('')
                setSuccess('')
                setViewMode('login')
              }}
              style={secondaryLinkStyle}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* Register footer */}
        {viewMode === 'login' && (
          <div style={{ marginTop: 28, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontWeight: 600,
  fontSize: 13,
  color: '#334155',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  border: '1px solid #dbe3ef',
  borderRadius: 12,
  padding: '0 16px',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all .2s ease',
  background: '#f8fafc',
}

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  height: 50,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
}

const secondaryLinkStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 16,
  background: 'none',
  border: 'none',
  color: '#64748b',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'center',
}