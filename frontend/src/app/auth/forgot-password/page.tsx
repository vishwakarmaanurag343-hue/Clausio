'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

type Step = 'email' | 'reset' | 'success'

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.6)',
  borderRadius: 12,
  padding: '0 14px',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
}

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  height: 52,
  border: 'none',
  borderRadius: 9999,
  background: disabled ? '#93c5fd' : 'linear-gradient(110deg,#1e3a8a,#3b82f6,#6366f1,#1e3a8a)',
  backgroundSize: '300% 300%',
  color: '#fff',
  fontSize: 15,
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 10px 30px rgba(59,130,246,0.25)',
})

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim().toLowerCase())
      setMessage(`If ${email.trim()} is registered, a 6-digit reset code has been sent.`)
      setStep('reset')
    } catch (err: any) {
      setError(err.message || 'Cannot connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (otp.trim().length !== 6) { setError('Please enter the 6-digit code.'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      await authApi.resetPassword({ email: email.trim().toLowerCase(), otp: otp.trim(), newPassword })
      setStep('success')
      setTimeout(() => router.push('/auth/login'), 1800)
    } catch (err: any) {
      setError(err.message || 'Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: `radial-gradient(circle at 15% 50%, rgba(226,232,240,0.6), transparent 40%),
                   radial-gradient(circle at 85% 30%, rgba(203,213,225,0.7), transparent 40%),
                   #f1f5f9`,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(59,130,246,0.15)',
            }}>
              <i className="ti ti-gavel" style={{ fontSize: 20, color: '#1e3a8a' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Clausio</div>
              <div style={{ fontSize: 9, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase' }}>Legal Intelligence</div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 36, borderRadius: 28 }}>

          {step === 'email' && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4, textAlign: 'center' }}>
                Forgot password?
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 24 }}>
                Enter your registered email and we'll send a 6-digit OTP to reset your password.
              </p>

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FField label="Email address">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="advocate@lawfirm.com" required style={inputStyle} />
                </FField>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={buttonStyle(loading)}>
                  {loading ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP...</> : <><i className="ti ti-send" /> Send Reset OTP</>}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
                Remember your password?{' '}
                <a href="/auth/login" style={{ color: '#1e40af', fontWeight: 700, textDecoration: 'none' }}>Sign in</a>
              </p>
            </>
          )}

          {step === 'reset' && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4, textAlign: 'center' }}>
                Check your email
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
                Enter the 6-digit code sent to <strong style={{ color: '#2563eb' }}>{email}</strong>
              </p>

              {message && (
                <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, fontSize: 13, color: '#15803d', marginBottom: 16 }}>
                  {message}
                </div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FField label="6-digit OTP code">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    required
                    style={{ ...inputStyle, height: 56, fontSize: 24, fontWeight: 800, textAlign: 'center', letterSpacing: '10px', fontFamily: 'monospace' }}
                  />
                </FField>

                <FField label="New password">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" required style={inputStyle} />
                </FField>

                <FField label="Confirm new password">
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required style={inputStyle} />
                </FField>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={buttonStyle(loading)}>
                  {loading ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> Resetting...</> : <><i className="ti ti-check" /> Reset Password</>}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => { setOtp(''); setError(''); handleSendOtp({ preventDefault: () => {} } as any) }}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                >
                  Resend code
                </button>
                <a href="/auth/login" style={{ color: '#64748b', fontWeight: 600, textDecoration: 'none' }}>Back to Sign In</a>
              </div>

              <style suppressHydrationWarning>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#f0fdf4', border: '2px solid #86efac',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, margin: '0 auto 16px',
              }}>
                ✅
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Password reset!</h1>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                Your password has been reset successfully. Taking you to sign in…
              </p>
              <a href="/auth/login" style={{ ...buttonStyle(false), textDecoration: 'none', display: 'flex' }}>
                Sign In →
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
