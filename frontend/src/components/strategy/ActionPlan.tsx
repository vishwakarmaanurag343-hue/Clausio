'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { actionPlansApi, aiApi, parseAiJson } from '@/lib/api'

interface Props { fullView?: boolean }

interface PlanTask {
  task?:                string
  dueRelativeToHearing?: string
  owner?:               string
  priority?:            string
  reason?:              string
}

const OWNER_STYLE: Record<string, { bg: string; fg: string; bd: string }> = {
  Advocate: { bg: '#eff6ff', fg: '#1d4ed8', bd: '#bfdbfe' },
  Client:   { bg: '#f0fdf4', fg: '#15803d', bd: '#bbf7d0' },
  Clerk:    { bg: '#f1f5f9', fg: '#475569', bd: '#e2e8f0' },
}
const PRIORITY_STYLE: Record<string, { bg: string; fg: string; bd: string }> = {
  High:   { bg: '#fef2f2', fg: '#dc2626', bd: '#fecaca' },
  Medium: { bg: '#fffbeb', fg: '#b45309', bd: '#fde68a' },
  Low:    { bg: '#f0fdf4', fg: '#15803d', bd: '#bbf7d0' },
}
function ownerOf(o?: string)    { return OWNER_STYLE[o ?? ''] ? o! : 'Advocate' }
function priorityOf(p?: string) { return PRIORITY_STYLE[p ?? ''] ? p! : 'Medium' }

/** Extract the tasks array + next hearing date. Returns null on ANY failure — callers must never render raw text. */
function extractPlan(raw: unknown): { nextHearingDate: string | null; tasks: PlanTask[] } | null {
  let parsed: any = raw
  if (typeof raw === 'string') {
    if (!raw.trim()) return null
    parsed = parseAiJson<any>(raw.trim())
  }
  const tasks = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.tasks) ? parsed.tasks : null
  if (!tasks) return null
  const clean = tasks.filter((t: any) => t && typeof t === 'object')
  return {
    nextHearingDate: !Array.isArray(parsed) && typeof parsed?.nextHearingDate === 'string' ? parsed.nextHearingDate : null,
    tasks: clean,
  }
}

export default function ActionPlan({ fullView = false }: Props) {
  const { selectedCaseId } = useCaseStore()
  const [actions,    setActions]    = useState<any[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showAdd,    setShowAdd]    = useState(false)
  const [filter,     setFilter]     = useState<'all'|'pending'|'done'>('pending')

  // AI working plan (flashcards) — separate from the saved checklist below
  const [plan,       setPlan]       = useState<{ nextHearingDate: string | null; tasks: PlanTask[] } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState('')
  const [savedCount, setSavedCount] = useState<number | null>(null)

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

  function generate() {
    if (!selectedCaseId || generating) return
    setGenerating(true); setGenError(''); setSavedCount(null)
    aiApi.getActionPlan(selectedCaseId)
      .then(res => {
        const parsed = extractPlan(res.actionPlan ?? res.result ?? res)
        if (parsed) setPlan(parsed)
        else setGenError('The AI response could not be read as plan cards. Please retry.')
      })
      .catch(err => setGenError(err.message || 'Failed to generate the working plan'))
      .finally(() => setGenerating(false))
  }

  async function saveAllToMyPlan() {
    if (!selectedCaseId || !plan?.tasks.length) return
    try {
      await Promise.all(plan.tasks.map(t => actionPlansApi.create(selectedCaseId, {
        title:       t.task ?? 'Action',
        description: t.reason ?? '',
        priority:    priorityOf(t.priority),
        assignedTo:  ownerOf(t.owner) === 'Clerk' ? 'Clerk' : ownerOf(t.owner),
      })))
      setSavedCount(plan.tasks.length)
      load()
    } catch { setGenError('Failed to save tasks to your plan.') }
  }

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
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(15,23,42,.04)', height: fullView ? 'auto' : '100%', overflowY: fullView ? 'visible' : 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Working Action Plan</h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>AI-built chamber plan for this case — Advocate / Client / Clerk tasks.</p>
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

      {/* ===================== AI WORKING PLAN (flashcards) ===================== */}
      {!plan && !generating && !genError && (
        <div style={{ textAlign: 'center', padding: 26, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, marginBottom: 20 }}>
          <i className="ti ti-gavel" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: '#94a3b8' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 6 }}>No AI plan generated yet</div>
          <div style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 14 }}>Builds a working plan against the real next hearing date.</div>
          <button onClick={generate} disabled={!selectedCaseId} style={{ padding: '9px 18px', background: selectedCaseId ? '#2563eb' : '#93c5fd', color: '#fff', border: 'none', borderRadius: 10, cursor: selectedCaseId ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
            <i className="ti ti-sparkles" style={{ marginRight: 6 }} />Generate with AI
          </button>
        </div>
      )}

      {generating && (
        <div style={{ textAlign: 'center', padding: 26, color: '#7c3aed', marginBottom: 20 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 26, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>AI is building your working plan...</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>This reads the full case file — usually under a minute</div>
        </div>
      )}

      {genError && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
          {genError} <button onClick={generate} style={{ marginLeft: 8, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      {plan && !generating && (
        <div style={{ marginBottom: 22 }}>
          {/* Next hearing strip + save all */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {plan.nextHearingDate && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 12px' }}>
                📅 Next hearing: {plan.nextHearingDate}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <button onClick={saveAllToMyPlan} style={{ height: 30, padding: '0 12px', border: '1px solid #86efac', borderRadius: 8, background: '#f0fdf4', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: '#15803d', fontFamily: 'inherit' }}>
              <i className="ti ti-download" style={{ fontSize: 12, marginRight: 4 }} />{savedCount !== null ? `Saved ${savedCount} ✓` : 'Save all to My Plan'}
            </button>
          </div>

          {plan.tasks.map((t, i) => {
            const own = OWNER_STYLE[ownerOf(t.owner)]
            const pri = PRIORITY_STYLE[priorityOf(t.priority)]
            return (
              <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#2563eb', marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#0f172a', lineHeight: 1.6 }}>{t.task || 'Untitled task'}</span>
                  </div>
                  <div style={{ display: 'flex', flexShrink: 0, gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: own.bg, border: `1px solid ${own.bd}`, color: own.fg }}>{ownerOf(t.owner)}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: pri.bg, border: `1px solid ${pri.bd}`, color: pri.fg }}>{priorityOf(t.priority)}</span>
                  </div>
                </div>

                {/* Due chip */}
                {t.dueRelativeToHearing && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '4px 10px', marginBottom: 8 }}>
                    <i className="ti ti-calendar-time" style={{ fontSize: 12 }} />⏳ {t.dueRelativeToHearing}
                  </div>
                )}

                {/* Why this matters now */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', letterSpacing: 1, marginBottom: 4 }}>WHY THIS MATTERS NOW</div>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-line' }}>{t.reason || '—'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===================== SAVED CHECKLIST (unchanged behaviour) ===================== */}

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
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Saved Tasks Yet</div>
          <div style={{ fontSize: 13 }}>Generate an AI plan above and “Save all to My Plan”, or add one manually.</div>
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
