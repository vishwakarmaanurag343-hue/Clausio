'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useCaseStore } from '@/lib/store'
import { notepadApi } from '@/lib/api'

const CATEGORIES = ['Hearing Notes', 'Research Notes', 'Client Instructions', 'General'] as const
type Category = typeof CATEGORIES[number]
type Tab = Category | 'All'

const TEMPLATES: { label: string; text: string }[] = [
  { label: 'Hearing Date', text: 'Hearing Date: ' },
  { label: 'Judge observed', text: 'Judge observed: ' },
  { label: 'Next steps', text: 'Next steps:\n- ' },
  { label: 'Client instruction', text: 'Client instruction: ' },
  { label: 'Citation to check', text: 'Citation to check: ' },
]

const OPEN_KEY = 'clausio_notes_panel_open'
const scopeKey = (caseId: string) => (caseId ? `clausio_notes_${caseId}` : 'clausio_notes_general')

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('clausio_token') || ''
}
function readScope(caseId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(scopeKey(caseId))
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function writeScope(caseId: string, data: Record<string, string>) {
  try { localStorage.setItem(scopeKey(caseId), JSON.stringify(data)) } catch { /* quota / private mode */ }
}

export default function FloatingNotes() {
  const pathname = usePathname()
  const { selectedCaseId, selectedCaseName } = useCaseStore()
  const scope = selectedCaseId || ''

  const [mounted, setMounted] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [tab, setTab] = useState<Tab>('General')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState('')
  const [copied, setCopied] = useState(false)

  const [allNotes, setAllNotes] = useState<any[]>([])
  const [allLoading, setAllLoading] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const category: Category = tab === 'All' ? 'General' : tab

  // ── mount + auth ────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)
    try { setOpen(localStorage.getItem(OPEN_KEY) === '1') } catch { /* ignore */ }
  }, [])
  useEffect(() => { setAuthed(!!getToken()) }, [pathname])
  useEffect(() => {
    if (mounted) { try { localStorage.setItem(OPEN_KEY, open ? '1' : '0') } catch { /* ignore */ } }
  }, [open, mounted])

  // ── load notes for the current scope (localStorage first, then backend) ──
  useEffect(() => {
    if (!mounted) return
    const local = readScope(scope)
    setNotes(local)
    setDirty({})
    setSavedAt('')

    if (!getToken()) return
    const req = scope ? notepadApi.getForCase(scope) : notepadApi.getGeneral()
    req.then((rows: any) => {
      if (!Array.isArray(rows) || rows.length === 0) return
      const localTs = local._savedAt ? Date.parse(local._savedAt) : 0
      const merged: Record<string, string> = { ...local }
      let changed = false
      for (const r of rows) {
        if (!r || typeof r.category !== 'string') continue
        const remoteTs = r.updatedAt ? Date.parse(r.updatedAt) : 0
        if (merged[r.category] === undefined || remoteTs > localTs) {
          if (merged[r.category] !== (r.content ?? '')) {
            merged[r.category] = r.content ?? ''
            changed = true
          }
        }
      }
      if (changed) { setNotes(merged); writeScope(scope, merged) }
    }).catch(() => { /* offline — localStorage already loaded */ })
  }, [scope, mounted])

  const loadAll = useCallback(() => {
    if (!getToken()) { setAllNotes([]); return }
    setAllLoading(true)
    notepadApi.getAll()
      .then((rows: any) => setAllNotes(Array.isArray(rows) ? rows : []))
      .catch(() => setAllNotes([]))
      .finally(() => setAllLoading(false))
  }, [])

  useEffect(() => { if (open && tab === 'All') loadAll() }, [open, tab, loadAll])

  // ── edits stay on the device until the lawyer clicks Save ───
  const applyChange = useCallback((val: string) => {
    const next = { ...notes, [category]: val, _savedAt: new Date().toISOString() }
    setNotes(next)
    writeScope(scope, next)                          // draft kept locally (survives refresh)
    setDirty(d => ({ ...d, [category]: true }))
  }, [notes, category, scope])

  const anyDirty = CATEGORIES.some(c => dirty[c])

  async function save() {
    if (!getToken()) { alert('Sign in to save your notes.'); return }
    setSaving(true)
    const cats = CATEGORIES.filter(c => dirty[c])
    const toSave = cats.length ? cats : [category]
    try {
      for (const c of toSave) {
        await notepadApi.save({ caseId: scope || undefined, category: c, content: notes[c] ?? '' })
      }
      setDirty({})
      setSavedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      alert('Could not save to the server. Your notes are still kept on this device.')
    } finally {
      setSaving(false)
    }
  }

  function insertTemplate(text: string) {
    const el = textareaRef.current
    const cur = notes[category] ?? ''
    if (el && el.selectionStart != null) {
      const s = el.selectionStart
      const e = el.selectionEnd ?? s
      applyChange(cur.slice(0, s) + text + cur.slice(e))
      requestAnimationFrame(() => { el.focus(); const p = s + text.length; el.setSelectionRange(p, p) })
    } else {
      applyChange(cur ? `${cur}\n${text}` : text)
    }
  }

  function copyCurrent() {
    const text = CATEGORIES.filter(c => (notes[c] ?? '').trim()).map(c => `━━ ${c} ━━\n${notes[c]}`).join('\n\n')
    navigator.clipboard.writeText(text || '(no notes)').then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    }).catch(() => { /* clipboard blocked */ })
  }

  function clearCurrent() {
    if ((notes[category] ?? '') === '') return
    if (!confirm(`Clear all "${category}" notes for ${scopeLabel}? You still need to press Save to sync this.`)) return
    applyChange('')
    textareaRef.current?.focus()
  }

  const scopeLabel = scope ? (selectedCaseName || 'this case') : 'General notes'
  const noteCount = useMemo(
    () => CATEGORIES.filter(c => (notes[c] ?? '').trim().length > 0).length,
    [notes]
  )

  if (!mounted || !authed) return null
  if (pathname === '/login' || pathname.startsWith('/auth')) return null

  // ── Floating button ────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Notes"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 998,
          width: 48, height: 48, borderRadius: '50%',
          background: '#0f172a', border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(15,23,42,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontFamily: 'inherit',
        }}
      >
        📝
        {noteCount > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, padding: '0 4px',
            borderRadius: 9, background: anyDirty ? '#d97706' : '#2563eb', color: '#fff', fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
          }}>
            {noteCount}
          </span>
        )}
      </button>
    )
  }

  // ── Panel ──────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 998,
        width: 360, height: minimized ? 'auto' : 480,
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
        boxShadow: '0 16px 48px rgba(15,23,42,0.22)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: minimized ? 'none' : '1px solid #f1f5f9', background: '#f8fafc' }}>
        <span style={{ fontSize: 16 }}>📝</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Notes</div>
          <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {scope ? <><i className="ti ti-folder" style={{ fontSize: 10, marginRight: 3 }} />{scopeLabel}</> : 'General notes'}
          </div>
        </div>
        <button onClick={() => setMinimized(m => !m)} title={minimized ? 'Expand' : 'Minimize'} style={iconBtn}>
          {minimized ? '▢' : '—'}
        </button>
        <button onClick={() => setOpen(false)} title="Close" style={iconBtn}>×</button>
      </div>

      {!minimized && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: '10px 12px 6px', flexWrap: 'wrap' }}>
            {[...CATEGORIES, 'All' as const].map(c => {
              const active = c === tab
              const has = c !== 'All' && (notes[c] ?? '').trim().length > 0
              const isDirty = c !== 'All' && dirty[c]
              return (
                <button key={c} onClick={() => setTab(c)}
                  style={{
                    padding: '4px 9px', borderRadius: 14, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
                    border: `1px solid ${active ? '#2563eb' : '#e2e8f0'}`,
                    background: active ? '#eff6ff' : '#f8fafc',
                    color: active ? '#1d4ed8' : '#475569',
                  }}>
                  {c === 'All' ? '📋 All' : c}{isDirty ? ' •' : has ? ' ·' : ''}
                </button>
              )
            })}
          </div>

          {tab === 'All' ? (
            /* ── All saved notes (reference view) ── */
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 10px' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>All notes you have saved</span>
                <button onClick={loadAll} style={{ ...footerBtn, padding: '3px 8px' }}>
                  <i className={`ti ${allLoading ? 'ti-loader animate-spin' : 'ti-refresh'}`} style={{ fontSize: 12 }} /> Refresh
                </button>
              </div>
              {allLoading && allNotes.length === 0 && (
                <div style={{ fontSize: 12, color: '#94a3b8', padding: '20px 0', textAlign: 'center' }}>Loading…</div>
              )}
              {!allLoading && allNotes.length === 0 && (
                <div style={{ fontSize: 12, color: '#94a3b8', padding: '20px 0', textAlign: 'center' }}>
                  Nothing saved yet. Type a note and press <strong>Save</strong>.
                </div>
              )}
              {allNotes.map(n => (
                <div key={n.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 11px', marginBottom: 8, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>
                      {n.caseName || 'General'} · <span style={{ color: '#64748b', fontWeight: 600 }}>{n.category}</span>
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                      {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto' }}>
                    {n.content}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(n.content).catch(() => {})}
                    style={{ ...footerBtn, marginTop: 6, padding: '2px 8px', fontSize: 10 }}>
                    <i className="ti ti-copy" style={{ fontSize: 11 }} /> Copy
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Quick templates */}
              <div style={{ display: 'flex', gap: 4, padding: '4px 12px 8px', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9' }}>
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => insertTemplate(t.text)}
                    style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#475569',
                    }}>
                    + {t.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={notes[category] ?? ''}
                onChange={e => applyChange(e.target.value)}
                placeholder={`Type your ${category.toLowerCase()} here — then press Save`}
                style={{
                  flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none',
                  padding: '12px 14px', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6,
                  color: '#0f172a', background: '#fff', boxSizing: 'border-box',
                }}
              />

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: anyDirty ? '#d97706' : savedAt ? '#16a34a' : '#94a3b8' }}>
                  {anyDirty ? 'Unsaved changes' : savedAt ? `Saved ✓ ${savedAt}` : 'No changes'}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={copyCurrent} style={footerBtn} title="Copy all notes">
                    <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: 12 }} />
                  </button>
                  <button onClick={clearCurrent} style={{ ...footerBtn, color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }} title="Clear this category">
                    <i className="ti ti-eraser" style={{ fontSize: 12 }} />
                  </button>
                  <button
                    onClick={save}
                    disabled={saving || !anyDirty}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 7,
                      border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                      background: saving || !anyDirty ? '#cbd5e1' : '#2563eb', color: '#fff',
                      cursor: saving || !anyDirty ? 'not-allowed' : 'pointer',
                    }}>
                    <i className={`ti ${saving ? 'ti-loader animate-spin' : 'ti-device-floppy'}`} style={{ fontSize: 13 }} />
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer',
  color: '#64748b', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center',
  justifyContent: 'center', borderRadius: 6, fontFamily: 'inherit', lineHeight: 1,
}
const footerBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 7,
  border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer',
  fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
}
