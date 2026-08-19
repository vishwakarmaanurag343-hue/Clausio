'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { documentsApi } from '@/lib/api'

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

function getToken() {
  return document.cookie.split(';').find(c => c.trim().startsWith('clausio_token='))?.split('=')[1] ?? ''
}

export default function DocumentsPage() {
  const { selectedCaseId } = useCaseStore()
  const [documents,   setDocuments]   = useState<any[]>([])
  const [loading,     setLoading]     = useState(false)
  const [activeTab,   setActiveTab]   = useState('All')
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState('')

  const load = useCallback(async () => {
    if (!selectedCaseId) return
    setLoading(true)
    try {
      const data = await documentsApi.getByCaseId(selectedCaseId)
      setDocuments(Array.isArray(data) ? data : [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [selectedCaseId])

  useEffect(() => { load() }, [load])

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

  const filtered = activeTab === 'All'
    ? documents
    : documents.filter(d => (d.category ?? 'Other') === activeTab)

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All'
      ? documents.length
      : documents.filter(d => (d.category ?? 'Other') === cat).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="glass-panel mobile-client-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 32px)', overflowY: 'auto', margin: '16px', padding: '24px 32px', borderRadius: 24 }}>
      <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Documents</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              {documents.length} documents · AI classified by type
            </p>
          </div>
        <label style={{ padding: '10px 18px', borderRadius: 10, background: '#2563eb', color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.7 : 1 }}>
          <i className="ti ti-upload" style={{ fontSize: 14 }} />
          {uploading ? 'Uploading...' : 'Upload Document'}
          <input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading || !selectedCaseId} />
        </label>
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
          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
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
                {activeTab === 'All' ? 'No documents yet' : `No ${activeTab} documents`}
              </div>
              <div style={{ fontSize: 13 }}>Upload a document to get started.</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(doc => {
              const cat    = doc.category ?? 'Other'
              const colors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['Other']
              const sizeKB = doc.sizeBytes ? Math.round(doc.sizeBytes / 1024) : 0

              return (
                <div key={doc.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>

                  {/* File icon */}
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${colors.icon}`} style={{ fontSize: 20, color: colors.color }} />
                  </div>

                  {/* File info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {doc.fileName}
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
                      {/* Exhibit label */}
                      {doc.exhibitLabel && (
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f5f3ff', color: '#7c3aed' }}>
                          {doc.exhibitLabel}
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
                    </div>
                    {/* Description */}
                    {doc.categoryDescription && (
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{doc.categoryDescription}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
              )
            })}
          </div>
        </>
      )}
      </div>
    </div>
  )
}
