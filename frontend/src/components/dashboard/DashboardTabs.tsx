'use client'

// ============================================================
// DASHBOARD TAB COMPONENTS
// All 5 tabs with full backend connectivity
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import {
  documentsApi,
  hearingsApi,
  actionPlansApi,
  researchApi,
  timelineApi,
} from '@/lib/api'

// ============================================================
// DOCUMENTS TAB
// ============================================================

export function DocumentsTab({ caseId }: { caseId: string }) {
  const [docs,     setDocs]     = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [uploading, setUploading] = useState(false)

  const load = useCallback(() => {
    if (!caseId) return
    setLoading(true)
    documentsApi.getByCaseId(caseId)
      .then(data => setDocs(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => { load() }, [load])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !caseId) return
    setUploading(true)
    try {
      await documentsApi.upload(caseId, file, 'General', '')
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId: string) {
    if (!caseId) return
    try {
      await documentsApi.remove(caseId, docId)
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function formatSize(bytes: number) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  function getIcon(type: string) {
    if (type?.includes('pdf'))   return '📄'
    if (type?.includes('image')) return '🖼️'
    if (type?.includes('word'))  return '📝'
    return '📁'
  }

  return (
    <div>
      {/* Upload Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>{docs.length} document{docs.length !== 1 ? 's' : ''} uploaded</div>
        <label style={{ padding: '6px 14px', background: '#3b82f6', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : '+ Upload'}
          <input type="file" style={{ display: 'none' }} onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
        </label>
      </div>

      {error && <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}

      {loading && <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading documents...</div>}

      {!loading && docs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontSize: 13 }}>No documents uploaded yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Click Upload to add case documents</div>
        </div>
      )}

      {!loading && docs.map(doc => (
        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 20 }}>{getIcon(doc.mimeType)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName ?? doc.name}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{doc.documentType} · {formatSize(doc.fileSize)} · {doc.exhibitLabel ? `Exhibit ${doc.exhibitLabel}` : 'No exhibit label'}</div>
          </div>
          <button
            onClick={() => handleDelete(doc.id)}
            style={{ padding: '3px 8px', fontSize: 10, borderRadius: 5, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// HEARINGS TAB
// ============================================================

export function HearingsTab({ caseId }: { caseId: string }) {
  const [hearings, setHearings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!caseId) return
    setLoading(true)
    hearingsApi.getByCaseId(caseId)
      .then(data => setHearings(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [caseId])

  return (
    <div>
      {error && <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading hearings...</div>}

      {!loading && hearings.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
          <div style={{ fontSize: 13 }}>No hearings recorded yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Go to Hearings page to add hearing records</div>
        </div>
      )}

      {!loading && hearings.map((h, i) => (
        <div key={h.id} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, marginBottom: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
              Hearing {hearings.length - i} — {new Date(h.hearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#1e40af', fontWeight: 600 }}>{h.stage}</span>
          </div>
          {h.whatHappened && <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>{h.whatHappened}</div>}
          {h.judgeObservation && (
            <div style={{ fontSize: 11, color: '#7c3aed', background: '#f5f3ff', padding: '4px 8px', borderRadius: 6, marginTop: 6 }}>
              <strong>Judge:</strong> {h.judgeObservation}
            </div>
          )}
          {h.orders?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {h.orders.map((o: any) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: o.done ? '#16a34a' : '#dc2626', marginTop: 4 }}>
                  <span>{o.done ? '✅' : '⏰'}</span>
                  <span>{o.text}</span>
                  {o.deadline && <span style={{ color: '#94a3b8' }}>· Due {new Date(o.deadline).toLocaleDateString('en-IN')}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// TASKS TAB
// ============================================================

export function TasksTab({ caseId }: { caseId: string }) {
  const [tasks,      setTasks]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!caseId) return
    setLoading(true)
    actionPlansApi.getByCaseId(caseId)
      .then(data => setTasks(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => { load() }, [load])

  async function toggleDone(task: any) {
    if (!caseId) return
    setUpdatingId(task.id)
    try {
      if (task.done) {
        await actionPlansApi.markUndone(caseId, task.id)
      } else {
        await actionPlansApi.markDone(caseId, task.id)
      }
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  function getPriorityColor(p: string) {
    if (p === 'High')   return { bg: '#fef2f2', clr: '#dc2626' }
    if (p === 'Medium') return { bg: '#fff7ed', clr: '#d97706' }
    return { bg: '#f0fdf4', clr: '#16a34a' }
  }

  const pending  = tasks.filter(t => !t.done)
  const done     = tasks.filter(t => t.done)

  return (
    <div>
      {error && <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading tasks...</div>}

      {!loading && tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 13 }}>No tasks yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Generate AI Strategy to create action plan</div>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Pending ({pending.length})</div>
          {pending.map(task => {
            const pc = getPriorityColor(task.priority)
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleDone(task)}
                  disabled={updatingId === task.id}
                  style={{ marginTop: 2, cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{task.title}</div>
                  {task.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{task.description}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: pc.bg, color: pc.clr, fontWeight: 600 }}>{task.priority}</span>
                    {task.dueBy && <span style={{ fontSize: 10, color: '#94a3b8' }}>Due {new Date(task.dueBy).toLocaleDateString('en-IN')}</span>}
                    {task.assignedTo && <span style={{ fontSize: 10, color: '#94a3b8' }}>· {task.assignedTo}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Completed ({done.length})</div>
          {done.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 6, border: '1px solid #bbf7d0', opacity: 0.8 }}>
              <input
                type="checkbox"
                checked={true}
                onChange={() => toggleDone(task)}
                disabled={updatingId === task.id}
                style={{ marginTop: 2, cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', textDecoration: 'line-through' }}>{task.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// RESEARCH TAB
// ============================================================

export function ResearchTab({ caseId }: { caseId: string }) {
  const [research, setResearch] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!caseId) return
    setLoading(true)
    researchApi.getByCaseId(caseId)
      .then(data => setResearch(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [caseId])

  function getStrengthColor(s: string) {
    if (s === 'High')   return { bg: '#f0fdf4', clr: '#16a34a' }
    if (s === 'Medium') return { bg: '#fff7ed', clr: '#d97706' }
    return { bg: '#fef2f2', clr: '#dc2626' }
  }

  return (
    <div>
      {error && <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading research...</div>}

      {!loading && research.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
          <div style={{ fontSize: 13 }}>No legal research yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Generate AI Strategy to add relevant judgments</div>
        </div>
      )}

      {!loading && research.map(r => {
        const sc = getStrengthColor(r.strength)
        return (
          <div key={r.id} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, marginBottom: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>{r.citation}</div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.clr, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.strength}</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{r.court} · {r.year}</div>
            {r.ratioDecidendi && <div style={{ fontSize: 12, color: '#334155', marginBottom: 4, lineHeight: 1.5 }}>{r.ratioDecidendi}</div>}
            {r.howToUse && (
              <div style={{ fontSize: 11, color: '#7c3aed', background: '#f5f3ff', padding: '4px 8px', borderRadius: 6, marginTop: 6 }}>
                <strong>Use:</strong> {r.howToUse}
              </div>
            )}
            {r.fullJudgmentUrl && (
              <a href={r.fullJudgmentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>
                View Judgment →
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// TIMELINE TAB
// ============================================================

export function TimelineTab({ caseId }: { caseId: string }) {
  const [events,  setEvents]  = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!caseId) return
    setLoading(true)
    timelineApi.getByCaseId(caseId)
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [caseId])

  function getCategoryColor(cat: string) {
    const map: Record<string, string> = {
      'Marriage':  '#7c3aed',
      'Violence':  '#dc2626',
      'Financial': '#d97706',
      'Court':     '#2563eb',
      'Other':     '#64748b',
    }
    return map[cat] ?? '#64748b'
  }

  return (
    <div>
      {error && <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading timeline...</div>}

      {!loading && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🕒</div>
          <div style={{ fontSize: 13 }}>No timeline events yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Generate AI Chronology to build case timeline</div>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: '#e2e8f0' }} />
          {events.map((e, i) => {
            const color = getCategoryColor(e.category)
            return (
              <div key={e.id} style={{ position: 'relative', marginBottom: 16, paddingLeft: 16 }}>
                <div style={{ position: 'absolute', left: -7, top: 4, width: 12, height: 12, borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${color}40` }} />
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color }}>
                      {e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                    {e.category && (
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: `${color}15`, color, fontWeight: 600 }}>{e.category}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{e.event}</div>
                  {e.legalSignificance && <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{e.legalSignificance}</div>}
                  {e.source && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Source: {e.source}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
