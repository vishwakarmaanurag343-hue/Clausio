'use client'

import { useState } from 'react'
import { authApi } from '@/lib/api'

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving,          setSaving]          = useState(false)
  const [success,         setSuccess]         = useState('')
  const [error,           setError]           = useState('')

  async function handleChangePassword() {
    setError('')
    setSuccess('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill all fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSaving(true)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      setSuccess('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Check your current password.')
    } finally {
      setSaving(false)
    }
  }

  const user = authApi.getUser()

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Security</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Manage your password and account security.</p>
      </div>

      {/* Account Info */}
      <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Signed in as</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{user?.email ?? '—'}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{user?.role ?? '—'}</div>
      </div>

      {/* Change Password */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>Change Password</div>

        {success && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d' }}>
            ✓ {success}
          </div>
        )}
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
          <Field label="Current Password">
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} placeholder="Enter current password" />
          </Field>
          <Field label="New Password">
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="Min. 8 characters" />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="Re-enter new password" />
          </Field>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={saving}
          style={{ marginTop: 20, background: saving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
        >
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </div>

      {/* Security Tips */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>🔐 Security Tips</div>
        {[
          'Use a strong password with letters, numbers and symbols',
          'Never share your password with anyone',
          'Log out when using shared computers',
          'Your client data is encrypted and stored securely in India',
        ].map((tip, i) => (
          <div key={i} style={{ fontSize: 12, color: '#78350f', marginBottom: 6, display: 'flex', gap: 6 }}>
            <span>•</span> {tip}
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8,
  padding: '0 12px', fontSize: 13, outline: 'none', background: '#fff',
  boxSizing: 'border-box', color: '#0f172a', fontFamily: 'inherit',
}
