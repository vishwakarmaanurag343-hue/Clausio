'use client'

import { useState, useEffect } from 'react'
import { teamApi } from '@/lib/api'

// UI label ↔ backend role value
const ROLE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Administrator',   value: 'SuperAdmin' },
  { label: 'Senior Advocate', value: 'SeniorAdvocate' },
  { label: 'Advocate',        value: 'JuniorAdvocate' },
  { label: 'Associate',       value: 'Clerk' },
  { label: 'Intern',          value: 'Intern' },
]

function roleLabel(value?: string | null) {
  return ROLE_OPTIONS.find(r => r.value === value)?.label ?? (value || 'Unassigned')
}

function roleColor(value?: string | null) {
  switch (value) {
    case 'SuperAdmin':     return '#2563eb'
    case 'SeniorAdvocate': return '#7c3aed'
    case 'JuniorAdvocate': return '#16a34a'
    case 'Clerk':          return '#d97706'
    case 'Intern':         return '#0891b2'
    default:               return '#64748b'
  }
}

function initials(first?: string, last?: string) {
  const a = (first || '').trim().charAt(0)
  const b = (last || '').trim().charAt(0)
  return (a + b).toUpperCase() || '?'
}

export default function TeamSettings() {
  const [members, setMembers] = useState<any[]>([])
  const [stats,   setStats]   = useState<any>({ total: 0, advocates: 0, associates: 0, interns: 0 })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const [inviteEmail,     setInviteEmail]     = useState('')
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName,  setInviteLastName]  = useState('')
  const [inviteRole,      setInviteRole]      = useState('JuniorAdvocate')
  const [inviting,        setInviting]        = useState(false)
  const [inviteResult,    setInviteResult]    = useState<{ email: string; tempPassword: string } | null>(null)
  const [inviteError,     setInviteError]     = useState('')

  const [rowBusy, setRowBusy] = useState('')
  const [rowMsg,  setRowMsg]  = useState<{ id: string; text: string; ok: boolean } | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await teamApi.getMembers()
      setMembers(Array.isArray(res?.members) ? res.members : [])
      setStats(res?.stats ?? { total: 0, advocates: 0, associates: 0, interns: 0 })
    } catch (err: any) {
      setError(err.message || 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) { setInviteError('Email is required.'); return }
    setInviting(true)
    setInviteError('')
    setInviteResult(null)
    try {
      const res = await teamApi.invite({
        email: inviteEmail.trim(),
        firstName: inviteFirstName.trim() || undefined,
        lastName: inviteLastName.trim() || undefined,
        role: inviteRole,
      })
      setInviteResult({ email: res.email, tempPassword: res.tempPassword })
      setInviteEmail(''); setInviteFirstName(''); setInviteLastName('')
      await load()
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    setRowBusy(id)
    setRowMsg(null)
    try {
      await teamApi.updateRole(id, newRole)
      await load()
      setRowMsg({ id, text: 'Role updated.', ok: true })
    } catch (err: any) {
      setRowMsg({ id, text: err.message || 'Failed to update role', ok: false })
    } finally {
      setRowBusy('')
    }
  }

  async function handleRemove(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from team?`)) return
    setRowBusy(id)
    setRowMsg(null)
    try {
      await teamApi.removeMember(id)
      await load()
    } catch (err: any) {
      setRowMsg({ id, text: err.message || 'Failed to remove member', ok: false })
    } finally {
      setRowBusy('')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <i className="ti ti-loader animate-spin" style={{ fontSize: 30, color: '#2563eb' }} />
        <p style={{ marginTop: 12, fontSize: 13 }}>Loading team…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, color: '#dc2626', textAlign: 'center' }}>
        {error}
        <button onClick={load} style={{ display: 'block', margin: '12px auto 0', padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Retry</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Team Management</h2>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 13 }}>Invite advocates, associates and interns to collaborate securely.</p>
      </div>

      {/* SECTION 1 — STATS (from backend) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard title="Total Members" value={stats.total}      icon="ti-users" />
        <StatCard title="Advocates"     value={stats.advocates}  icon="ti-scale" />
        <StatCard title="Associates"    value={stats.associates} icon="ti-briefcase" />
        <StatCard title="Interns"       value={stats.interns}    icon="ti-school" />
      </div>

      {/* SECTION 2 — INVITE */}
      <Section title="Invite New Member">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Email <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="advocate@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>First Name</label>
            <input value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={inputStyle}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button onClick={handleInvite} disabled={inviting} style={{ ...primaryButton, opacity: inviting ? 0.6 : 1, cursor: inviting ? 'default' : 'pointer', height: 42 }}>
            {inviting ? 'Inviting…' : 'Invite'}
          </button>
        </div>

        {inviteError && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
            ✗ {inviteError}
          </div>
        )}

        {inviteResult && (
          <div style={{ marginTop: 14, padding: '14px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, fontSize: 13, color: '#15803d' }}>
            <div style={{ fontWeight: 700 }}>✓ Invitation sent to {inviteResult.email}</div>
            <div style={{ marginTop: 6 }}>Temporary password: <code style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{inviteResult.tempPassword}</code></div>
            <div style={{ marginTop: 6, color: '#166534' }}>Please share these credentials securely.</div>
          </div>
        )}
      </Section>

      {/* SECTION 3 — MEMBERS */}
      <Section title="Team Members">
        {members.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 13, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            No team members yet.
          </div>
        ) : members.map(m => (
          <div key={m.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: roleColor(m.role), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {initials(m.firstName, m.lastName)}
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                {`${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email}
                {m.isCurrentUser && <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', background: '#eff6ff', color: '#2563eb', borderRadius: 8, fontWeight: 700 }}>YOU</span>}
              </div>
              <div style={{ marginTop: 2, color: '#64748b', fontSize: 12 }}>{m.email}</div>
              {rowMsg && rowMsg.id === m.id && (
                <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: rowMsg.ok ? '#16a34a' : '#dc2626' }}>{rowMsg.text}</div>
              )}
            </div>
            <span style={{ padding: '3px 10px', background: roleColor(m.role) + '18', color: roleColor(m.role), borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {roleLabel(m.role)}
            </span>
            <select
              value={m.role ?? 'JuniorAdvocate'}
              disabled={rowBusy === m.id}
              onChange={e => handleRoleChange(m.id, e.target.value)}
              style={{ ...inputStyle, width: 150, height: 36, fontSize: 12 }}
            >
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button
              onClick={() => handleRemove(m.id, `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email)}
              disabled={m.isCurrentUser || rowBusy === m.id}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid #fca5a5',
                background: 'transparent', color: '#dc2626', fontSize: 12, fontWeight: 600,
                fontFamily: 'inherit', flexShrink: 0,
                opacity: m.isCurrentUser ? 0.4 : 1,
                cursor: m.isCurrentUser || rowBusy === m.id ? 'not-allowed' : 'pointer',
              }}>
              Remove
            </button>
          </div>
        ))}
      </Section>

      {/* SECTION 4 — no save button; all changes are immediate API calls */}
      <p style={{ fontSize: 12, color: '#94a3b8' }}>
        Role changes and member removal take effect immediately. Removed members are deactivated — their case data is retained.
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>{title}</h3>
      {children}
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, background: '#fff' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 22, color: '#2563eb' }} />
      <div style={{ marginTop: 10, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{value ?? 0}</div>
      <div style={{ marginTop: 2, color: '#64748b', fontSize: 12 }}>{title}</div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit', color: '#0f172a' }
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const primaryButton: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '0 20px', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }
