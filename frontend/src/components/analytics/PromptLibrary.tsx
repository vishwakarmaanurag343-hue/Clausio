'use client'

import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, promptReferenceApi } from '@/lib/api'
import AIResponseFormatter from '@/components/common/AIResponseFormatter'

const REF_DOC_TYPES = [
  'Maintenance Application', 'Bail Application', 'Plaint / Suit', 'Written Statement',
  'Writ Petition', 'Appeal', 'Other',
]

// ── Built-in prompts ──────────────────────────────────────────────
const BUILT_IN = [
  {
    category: 'Case Analysis',
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    items: [
      { id: 'summary',        icon: '📄', title: 'Full Case Summary',     desc: 'Complete brief for Senior Counsel — parties, strengths, weaknesses, strategy.' },
      { id: 'contradictions', icon: '⚠️', title: 'Find Contradictions',   desc: 'Forensic analysis of inconsistencies between claims, statements and documents.' },
      { id: 'chronology',     icon: '📅', title: 'Build Timeline',        desc: 'Court-ready chronological timeline with dates, events and legal significance.' },
    ]
  },
  {
    category: 'Legal Research',
    color: '#15803d', bg: '#f0fdf4', border: '#86efac',
    items: [
      { id: 'research',  icon: '⚖️', title: 'Find Binding Judgments',  desc: 'SC and HC judgments with ratio decidendi and how to use in court.' },
      { id: 'financial', icon: '💰', title: 'Financial Analysis',       desc: 'Maintenance calculation using Rajnesh v. Neha standard with settlement range.' },
    ]
  },
  {
    category: 'Hearing Preparation',
    color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd',
    items: [
      { id: 'prep',      icon: '🎯', title: 'Hearing Prep Brief',   desc: 'Complete day-of brief with opening submission, arguments and documents.' },
      { id: 'readiness', icon: '🛡️', title: 'Readiness Check',      desc: 'Audit of case readiness with score, gaps and what to fix before hearing.' },
      { id: 'witness',   icon: '👥', title: 'Witness Intelligence', desc: 'Credibility scores, preparation tips and cross-examination questions per witness.' },
    ]
  },
  {
    category: 'Action & Planning',
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    items: [
      { id: 'actionplan', icon: '✅', title: '30-Day Action Plan', desc: 'Prioritised task list with deadlines, assignments and legal basis for each action.' },
    ]
  },
]

// ── Custom prompt storage ─────────────────────────────────────────
const CUSTOM_KEY = 'clausio_custom_prompts'

interface CustomPrompt {
  id:       string
  title:    string
  prompt:   string
  category: string
  createdAt: string
}

function loadCustomPrompts(): CustomPrompt[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]') } catch { return [] }
}

function saveCustomPrompts(prompts: CustomPrompt[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(prompts))
}

interface Result { promptId: string; output: string; title: string; time: string; styledAs?: string }

export default function PromptLibrary() {
  const { selectedCaseId } = useCaseStore()
  const [loading,        setLoading]        = useState<string | null>(null)
  const [result,         setResult]         = useState<Result | null>(null)
  const [error,          setError]          = useState('')
  const [search,         setSearch]         = useState('')
  const [copied,         setCopied]         = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customPrompts,  setCustomPrompts]  = useState<CustomPrompt[]>([])
  const [editingId,      setEditingId]      = useState<string | null>(null)

  // Custom form state
  const [customTitle,    setCustomTitle]    = useState('')
  const [customPrompt,   setCustomPrompt]   = useState('')
  const [customCategory, setCustomCategory] = useState('My Firm')

  // ── Reference (style) documents ──
  const [refDocs,       setRefDocs]       = useState<any[]>([])
  const [selectedRefId, setSelectedRefId] = useState<string>('')
  const [showRefUpload, setShowRefUpload] = useState(false)
  const [refTitle,      setRefTitle]      = useState('')
  const [refType,       setRefType]       = useState(REF_DOC_TYPES[0])
  const [refFile,       setRefFile]       = useState<File | null>(null)
  const [refUploading,  setRefUploading]  = useState(false)
  const [refError,      setRefError]      = useState('')

  function loadRefDocs() {
    promptReferenceApi.getAll()
      .then((d: any) => setRefDocs(Array.isArray(d) ? d : []))
      .catch(() => setRefDocs([]))
  }

  useEffect(() => {
    setCustomPrompts(loadCustomPrompts())
    loadRefDocs()
  }, [])

  async function uploadRefDoc() {
    if (!refFile || !refTitle.trim()) { setRefError('Give it a title and pick a file.'); return }
    setRefUploading(true); setRefError('')
    try {
      const res = await promptReferenceApi.upload(refFile, refTitle.trim(), refType)
      setShowRefUpload(false)
      setRefTitle(''); setRefFile(null); setRefType(REF_DOC_TYPES[0])
      loadRefDocs()
      if (res?.id) setSelectedRefId(res.id)
    } catch (e: any) {
      setRefError(e?.message || 'Upload failed.')
    } finally {
      setRefUploading(false)
    }
  }

  async function deleteRefDoc(id: string) {
    if (!confirm('Delete this reference document?')) return
    try {
      await promptReferenceApi.delete(id)
      if (selectedRefId === id) setSelectedRefId('')
      loadRefDocs()
    } catch { /* ignore */ }
  }

  const selectedRef = refDocs.find(d => d.id === selectedRefId)

  // ── Run built-in prompt ──────────────────────────────────────────
  async function runBuiltIn(promptId: string, title: string) {
    if (!selectedCaseId) { setError('Please select a case from the dashboard first.'); return }
    setLoading(promptId); setError(''); setResult(null)
    try {
      const ref = selectedRefId || undefined
      let res: any
      switch (promptId) {
        case 'summary':        res = await aiApi.getSummary(selectedCaseId, undefined, ref); break
        case 'contradictions': res = await aiApi.getContradictions(selectedCaseId, ref);     break
        case 'chronology':     res = await aiApi.getChronology(selectedCaseId, ref);         break
        case 'research':       res = await aiApi.getLegalResearch(selectedCaseId, ref);      break
        case 'financial':      res = await aiApi.getFinancial(selectedCaseId, undefined, ref); break
        case 'prep':           res = await aiApi.getPrep(selectedCaseId, ref);               break
        case 'readiness':      res = await aiApi.getReadiness(selectedCaseId, ref);          break
        case 'witness':        res = await aiApi.getWitness(selectedCaseId, {}, ref);        break
        case 'actionplan':     res = await aiApi.getActionPlan(selectedCaseId, ref);         break
        default: return
      }
      const raw = res.summary ?? res.contradictions ?? res.chronology ?? res.judgments ??
                  res.analysis ?? res.brief ?? res.readiness ?? res.intelligence ??
                  res.actionPlan ?? res.result ?? ''
      setResult({ promptId, output: raw, title, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), styledAs: selectedRef?.title })
      saveHistory(title, raw)
    } catch (err: any) {
      setError(err.message || 'Failed to run prompt.')
    } finally { setLoading(null) }
  }

  // ── Run custom prompt ────────────────────────────────────────────
  async function runCustom(cp: CustomPrompt) {
    if (!selectedCaseId) { setError('Please select a case from the dashboard first.'); return }
    setLoading(cp.id); setError(''); setResult(null)
    try {
      const res = await aiApi.chat({ message: cp.prompt, caseId: selectedCaseId }, selectedRefId || undefined)
      const raw = res.response ?? res.result ?? ''
      setResult({ promptId: cp.id, output: raw, title: cp.title, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), styledAs: selectedRef?.title })
      saveHistory(cp.title, raw)
    } catch (err: any) {
      setError(err.message || 'Failed to run custom prompt.')
    } finally { setLoading(null) }
  }

  function saveHistory(query: string, response: string) {
    const stored = JSON.parse(localStorage.getItem('clausio_ai_history') || '[]')
    stored.unshift({ query: `Prompt: ${query}`, response, time: new Date().toISOString(), caseId: selectedCaseId })
    localStorage.setItem('clausio_ai_history', JSON.stringify(stored.slice(0, 100)))
  }

  // ── Save custom prompt ───────────────────────────────────────────
  function saveCustom() {
    if (!customTitle.trim() || !customPrompt.trim()) return
    const updated = editingId
      ? customPrompts.map(p => p.id === editingId ? { ...p, title: customTitle, prompt: customPrompt, category: customCategory } : p)
      : [...customPrompts, { id: Date.now().toString(), title: customTitle, prompt: customPrompt, category: customCategory, createdAt: new Date().toISOString() }]
    setCustomPrompts(updated)
    saveCustomPrompts(updated)
    setCustomTitle(''); setCustomPrompt(''); setCustomCategory('My Firm')
    setShowCustomForm(false); setEditingId(null)
  }

  function editCustom(cp: CustomPrompt) {
    setCustomTitle(cp.title); setCustomPrompt(cp.prompt); setCustomCategory(cp.category)
    setEditingId(cp.id); setShowCustomForm(true)
  }

  function deleteCustom(id: string) {
    const updated = customPrompts.filter(p => p.id !== id)
    setCustomPrompts(updated); saveCustomPrompts(updated)
  }

  function copyResult() {
    if (!result) return
    navigator.clipboard.writeText(result.output)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── Search ───────────────────────────────────────────────────────
  const allBuiltIn = BUILT_IN.flatMap(cat => cat.items.map(item => ({ ...item, category: cat.category, color: cat.color, bg: cat.bg, border: cat.border })))
  const filtered   = search ? allBuiltIn.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase())) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>

      {/* LEFT — Prompt list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Prompt Library</h2>
            <p style={{ marginTop: 3, color: '#64748b', fontSize: 13 }}>Click any prompt to run on your selected case.</p>
          </div>
          <button onClick={() => { setShowCustomForm(true); setEditingId(null); setCustomTitle(''); setCustomPrompt(''); setCustomCategory('My Firm') }}
            style={{ padding: '8px 14px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            + Custom Prompt
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts..."
            style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, paddingLeft: 38, paddingRight: 14, fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {/* ── My Firm's Reference Documents ── */}
        <div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>📁 My Firm's Reference Documents</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>AI will match your firm's writing style, structure and prayer format.</div>
            </div>
            <button type="button" onClick={() => { setShowRefUpload(true); setRefError('') }}
              style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 8, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Upload Reference Document
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: `1px solid ${selectedRefId === '' ? '#2563eb' : '#e2e8f0'}`, background: selectedRefId === '' ? '#eff6ff' : '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#0f172a' }}>
              <input type="radio" checked={selectedRefId === ''} onChange={() => setSelectedRefId('')} style={{ accentColor: '#2563eb' }} />
              No reference (use default Clausio style)
            </label>
            {refDocs.map(d => {
              const on = selectedRefId === d.id
              return (
                <div key={d.id} style={{ border: `1px solid ${on ? '#2563eb' : '#e2e8f0'}`, background: on ? '#eff6ff' : '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <input type="radio" checked={on} onChange={() => setSelectedRefId(d.id)} style={{ marginTop: 3, accentColor: '#2563eb' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>📄 {d.title || d.fileName}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: '#dbeafe', color: '#1e40af' }}>{d.docType}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                        {d.fileName} · Added {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </div>
                      {on && d.preview && (
                        <div style={{ fontSize: 11.5, color: '#0369a1', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>
                          "{d.preview}" — AI will match this document's style
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => deleteRefDoc(d.id)}
                      style={{ flexShrink: 0, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>Delete</button>
                  </div>
                </div>
              )
            })}
            {refDocs.length === 0 && (
              <div style={{ fontSize: 12, color: '#94a3b8', padding: '4px 2px' }}>No reference documents yet. Upload your firm's petition/plaint to get output in your style.</div>
            )}
          </div>
        </div>

        {error && <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{error}</div>}

        {/* Upload reference modal */}
        {showRefUpload && (
          <div onClick={() => setShowRefUpload(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px', zIndex: 1000 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 460, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Upload Reference Document</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>AI reads this and copies its style, format and language.</div>

              <label style={labelSt}>What is this document?</label>
              <input value={refTitle} onChange={e => setRefTitle(e.target.value)} placeholder="e.g. Our Firm's Maintenance Application" style={inputSt} />

              <label style={{ ...labelSt, marginTop: 12 }}>Document Type</label>
              <select value={refType} onChange={e => setRefType(e.target.value)} style={inputSt}>
                {REF_DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <label style={{ ...labelSt, marginTop: 12 }}>File (PDF, DOCX, TXT · max 10MB)</label>
              <input type="file" accept=".pdf,.docx,.txt" onChange={e => setRefFile(e.target.files?.[0] ?? null)}
                style={{ ...inputSt, padding: '8px 10px' }} />

              {refError && <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12.5, color: '#dc2626' }}>{refError}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={uploadRefDoc} disabled={refUploading}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: refUploading ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: refUploading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {refUploading ? 'Extracting text…' : 'Upload'}
                </button>
                <button onClick={() => setShowRefUpload(false)}
                  style={{ padding: '10px 18px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Custom prompt form */}
        {showCustomForm && (
          <div style={{ marginBottom: 20, padding: 18, background: '#f8fafc', border: '2px solid #2563eb', borderRadius: 14 }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>
              {editingId ? 'Edit Custom Prompt' : 'Add Custom Prompt for Your Law Firm'}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelSt}>Prompt Name</label>
              <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="e.g. My Firm's Maintenance Strategy" style={inputSt} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelSt}>Category</label>
              <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="e.g. My Firm, Family Law, Criminal" style={inputSt} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Prompt Instructions</label>
              <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={5}
                placeholder={`Write exactly what you want the AI to do for your law firm.\n\nExample:\n"Analyse this case from the perspective of a family court advocate practicing in Mumbai. Focus on section 125 CrPC maintenance strategy. Always cite 3 binding Supreme Court judgments. Format as a structured brief I can hand to my senior."`}
                style={{ ...inputSt, height: 'auto', resize: 'vertical', padding: '10px 12px' }} />
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#1d4ed8', lineHeight: 1.6 }}>
              💡 Tip: You can specify your preferred output format, citation style, language (Hindi/English), court type, and any firm-specific strategy you want the AI to follow every time.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowCustomForm(false); setEditingId(null) }} style={{ flex: 1, padding: '9px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
              <button onClick={saveCustom} disabled={!customTitle.trim() || !customPrompt.trim()} style={{ flex: 2, padding: '9px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13, opacity: !customTitle.trim() || !customPrompt.trim() ? 0.5 : 1 }}>
                {editingId ? 'Save Changes' : 'Save Prompt'}
              </button>
            </div>
          </div>
        )}

        {/* My Firm's Custom Prompts */}
        {customPrompts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>⭐ My Firm's Custom Prompts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customPrompts.map(cp => (
                <div key={cp.id} style={{ border: '1.5px solid #a5b4fc', borderRadius: 12, padding: '14px 16px', background: '#eef2ff', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{cp.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{cp.category} · {cp.prompt.slice(0, 80)}...</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => editCustom(cp)} style={{ padding: '5px 10px', border: '1px solid #a5b4fc', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#7c3aed', fontFamily: 'inherit' }}>Edit</button>
                    <button onClick={() => runCustom(cp)} disabled={loading === cp.id}
                      style={{ padding: '5px 14px', border: 'none', borderRadius: 6, background: loading === cp.id ? '#93c5fd' : '#7c3aed', color: '#fff', cursor: loading === cp.id ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                      {loading === cp.id ? 'Running...' : '▶ Run'}
                    </button>
                    <button onClick={() => deleteCustom(cp.id)} style={{ padding: '5px 8px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', fontSize: 11, color: '#dc2626', fontFamily: 'inherit' }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Built-in prompts */}
        {(filtered ?? BUILT_IN.flatMap(c => c.items.map(i => ({ ...i, ...BUILT_IN.find(x => x.items.includes(i))! })))).length > 0 && (
          filtered ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Search Results</div>
              {filtered.map(item => (
                <PromptCard key={item.id} item={item} loading={loading} onRun={() => runBuiltIn(item.id, item.title)} />
              ))}
            </div>
          ) : BUILT_IN.map(cat => (
            <div key={cat.category} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{cat.category}</div>
              {cat.items.map(item => (
                <PromptCard key={item.id} item={{ ...item, color: cat.color, bg: cat.bg, border: cat.border, category: cat.category }} loading={loading} onRun={() => runBuiltIn(item.id, item.title)} />
              ))}
            </div>
          ))
        )}
      </div>

      {/* RIGHT — Result panel */}
      {result && (
        <div style={{ position: 'sticky', top: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{result.title}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {result.time}
                  {result.styledAs && (
                    <span style={{ padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: 10 }}>
                      Styled as: {result.styledAs}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={copyResult} style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 7, background: copied ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit' }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <button onClick={() => setResult(null)} style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#94a3b8', fontFamily: 'inherit' }}>×</button>
              </div>
            </div>
            <div style={{ padding: 16, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              <AIResponseFormatter content={result.output} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PromptCard({ item, loading, onRun }: { item: any; loading: string | null; onRun: () => void }) {
  const isRunning = loading === item.id
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1.5px solid ${item.border}`, borderRadius: 12, background: item.bg, marginBottom: 8, cursor: isRunning ? 'not-allowed' : 'pointer' }}
      onClick={!isRunning ? onRun : undefined}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.desc}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); onRun() }} disabled={isRunning}
        style={{ padding: '6px 14px', border: 'none', borderRadius: 7, background: isRunning ? '#93c5fd' : item.color, color: '#fff', cursor: isRunning ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0 }}>
        {isRunning ? 'Running...' : '▶ Run'}
      </button>
    </div>
  )
}

const labelSt: React.CSSProperties = { display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: '#374151' }
const inputSt: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }
