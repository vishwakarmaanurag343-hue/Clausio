'use client'

import { useState, useEffect, type FormEvent } from 'react'

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5123'
const APP =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [credits, setCredits] = useState(50)
  const [token, setToken] = useState('')

  // OTP verification state
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [resendCount, setResendCount] = useState(0)

  // Deep link: /signup?email=…&step=otp  (used by the login page when the
  // account exists but is not yet verified).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    const stepParam = params.get('step')
    if (emailParam) setEmail(emailParam)
    if (stepParam === 'otp') setStep('otp')
  }, [])

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!firstName.trim()) {
      setError('Please enter your first name.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'Lawyer',
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(
          data?.message ||
            data?.error ||
            'Registration failed. Please try again.'
        )
        return
      }

      // Registration successful — the backend has emailed a 6-digit OTP.
      // No JWT is issued until the email is verified.
      setStep('otp')
    } catch {
      setError('Cannot connect to server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setOtpError('')

    if (otp.length !== 6) {
      setOtpError('Please enter the 6-digit code.')
      return
    }

    setOtpLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim() }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setOtpError(data?.message || 'Invalid code. Please try again.')
        return
      }

      const jwt =
        data?.token || data?.accessToken || data?.data?.token || ''

      setToken(jwt)

      if (jwt) {
        try {
          const walletRes = await fetch(`${BACKEND}/api/wallet`, {
            headers: { Authorization: `Bearer ${jwt}` },
          })
          if (walletRes.ok) {
            const w = await walletRes.json()
            setCredits(w?.balance ?? 50)
          }
        } catch {
          setCredits(50)
        }
      }

      setStep('success')
    } catch {
      setOtpError('Cannot connect to server.')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleResendOtp() {
    if (resendCount >= 3) {
      setOtpError('Maximum resend attempts reached. Please register again.')
      return
    }

    setResendLoading(true)
    setResendMsg('')
    setOtpError('')

    try {
      const res = await fetch(`${BACKEND}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setResendCount((c) => c + 1)
        setResendMsg('New code sent! Check your email.')
        setOtp('')
      } else {
        setOtpError(data?.message || 'Failed to resend. Try again.')
      }
    } catch {
      setOtpError('Cannot connect to server.')
    } finally {
      setResendLoading(false)
    }
  }

  function goToDashboard() {
    if (token) {
      window.location.href =
        `${APP}/auth/callback` +
        `?token=${encodeURIComponent(token)}` +
        `&email=${encodeURIComponent(email)}`
    } else {
      window.location.href = `${APP}/auth/login`
    }
  }

  // SUCCESS SCREEN
  if (step === 'success') {
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
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              fontFamily: 'monospace',
              letterSpacing: '0.2em',
            }}>
              ⚖️ CLAUSIO
            </div>
          </div>

          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '40px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#f0fdf4',
              border: '2px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              margin: '0 auto 20px',
            }}>
              ✅
            </div>

            <h1 style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: 8,
            }}>
              Welcome to Clausio{firstName ? `, ${firstName}!` : '!'}
            </h1>

            <p style={{
              fontSize: 14,
              color: '#64748b',
              marginBottom: 28,
              lineHeight: 1.6,
            }}>
              Your account is ready. You have been given free AI credits
              to get started.
            </p>

            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              borderRadius: 16,
              padding: '24px 28px',
              marginBottom: 28,
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
              }} />
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 8,
              }}>
                Your AI Credit Balance
              </div>
              <div style={{
                fontSize: 56,
                fontWeight: 900,
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {credits}
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.8)',
              }}>
                Free credits · No card needed
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 24,
              textAlign: 'left',
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}>
                What you can do with credits
              </div>
              {[
                {
                  icon: '📄',
                  text: 'Draft bail applications, plaints, maintenance orders',
                  cost: '2 credits each',
                },
                {
                  icon: '⚖️',
                  text: 'Research SC/HC judgments from eCourts database',
                  cost: '1 credit each',
                },
                {
                  icon: '🎯',
                  text: "Prepare hearing briefs with judge's likely questions",
                  cost: '2 credits each',
                },
                {
                  icon: '🔍',
                  text: 'Analyse evidence and find contradictions',
                  cost: '3 credits each',
                },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                  borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>
                    {item.text}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: '#2563eb',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {item.cost}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={goToDashboard}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginBottom: 12,
              }}
            >
              Go to Dashboard →
            </button>

            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Signed in as {email}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // OTP VERIFICATION SCREEN
  if (step === 'otp') {
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
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              fontFamily: 'monospace',
              letterSpacing: '0.2em',
            }}>
              ⚖️ CLAUSIO
            </div>
          </div>

          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '40px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>

            <h1 style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: 8,
            }}>
              Check your email
            </h1>

            <p style={{
              fontSize: 14,
              color: '#64748b',
              marginBottom: 8,
              lineHeight: 1.6,
            }}>
              We sent a 6-digit verification code to:
            </p>

            <p style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#2563eb',
              marginBottom: 28,
            }}>
              {email}
            </p>

            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(val)
                  }}
                  placeholder="000000"
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '16px 12px',
                    borderRadius: 12,
                    border: otpError ? '2px solid #dc2626' : '2px solid #e2e8f0',
                    fontSize: 32,
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: '12px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#0f172a',
                  }}
                />
              </div>

              {otpError && (
                <div style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#dc2626',
                  marginBottom: 16,
                  textAlign: 'left',
                }}>
                  {otpError}
                </div>
              )}

              {resendMsg && (
                <div style={{
                  padding: '10px 14px',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#16a34a',
                  marginBottom: 16,
                }}>
                  {resendMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 10,
                  border: 'none',
                  background:
                    otpLoading || otp.length !== 6
                      ? '#93c5fd'
                      : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor:
                    otpLoading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  marginBottom: 16,
                }}
              >
                {otpLoading ? 'Verifying...' : 'Verify Email →'}
              </button>
            </form>

            <div style={{ fontSize: 13, color: '#64748b' }}>
              Didn&apos;t receive the code?{' '}
              <button
                onClick={handleResendOtp}
                disabled={resendLoading || resendCount >= 3}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCount >= 3 ? '#94a3b8' : '#2563eb',
                  cursor: resendCount >= 3 ? 'default' : 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              >
                {resendLoading
                  ? 'Sending...'
                  : resendCount >= 3
                  ? 'Max attempts reached'
                  : 'Resend code'}
              </button>
            </div>

            {resendCount > 0 && resendCount < 3 && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                {3 - resendCount} resend attempt
                {3 - resendCount !== 1 ? 's' : ''} remaining
              </div>
            )}

            <div style={{ marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
              Code expires in 5 minutes
            </div>
          </div>
        </div>
      </div>
    )
  }

  // SIGNUP FORM
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
      <div style={{ width: '100%', maxWidth: 440 }}>
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
            Create your account
          </h1>
          <p style={{
            fontSize: 13,
            color: '#64748b',
            textAlign: 'center',
            marginBottom: 20,
          }}>
            Get 50 free AI credits instantly. No credit card required.
          </p>

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: '#16a34a',
            fontWeight: 600,
          }}>
            <span>⚡</span>
            <span>50 free AI credits on signup — no credit card needed</span>
          </div>

          <form onSubmit={handleSignup}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 14,
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 6,
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Parth"
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
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 6,
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Bindra"
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
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6,
              }}>
                Email Address *
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
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6,
              }}>
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
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
              {loading ? 'Creating account...' : 'Create Free Account →'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#64748b',
            marginTop: 20,
          }}>
            Already have an account?{' '}
            <a href="/login" style={{
              color: '#2563eb',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Sign in
            </a>
          </p>

          <p style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#94a3b8',
            marginTop: 16,
            lineHeight: 1.5,
          }}>
            By signing up you agree to our{' '}
            <a href="/terms" style={{ color: '#64748b' }}>
              Terms
            </a>{' '}
            and{' '}
            <a href="/privacy" style={{ color: '#64748b' }}>
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
