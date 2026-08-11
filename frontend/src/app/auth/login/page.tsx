'use client'

import { authApi } from '@/lib/api'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'register'

const ROLES = ['SeniorAdvocate', 'JuniorAdvocate', 'Clerk']
const ROLE_LABELS: Record<string, string> = {
  SeniorAdvocate: 'Senior Advocate',
  JuniorAdvocate: 'Junior Advocate',
  Clerk:          'Clerk / Paralegal',
}

const FEATURES = [
  { icon: 'ti-gavel',        text: 'AI-powered petition drafting' },
  { icon: 'ti-book',         text: 'Legal research with binding judgments' },
  { icon: 'ti-calendar',     text: 'Hearing diary with deadline alerts' },
  { icon: 'ti-shield-check', text: 'Case readiness score before every hearing' },
  { icon: 'ti-message',      text: 'Client updates in Hindi & Gujarati' },
  { icon: 'ti-chart-bar',    text: 'Financial intelligence for maintenance cases' },
]

export default function LoginPage() {
  const router = useRouter()
  const [mode,     setMode]     = useState<Mode>('login')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [mounted,  setMounted]  = useState(false)
  const [activeF,  setActiveF]  = useState(0)
  const [showPass, setShowPass] = useState(false)
  const [regStep,  setRegStep]  = useState(1)

  // Login
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Register
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [regEmail,    setRegEmail]    = useState('')
  const [phone,       setPhone]       = useState('')
  const [barCouncil,  setBarCouncil]  = useState('')
  const [firmName,    setFirmName]    = useState('')
  const [role,        setRole]        = useState('SeniorAdvocate')
  const [regPassword, setRegPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => setActiveF(p => (p + 1) % FEATURES.length), 3000)
    return () => clearInterval(t)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      document.cookie = `clausio_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (regPassword !== confirmPass) { setError('Passwords do not match.'); return }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await authApi.register({ firstName, lastName, email: regEmail, password: regPassword, phone, barCouncilNo: barCouncil, firmName, role })
      setSuccess('Account created successfully. Please sign in.')
      setMode('login')
      setEmail(regEmail)
      setRegStep(1)
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const psColor = regPassword.length === 0 ? '#e2e8f0' : regPassword.length < 6 ? '#ef4444' : regPassword.length < 10 ? '#f59e0b' : '#22c55e'
  const psWidth = regPassword.length === 0 ? '0%' : regPassword.length < 6 ? '33%' : regPassword.length < 10 ? '66%' : '100%'
  const psLabel = regPassword.length === 0 ? '' : regPassword.length < 6 ? 'Weak' : regPassword.length < 10 ? 'Medium' : 'Strong'

  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatOrb {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(-20px) scale(1.04); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes gradient-xy {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-blue {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.2); }
          50%     { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
        }

        .auth-input {
          width: 100%;
          height: 48px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 12px;
          padding: 0 14px 0 44px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          outline: none;
          transition: all 0.2s;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
        }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-input:focus {
          background: rgba(255,255,255,0.95);
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12), inset 0 2px 4px rgba(0,0,0,0.02);
        }

        .ai-magic-button {
          position: relative;
          border-radius: 9999px;
          background: linear-gradient(110deg, #1e3a8a, #3b82f6, #6366f1, #1e3a8a);
          background-size: 300% 300%;
          animation: gradient-xy 6s ease infinite;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 10px 30px rgba(59,130,246,0.3), inset 0 2px 2px rgba(255,255,255,0.4);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ai-magic-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(59,130,246,0.4), inset 0 2px 2px rgba(255,255,255,0.5);
        }
        .ai-magic-button::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 3s ease-in-out infinite;
        }
        .ai-magic-button:disabled { opacity: 0.7; cursor: not-allowed; }

        .tab-btn {
          flex: 1; padding: 10px;
          border: 1px solid transparent;
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          font-family: inherit; cursor: pointer;
          transition: all 0.2s;
        }
        .feature-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 12px;
          transition: all 0.3s;
        }
        .secondary-btn {
          width: 100%; height: 48px;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 12px;
          font-size: 14px; font-weight: 600;
          font-family: inherit; cursor: pointer;
          color: #475569; display: flex;
          align-items: center; justify-content: center;
          gap: 6px; transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .secondary-btn:hover {
          background: rgba(255,255,255,0.85);
          border-color: #3b82f6; color: #1e40af;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Full page background — matches dashboard */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: `radial-gradient(circle at 15% 50%, rgba(226,232,240,0.6), transparent 40%),
                     radial-gradient(circle at 85% 30%, rgba(203,213,225,0.7), transparent 40%),
                     #f1f5f9`,
        backgroundAttachment: 'fixed',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Background floating orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', animation: 'floatOrb 10s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', animation: 'floatOrb 12s ease-in-out infinite reverse', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* ── LEFT PANEL ── */}
        <div style={{ width: '45%', display: 'flex', flexDirection: 'column', padding: '52px 56px', position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <div style={{ animation: mounted ? 'fadeIn 0.5s ease both' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(59,130,246,0.15), 0 0 0 0 rgba(59,130,246,0.2)',
                animation: 'pulse-blue 3s ease-in-out infinite',
              }}>
                <i className="ti ti-gavel" style={{ fontSize: 22, color: '#1e3a8a' }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Clausio</div>
                <div style={{ fontSize: 9, color: '#64748b', letterSpacing: 3, marginTop: 1, textTransform: 'uppercase' }}>Legal Intelligence</div>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ animation: mounted ? 'fadeIn 0.6s ease 0.1s both' : 'none' }}>
              <div style={{ fontSize: 11, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>
                Trusted by advocates across India
              </div>
              <h1 style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-1px' }}>
                Every clause.<br />
                <span style={{
                  background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Intelligently
                </span>{' '}
                handled.
              </h1>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, maxWidth: 360, marginBottom: 40 }}>
                India's most advanced AI litigation platform — built for practising advocates in all courts.
              </p>
            </div>

            {/* Feature showcase card */}
            <div style={{ animation: mounted ? 'fadeIn 0.6s ease 0.2s both' : 'none' }}>
              <div className="glass-panel" style={{ padding: 8, borderRadius: 20, marginBottom: 32 }}>
                {FEATURES.map((f, i) => (
                  <div key={i} className="feature-row" style={{ background: i === activeF ? 'rgba(59,130,246,0.08)' : 'transparent', opacity: i === activeF ? 1 : 0.45 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: i === activeF ? 'rgba(30,58,138,0.1)' : 'transparent',
                      border: `1px solid ${i === activeF ? 'rgba(59,130,246,0.25)' : 'transparent'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s',
                    }}>
                      <i className={`ti ${f.icon}`} style={{ fontSize: 16, color: i === activeF ? '#1e3a8a' : '#94a3b8', transition: 'all 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 13, color: i === activeF ? '#0f172a' : '#94a3b8', fontWeight: i === activeF ? 600 : 400, transition: 'all 0.3s' }}>
                      {f.text}
                    </span>
                    {i === activeF && (
                      <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, boxShadow: '0 0 8px rgba(59,130,246,0.6)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, animation: mounted ? 'fadeIn 0.6s ease 0.3s both' : 'none' }}>
              {[
                { value: '11', label: 'Practice Areas' },
                { value: '100+', label: 'Document Types' },
                { value: '99.9%', label: 'Uptime' },
              ].map((s, i) => (
                <div key={i} className="glass-card" style={{ padding: '14px 16px', textAlign: 'center', borderRadius: 14 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom badges */}
          <div style={{ display: 'flex', gap: 20, marginTop: 40, animation: mounted ? 'fadeIn 0.6s ease 0.4s both' : 'none' }}>
            {['🔒 256-bit Encrypted', '🇮🇳 India Servers', '⚖️ DPDP Act 2023'].map((b, i) => (
              <span key={i} style={{ fontSize: 11, color: '#94a3b8' }}>{b}</span>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 64px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: 420, animation: mounted ? 'fadeIn 0.7s ease 0.15s both' : 'none' }}>

            {/* Form card */}
            <div className="glass-panel" style={{ padding: 36, borderRadius: 28 }}>

              {/* Tab switcher */}
              <div style={{ display: 'flex', background: 'rgba(241,245,249,0.8)', borderRadius: 14, padding: 4, marginBottom: 28 }}>
                <button className="tab-btn"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); setRegStep(1) }}
                  style={{ background: mode === 'login' ? 'rgba(255,255,255,0.95)' : 'transparent', color: mode === 'login' ? '#0f172a' : '#64748b', boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', border: mode === 'login' ? '1px solid rgba(255,255,255,0.8)' : '1px solid transparent' }}>
                  Sign In
                </button>
                <button className="tab-btn"
                  onClick={() => { setMode('register'); setError(''); setSuccess(''); setRegStep(1) }}
                  style={{ background: mode === 'register' ? 'rgba(255,255,255,0.95)' : 'transparent', color: mode === 'register' ? '#0f172a' : '#64748b', boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', border: mode === 'register' ? '1px solid rgba(255,255,255,0.8)' : '1px solid transparent' }}>
                  Create Account
                </button>
              </div>

              {/* Heading */}
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.3px' }}>
                  {mode === 'login' ? 'Welcome back' : regStep === 1 ? 'Create your account' : 'Professional details'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b' }}>
                  {mode === 'login' ? 'Sign in to access your case dashboard.' : regStep === 1 ? 'Step 1 of 2 — Basic information' : 'Step 2 of 2 — Almost done!'}
                </p>
              </div>

              {/* Alerts */}
              {success && (
                <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, fontSize: 13, color: '#15803d', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 16 }} /> {success}
                </div>
              )}
              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#dc2626', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: 16 }} /> {error}
                </div>
              )}

              {/* ── LOGIN ── */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <FField label="Email address">
                    <i className="ti ti-mail" style={iconSt} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="advocate@lawfirm.com" required className="auth-input" />
                  </FField>
                  <FField label="Password">
                    <i className="ti ti-lock" style={iconSt} />
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required className="auth-input" />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                      <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} style={{ fontSize: 17 }} />
                    </button>
                  </FField>
                  <button type="submit" disabled={loading} className="ai-magic-button" style={{ width: '100%', height: 52, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                    {loading ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : <><i className="ti ti-login" /> Sign In to Dashboard</>}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                    New to Clausio?{' '}
                    <span onClick={() => { setMode('register'); setError('') }} style={{ color: '#1e40af', fontWeight: 700, cursor: 'pointer' }}>
                      Create account
                    </span>
                  </p>
                </form>
              )}

              {/* ── REGISTER ── */}
              {mode === 'register' && (
                <>
                  {/* Step bar */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 24, alignItems: 'center' }}>
                    {[1, 2].map(s => (
                      <div key={s} style={{ height: 4, flex: s === regStep ? 2 : 1, borderRadius: 4, background: s <= regStep ? '#3b82f6' : '#e2e8f0', transition: 'all 0.4s', boxShadow: s === regStep ? '0 0 8px rgba(59,130,246,0.4)' : 'none' }} />
                    ))}
                    <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{regStep}/2</span>
                  </div>

                  {regStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideUp 0.3s ease' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <FField label="First name">
                          <i className="ti ti-user" style={iconSt} />
                          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Rajesh" required className="auth-input" />
                        </FField>
                        <FField label="Last name">
                          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sharma" required className="auth-input" style={{ paddingLeft: 14 }} />
                        </FField>
                      </div>
                      <FField label="Email address">
                        <i className="ti ti-mail" style={iconSt} />
                        <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="advocate@lawfirm.com" required className="auth-input" />
                      </FField>
                      <FField label="Mobile number">
                        <i className="ti ti-phone" style={iconSt} />
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" required className="auth-input" />
                      </FField>
                      <FField label="Your role">
                        <i className="ti ti-briefcase" style={iconSt} />
                        <select value={role} onChange={e => setRole(e.target.value)} className="auth-input" style={{ appearance: 'none' }}>
                          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      </FField>
                      <button type="button" className="ai-magic-button"
                        onClick={() => {
                          if (!firstName || !lastName || !regEmail || !phone) { setError('Please fill all fields.'); return }
                          setError(''); setRegStep(2)
                        }}
                        style={{ width: '100%', height: 48, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                        Continue <i className="ti ti-arrow-right" />
                      </button>
                    </div>
                  )}

                  {regStep === 2 && (
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideUp 0.3s ease' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <FField label="Bar Council No.">
                          <input type="text" value={barCouncil} onChange={e => setBarCouncil(e.target.value)} placeholder="MH/1234/2015" className="auth-input" style={{ paddingLeft: 14 }} />
                        </FField>
                        <FField label="Firm / Chamber">
                          <input type="text" value={firmName} onChange={e => setFirmName(e.target.value)} placeholder="Sharma & Co." className="auth-input" style={{ paddingLeft: 14 }} />
                        </FField>
                      </div>
                      <FField label="Password">
                        <i className="ti ti-lock" style={iconSt} />
                        <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Min. 8 characters" required className="auth-input" />
                      </FField>
                      {regPassword && (
                        <div style={{ marginTop: -6 }}>
                          <div style={{ height: 3, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: psWidth, background: psColor, borderRadius: 3, transition: 'all 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: psColor, marginTop: 4, display: 'block', fontWeight: 600 }}>{psLabel}</span>
                        </div>
                      )}
                      <FField label="Confirm password">
                        <i className="ti ti-lock-check" style={iconSt} />
                        <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Re-enter password" required className="auth-input" />
                        {confirmPass && confirmPass === regPassword && (
                          <i className="ti ti-circle-check" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: 18 }} />
                        )}
                      </FField>
                      <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                        By registering you agree to Clausio's Terms. Data stored in India — DPDP Act 2023 compliant.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                        <button type="button" className="secondary-btn" onClick={() => { setRegStep(1); setError('') }}>
                          <i className="ti ti-arrow-left" /> Back
                        </button>
                        <button type="submit" disabled={loading} className="ai-magic-button"
                          style={{ height: 48, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          {loading ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><i className="ti ti-user-plus" /> Create Account</>}
                        </button>
                      </div>
                    </form>
                  )}

                  <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 16 }}>
                    Already have an account?{' '}
                    <span onClick={() => { setMode('login'); setError('') }} style={{ color: '#1e40af', fontWeight: 700, cursor: 'pointer' }}>
                      Sign in
                    </span>
                  </p>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
              {['🔒 Encrypted', '🇮🇳 India Servers', '⚖️ DPDP 2023'].map((b, i) => (
                <span key={i} style={{ fontSize: 11, color: '#94a3b8' }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}

const iconSt: React.CSSProperties = {
  position: 'absolute', left: 14, top: '50%',
  transform: 'translateY(-50%)', color: '#94a3b8',
  fontSize: 17, pointerEvents: 'none', zIndex: 1,
}
