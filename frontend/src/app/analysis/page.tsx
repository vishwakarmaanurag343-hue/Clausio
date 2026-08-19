'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { documentsApi, timelineApi, aiApi, casesApi, parseAiJson } from '@/lib/api'
import type { CaseSummaryResponse } from '@/types/AIResponse'
import AIResponseFormatter from '@/components/common/AIResponseFormatter'
import FlashCard from '@/components/common/FlashCard'
import CanvasFlowTimeline, { CanvasCardItem } from '@/components/common/CanvasFlowTimeline'
import SerpentineTimeline, { SerpentineTimelineItem } from '@/components/common/SerpentineTimeline'

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
  const [viewMode,     setViewMode]     = useState<'canvas' | 'table'>('canvas')
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

  const [allCases, setAllCases] = useState<any[]>([])

  // Load all user cases for case switcher
  useEffect(() => {
    casesApi.getAll()
      .then(cases => {
        if (Array.isArray(cases)) {
          setAllCases(cases)
          if (!selectedCaseId && cases.length > 0) {
            const first = cases[0]
            useCaseStore.getState().setSelectedCase(first.id, first.name || first.caseNumber || 'Active Case')
          }
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
    if (!selectedCaseId) { setError('Please select a case first.'); return }
    if (documents.length === 0 && pendingFiles.length === 0 && !pastedText.trim()) {
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
  }, [selectedCaseId, documents.length, pendingFiles, pastedText])

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Analysis
            </h1>
            {/* Case Dropdown */}
            {allCases.length > 0 && (
              <select
                value={selectedCaseId}
                onChange={(e) => {
                  const c = allCases.find(item => item.id === e.target.value)
                  if (c) useCaseStore.getState().setSelectedCase(c.id, c.name || c.caseNumber || 'Active Case')
                }}
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  outline: 'none',
                  maxWidth: 260
                }}
              >
                {allCases.map(c => (
                  <option key={c.id} value={c.id}>
                    📁 {c.name || c.caseNumber || 'Untitled Case'}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            Chronology, Structured Case Summary, and Evidence Intelligence for active case documents.
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
            disabled={analyzing}
            onClick={() => {
              if (documents.length > 0 && pendingFiles.length === 0 && !pastedText.trim()) {
                handleRunAnalysis()
              } else {
                setShowUploadModal(true)
              }
            }}
            style={{
              height: 38, padding: '0 16px',
              background: analyzing ? '#94a3b8' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: analyzing ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            {analyzing ? (
              <>
                <i className="ti ti-loader animate-spin" style={{ fontSize: 14 }} />
                Analyzing Case...
              </>
            ) : (
              <>
                <i className="ti ti-brain" style={{ fontSize: 14 }} />
                {documents.length > 0 ? `Run Analysis (${documents.length} docs)` : 'Run Analysis'}
              </>
            )}
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
            <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* If we have documents, show individual per-document chronology triggers & results */}
              {documents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                      Case Documents (<strong style={{ color: '#0f172a' }}>{documents.length}</strong>). Click <strong>"Extract Timeline"</strong> on any individual document or run cross-document analysis:
                    </p>
                    <button
                      disabled={analyzing}
                      onClick={handleRunAnalysis}
                      style={{
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                        padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <i className="ti ti-calendar-event" /> Run Full Case Timeline
                    </button>
                  </div>

                  {documents.map((doc) => {
                    const isLoading = evidenceLoading[`chron_${doc.id}`]
                    const result = evidenceResults[`chron_${doc.id}`]
                    return (
                      <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <i className="ti ti-calendar" style={{ fontSize: 16, color: '#2563eb' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569', fontWeight: 500 }}>{doc.documentType || 'Exhibit'}</span>
                          </div>

                          <button
                            disabled={isLoading}
                            onClick={async () => {
                              if (evidenceLoading[`chron_${doc.id}`]) return
                              setEvidenceLoading(prev => ({ ...prev, [`chron_${doc.id}`]: true }))
                              try {
                                const res = await aiApi.getChronology(doc.id)
                                setEvidenceResults(prev => ({ ...prev, [`chron_${doc.id}`]: res.result || res.chronology }))
                              } catch (err: any) {
                                setEvidenceResults(prev => ({ ...prev, [`chron_${doc.id}`]: `Error: ${err.message || 'Failed to extract timeline.'}` }))
                              } finally {
                                setEvidenceLoading(prev => ({ ...prev, [`chron_${doc.id}`]: false }))
                              }
                            }}
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
                                Extracting...
                              </>
                            ) : result ? (
                              <>
                                <i className="ti ti-refresh" style={{ fontSize: 13 }} />
                                Re-extract Timeline
                              </>
                            ) : (
                              <>
                                <i className="ti ti-calendar-plus" style={{ fontSize: 13 }} />
                                Extract Timeline
                              </>
                            )}
                          </button>
                        </div>

                        {isLoading && (
                          <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', fontSize: 12, background: '#f8fafc' }}>
                            <i className="ti ti-loader animate-spin" style={{ fontSize: 16 }} />
                            <span>Extracting date sequences and procedural events from <strong>{doc.fileName}</strong>...</span>
                          </div>
                        )}

                        {!isLoading && result && (
                          <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="ti ti-calendar-time" style={{ color: '#2563eb' }} /> Date & Time Incident Timeline
                              </span>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => setEvidenceResults(prev => ({ ...prev, [`mode_chron_${doc.id}`]: 'canvas' }))}
                                  style={{
                                    padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                                    background: (evidenceResults[`mode_chron_${doc.id}`] ?? 'canvas') === 'canvas' ? '#2563eb' : '#e2e8f0',
                                    color: (evidenceResults[`mode_chron_${doc.id}`] ?? 'canvas') === 'canvas' ? '#fff' : '#64748b',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <i className="ti ti-layout-grid" /> Spatial Flow
                                </button>
                                <button
                                  onClick={() => setEvidenceResults(prev => ({ ...prev, [`mode_chron_${doc.id}`]: 'list' }))}
                                  style={{
                                    padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                                    background: evidenceResults[`mode_chron_${doc.id}`] === 'list' ? '#2563eb' : '#e2e8f0',
                                    color: evidenceResults[`mode_chron_${doc.id}`] === 'list' ? '#fff' : '#64748b',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <i className="ti ti-list" /> List View
                                </button>
                              </div>
                            </div>

                            {/* Serpentine Snake Roadmap View */}
                            {(evidenceResults[`mode_chron_${doc.id}`] ?? 'canvas') === 'canvas' && (
                              <div style={{ height: 540, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
                                <SerpentineTimeline
                                  items={(() => {
                                    const parsed = parseAiJson(result)
                                    // If AI returned structured events array
                                    if (Array.isArray(parsed?.Events) && parsed.Events.length > 0) {
                                      return parsed.Events.map((ev: any, i: number) => {
                                        const isMilestone = (ev.Category || '').toLowerCase().includes('police') || (ev.Category || '').toLowerCase().includes('fir') || (ev.Category || '').toLowerCase().includes('order') || i === 0
                                        return {
                                          id: `chron_ev_${doc.id}_${i}`,
                                          date: ev.DisplayDate || ev.Date || `Step ${i + 1}`,
                                          year: ev.Year || (ev.Date ? ev.Date.split('-')[0] : undefined),
                                          title: ev.Title || ev.Category || 'Incident Event',
                                          description: ev.Description || ev.EventDetails || String(ev),
                                          category: ev.Category,
                                          source: ev.Source || doc.fileName,
                                          isMajorMilestone: isMilestone,
                                          highlightColor: isMilestone ? 'red' : 'grey'
                                        } as SerpentineTimelineItem
                                      })
                                    }

                                    // Fallback parser from markdown lines (Extracting dates)
                                    const rawText = parsed?.DraftText || parsed?.draftText || (typeof result === 'string' ? result : JSON.stringify(result || ''))
                                    const lines = String(rawText).split('\n')
                                    const itemsList: SerpentineTimelineItem[] = []
                                    let stepCount = 1

                                    lines.forEach((l) => {
                                      const trimmed = l.trim()
                                      if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ') || /^\d+\.\s+/.test(trimmed)) {
                                        const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '')
                                        // Try to extract date pattern if present (e.g. 15th March, 2018, 24 August 2023)
                                        const dateMatch = cleanTitle.match(/\(?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+\d{4})?|\d{4})\)?/)
                                        const dateStr = dateMatch ? dateMatch[1] : `Step ${stepCount}`
                                        const yearMatch = cleanTitle.match(/\b(19\d\d|20\d\d)\b/)

                                        itemsList.push({
                                          id: `chron_node_${doc.id}_${stepCount}`,
                                          date: dateStr,
                                          year: yearMatch ? yearMatch[1] : undefined,
                                          title: cleanTitle.replace(/\(?(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+\d{4})?)\)?/g, '').trim() || cleanTitle,
                                          description: cleanTitle,
                                          isMajorMilestone: stepCount === 1 || cleanTitle.toLowerCase().includes('fir') || cleanTitle.toLowerCase().includes('arrest'),
                                          highlightColor: stepCount === 1 ? 'red' : 'grey'
                                        })
                                        stepCount++
                                      }
                                    })

                                    return itemsList.length > 0 ? itemsList : [
                                      {
                                        id: `chron_node_${doc.id}_1`,
                                        date: 'Case Timeline',
                                        year: '2024',
                                        title: 'Procedural Events Extracted',
                                        description: String(rawText),
                                        isMajorMilestone: true
                                      }
                                    ]
                                  })()}
                                />
                              </div>
                            )}

                            {/* List View */}
                            {evidenceResults[`mode_chron_${doc.id}`] === 'list' && (
                              <AIResponseFormatter content={result} />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Aggregated Timeline Events: Canvas Flow View OR Master Table View */}
              {timeline.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        Cross-Document Master Chronology
                      </span>
                      <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                        {timeline.length} Events
                      </span>
                    </div>

                    {/* View Switcher: Serpentine Roadmap vs Interactive Flow vs Table */}
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <button
                        onClick={() => setViewMode('canvas')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                          borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                          background: viewMode === 'canvas' ? '#ffffff' : 'transparent',
                          color: viewMode === 'canvas' ? '#1e293b' : '#64748b',
                          boxShadow: viewMode === 'canvas' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="ti ti-timeline" /> Snake Roadmap
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                          borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                          background: viewMode === 'table' ? '#ffffff' : 'transparent',
                          color: viewMode === 'table' ? '#1e293b' : '#64748b',
                          boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="ti ti-table" /> Table View
                      </button>
                    </div>
                  </div>

                  {/* ── SERPENTINE SNAKE ROADMAP VIEW (MATCHING USER REFERENCE IMAGE) ── */}
                  {viewMode === 'canvas' && (
                    <div style={{ height: 600, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
                      <SerpentineTimeline
                        items={timeline.map((ev, i) => {
                          const dateObj = ev.eventDate ? new Date(ev.eventDate) : null
                          const dateStr = dateObj
                            ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Unknown Date'
                          const yearStr = dateObj ? dateObj.getFullYear() : undefined
                          
                          const evLower = (ev.event || '').toLowerCase()
                          const isMajor = evLower.includes('fir') || evLower.includes('arrest') || evLower.includes('death') || evLower.includes('order') || evLower.includes('judgment') || i === 0

                          return {
                            id: ev.id ?? i,
                            date: dateStr,
                            year: yearStr,
                            title: ev.event,
                            description: ev.event,
                            category: ev.category || 'Procedural Step',
                            source: ev.source || 'Case Dossier',
                            isMajorMilestone: isMajor,
                            highlightColor: isMajor ? 'red' : 'grey'
                          } as SerpentineTimelineItem
                        })}
                      />
                    </div>
                  )}

                  {/* ── TRADITIONAL TABLE VIEW ── */}
                  {viewMode === 'table' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 650, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
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

              {documents.length === 0 && (
                <div style={{ padding: 60, textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <i className="ti ti-calendar-event" style={{ fontSize: 36, color: '#cbd5e1' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>No documents uploaded yet.</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Upload Document
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CASE SUMMARY VIEW */}
          {activeTab === 'summary' && (
            <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Document list with on-demand summary buttons */}
              {documents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                      Case Documents (<strong style={{ color: '#0f172a' }}>{documents.length}</strong>). Click <strong>"Summarize Document"</strong> on any file to evaluate individually or run Master Summary:
                    </p>
                    <button
                      disabled={analyzing}
                      onClick={handleRunAnalysis}
                      style={{
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                        padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <i className="ti ti-notes" /> Run Full Case Summary
                    </button>
                  </div>

                  {documents.map((doc) => {
                    const isLoading = evidenceLoading[`sum_${doc.id}`]
                    const result = evidenceResults[`sum_${doc.id}`]
                    return (
                      <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <i className="ti ti-file-description" style={{ fontSize: 16, color: '#2563eb' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569', fontWeight: 500 }}>{doc.documentType || 'Document'}</span>
                          </div>

                          <button
                            disabled={isLoading}
                            onClick={async () => {
                              if (evidenceLoading[`sum_${doc.id}`]) return
                              setEvidenceLoading(prev => ({ ...prev, [`sum_${doc.id}`]: true }))
                              try {
                                const res = await aiApi.getEvidence(doc.id)
                                setEvidenceResults(prev => ({ ...prev, [`sum_${doc.id}`]: res.result }))
                              } catch (err: any) {
                                setEvidenceResults(prev => ({ ...prev, [`sum_${doc.id}`]: `Error: ${err.message || 'Failed to summarize document.'}` }))
                              } finally {
                                setEvidenceLoading(prev => ({ ...prev, [`sum_${doc.id}`]: false }))
                              }
                            }}
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
                                Summarizing...
                              </>
                            ) : result ? (
                              <>
                                <i className="ti ti-refresh" style={{ fontSize: 13 }} />
                                Re-summarize
                              </>
                            ) : (
                              <>
                                <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
                                Summarize Document
                              </>
                            )}
                          </button>
                        </div>

                        {isLoading && (
                          <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', fontSize: 12, background: '#f8fafc' }}>
                            <i className="ti ti-loader animate-spin" style={{ fontSize: 16 }} />
                            <span>Synthesizing legal facts and strategic points from <strong>{doc.fileName}</strong>...</span>
                          </div>
                        )}

                        {!isLoading && result && (
                          <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="ti ti-notes" style={{ color: '#2563eb' }} /> Document Legal Summary
                              </span>
                            </div>
                            <AIResponseFormatter content={result} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Master Case Summary */}
              {!summary && summaryRaw && (
                <div style={{ padding: 4 }}>
                  <AIResponseFormatter content={summaryRaw} />
                </div>
              )}

              {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginTop: 6 }}>
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
                        {summary.keyWeaknesses?.map((w, i) => <li key={i}>{w}</li>)}
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

              {documents.length === 0 && !summary && !summaryRaw && (
                <div style={{ padding: 60, textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <i className="ti ti-notes" style={{ fontSize: 36, color: '#cbd5e1' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>No case summary generated yet.</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Upload Document
                  </button>
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
                          <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 22, height: 22, borderRadius: 6, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                                  <i className="ti ti-sparkles" />
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                  Evidentiary Intelligence & Strategic Analysis
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {/* Canvas vs List Toggle */}
                                <div style={{ display: 'flex', background: '#e2e8f0', padding: '2px', borderRadius: 8 }}>
                                  <button
                                    onClick={() => setEvidenceResults(prev => ({ ...prev, [`mode_${doc.id}`]: 'canvas' }))}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                                      borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                                      background: (evidenceResults[`mode_${doc.id}`] ?? 'canvas') === 'canvas' ? '#ffffff' : 'transparent',
                                      color: (evidenceResults[`mode_${doc.id}`] ?? 'canvas') === 'canvas' ? '#1e293b' : '#64748b',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <i className="ti ti-layout-grid" /> Sticky Canvas
                                  </button>
                                  <button
                                    onClick={() => setEvidenceResults(prev => ({ ...prev, [`mode_${doc.id}`]: 'list' }))}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                                      borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none',
                                      background: evidenceResults[`mode_${doc.id}`] === 'list' ? '#ffffff' : 'transparent',
                                      color: evidenceResults[`mode_${doc.id}`] === 'list' ? '#1e293b' : '#64748b',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <i className="ti ti-list" /> List View
                                  </button>
                                </div>

                                <button
                                  onClick={() => navigator.clipboard.writeText(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result))}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    background: '#fff', border: '1px solid #cbd5e1',
                                    padding: '4px 10px', borderRadius: 6, fontSize: 11,
                                    fontWeight: 600, color: '#475569', cursor: 'pointer'
                                  }}
                                >
                                  <i className="ti ti-copy" style={{ fontSize: 12 }} /> Copy
                                </button>
                              </div>
                            </div>

                            {/* Sticky Canvas View */}
                            {(evidenceResults[`mode_${doc.id}`] ?? 'canvas') === 'canvas' && (
                              <div style={{ height: 560, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
                                <CanvasFlowTimeline
                                  items={(() => {
                                    const parsed = parseAiJson(result)
                                    const rawText = parsed?.DraftText || parsed?.draftText || parsed?.Analysis || parsed?.analysis || (typeof result === 'string' ? result : JSON.stringify(result || ''))
                                    const lines = String(rawText || '').split('\n')
                                    const cardItems: CanvasCardItem[] = []
                                    let currentSection = 'Evidence Overview'
                                    let currentBuffer: string[] = []
                                    let stepCount = 1

                                    lines.forEach((l) => {
                                      const trimmed = l.trim()
                                      if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ') || /^\d+\.\s+/.test(trimmed)) {
                                        if (currentBuffer.length > 0) {
                                          const desc = currentBuffer.join('\n').trim()
                                          const descLower = desc.toLowerCase()
                                          const isRed = descLower.includes('risk') || descLower.includes('fail') || descLower.includes('misconduct') || descLower.includes('misappropriation') || descLower.includes('poison') || descLower.includes('suspicious') || descLower.includes('contradict')
                                          const isGreen = descLower.includes('compliance') || descLower.includes('natural justice') || descLower.includes('negative') || descLower.includes('favorable') || descLower.includes('support')
                                          const isAmber = descLower.includes('pending') || descLower.includes('examination') || descLower.includes('medium')

                                          cardItems.push({
                                            id: `card_${doc.id}_${stepCount}`,
                                            stepNumber: stepCount,
                                            title: currentSection,
                                            badgeText: `Point ${stepCount}`,
                                            badgeColor: isRed ? 'red' : isGreen ? 'green' : isAmber ? 'amber' : 'blue',
                                            description: desc,
                                            icon: isRed ? '⚠️' : isGreen ? '✅' : '📋'
                                          })
                                          stepCount++
                                          currentBuffer = []
                                        }
                                        currentSection = trimmed.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '')
                                      } else if (trimmed && !trimmed.match(/^---+$/)) {
                                        currentBuffer.push(trimmed)
                                      }
                                    })

                                    if (currentBuffer.length > 0) {
                                      const desc = currentBuffer.join('\n').trim()
                                      const descLower = desc.toLowerCase()
                                      const isRed = descLower.includes('risk') || descLower.includes('fail') || descLower.includes('misconduct') || descLower.includes('misappropriation') || descLower.includes('poison') || descLower.includes('suspicious') || descLower.includes('contradict')
                                      const isGreen = descLower.includes('compliance') || descLower.includes('natural justice') || descLower.includes('negative') || descLower.includes('favorable') || descLower.includes('support')
                                      const isAmber = descLower.includes('pending') || descLower.includes('examination') || descLower.includes('medium')

                                      cardItems.push({
                                        id: `card_${doc.id}_${stepCount}`,
                                        stepNumber: stepCount,
                                        title: currentSection,
                                        badgeText: `Point ${stepCount}`,
                                        badgeColor: isRed ? 'red' : isGreen ? 'green' : isAmber ? 'amber' : 'blue',
                                        description: desc,
                                        icon: isRed ? '⚠️' : isGreen ? '✅' : '📋'
                                      })
                                    }

                                    return cardItems.length > 0 ? cardItems : [
                                      {
                                        id: `card_${doc.id}_1`,
                                        stepNumber: 1,
                                        title: 'Evidence Summary',
                                        badgeText: 'Summary',
                                        badgeColor: 'blue',
                                        description: String(rawText),
                                        icon: '📄'
                                      }
                                    ]
                                  })()}
                                />
                              </div>
                            )}

                            {/* Classic List View */}
                            {evidenceResults[`mode_${doc.id}`] === 'list' && (
                              <div style={{ lineHeight: 1.7, fontSize: 13, color: '#334155' }}>
                                <AIResponseFormatter content={result} />
                              </div>
                            )}
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
