'use client'

// ============================================================
// NOTES TAB — plain fast note-taking, replacing pen and paper.
// No AI involved. Autosaves on blur; pinned notes float to top.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { notesApi } from '@/lib/api'

const TAG_COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777']

// Stable pastel per tag name
function tagColor(tag: string) {
  if (!tag) return '#64748b'
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_COLORS[h % TAG_COLORS.length]
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotesTab({ caseId }: { caseId: string }) {
  const [notes,     setNotes]     = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  // Quick-entry box
  const [quickTag,  setQuickTag]  = useState('')
  const [quickBody, setQuickBody] = useState('')
  const [savingQuick, setSavingQuick] = useState(false)

  // Inline edit
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [editBody,   setEditBody]   = useState('')
  const [copiedId,   setCopiedId]   = useState<string | null>(null)
  const [busyId,     setBusyId]     = useState<string | null>(null)

  const load = useCallback(() => {
    if (!caseId) return
    setLoading(true)
    notesApi.getByCaseId(caseId)
      .then(data => setNotes(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => {
    load()
    setQuickTag('')
    setQuickBody('')
    setEditingId(null)
  }, [load])

  // ── Create on blur: empty body is silently discarded ──
  async function saveQuick() {
    const body = quickBody.trim()
    if (!body || !caseId || savingQuick) return
    setSavingQuick(true)
    setError('')
    try {
      await notesApi.create(caseId, { tag: quickTag.trim(), body })
      setQuickTag('')
      setQuickBody('')
      load()
    } catch (err: any) {
      setError(err.message || 'Could not save the note.')
    } finally {
      setSavingQuick(false)
    }
  }

  // ── Inline edit: blur saves if changed ──
  async function saveEdit(id: string) {
    const body = editBody.trim()
    setEditingId(null)
    if (!body) return                       // don't wipe a note by blurring empty
    const current = notes.find(n => n.id === id)
    if (!current || current.body === body) return
    setBusyId(id)
    try {
      await notesApi.update(caseId, id, { body })
      load()
    } catch (err: any) {
      setError(err.message || 'Could not update the note.')
    } finally {
      setBusyId(null)
    }
  }

  async function togglePin(note: any) {
    setBusyId(note.id)
    try {
      await notesApi.update(caseId, note.id, { pinned: !note.pinned })
      load()
    } catch (err: any) {
      setError(err.message || 'Could not pin the note.')
    } finally {
      setBusyId(null)
    }
  }

  async function removeNote(id: string) {
    setBusyId(id)
    try {
      await notesApi.remove(caseId, id)
      if (editingId === id) setEditingId(null)
      load()
    } catch (err: any) {
      setError(err.message || 'Could not delete the note.')
    } finally {
      setBusyId(null)
    }
  }

  function copyNote(note: any) {
    const text = note.tag ? `[${note.tag}] ${note.body}` : note.body
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopiedId(note.id)
        setTimeout(() => setCopiedId(null), 1500)
      },
      () => setError('Clipboard unavailable in this browser.')
    )
  }

  const iconBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#94a3b8' } as const

  return (
    <div>
      {/* Quick-entry box — autosaves on blur */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <i className="ti ti-pencil" style={{ fontSize: 13, color: '#7c3aed' }} />
          <input
            value={quickTag}
            onChange={(e) => setQuickTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            placeholder="Tag (optional) — e.g. Hearing, Client call"
            maxLength={40}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', color: '#0f172a', background: 'transparent' }}
          />
        </div>
        <textarea
          rows={2}
          value={quickBody}
          onChange={(e) => setQuickBody(e.target.value)}
          onBlur={saveQuick}
          disabled={savingQuick}
          placeholder={savingQuick ? 'Saving…' : 'Jot a note… it saves when you click away'}
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.5, color: '#0f172a', background: 'transparent' }}
        />
      </div>

      {error && <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{error}</div>}

      {loading && <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading notes...</div>}

      {!loading && notes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗒️</div>
          <div style={{ fontSize: 13 }}>No notes yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Your pen-and-paper for this case starts here</div>
        </div>
      )}

      {/* Pinned first, then most recently edited — server already orders this */}
      {!loading && notes.map(note => {
        const editing = editingId === note.id
        return (
          <div key={note.id} style={{
            position: 'relative',
            background: '#f8fafc',
            border: `1px solid ${note.pinned ? '#fcd34d' : '#e2e8f0'}`,
            borderLeft: `3px solid ${note.pinned ? '#f59e0b' : 'transparent'}`,
            borderRadius: 10,
            padding: '10px 12px',
            marginBottom: 10,
            opacity: busyId === note.id ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: note.body ? 6 : 0 }}>
              {note.tag && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${tagColor(note.tag)}18`, color: tagColor(note.tag), textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {note.tag}
                </span>
              )}
              <span style={{ fontSize: 10, color: '#94a3b8' }}>
                {note.updatedAt !== note.createdAt ? 'Edited ' : ''}{timeAgo(note.updatedAt)}
              </span>
              <div style={{ flex: 1 }} />
              <button title={note.pinned ? 'Unpin' : 'Pin to top'} onClick={() => togglePin(note)} style={{ ...iconBtn, color: note.pinned ? '#f59e0b' : '#94a3b8' }}>
                <i className="ti ti-pin" />
              </button>
              <button title="Copy note" onClick={() => copyNote(note)} style={{ ...iconBtn, color: copiedId === note.id ? '#059669' : '#94a3b8' }}>
                <i className={copiedId === note.id ? 'ti ti-check' : 'ti ti-copy'} />
              </button>
              <button title="Edit note" onClick={() => { setEditingId(note.id); setEditBody(note.body) }} style={iconBtn}>
                <i className="ti ti-pencil" />
              </button>
              <button title="Delete note" onClick={() => removeNote(note.id)} style={{ ...iconBtn, color: '#dc2626' }}>
                <i className="ti ti-trash" />
              </button>
            </div>

            {editing ? (
              <textarea
                autoFocus
                rows={Math.min(8, Math.max(2, editBody.split('\n').length))}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                onBlur={() => saveEdit(note.id)}
                onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null) }}
                style={{ width: '100%', border: '1px solid #c7d2fe', outline: 'none', resize: 'vertical', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontFamily: 'inherit', lineHeight: 1.5, color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
              />
            ) : (
              <div
                onClick={() => { setEditingId(note.id); setEditBody(note.body) }}
                title="Click to edit"
                style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: 'text' }}
              >
                {note.body}
              </div>
            )}

            {copiedId === note.id && (
              <div style={{ position: 'absolute', top: -22, right: 8, fontSize: 10, fontWeight: 700, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 6, padding: '2px 8px' }}>
                Copied
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
