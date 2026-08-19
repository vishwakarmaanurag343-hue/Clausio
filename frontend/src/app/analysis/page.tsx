'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { documentsApi, timelineApi, aiApi, casesApi, parseAiJson } from '@/lib/api'
import type { CaseSummaryResponse } from '@/types/AIResponse'
import AIResponseFormatter from '@/components/common/AIResponseFormatter'
import FlashCard from '@/components/common/FlashCard'

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
  const [analyzing,    setAnalyzing]    = useState(false)
  const [loadingStep,  setLoadingStep]  = useState<number>(0)
  const [activeTab,    setActiveTab]    = useState<'chronology' | 'summary' | 'evidence'>('chronology')
  const [error,        setError]        = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)

  const [documents, setDocuments] = useState<any[]>([])
  const [timeline,  setTimeline]  = useState<any[]>([])
  const [summary,   setSummary]   = useState<CaseSummaryResponse | null>(null)
  const [summaryRaw, setSummaryRaw] = useState('')
  const [chronologyRaw, setChronologyRaw] = useState('')

  const [evidenceResults, setEvidenceResults] = useState<Record<string, string>>({})
  const [evidenceLoading, setEvidenceLoading] = useState<Record<string, boolean>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-select first case if none selected
  useEffect(() => {
    if (selectedCaseId) return
    casesApi.getAll()
      .then(cases => {
        if (Array.isArray(cases) && cases.length > 0) {
          const first = cases[0]
          useCaseStore.getState().setSelectedCase(first.id, first.name || first.caseNumber || 'Active Case')
        }
      })
      .catch(() => {})
  }, [selectedCaseId])

  // Load existing documents, timeline, and summary on case select
  const loadCaseData = useCallback(async () => {
    if (!selectedCaseId) return
    setError('')
    try {
      const [docs, tl, sumRes, chronRes] = await Promise.all([
        documentsApi.getByCaseId(selectedCaseId).catch(() => []),
        timelineApi.getByCaseId(selectedCaseId).catch(() => []),
        aiApi.getSummary(selectedCaseId).catch(() => null),
        aiApi.getChronology(selectedCaseId).catch(() => null),
      ])

      const docsArr = Array.isArray(docs) ? docs : []
      const tlArr   = Array.isArray(tl) ? tl : []
      setDocuments(docsArr)
      setTimeline(tlArr)

      if (sumRes && sumRes.result) {
        const parsed = parseAiJson<CaseSummaryResponse>(sumRes.result)
        setSummary(parsed)
        setSummaryRaw(parsed ? '' : sumRes.result)
      }

      if (chronRes && chronRes.result) {
        const parsedChron = parseAiJson<any[]>(chronRes.result)
        if (parsedChron && parsedChron.length > 0 && tlArr.length === 0) {
          setTimeline(parsedChron)
        } else if (!parsedChron) {
          setChronologyRaw(chronRes.result)
        }
      }
    } catch (err: any) {
      console.error('Error loading case analysis data:', err)
    }
  }, [selectedCaseId])

  useEffect(() => {
    loadCaseData()
  }, [loadCaseData])

  // On-demand analysis for a single document
  const handleAnalyzeDocument = async (docId: string) => {
    if (evidenceLoading[docId]) return
    setEvidenceLoading(prev => ({ ...prev, [docId]: true }))
    try {
      const res = await aiApi.getEvidence(docId)
      setEvidenceResults(prev => ({ ...prev, [docId]: res.result }))
    } catch (err: any) {
      setEvidenceResults(prev => ({ ...prev, [docId]: `Error: ${err.message || 'Failed to analyze evidence.'}` }))
    } finally {
      setEvidenceLoading(prev => ({ ...prev, [docId]: false }))
    }
  }

  const handleRunAnalysis = useCallback(async () => {
    if (!selectedCaseId) { setError('Please select a case from the top dropdown first.'); return }
    if (pendingFiles.length === 0 && !pastedText.trim()) {
      setError('Please upload at least one document or paste case text to analyze.')
      return
    }

    setAnalyzing(true)
    setLoadingStep(0)
    setError('')

    try {
      const filesToUpload = [...pendingFiles]
      if (pastedText.trim()) {
        filesToUpload.push(new File([pastedText], 'pasted-case-petition.txt', { type: 'text/plain' }))
      }
      
      for (const file of filesToUpload) {
        await documentsApi.upload(selectedCaseId, file, 'Case Document')
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

      setPendingFiles([])
      setPastedText('')
      setShowUploadModal(false)
      setActiveTab('chronology')
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please check your network/API settings.')
    } finally {
      setAnalyzing(false)
    }
  }, [selectedCaseId, pendingFiles, pastedText])

  const handleLoadSample = () => {
    setPastedText(`PETITION FOR DIVORCE UNDER SECTION 13(1)(ia) OF THE HINDU MARRIAGE ACT, 1955
IN THE FAMILY COURT AT BANDRA, MUMBAI
Petitioner: Sunita Sharma, Age 32, Residing at Andheri West, Mumbai
Respondent: Rajesh Sharma, Age 35, Residing at Bandra West, Mumbai

1. Marriage between parties was solemnized on 12th March 2018 according to Hindu Vedic rites at Mumbai.
2. From January 2020, Respondent started demanding additional dowry and subjected Petitioner to physical assault.
3. On 12th August 2020, Petitioner was admitted to Lilavati Hospital following severe domestic assault (Discharge Summary Exhibit B).
4. On 23rd January 2021, FIR No. 42/2021 was registered under Section 498A/323 IPC at Bandra Police Station.
5. Respondent drives a BMW X5 (Registration MH-02-CD-5555) but filed false affidavit claiming monthly income of only Rs. 20,000.
6. Interim maintenance was awarded at Rs. 25,000 per month on 15th October 2021 which Respondent has defaulted since January 2022.`)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)])
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
      setPendingFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  const handleRemoveFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '16px', padding: 16, borderRadius: 24, minHeight: 'calc(100vh - 120px)' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Analysis
          </h1>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            Chronology, Structured Case Summary, and Evidence Intelligence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            multiple
            accept=".pdf,.doc,.docx,.txt"
          />

          <button
            className="glass-button"
            onClick={() => setShowUploadModal(true)}
            style={{ height: 38, padding: '0 16px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="ti ti-upload" style={{ fontSize: 14 }} />
            Upload Document
          </button>

          <button
            className="glass-button"
            onClick={() => setShowUploadModal(true)}
            style={{ height: 38, padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
          >
            <i className="ti ti-brain" style={{ fontSize: 14 }} />
            Run Analysis
          </button>
        </div>
      </div>

      {error && (
        <div style={{ margin: '0 0 12px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* ── 3-TAB MAIN LAYOUT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10, overflow: 'hidden' }}>

        {/* Tab Selector Pill Bar */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '3px 4px', flexShrink: 0 }}>
          {[
            { id: 'chronology', icon: 'ti-calendar-event', label: `Chronology (${timeline.length})` },
            { id: 'summary',    icon: 'ti-notes',          label: 'Case Summary' },
            { id: 'evidence',   icon: 'ti-shield-check',   label: `Evidence Intelligence (${documents.length})` }
          ].map(t => {
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 14px', fontSize: 12, cursor: 'pointer', background: isActive ? '#eff6ff' : 'transparent',
                  border: 'none', borderRadius: 8, color: isActive ? '#1e40af' : '#64748b',
                  fontWeight: isActive ? 600 : 500, fontFamily: 'inherit', transition: 'all 0.15s'
                }}
              >
                <i className={`ti ${t.icon}`} style={{ fontSize: 14, color: isActive ? '#1d4ed8' : '#94a3b8' }} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Active Tab Panel Content */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* TAB 1: CHRONOLOGY TABLE */}
          {activeTab === 'chronology' && (
            <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {timeline.length === 0 && chronologyRaw && (
                <div style={{ padding: 16 }}>
                  <AIResponseFormatter content={chronologyRaw} />
                </div>
              )}
              {timeline.length === 0 && !chronologyRaw && (
                <div style={{ padding: 60, textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <i className="ti ti-calendar-event" style={{ fontSize: 36, color: '#cbd5e1' }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>No chronology generated yet.</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Upload case documents or petition text to build an automatic legal timeline.</p>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Upload & Run Chronology
                  </button>
                </div>
              )}
              {timeline.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 650 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#475569', width: 120 }}>Date</th>
                      <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#475569' }}>Event Description</th>
                      <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#475569', width: 130 }}>Category</th>
                      <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#475569', width: 220 }}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeline.map((ev, i) => (
                      <tr key={ev.id ?? i} style={{ borderBottom: i < timeline.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                          📅 {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#0f172a', lineHeight: 1.5 }}>
                          {ev.event}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 12, display: 'inline-block', background: '#f1f5f9', color: '#475569' }}>
                            {ev.category || 'General'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                          <i className="ti ti-file" style={{ fontSize: 11, marginRight: 4, color: '#94a3b8' }} />
                          {ev.source || 'Case Dossier'}
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
            <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!summary && !summaryRaw && (
                <div style={{ padding: 60, textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <i className="ti ti-notes" style={{ fontSize: 36, color: '#cbd5e1' }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>No case summary generated yet.</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Run analysis on your case files to synthesize core facts, strengths, and risks.</p>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Run Case Summary
                  </button>
                </div>
              )}

              {!summary && summaryRaw && (
                <div style={{ padding: 4 }}>
                  <AIResponseFormatter content={summaryRaw} />
                </div>
              )}

              {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, background: '#fafbfc' }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-file-text" style={{ color: '#2563eb' }} /> Core Case Facts
                      </h4>
                      <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, margin: 0 }}>{summary.coreFacts || 'No core facts extracted.'}</p>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, background: '#fafbfc' }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-scale" style={{ color: '#2563eb' }} /> Current Procedural Stage
                      </h4>
                      <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, margin: 0 }}>{summary.currentStage || 'Pre-trial / Active Proceedings'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ border: '1px solid #bbf7d0', borderRadius: 10, padding: 14, background: '#f0fdf4' }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-thumb-up" /> Key Case Strengths
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#14532d', lineHeight: 1.6 }}>
                        {summary.keyStrengths?.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div style={{ border: '1px solid #fecaca', borderRadius: 10, padding: 14, background: '#fef2f2' }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-alert-triangle" /> Key Case Risks & Weaknesses
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#7f1d1d', lineHeight: 1.6 }}>
                        {summary.keyWeaknesses?.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div style={{ border: '1px solid #ddd6fe', borderRadius: 10, padding: 14, background: '#f5f3ff' }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-arrow-right" /> Recommended Next Steps
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#4c1d95', lineHeight: 1.6 }}>
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
            <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {documents.length === 0 && (
                <div style={{ padding: 60, textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <i className="ti ti-shield-check" style={{ fontSize: 36, color: '#cbd5e1' }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>No documents uploaded for this case yet.</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Upload case exhibits and court orders to generate legal evidentiary assessments.</p>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Upload Documents
                  </button>
                </div>
              )}

              {documents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                      Uploaded Case Exhibits & Documents (<strong style={{ color: '#0f172a' }}>{documents.length}</strong>). Click <strong>"Analyze Evidence"</strong> on any document to evaluate its legal weight:
                    </p>
                  </div>

                  {documents.map((doc) => {
                    const isLoading = evidenceLoading[doc.id]
                    const result = evidenceResults[doc.id]
                    return (
                      <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <i className="ti ti-file-text" style={{ fontSize: 16, color: '#2563eb' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569', fontWeight: 500 }}>{doc.documentType || 'Exhibit / Document'}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#dcfce7', color: '#15803d', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <i className="ti ti-check" style={{ fontSize: 11 }} /> Ingested
                            </span>
                          </div>

                          <button
                            disabled={isLoading}
                            onClick={() => handleAnalyzeDocument(doc.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              background: result ? '#f8fafc' : '#2563eb',
                              color: result ? '#475569' : '#fff',
                              border: result ? '1px solid #cbd5e1' : 'none',
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                              boxShadow: result ? 'none' : '0 2px 6px rgba(37,99,235,0.25)',
                              transition: 'all 0.15s'
                            }}
                          >
                            {isLoading ? (
                              <>
                                <i className="ti ti-loader animate-spin" style={{ fontSize: 13 }} />
                                Analyzing...
                              </>
                            ) : result ? (
                              <>
                                <i className="ti ti-refresh" style={{ fontSize: 13 }} />
                                Re-analyze
                              </>
                            ) : (
                              <>
                                <i className="ti ti-brain" style={{ fontSize: 13 }} />
                                Analyze Evidence
                              </>
                            )}
                          </button>
                        </div>

                        {/* Analysis Output Section */}
                        {isLoading && (
                          <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', fontSize: 12, background: '#f8fafc' }}>
                            <i className="ti ti-loader animate-spin" style={{ fontSize: 16 }} />
                            <span>Clausio Legal AI is evaluating facts, credibility, and evidentiary admissibility for <strong>{doc.fileName}</strong>...</span>
                          </div>
                        )}

                        {!isLoading && result && (
                          <div style={{ padding: '14px', background: '#faf5ff' }}>
                            <p style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              <i className="ti ti-shield-check" /> Legal Evidentiary Assessment
                            </p>
                            <AIResponseFormatter content={result} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── UPLOAD & RUN ANALYSIS MODAL ── */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Analyze Case Files</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Upload case PDFs or paste petition text to generate chronology & summary.</p>
              </div>
              <button
                onClick={() => { if (!analyzing) setShowUploadModal(false); }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
              >
                <i className="ti ti-x" style={{ fontSize: 18 }} />
              </button>
            </div>

            {/* Drag and Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              style={{
                border: '2px dashed #cbd5e1', padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                borderRadius: 12, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
              }}
            >
              <i className="ti ti-file-upload" style={{ fontSize: 28, color: '#3b82f6' }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                Drag documents here or <span style={{ color: '#2563eb' }}>browse files</span>
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>PDF, DOCX, TXT · Up to 20MB</p>
            </div>

            {/* File List */}
            {pendingFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pendingFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f1f5f9', borderRadius: 8 }}>
                    <i className="ti ti-file" style={{ color: '#2563eb' }} />
                    <span style={{ fontSize: 12, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{formatSize(file.size)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                    >
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Paste Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Or Paste Petition / Facts</label>
                <button
                  onClick={handleLoadSample}
                  style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Load Sample Petition
                </button>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste case statements, orders, FIRs, or notice text..."
                style={{ width: '100%', height: 110, border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, fontSize: 12, resize: 'vertical' }}
              />
            </div>

            {/* Loading progress if analyzing */}
            {analyzing && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-loader animate-spin" style={{ color: '#16a34a' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>{LOADING_STEPS[loadingStep]}</span>
                </div>
                <div style={{ height: 4, background: '#dcfce7', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#16a34a', width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                disabled={analyzing}
                onClick={() => setShowUploadModal(false)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={analyzing}
                onClick={handleRunAnalysis}
                style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {analyzing ? <i className="ti ti-loader animate-spin" /> : <i className="ti ti-brain" />}
                {analyzing ? 'Analyzing...' : 'Run Case Analysis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
