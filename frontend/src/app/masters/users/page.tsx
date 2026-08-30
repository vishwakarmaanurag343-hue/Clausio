'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import { getRole } from '@/lib/pagePermissions'

const ROLES = ['SuperAdmin', 'SeniorAdvocate', 'JuniorAdvocate', 'Clerk', 'Intern']

const ROLE_STYLE: Record<string, { bg: string; fg: string }> = {
  SuperAdmin:     { bg: '#eef2ff', fg: '#4f46e5' },
  SeniorAdvocate: { bg: '#eff6ff', fg: '#2563eb' },
  JuniorAdvocate: { bg: '#f0fdf4', fg: '#16a34a' },
  Clerk:          { bg: '#fffbeb', fg: '#d97706' },
  Intern:         { bg: '#f1f5f9', fg: '#64748b' },
}
const roleStyle = (r?: string) => ROLE_STYLE[r ?? ''] ?? { bg: '#f1f5f9', fg: '#64748b' }

interface UserRow {
  id: string
  firstName: string
  lastName: string
  email: string
  role?: string
  phone?: string
  isActive: boolean
  createdAt: string
}

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', role: 'JuniorAdvocate', isActive: true }

export default function UserMasterPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  // edit / create modal
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [tempPassword, setTempPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (getRole() !== 'SuperAdmin') router.replace('/dashboard')
    else setAuthorized(true)
  }, [router])

  const load = useCallback(() => {
    setLoading(true); setError('')
    adminApi.getUsers()
      .then((r: any) => setUsers(Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : []))
      .catch((e: any) => setError(e?.message || 'Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (authorized) load() }, [authorized, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      const matchesQ = !q ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      const matchesRole = !roleFilter || u.role === roleFilter
      return matchesQ && matchesRole
    })
  }, [users, search, roleFilter])

  function flash(msg: string) { setNotice(msg); setTimeout(() => setNotice(''), 3000) }

  function openEdit(u: UserRow) {
    setEditing(u); setCreating(false); setFormError('')
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone ?? '', role: u.role ?? 'JuniorAdvocate', isActive: u.isActive })
  }
  function openCreate() {
    setCreating(true); setEditing(null); setFormError(''); setTempPassword('')
    setForm({ ...emptyForm })
  }
  function closeModal() { setEditing(null); setCreating(false) }

  async function saveForm() {
    setSaving(true); setFormError('')
    try {
      if (creating) {
        if (!form.email.trim() || !tempPassword.trim()) { setFormError('Email and a temporary password are required.'); setSaving(false); return }
        await adminApi.createUser({
          firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(),
          phone: form.phone.trim() || undefined, role: form.role, tempPassword: tempPassword.trim(),
        })
        flash(`User ${form.email.trim()} created`)
      } else if (editing) {
        await adminApi.updateUser(editing.id, {
          firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(),
          phone: form.phone.trim(), role: form.role, isActive: form.isActive,
        })
        flash('User updated')
      }
      closeModal(); load()
    } catch (e: any) {
      setFormError(e?.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(u: UserRow) {
    setBusyId(u.id)
    try { await adminApi.updateUser(u.id, { isActive: !u.isActive }); load() }
    catch (e: any) { setError(e?.message || 'Update failed.') }
    finally { setBusyId(null) }
  }

  async function removeUser(u: UserRow) {
    if (!confirm(`Delete ${u.firstName} ${u.lastName} (${u.email})? This cannot be undone.`)) return
    setBusyId(u.id)
    try { await adminApi.deleteUser(u.id); flash('User deleted'); load() }
    catch (e: any) { setError(e?.message || 'Delete failed.') }
    finally { setBusyId(null) }
  }

  if (authorized === null) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Checking access…</div>
  }

  return (
    <div style={{ position: 'relative', flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: 48, fontFamily: 'Inter, sans-serif' }}>

      <button onClick={() => router.push('/dashboard')}
        style={{ position: 'absolute', top: 20, right: 24, padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-home" /> Dashboard
      </button>

      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>User Master</h1>
      <p style={{ margin: '4px 0 20px', fontSize: 13, color: '#64748b' }}>View, edit, activate and remove users.</p>

      {notice && <div style={{ marginBottom: 14, padding: '9px 13px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d' }}>{notice}</div>}
      {error && <div style={{ marginBottom: 14, padding: '9px 13px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{error}</div>}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
          style={{ flex: 1, minWidth: 220, padding: '9px 13px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '9px 13px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={openCreate}
          style={{ padding: '9px 16px', border: 'none', borderRadius: 10, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-plus" /> Add New User
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Name', 'Email', 'Role', 'Status', 'Phone', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No users found.</td></tr>}
            {filtered.map((u, i) => {
              const rs = roleStyle(u.role)
              return (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: busyId === u.id ? 0.5 : 1 }}>
                  <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f172a' }}>{u.firstName} {u.lastName}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b' }}>{u.email}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: rs.bg, color: rs.fg }}>{u.role || '—'}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => toggleActive(u)} disabled={busyId === u.id}
                      style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: u.isActive ? '#f0fdf4' : '#fef2f2', color: u.isActive ? '#15803d' : '#dc2626' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#64748b' }}>{u.phone || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(u)} title="Edit"
                        style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#334155', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                        <i className="ti ti-edit" />
                      </button>
                      <button onClick={() => removeUser(u)} title="Delete" disabled={busyId === u.id}
                        style={{ padding: '4px 10px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Edit / Create modal */}
      {(editing || creating) && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{creating ? 'Add New User' : 'Edit User'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="First Name"><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={inp} /></Field>
              <Field label="Last Name"><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={inp} /></Field>
            </div>
            <Field label="Email"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} /></Field>
            <Field label="Role">
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            {creating && (
              <Field label="Temporary Password">
                <input value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="Share this with the user" style={inp} />
              </Field>
            )}

            {!creating && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 4px', fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ width: 15, height: 15, accentColor: '#16a34a' }} />
                Active — user can sign in
              </label>
            )}

            {formError && <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12.5, color: '#dc2626' }}>{formError}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={saveForm} disabled={saving}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: saving ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving…' : creating ? 'Create User' : 'Save Changes'}
              </button>
              <button onClick={closeModal} style={{ padding: '10px 18px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginTop: 12 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>{label}</label>{children}</div>
}
const inp: React.CSSProperties = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }
