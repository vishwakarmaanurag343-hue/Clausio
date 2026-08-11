'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { documentsApi, timelineApi, aiApi, parseAiJson } from '@/lib/api'
import type { CaseSummaryResponse } from '@/types/AIResponse'

type AnalysisStatus = 'idle' | 'uploading' | 'completed'

const LOADING_STEPS = [
  'Uploading documents to the case file...',
  'Extracting key entities, dates, and party details...',
  'Running cross-document chronology parsing & index compilation...',
  'Evaluating case summary and evidence...',
]

export default function AnalysisPage() {
  const { selectedCaseId } = useCaseStore()

  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pastedText,   setPastedText]   = useState<string>('')
  const [status,       setStatus]       = useState<AnalysisStatus>('idle')
  const [loadingStep,  setLoadingStep]  = useState<number>(0)
  const [activeTab,    setActiveTab]    = useState<'chronology' | 'summary' | 'evidence'>('chronology')
  const [error,        setError]        = useState('')

  const [documents, setDocuments] = useState<any[]>([])
  const [timeline,  setTimeline]  = useState<any[]>([])
  const [summary,   setSummary]   = useState<CaseSummaryResponse | null>(null)
  const [summaryRaw, setSummaryRaw] = useState('')
  const [chronologyRaw, setChronologyRaw] = useState('')

  const [evidenceResults, setEvidenceResults] = useState<Record<string, string>>({})
  const [evidenceLoading, setEvidenceLoading] = useState<Record<string, boolean>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load any documents/timeline already saved for this case so results persist across refresh
  useEffect(() => {
    if (!selectedCaseId) return
    Promise.all([
      documentsApi.getByCaseId(selectedCaseId),
      timelineApi.getByCaseId(selectedCaseId),
    ]).then(([docs, tl]) => {
      const docsArr = Array.isArray(docs) ? docs : []
      const tlArr   = Array.isArray(tl) ? tl : []
      setDocuments(docsArr)
      setTimeline(tlArr)
      if (docsArr.length > 0 || tlArr.length > 0) setStatus('completed')
    }).catch(err => console.error(err))
  }, [selectedCaseId])

  // Run evidence analysis for any document that doesn't have a result yet
  useEffect(() => {
    if (activeTab !== 'evidence') return
    documents.forEach(doc => {
      if (evidenceResults[doc.id] || evidenceLoading[doc.id]) return
      setEvidenceLoading(prev => ({ ...prev, [doc.id]: true }))
      aiApi.getEvidence(doc.id)
        .then(res => setEvidenceResults(prev => ({ ...prev, [doc.id]: res.result })))
        .catch(err => setEvidenceResults(prev => ({ ...prev, [doc.id]: `Error: ${err.message}` })))
        .finally(() => setEvidenceLoading(prev => ({ ...prev, [doc.id]: false })))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, documents])

  const handleRunAnalysis = useCallback(async () => {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    if (pendingFiles.length === 0 && !pastedText.trim()) {
      setError('Upload a document or paste text to analyze.')
      return
    }

    setStatus('uploading')
    setLoadingStep(0)
    setError('')

    try {
      const filesToUpload = [...pendingFiles]
      if (pastedText.trim()) {
        filesToUpload.push(new File([pastedText], 'pasted-text.txt', { type: 'text/plain' }))
      }
      for (const file of filesToUpload) {
        await documentsApi.upload(selectedCaseId, file, 'Uploaded Document')
      }
      const docs = await documentsApi.getByCaseId(selectedCaseId)
      setDocuments(Array.isArray(docs) ? docs : [])
      setLoadingStep(1)

      const chronRes = await aiApi.getChronology(selectedCaseId)
      const events = parseAiJson<any[]>(chronRes.result)
      setChronologyRaw(events ? '' : chronRes.result)
      setLoadingStep(2)

      if (events && events.length > 0) {
        await timelineApi.bulkCreate(selectedCaseId, events.map((e, i) => ({
          eventDate:         e.eventDate,
          event:              e.event,
          source:             e.source,
          legalSignificance:  e.legalSignificance,
          category:           e.category,
          sortOrder:          i,
        })))
        const tl = await timelineApi.getByCaseId(selectedCaseId)
        setTimeline(Array.isArray(tl) ? tl : [])
      }

      const summaryRes = await aiApi.getSummary(selectedCaseId)
      const parsedSummary = parseAiJson<CaseSummaryResponse>(summaryRes.result)
      setSummary(parsedSummary)
      setSummaryRaw(parsedSummary ? '' : summaryRes.result)
      setLoadingStep(3)

      setStatus('completed')
      setActiveTab('chronology')
      setPendingFiles([])
      setPastedText('')
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.')
      setStatus('idle')
    }
  }, [selectedCaseId, pendingFiles, pastedText])

  const handleLoadSample = () => {
    setPastedText('PETITION FOR DIVORCE UNDER SECTION 13(1)(ia) OF THE HINDU MARRIAGE ACT, 1955...')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingFiles(Array.from(e.target.files))
    }
  }

  const triggerBrowse = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setPendingFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleRemoveFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setStatus('idle')
    setPendingFiles([])
    setPastedText('')
    setLoadingStep(0)
    setError('')
  }

  function formatSize(bytes: number) {
    return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
  }

  return (
    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '16px', padding: 16, borderRadius: 24 }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Analysis
          </h1>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            Upload documents or paste text to analyze.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            multiple
            accept=".pdf,.doc,.docx,.txt"
          />

          {/* Top actions */}
          {status === 'completed' && (
            <button
              className="glass-button"
              onClick={handleReset}
              style={{ height: 38, padding: '0 16px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="ti ti-refresh" style={{ fontSize: 14 }} />
              Upload more
            </button>
          )}

          {status === 'idle' && (
            <button
              className="glass-button"
              onClick={triggerBrowse}
              style={{ height: 38, padding: '0 16px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="ti ti-upload" style={{ fontSize: 14 }} />
              Upload
            </button>
          )}

          {status === 'idle' && (
            <button
              className="glass-button"
              onClick={handleRunAnalysis}
              style={{ height: 38, padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            >
              <i className="ti ti-brain" style={{ fontSize: 14 }} />
              Run analysis
            </button>
          )}
        </div>
      </div>

      {/* ── CORE VIEWS ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {error && (
          <div style={{ maxWidth: 760, margin: '0 auto 16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* ── STATE 1: IDLE / UPLOAD AREA ── */}
        {status === 'idle' && (
          <div style={{ maxWidth: 760, margin: '20px auto 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Drag & Drop Container */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              className="glass-card"
              style={{
                border: '2px dashed rgba(0,0,0,0.1)', padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)'
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <i className="ti ti-file-upload" style={{ fontSize: 24, color: '#3b82f6' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                Drag and drop your case document or <span style={{ color: '#2563eb' }}>click to browse</span>
              </p>
              <p style={{ fontSize: 12, color: '#64748b' }}>
                Supports PDF, DOC, DOCX, TXT · Max size 20MB
              </p>
            </div>

            {/* Selected Files List */}
            {pendingFiles.length > 0 && (
              <div className="glass-card" style={{ padding: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, paddingLeft: 4 }}>Selected files ({pendingFiles.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {pendingFiles.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                      <i className="ti ti-file-type-pdf" style={{ fontSize: 16, color: '#ef4444' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{formatSize(file.size)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                        style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                      >
                        <i className="ti ti-x" style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paste Text Area */}
            <div className="glass-card" style={{ padding: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 10 }}>
                Or paste case petition / text facts below
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste raw statements, court orders, case histories, or contract clauses here to analyze them..."
                style={{
                  width: '100%', minHeight: 140, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10,
                  padding: 14, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                  background: 'rgba(255,255,255,0.6)', color: '#0f172a', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Demo Helper Action */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <button
                onClick={handleLoadSample}
                style={{
                  fontSize: 10, background: 'transparent', border: 'none', color: '#3b82f6',
                  cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'underline'
                }}
              >
                <i className="ti ti-copy" />
                Load sample petition text
              </button>
            </div>

          </div>
        )}

        {/* ── STATE 2: LOADING / AI RUNNING PIPELINE ── */}
        {status === 'uploading' && (
          <div style={{ maxWidth: 460, margin: '40px auto 0', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>

            {/* Spinning/progress visual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <i className="ti ti-loader animate-spin" style={{ fontSize: 16, color: '#1e3a8a' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>Clausio Legal AI Core is analyzing...</p>
                <p style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>Generating chronology, summary, and extracting evidence data.</p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 20 }}>
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                  width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
                  transition: 'width 0.8s ease'
                }}
              />
            </div>

            {/* Log stepper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LOADING_STEPS.map((stepDesc, idx) => {
                const isPassed = idx < loadingStep
                const isActive = idx === loadingStep
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isPassed || isActive ? 1 : 0.35 }}>
                    {isPassed ? (
                      <i className="ti ti-circle-check" style={{ fontSize: 13, color: '#10b981' }} />
                    ) : isActive ? (
                      <i className="ti ti-rotate-clockwise animate-spin" style={{ fontSize: 13, color: '#3b82f6' }} />
                    ) : (
                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #cbd5e1' }} />
                    )}
                    <span style={{ fontSize: 10, color: isActive ? '#0f172a' : '#475569', fontWeight: isActive ? 500 : 400 }}>
                      {stepDesc}
                    </span>
                  </div>
                )
              })}
            </div>

          </div>
        )}

        {/* ── STATE 3: COMPLETED RESULTS VIEW ── */}
        {status === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>

            {/* Inner Route Tabs */}
            <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '2px 4px', flexShrink: 0 }}>
              {[
                { id: 'chronology', icon: 'ti-calendar-event', label: 'Chronology' },
                { id: 'summary',    icon: 'ti-notes',          label: 'Case Summary' },
                { id: 'evidence',   icon: 'ti-shield-check',   label: 'Evidence Intelligence' }
              ].map(t => {
                const isActive = activeTab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 12px', fontSize: 11, cursor: 'pointer', background: isActive ? '#eff6ff' : 'transparent',
                      border: 'none', borderRadius: 6, color: isActive ? '#1e40af' : '#64748b',
                      fontWeight: isActive ? 600 : 400, fontFamily: 'inherit', transition: 'all 0.15s'
                    }}
                  >
                    <i className={`ti ${t.icon}`} style={{ fontSize: 13, color: isActive ? '#1d4ed8' : '#94a3b8' }} />
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* Active Tab Panel Content */}
            <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* TAB 1: CHRONOLOGY TABLE */}
              {activeTab === 'chronology' && (
                <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {timeline.length === 0 && chronologyRaw && (
                    <div style={{ padding: 16, fontSize: 12, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{chronologyRaw}</div>
                  )}
                  {timeline.length === 0 && !chronologyRaw && (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No chronology events yet.</div>
                  )}
                  {timeline.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#475569', width: 110 }}>Date</th>
                          <th style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#475569' }}>Event Description</th>
                          <th style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#475569', width: 120 }}>Category</th>
                          <th style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#475569', width: 220 }}>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeline.map((ev, i) => (
                          <tr key={ev.id ?? i} style={{ borderBottom: i < timeline.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <td style={{ padding: '10px 12px', fontSize: 11, fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>
                              {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 11, color: '#0f172a', lineHeight: 1.4 }}>
                              {ev.event}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 12, display: 'inline-block', background: '#f1f5f9', color: '#475569' }}>
                                {ev.category || '—'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 10, color: '#64748b', fontWeight: 500 }}>
                              <i className="ti ti-file" style={{ fontSize: 10, marginRight: 4, color: '#cbd5e1' }} />
                              {ev.source || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 2: CASE SUMMARY VIEW */}
              {activeTab === 'summary' && (
                <div style={{ padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {!summary && !summaryRaw && (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No summary yet.</div>
                  )}

                  {!summary && summaryRaw && (
                    <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{summaryRaw}</div>
                  )}

                  {summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                          <h4 style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Core Facts</h4>
                          <p style={{ fontSize: 11, color: '#334155', lineHeight: 1.5 }}>{summary.coreFacts}</p>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                          <h4 style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Current Stage</h4>
                          <p style={{ fontSize: 11, color: '#334155', lineHeight: 1.5 }}>{summary.currentStage}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                          <h4 style={{ fontSize: 10, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Key Strengths</h4>
                          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 10.5, color: '#334155', lineHeight: 1.6 }}>
                            {summary.keyStrengths?.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                          <h4 style={{ fontSize: 10, fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Key Weaknesses</h4>
                          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 10.5, color: '#334155', lineHeight: 1.6 }}>
                            {summary.keyWeaknesses?.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#fbfbfe' }}>
                          <h4 style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Recommended Next Steps</h4>
                          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 10.5, color: '#334155', lineHeight: 1.6 }}>
                            {summary.nextSteps?.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EVIDENCE INTELLIGENCE VIEW */}
              {activeTab === 'evidence' && (
                <div style={{ padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {documents.length === 0 && (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No documents uploaded for this case yet.</div>
                  )}

                  {documents.length > 0 && (
                    <p style={{ fontSize: 11, color: '#64748b' }}>AI is analysing <strong style={{ color: '#0f172a' }}>{documents.length} document(s)</strong> for evidentiary value.</p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {documents.map((doc) => (
                      <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <i className="ti ti-file-text" style={{ fontSize: 12, color: '#94a3b8' }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{doc.fileName}</span>
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#f1f5f9', color: '#64748b', marginLeft: 4 }}>{doc.documentType}</span>
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          {evidenceLoading[doc.id] && (
                            <p style={{ fontSize: 10, color: '#64748b' }}>Analysing...</p>
                          )}
                          {!evidenceLoading[doc.id] && evidenceResults[doc.id] && (
                            <div style={{ background: '#fbfbfe', border: '1px solid #f1f5f9', borderRadius: 6, padding: '6px 8px' }}>
                              <p style={{ fontSize: 9, color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                                <i className="ti ti-brain" /> AI Evidence Insight
                              </p>
                              <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{evidenceResults[doc.id]}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
