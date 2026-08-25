'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { documentsApi, hearingsApi } from '@/lib/api'
import CaseTypeBadge from '@/components/ui/CaseTypeBadge'

const CATEGORIES = ['All', 'Evidence', 'Proof', 'Court Order', 'Pleading', 'Financial', 'Medical', 'Identity', 'Other']

const CATEGORY_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  'Evidence':    { bg: '#fef2f2', color: '#dc2626', icon: 'ti-camera' },
  'Proof':       { bg: '#f0fdf4', color: '#16a34a', icon: 'ti-certificate' },
  'Court Order': { bg: '#eff6ff', color: '#2563eb', icon: 'ti-gavel' },
  'Pleading':    { bg: '#f5f3ff', color: '#7c3aed', icon: 'ti-file-text' },
  'Financial':   { bg: '#fffbeb', color: '#d97706', icon: 'ti-coin' },
  'Medical':     { bg: '#fdf4ff', color: '#a21caf', icon: 'ti-stethoscope' },
  'Identity':    { bg: '#f0fdfa', color: '#0d9488', icon: 'ti-id' },
  'Other':       { bg: '#f8fafc', color: '#64748b', icon: 'ti-file' },
}

// Filing filter chips shown alongside the category tabs.
const FILING_FILTERS = ['All', 'Not Filed', 'Filed'] as const

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('clausio_token='))?.split('=')[1] ?? ''
}

function fmtDate(d?: string | null) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' }
}

export default function DocumentsPage() {
  const { selectedCaseId } = useCaseStore()
  const [documents,   setDocuments]   = useState<any[]>([])
  const [hearings,    setHearings]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(false)
  const [activeTab,   setActiveTab]   = useState('All')
  const [filingFilter, setFilingFilter] = useState<typeof FILING_FILTERS[number]>('All')
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState('')
  // id of the doc whose "mark as filed" inline form is open
  const [filingDocId, setFilingDocId] = useState<string | null>(null)
  const [filedDate,   setFiledDate]   = useState('')
  const [filedHearingId, setFiledHearingId] = useState('')
  const [savingFiling, setSavingFiling] = useState(false)

  const load = useCallback(async () => {
    if (!selectedCaseId) return
    setLoading(true)
    try {
      const data = await documentsApi.getByCaseId(selectedCaseId)
      setDocuments(Array.isArray(data) ? data : [])
      hearingsApi.getByCaseId(selectedCaseId).then((h: any) => setHearings(Array.isArray(h) ? h : [])).catch(() => {})
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [selectedCaseId])

  useEffect(() => { setFilingFilter('All'); setFilingDocId(null); load() }, [load])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedCaseId) return
    setUploading(true)
    try {
      await documentsApi.upload(selectedCaseId, file)
      await load()
    } catch (err: any) { setError(err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  async function handleDelete(docId: string) {
    if (!selectedCaseId) return
    if (!confirm('Delete this document?')) return
    try {
      await documentsApi.remove(selectedCaseId, docId)
      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (err: any) { setError(err.message) }
  }

  function openFileForm(docId: string) {
    setFilingDocId(docId)
    setFiledDate(new Date().toISOString().slice(0, 10))
    setFiledHearingId('')
  }

  async function markFiled(docId: string) {
    if (!selectedCaseId) return
    setSavingFiling(true); setError('')
    try {
      const updated = await documentsApi.setFilingStatus(selectedCaseId, docId, {
        filingStatus: 'Filed',
        filedDate: filedDate ? new Date(filedDate + 'T09:00:00').toISOString() : undefined,
        filedAtHearingId: filedHearingId || undefined,
      })
      setDocuments(prev => prev.map(d => d.id === docId ? updated : d))
      setFilingDocId(null)
    } catch (err: any) { setError(err.message) }
    finally { setSavingFiling(false) }
  }

  async function markNotFiled(docId: string) {
    if (!selectedCaseId) return
    setError('')
    try {
      const updated = await documentsApi.setFilingStatus(selectedCaseId, docId, { filingStatus: 'Not Filed' })
      setDocuments(prev => prev.map(d => d.id === docId ? updated : d))
      if (filingDocId === docId) setFilingDocId(null)
    } catch (err: any) { setError(err.message) }
  }

  // ── filtering: category tab + filing filter ──
  const byCategory = activeTab === 'All'
    ? documents
    : documents.filter(d => (d.category ?? 'Other') === activeTab)
  const filtered = filingFilter === 'All'
    ? byCategory
    : byCategory.filter(d => (d.filingStatus ?? 'Not Filed') === filingFilter)

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All'
      ? documents.length
      : documents.filter(d => (d.category ?? 'Other') === cat).length
    return acc
  }, {} as Record<string, number>)
  const filedCount = documents.filter(d => (d.filingStatus ?? 'Not Filed') === 'Filed').length
  const notFiledCount = documents.length - filedCount
  const filingCounts: Record<string, number> = { All: documents.length, 'Not Filed': notFiledCount, Filed: filedCount }

  return (
    <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER (matches Hearings page pattern) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Documents</h1>
          <p style={{ marginTop: 4, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            Uploads, filing status and exhibit tracking · AI classified
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CaseTypeBadge />
          <label className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, borderRadius: 10, cursor: uploading || !selectedCaseId ? 'not-allowed' : 'pointer', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', opacity: uploading || !selectedCaseId ? 0.7 : 1 }}>
            <i className="ti ti-upload" style={{ fontSize: 14 }} />
            {uploading ? 'Uploading...' : 'Upload Document'}
            <input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading || !selectedCaseId} />
          </label>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!selectedCaseId && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <i className="ti ti-folder-open" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Select a case to view documents</div>
        </div>
      )}

      {selectedCaseId && (
        <>
          {/* ── FILTERS: category tabs + filing filter ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.filter(c => c === 'All' || counts[c] > 0).map(cat => (
                <button key={cat} onClick={() => setActiveTab(cat)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${activeTab === cat ? '#2563eb' : '#e2e8f0'}`, background: activeTab === cat ? '#eff6ff' : '#fff', color: activeTab === cat ? '#1d4ed8' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: activeTab === cat ? 600 : 500, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {cat}
                  <span style={{ background: activeTab === cat ? '#2563eb' : '#f1f5f9', color: activeTab === cat ? '#fff' : '#64748b', borderRadius: 99, padding: '0px 6px', fontSize: 10, fontWeight: 700 }}>
                    {counts[cat]}
                  </span>
                </button>
              ))}
            </div>

            {/* filing-status divider + chips */}
            <div style={{ width: 1, height: 22, background: '#e2e8f0' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FILING_FILTERS.map(f => {
                const isActive = filingFilter === f
                const accent = f === 'Filed' ? '#16a34a' : f === 'Not Filed' ? '#d97706' : '#334155'
                return (
                  <button key={f} onClick={() => setFilingFilter(f)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${isActive ? accent : '#e2e8f0'}`, background: isActive ? (f === 'Filed' ? '#f0fdf4' : f === 'Not Filed' ? '#fffbeb' : '#f8fafc') : '#fff', color: isActive ? accent : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 500, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {f === 'Filed' ? '✓ Filed' : f === 'Not Filed' ? '⏳ Not Filed' : 'Any status'}
                    <span style={{ background: isActive ? accent : '#f1f5f9', color: '#fff', borderRadius: 99, padding: '0px 6px', fontSize: 10, fontWeight: 700 }}>
                      {filingCounts[f]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Documents list */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#7c3aed' }}>
              <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 10, animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: 13 }}>Loading documents...</div>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <i className="ti ti-files" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                {documents.length === 0 ? 'No documents yet' : 'Nothing matches these filters'}
              </div>
              <div style={{ fontSize: 13 }}>{documents.length === 0 ? 'Upload a document to get started.' : 'Try a different category or filing status.'}</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(doc => {
              const cat    = doc.category ?? 'Other'
              const colors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['Other']
              const sizeKB = doc.sizeBytes ? Math.round(doc.sizeBytes / 1024) : 0
              const isFiled = (doc.filingStatus ?? 'Not Filed') === 'Filed'
              const filedHearing = isFiled && doc.filedAtHearingId
                ? hearings.find(h => h.id === doc.filedAtHearingId)
                : null
              const filingOpen = filingDocId === doc.id

              return (
                <div key={doc.id} style={{ background: '#fff', border: `1px solid ${filingOpen ? '#c7d2fe' : '#e2e8f0'}`, borderRadius: 14, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: filingOpen ? 12 : 0, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>

                    {/* File icon */}
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${colors.icon}`} style={{ fontSize: 20, color: colors.color }} />
                    </div>

                    {/* File info */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>
                          {doc.fileName}
                        </span>
                        {/* EXHIBIT — prominent only when filed; otherwise pending badge */}
                        {isFiled ? (
                          doc.exhibitLabel && (
                            <span style={{ padding: '3px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 800, background: '#f5f3ff', color: '#7c3aed', border: '1.5px solid #ddd6fe', letterSpacing: 0.3 }}>
                              ⚖ {doc.exhibitLabel}
                            </span>
                          )
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                            ⏳ Pending to file
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* Category badge */}
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: colors.bg, color: colors.color, border: `1px solid ${colors.color}33` }}>
                          {cat}
                        </span>
                        {/* Confidence */}
                        {doc.categoryConfidence > 0 && (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            {doc.categoryConfidence}% confidence
                          </span>
                        )}
                        {/* Size */}
                        {sizeKB > 0 && (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{sizeKB} KB</span>
                        )}
                        {/* OCR status */}
                        <span style={{ fontSize: 11, color: doc.ocrStatus === 'Completed' ? '#16a34a' : '#d97706', fontWeight: 500 }}>
                          {doc.ocrStatus === 'Completed' ? '✓ Text extracted' : '⏳ Processing'}
                        </span>
                        {/* Filing meta when filed */}
                        {isFiled && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                            ✓ Filed {fmtDate(doc.filedDate)}
                            {filedHearing?.hearingDate && (
                              <span style={{ color: '#64748b', fontWeight: 500 }}>· at hearing of {fmtDate(filedHearing.hearingDate)}</span>
                            )}
                          </span>
                        )}
                      </div>
                      {/* Description */}
                      {doc.categoryDescription && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{doc.categoryDescription}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      {/* Filing status dropdown */}
                      <select
                        value={isFiled ? 'Filed' : 'Not Filed'}
                        onChange={(e) => {
                          if (e.target.value === 'Filed') openFileForm(doc.id)
                          else markNotFiled(doc.id)
                        }}
                        style={{
                          padding: '7px 10px', borderRadius: 8, border: `1px solid ${isFiled ? '#bbf7d0' : '#fde68a'}`,
                          background: isFiled ? '#f0fdf4' : '#fffbeb', color: isFiled ? '#15803d' : '#b45309',
                          fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="Not Filed">⏳ Not Filed</option>
                        <option value="Filed">✓ Filed</option>
                      </select>
                      <a href={`http://localhost:5123/api/cases/${selectedCaseId}/documents/${doc.id}/download`}
                        target="_blank"
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-download" style={{ fontSize: 13 }} />
                      </a>
                      <button onClick={() => handleDelete(doc.id)}
                        style={{ padding: '6px 12px', border: '1px solid #fca5a5', borderRadius: 8, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-trash" style={{ fontSize: 13 }} />
                      </button>
                    </div>
                  </div>

                  {/* Inline "file it" form (only while marking this doc as Filed) */}
                  {filingOpen && (
                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 12, display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 5 }}>FILED ON</label>
                        <input type="date" value={filedDate} onChange={e => setFiledDate(e.target.value)}
                          style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12.5, fontFamily: 'inherit', outline: 'none', background: '#f8fafc' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 5 }}>AT HEARING (OPTIONAL)</label>
                        <select value={filedHearingId} onChange={e => setFiledHearingId(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12.5, fontFamily: 'inherit', outline: 'none', background: '#f8fafc' }}>
                          <option value="">— Not linked to a hearing —</option>
                          {hearings.map(h => (
                            <option key={h.id} value={h.id}>
                              {new Date(h.hearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{h.stage ? ` · ${h.stage}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button disabled={savingFiling} onClick={() => markFiled(doc.id)}
                          style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: '#16a34a', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: savingFiling ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: savingFiling ? .7 : 1 }}>
                          {savingFiling ? 'Saving…' : 'Mark as Filed'}
                        </button>
                        <button onClick={() => setFilingDocId(null)} disabled={savingFiling}
                          style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
