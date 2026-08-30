'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import { getRole, PAGE_SECTIONS } from '@/lib/pagePermissions'

interface UserRow { id: string; firstName: string; lastName: string; email: string; role?: string }

export default function RolesMasterPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  const [users, setUsers] = useState<UserRow[]>([])
  const [userId, setUserId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loadingPerms, setLoadingPerms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (getRole() !== 'SuperAdmin') router.replace('/dashboard')
    else setAuthorized(true)
  }, [router])

  useEffect(() => {
    if (!authorized) return
    adminApi.getUsers()
      .then((r: any) => setUsers(Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : []))
      .catch((e: any) => setError(e?.message || 'Failed to load users.'))
  }, [authorized])

  const loadPerms = useCallback((id: string) => {
    if (!id) { setSelected(new Set()); return }
    setLoadingPerms(true); setError(''); setNotice('')
    adminApi.getPermissions(id)
      .then((r: any) => {
        const keys: string[] = Array.isArray(r?.pageKeys) ? r.pageKeys : []
        // No rows configured yet → default to "everything allowed" so the admin sees the current effective state.
        setSelected(keys.length === 0
          ? new Set(PAGE_SECTIONS.flatMap(s => s.pages.map(p => p.key)))
          : new Set(keys))
      })
      .catch((e: any) => setError(e?.message || 'Failed to load permissions.'))
      .finally(() => setLoadingPerms(false))
  }, [])

  function onSelectUser(id: string) {
    setUserId(id)
    loadPerms(id)
  }

  function toggle(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  function setSection(pages: { key: string }[], on: boolean) {
    setSelected(prev => {
      const next = new Set(prev)
      pages.forEach(p => on ? next.add(p.key) : next.delete(p.key))
      return next
    })
  }

  async function save() {
    if (!userId) return
    setSaving(true); setError(''); setNotice('')
    try {
      await adminApi.savePermissions(userId, Array.from(selected))
      const u = users.find(x => x.id === userId)
      setNotice(`Permissions saved for ${u ? `${u.firstName} ${u.lastName}` : 'user'}`)
      setTimeout(() => setNotice(''), 4000)
    } catch (e: any) {
      setError(e?.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const selectedUser = users.find(u => u.id === userId)

  if (authorized === null) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Checking access…</div>
  }

  return (
    <div style={{ position: 'relative', flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', padding: '24px', paddingBottom: 48, fontFamily: 'Inter, sans-serif' }}>

      <button onClick={() => router.push('/dashboard')}
        style={{ position: 'absolute', top: 20, right: 24, padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-home" /> Dashboard
      </button>

      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Roles Master</h1>
      <p style={{ margin: '4px 0 20px', fontSize: 13, color: '#64748b' }}>Choose which sidebar pages each user can open. SuperAdmins always see everything.</p>

      {notice && <div style={{ marginBottom: 14, padding: '9px 13px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d' }}>{notice}</div>}
      {error && <div style={{ marginBottom: 14, padding: '9px 13px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{error}</div>}

      {/* Step 1 — user selector */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Select User</label>
        <select value={userId} onChange={e => onSelectUser(e.target.value)}
          style={{ width: '100%', maxWidth: 460, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: '#f8fafc', outline: 'none' }}>
          <option value="">— Choose a user —</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.role || 'No role'} ({u.email})</option>
          ))}
        </select>
      </div>

      {/* Step 2 — checklist */}
      {userId && (
        <>
          {loadingPerms ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading permissions…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {selectedUser?.role === 'SuperAdmin' && (
                <div style={{ padding: '10px 13px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, fontSize: 12.5, color: '#4f46e5' }}>
                  This user is a SuperAdmin and can access every page regardless of what is checked here.
                </div>
              )}
              {PAGE_SECTIONS.map(sec => {
                const allOn = sec.pages.every(p => selected.has(p.key))
                return (
                  <div key={sec.section} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                        {sec.section}{sec.superAdminOnly ? ' (SuperAdmin only)' : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setSection(sec.pages, true)} disabled={allOn}
                          style={pillBtn(allOn)}>Select all</button>
                        <button onClick={() => setSection(sec.pages, false)}
                          style={pillBtn(false)}>Deselect all</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                      {sec.pages.map(p => (
                        <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: selected.has(p.key) ? '#eff6ff' : '#f8fafc', cursor: 'pointer', fontSize: 13, color: '#0f172a' }}>
                          <input type="checkbox" checked={selected.has(p.key)} onChange={() => toggle(p.key)} style={{ width: 15, height: 15, accentColor: '#2563eb' }} />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Step 3 — save */}
              <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, #fff 60%, transparent)', paddingTop: 12 }}>
                <button onClick={save} disabled={saving}
                  style={{ padding: '11px 22px', border: 'none', borderRadius: 10, background: saving ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className={`ti ${saving ? 'ti-loader animate-spin' : 'ti-device-floppy'}`} />
                  {saving ? 'Saving…' : 'Save Permissions'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const pillBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '3px 10px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff',
  color: disabled ? '#cbd5e1' : '#475569', fontSize: 11, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
})
