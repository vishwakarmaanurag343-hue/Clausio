'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { actionPlansApi } from '@/lib/api'

interface Props { fullView?: boolean }

export default function ActionPlan({ fullView = false }: Props) {
  const { selectedCaseId } = useCaseStore()
  const [actions,    setActions]    = useState<any[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showAdd,    setShowAdd]    = useState(false)
  const [filter,     setFilter]     = useState<'all'|'pending'|'done'>('pending')

  // Add form
  const [newTitle,    setNewTitle]    = useState('')
  const [newDesc,     setNewDesc]     = useState('')
  const [newPriority, setNewPriority] = useState('High')
  const [newDue,      setNewDue]      = useState('')
  const [saving,      setSaving]      = useState(false)

  const load = useCallback(() => {
    if (!selectedCaseId) return
    setLoading(true); setError('')
    actionPlansApi.getByCaseId(selectedCaseId)
      .then(data => setActions(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedCaseId])

  useEffect(() => { load() }, [load])

  async function markComplete(id: string) {
    if (!selectedCaseId) return
    setUpdatingId(id)
    try { await actionPlansApi.markDone(selectedCaseId, id); load() }
    catch { } finally { setUpdatingId(null) }
  }

  async function deleteAction(id: string) {
    if (!selectedCaseId || !confirm('Delete this action?')) return
    try { await actionPlansApi.remove(selectedCaseId, id); load() }
    catch { setError('Failed to delete') }
  }

  async function addAction() {
    if (!selectedCaseId || !newTitle.trim()) return
    setSaving(true)
    try {
      await actionPlansApi.create(selectedCaseId, {
        title: newTitle, description: newDesc,
        priority: newPriority, dueBy: newDue || undefined, assignedTo: 'Lawyer',
      })
      setNewTitle(''); setNewDesc(''); setNewPriority('High'); setNewDue('')
      setShowAdd(false); load()
    } catch { setError('Failed to add') } finally { setSaving(false) }
  }

  function exportAll() {
    const text = filtered.map((a, i) =>
      `${i + 1}. [${a.priority}] ${a.title}\n   ${a.description}\n   Due: ${a.dueBy ? new Date(a.dueBy).toLocaleDateString('en-IN') : 'Before Next Hearing'}\n   Status: ${a.done ? 'Done' : 'Pending'}`
    ).join('\n\n')
    navigator.clipboard.writeText(`30-Day Action Plan\n\n${text}`)
  }

  function pc(p: string) {
    if (p === 'High' || p === 'Critical') return { clr: '#dc2626', bg: '#fef2f2' }
    if (p === 'Medium') return { clr: '#d97706', bg: '#fff7ed' }
    return { clr: '#16a34a', bg: '#f0fdf4' }
  }

  const filtered = actions.filter(a =>
    filter === 'all' ? true : filter === 'done' ? a.done : !a.done
  )
  const doneCount    = actions.filter(a => a.done).length
  const pendingCount = actions.filter(a => !a.done).length
  const completePct  = actions.length > 0 ? Math.round((doneCount / actions.length) * 100) : 0

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(15,23,42,.04)', height: fullView ? 'auto' : '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>30-Day Action Plan</h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>AI-generated tasks for this case.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {actions.length > 0 && (
            <button onClick={exportAll} style={{ height: 34, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-copy" style={{ fontSize: 13 }} />Copy All
            </button>
          )}
          <button onClick={() => setShowAdd(s => !s)} style={{ height: 34, padding: '0 12px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} />Add Task
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {actions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
            <span><strong style={{ color: '#16a34a' }}>{doneCount} done</strong> · {pendingCount} pending</span>
            <span style={{ fontWeight: 700, color: completePct >= 70 ? '#16a34a' : '#d97706' }}>{completePct}% complete</span>
          </div>
          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completePct}%`, background: completePct >= 70 ? '#16a34a' : '#f59e0b', borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['pending','all','done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '4px 12px', border: `1px solid ${filter === f ? '#2563eb' : '#e2e8f0'}`, borderRadius: 20, background: filter === f ? '#2563eb' : '#fff', color: filter === f ? '#fff' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div style={{ background: '#f8fafc', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 12, fontSize: 13 }}>Add Manual Task</div>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title *" style={inp} />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description" rows={2} style={{ ...inp, resize: 'none', height: 'auto', padding: '8px 12px', marginTop: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={inp}>
              {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
            </select>
            <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Cancel</button>
            <button onClick={addAction} disabled={saving || !newTitle.trim()} style={{ flex: 2, padding: '8px', border: 'none', borderRadius: 8, background: saving ? '#93c5fd' : '#2563eb', color: '#fff', cursor: saving || !newTitle.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 12 }}>
              {saving ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </div>
      )}

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>Loading...</div>}

      {!loading && actions.length === 0 && (
        <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
          <i className="ti ti-list-check" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Tasks Yet</div>
          <div style={{ fontSize: 13 }}>Click Run AI Strategy to generate tasks, or add manually above.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(item => {
          const p = pc(item.priority)
          return (
            <div key={item.id} style={{ display: 'flex', gap: 14, border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: item.done ? '#f8fafc' : '#fff', opacity: item.done ? 0.7 : 1, transition: 'all 0.2s' }}>
              <input type="checkbox" checked={!!item.done} onChange={() => !item.done && markComplete(item.id)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, color: item.done ? '#94a3b8' : '#0f172a', fontSize: 14, textDecoration: item.done ? 'line-through' : 'none', flex: 1, marginRight: 8 }}>
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, color: p.clr, background: p.bg }}>{item.priority}</span>
                    <button onClick={() => deleteAction(item.id)} style={{ width: 24, height: 24, border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ti ti-trash" style={{ fontSize: 11, color: '#dc2626' }} />
                    </button>
                  </div>
                </div>
                {item.description && <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{item.description}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#2563eb', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ti ti-calendar" style={{ fontSize: 12 }} />
                    {item.dueBy ? new Date(item.dueBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Before Next Hearing'}
                  </span>
                  {!item.done && (
                    <button onClick={() => markComplete(item.id)} disabled={updatingId === item.id}
                      style={{ height: 28, padding: '0 10px', border: '1px solid #86efac', borderRadius: 6, background: '#f0fdf4', cursor: updatingId === item.id ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700, color: '#15803d', fontFamily: 'inherit' }}>
                      {updatingId === item.id ? 'Saving...' : '✓ Done'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }
