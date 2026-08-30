'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { documentsApi, timelineApi, aiApi, parseAiJson, BASE } from '@/lib/api'
import FlashCard from '@/components/common/FlashCard'

type AnalysisStatus = 'idle' | 'uploading' | 'completed'

interface EvidenceCard { documentName?: string; impact?: string; claim?: string; supports?: string; summary?: string }

// Timeline event categories — colors double as legend and dot fills
const CATEGORY_COLORS: Record<string, string> = { Medical: '#ef4444', Financial: '#10b981', Procedural: '#2563eb', Incident: '#f59e0b' }
const catColor = (c?: string | null) => CATEGORY_COLORS[(c ?? '').trim()] ?? '#94a3b8'

const REGEN_BTN: React.CSSProperties = { height: 26, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap' }

// PrepBriefCard-style status-pill conventions: green = rely on it, amber = corroborates,
// grey = safe to skip (the prompt ranks weak documents Low precisely so they sink)
function impactBadge(impact?: string) {
  const s = (impact ?? '').toLowerCase()
  if (s === 'high')   return { label: 'HIGH IMPACT',    bg: '#f0fdf4', fg: '#15803d', bd: '#86efac' }
  if (s === 'medium') return { label: 'MEDIUM IMPACT',  bg: '#fefce8', fg: '#a16207', bd: '#fde047' }
  if (s === 'low')    return { label: 'LOW — SKIP',     bg: '#f1f5f9', fg: '#64748b', bd: '#e2e8f0' }
  return               { label: `${(impact || 'UNRATED').toUpperCase()} IMPACT`, bg: '#f1f5f9', fg: '#64748b', bd: '#e2e8f0' }
}

const LOADING_STEPS = [
  'Uploading documents to the case file...',
  'Extracting key entities, dates, and party details...',
  'Running cross-document chronology parsing & index compilation...',
  'Evaluating case summary and evidence...',
]

export default function AnalysisPage() {
  const { selectedCaseId, selectedCaseName } = useCaseStore()

  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pastedText,   setPastedText]   = useState<string>('')
  const [status,       setStatus]       = useState<AnalysisStatus>('idle')
  const [loadingStep,  setLoadingStep]  = useState<number>(0)
  const [activeTab,    setActiveTab]    = useState<'chronology' | 'summary' | 'evidence'>('chronology')
  const [error,        setError]        = useState('')

  const [documents, setDocuments] = useState<any[]>([])
  const [timeline,  setTimeline]  = useState<any[]>([])
  const [summaryCards, setSummaryCards] = useState<{ overview?: string; parties?: string; reliefSought?: string; keyFacts?: string; proceduralHistory?: string; currentPosition?: string } | null>(null)
  const [summaryParseFailed, setSummaryParseFailed] = useState(false)
  const [retryingSummary, setRetryingSummary] = useState(false)
  const [copiedBrief, setCopiedBrief] = useState(false)
  const [chronologyParseFailed, setChronologyParseFailed] = useState(false)
  const [retryingChronology, setRetryingChronology] = useState(false)
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null)
  const [sourceHint, setSourceHint] = useState('')
  const [showLowEvidence, setShowLowEvidence] = useState(false)

  const [evidenceCards, setEvidenceCards]     = useState<EvidenceCard[]>([])
  const [missingEvidence, setMissingEvidence] = useState<string[]>([])
  const [evidenceParseFailed, setEvidenceParseFailed] = useState(false)
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [evidenceFetched, setEvidenceFetched] = useState(false)
  const [retryingEvidence, setRetryingEvidence] = useState(false)

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

  // Fetch case-level Evidence Intelligence, parse the strict { evidence:[…],
  // missingEvidence:[…] } contract. Returns false only when the response could not be
  // read (never renders raw JSON).
  const saveEvidenceFromAi = useCallback(async (): Promise<boolean> => {
    if (!selectedCaseId) return true
    setEvidenceLoading(true)
    try {
      const res = await aiApi.getCaseEvidence(selectedCaseId)
      const obj = parseAiJson<any>(res.result ?? '')
      const cards: EvidenceCard[] | null = obj && typeof obj === 'object' && !Array.isArray(obj) && Array.isArray(obj.evidence)
        ? obj.evidence.filter((c: any) => c && typeof c === 'object')
        : null
      const gaps: string[] = obj && typeof obj === 'object' && Array.isArray(obj.missingEvidence)
        ? obj.missingEvidence.filter((g: any) => typeof g === 'string' && g.trim())
        : []
      setEvidenceCards(cards ?? [])
      setMissingEvidence(gaps)
      setEvidenceParseFailed(!cards)
      return !!cards
    } catch {
      setEvidenceParseFailed(true)
      return false
    } finally {
      setEvidenceLoading(false)
    }
  }, [selectedCaseId])

  // Open a timeline event's source document: fuzzy-match the model-quoted name against
  // the case's uploaded files, stream the real file through the authed endpoint and
  // open it in a new tab. Unmatched names surface a hint instead of failing silently.
  const openSourceDocument = useCallback(async (sourceName?: string | null) => {
    if (!sourceName || !selectedCaseId) return
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const target = norm(sourceName)
    let best: any = null
    let bestOverlap = 0
    for (const d of documents) {
      const fname = norm(d.fileName ?? '')
      if (!fname) continue
      const overlap = fname === target ? 9999
        : (target.includes(fname) || fname.includes(target)) ? Math.min(fname.length, target.length)
        : 0
      if (overlap > bestOverlap) { bestOverlap = overlap; best = d }
    }
    if (!best) {
      setSourceHint(`Couldn't locate "${sourceName}" among the uploaded documents.`)
      setTimeout(() => setSourceHint(''), 4000)
      return
    }
    try {
      const token = localStorage.getItem('clausio_token')
      const res = await fetch(`${BASE}/cases/${selectedCaseId}/documents/${best.id}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch {
      setSourceHint(`Couldn't open "${best.fileName}".`)
      setTimeout(() => setSourceHint(''), 4000)
    }
  }, [selectedCaseId, documents])

  // Copy the full brief as headed plain text
  const copyBrief = useCallback(async () => {
    if (!summaryCards) return
    const text = ([
      ['Overview', summaryCards.overview],
      ['Parties', summaryCards.parties],
      ['Relief Sought', summaryCards.reliefSought],
      ['Key Facts', summaryCards.keyFacts],
      ['Procedural History', summaryCards.proceduralHistory],
      ['Current Position', summaryCards.currentPosition],
    ] as const).filter(([, t]) => t && t.trim())
      .map(([h, t]) => `${h.toUpperCase()}\n${t}`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedBrief(true)
      setTimeout(() => setCopiedBrief(false), 2000)
    } catch { /* clipboard unavailable — silent */ }
  }, [summaryCards])

  // Export the brief as a print-styled PDF via a popup window (no dependencies)
  const exportBriefPdf = useCallback(() => {
    if (!summaryCards || !selectedCaseName) return
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    const paras = (t: string) => t.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br/>')}</p>`).join('')
    const sectionsHtml = ([
      ['Overview', summaryCards.overview],
      ['Parties', summaryCards.parties],
      ['Relief Sought', summaryCards.reliefSought],
      ['Key Facts', summaryCards.keyFacts],
      ['Procedural History', summaryCards.proceduralHistory],
      ['Current Position', summaryCards.currentPosition],
    ] as const).filter(([, t]) => t && t.trim())
      .map(([h, t]) => `<h2>${esc(h)}</h2>${paras(t!)}`)
      .join('')
    const win = window.open('', '_blank', 'width=820,height=920')
    if (!win) return
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${esc(selectedCaseName)} — Case Brief</title>
      <style>
        body{font-family:Georgia,'Times New Roman',serif;line-height:1.75;color:#111;max-width:700px;margin:48px auto;padding:0 24px}
        h1{font-size:20px;margin:0 0 2px}
        .meta{color:#666;font-size:12px;margin-bottom:26px}
        h2{font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#333;border-bottom:1px solid #ddd;padding-bottom:4px;margin:26px 0 10px}
        p{margin:0 0 12px;font-size:14px;text-align:justify}
        @media print{body{margin:24px auto}}
      </style></head><body>
      <h1>${esc(selectedCaseName)}</h1>
      <div class="meta">Case Brief · generated by Clausio AI · grounded in uploaded documents · ${new Date().toLocaleDateString('en-IN')}</div>
      ${sectionsHtml}
      </body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }, [summaryCards, selectedCaseName])

  // Run the review automatically the first time the Evidence tab is opened;
  // handleRunAnalysis clears evidenceFetched so fresh uploads get re-reviewed.
  useEffect(() => {
    if (activeTab === 'evidence' && !evidenceFetched && selectedCaseId && documents.length > 0) {
      setEvidenceFetched(true)
      saveEvidenceFromAi()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, documents, selectedCaseId])

  // Fetch the AI chronology, parse the strict {timeline:[…]} contract and persist it.
  // Returns false only when the response could not be read (never renders raw JSON).
  const saveChronologyFromAi = useCallback(async (): Promise<boolean> => {
    if (!selectedCaseId) return true
    const chronRes = await aiApi.getChronology(selectedCaseId)
    const chronObj = parseAiJson<any>(chronRes.chronology ?? chronRes.result ?? '')
    const rawEvents: any[] | null = Array.isArray(chronObj) ? chronObj : chronObj?.timeline ?? null
    setChronologyParseFailed(!rawEvents)
    if (!rawEvents || rawEvents.length === 0) {
      if (rawEvents) await timelineApi.bulkReplace(selectedCaseId, [])
      setTimeline([])
      return !!rawEvents
    }

    // Drop near-duplicate events the model sometimes emits (same date + same gist).
    const seen = new Set<string>()
    const events = rawEvents.filter(e => {
      const key = `${(e.date ?? '').trim()}|${(e.event ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 80)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    await timelineApi.bulkReplace(selectedCaseId, events.map((e, i) => {
      // EventDate is a non-nullable DateTime column — normalise; when a document's
      // date format can't be parsed keep it visible via legalSignificance
      const parsed = new Date(e.date ?? '')
      const unparseable = isNaN(+parsed)
      return {
        eventDate:         unparseable ? new Date(0).toISOString() : parsed.toISOString(),
        event:             e.event ?? '',
        source:            e.sourceDocument ?? '',
        legalSignificance: e.conflictingDate ?? (unparseable ? `Date as in document: ${e.date}` : null),
        category:          typeof e.category === 'string' ? e.category : '',
        sortOrder:         i,
      }
    }))
    const tl = await timelineApi.getByCaseId(selectedCaseId)
    setTimeline(Array.isArray(tl) ? tl : [])
    return true
  }, [selectedCaseId])

  // Fetch the AI summary, parse the strict {summary:[{parties, reliefSought, keyFacts,
  // proceduralHistory}]} contract. Returns false only when the response could not be
  // read (never renders raw JSON).
  const saveSummaryFromAi = useCallback(async (): Promise<boolean> => {
    if (!selectedCaseId) return true
    const res = await aiApi.getSummary(selectedCaseId)
    const obj = parseAiJson<any>(res.result ?? '')
    const entry: any = Array.isArray(obj) ? obj[0] : obj?.summary?.[0] ?? null
    setSummaryCards(entry && typeof entry === 'object' ? entry : null)
    setSummaryParseFailed(!entry)
    return !!entry
  }, [selectedCaseId])

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

      await saveChronologyFromAi()
      setLoadingStep(2)

      await saveSummaryFromAi()
      setLoadingStep(3)
      setEvidenceFetched(false) // fresh uploads get re-reviewed next time the Evidence tab opens

      setStatus('completed')
      setActiveTab('chronology')
      setPendingFiles([])
      setPastedText('')
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.')
      setStatus('idle')
    }
  }, [selectedCaseId, pendingFiles, pastedText, saveChronologyFromAi, saveSummaryFromAi])

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

              {/* TAB 1: VERIFIED CHRONOLOGY — INTERACTIVE CATEGORY TIMELINE */}
              {activeTab === 'chronology' && (
                <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 20px' }}>

                  {/* Legend + regenerate row */}
                  {timeline.length > 0 && (
                    <div style={{ maxWidth: 720, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 10.5, color: '#64748b' }}>
                        {(['Medical', 'Financial', 'Procedural', 'Incident'] as const).map(cat => (
                          <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: catColor(cat) }} /> {cat}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={async () => {
                          setRetryingChronology(true)
                          try { await saveChronologyFromAi() } finally { setRetryingChronology(false) }
                        }}
                        disabled={retryingChronology}
                        style={REGEN_BTN}>
                        {retryingChronology ? 'Regenerating…' : '↻ Regenerate'}
                      </button>
                    </div>
                  )}

                  {/* Parse-failure panel — never dump raw model output */}
                  {chronologyParseFailed && (
                    <div style={{ maxWidth: 680, margin: '0 auto 16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12.5, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      The AI response could not be read as a verified timeline.
                      <button
                        onClick={async () => {
                          setRetryingChronology(true)
                          try { await saveChronologyFromAi() } finally { setRetryingChronology(false) }
                        }}
                        disabled={retryingChronology}
                        style={{ height: 28, padding: '0 12px', border: 'none', borderRadius: 7, background: retryingChronology ? '#fecaca' : '#dc2626', color: '#fff', cursor: retryingChronology ? 'wait' : 'pointer', fontWeight: 700, fontSize: 11.5, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        {retryingChronology ? 'Retrying…' : 'Retry AI Chronology'}
                      </button>
                    </div>
                  )}

                  {timeline.length === 0 && (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                      No dated events were found in the case documents yet.
                    </div>
                  )}

                  {timeline.length > 0 && (
                    <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', paddingLeft: 118 }}>
                      {/* rail */}
                      <div style={{ position: 'absolute', left: 104, top: 14, bottom: 14, width: 2, background: '#e2e8f0' }} />
                      {[...timeline]
                        .sort((a, b) => new Date(a.eventDate ?? 0).getTime() - new Date(b.eventDate ?? 0).getTime())
                        .map((ev, i) => {
                          const d = ev.eventDate ? new Date(ev.eventDate) : null
                          const valid = d && !isNaN(+d) && +d !== 0
                          const unparsedNote: string | null =
                            typeof ev.legalSignificance === 'string' && ev.legalSignificance.startsWith('Date as in document:')
                              ? ev.legalSignificance.replace('Date as in document: ', '')
                              : null
                          const conflict: string | null = !unparsedNote && ev.legalSignificance ? ev.legalSignificance : null
                          const rowKey = String(ev.id ?? i)
                          const expanded = expandedTimelineId === rowKey
                          const cat = typeof ev.category === 'string' ? ev.category.trim() : ''
                          return (
                            <div key={rowKey} style={{ position: 'relative', marginBottom: expanded ? 18 : 10 }}>
                              {/* date marker */}
                              <div style={{ position: 'absolute', left: -114, top: 11, width: 92, textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#334155', fontVariantNumeric: 'tabular-nums', lineHeight: 1.35 }}>
                                {valid ? d!.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                {unparsedNote && (
                                  <div style={{ fontSize: 9, fontWeight: 500, color: '#94a3b8', marginTop: 1 }}>{unparsedNote}</div>
                                )}
                              </div>
                              {/* clickable category node */}
                              <button
                                onClick={() => setExpandedTimelineId(expanded ? null : rowKey)}
                                title={`${cat || 'Uncategorised'}${conflict ? ' · conflicting dates' : ''} — click to ${expanded ? 'collapse' : 'expand'}`}
                                aria-label={`Expand event on ${valid ? d!.toLocaleDateString('en-IN') : 'unknown date'}`}
                                style={{ position: 'absolute', left: -15.5, top: 13, width: 13, height: 13, borderRadius: '50%', padding: 0, cursor: 'pointer', background: catColor(cat), border: `2px solid ${conflict ? '#fff' : '#fff'}`, outline: conflict ? '2px solid #f59e0b' : 'none', boxShadow: `0 0 0 1.5px ${catColor(cat)}55` }} />
                              {/* event card — click anywhere toggles */}
                              <div
                                onClick={() => setExpandedTimelineId(expanded ? null : rowKey)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpandedTimelineId(expanded ? null : rowKey) }}
                                style={{ background: conflict && !expanded ? '#fffbeb' : '#fff', border: `1px solid ${expanded ? '#cbd5e1' : conflict ? '#fde68a' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: '50%', background: catColor(cat), opacity: 0.85 }} />
                                  {!expanded ? (
                                    <p style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.55, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {typeof ev.event === 'string' && ev.event.length > 120 ? `${ev.event.slice(0, 120)}…` : (ev.event ?? '')}
                                    </p>
                                  ) : (
                                    <span style={{ flex: 1, fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: catColor(cat) === '#94a3b8' ? '#64748b' : catColor(cat) }}>
                                      {cat || 'Uncategorised'}{conflict ? ' · date conflict' : ''}
                                    </span>
                                  )}
                                  {conflict && !expanded && (
                                    <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '1px 7px' }}>
                                      ⚠ date conflict
                                    </span>
                                  )}
                                  <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ flexShrink: 0, fontSize: 13, color: '#94a3b8' }} />
                                </div>

                                {expanded && (
                                  <>
                                    <p style={{ margin: '9px 0 0', fontSize: 12.5, lineHeight: 1.7, color: '#0f172a', whiteSpace: 'pre-line' }}>{ev.event}</p>
                                    {conflict && (
                                      <div style={{ marginTop: 9, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 11px', fontSize: 11.5, lineHeight: 1.6, color: '#92400e' }}>
                                        ⚠ <strong>Conflicting date:</strong> another document gives “{conflict}”. Verify against both originals before relying on this entry.
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                      {ev.source && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); openSourceDocument(ev.source) }}
                                          title="Open the source document"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '4px 11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                          📄 {ev.source} — open ↗
                                        </button>
                                      )}
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: catColor(cat) === '#94a3b8' ? '#64748b' : catColor(cat), background: `${catColor(cat)}18`, border: `1px solid ${catColor(cat)}55`, borderRadius: 10, padding: '3px 9px' }}>
                                        ● {cat || 'Other'}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {sourceHint && (
                    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: '#0f172a', color: '#fff', fontSize: 12, padding: '8px 16px', borderRadius: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
                      {sourceHint}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CASE SUMMARY — SCROLLABLE NARRATIVE BRIEF */}
              {activeTab === 'summary' && (
                <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 20px' }}>

                  {/* Parse-failure panel — never dump raw model output */}
                  {summaryParseFailed && (
                    <div style={{ maxWidth: 680, margin: '0 auto 16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12.5, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      The AI response could not be read as a case brief.
                      <button
                        onClick={async () => {
                          setRetryingSummary(true)
                          try { await saveSummaryFromAi() } finally { setRetryingSummary(false) }
                        }}
                        disabled={retryingSummary}
                        style={{ height: 28, padding: '0 12px', border: 'none', borderRadius: 7, background: retryingSummary ? '#fecaca' : '#dc2626', color: '#fff', cursor: retryingSummary ? 'wait' : 'pointer', fontWeight: 700, fontSize: 11.5, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        {retryingSummary ? 'Retrying…' : 'Retry AI Summary'}
                      </button>
                    </div>
                  )}

                  {!summaryCards && (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No summary yet.</div>
                  )}

                  {summaryCards && (() => {
                    const sections = ([
                      ['Overview', summaryCards.overview],
                      ['Parties', summaryCards.parties],
                      ['Relief Sought', summaryCards.reliefSought],
                      ['Key Facts', summaryCards.keyFacts],
                      ['Procedural History', summaryCards.proceduralHistory],
                      ['Current Position', summaryCards.currentPosition],
                    ] as const).filter(([, t]) => t && t.trim())
                    const words = sections.reduce((n, [, t]) => n + (t ?? '').split(/\s+/).filter(Boolean).length, 0)
                    const minutes = Math.max(1, Math.round(words / 200))
                    return (
                      <div style={{ maxWidth: 760, margin: '0 auto' }}>
                        {/* Brief header: identity + read time + actions */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                          <div style={{ minWidth: 0 }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                              {selectedCaseName || 'Case'} — Case Brief
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span>📖 {minutes} min read</span>·<span>grounded in {documents.length || 'the uploaded'} document{documents.length === 1 ? '' : 's'}</span>
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button onClick={copyBrief} style={{ ...REGEN_BTN, background: copiedBrief ? '#f0fdf4' : '#fff', borderColor: copiedBrief ? '#86efac' : '#e2e8f0', color: copiedBrief ? '#15803d' : '#475569' }}>
                              {copiedBrief ? '✓ Copied' : 'Copy'}
                            </button>
                            <button onClick={exportBriefPdf} disabled={!selectedCaseName} style={REGEN_BTN}>⬇ Export PDF</button>
                            <button
                              onClick={async () => {
                                setRetryingSummary(true)
                                try { await saveSummaryFromAi() } finally { setRetryingSummary(false) }
                              }}
                              disabled={retryingSummary}
                              style={REGEN_BTN}>
                              {retryingSummary ? 'Regenerating…' : '↻ Regenerate'}
                            </button>
                          </div>
                        </div>

                        {/* The brief itself — one continuous document */}
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '26px 28px' }}>
                          {sections.map(([label, text], i) => (
                            <section key={label} style={{ marginBottom: i < sections.length - 1 ? 22 : 0 }}>
                              <h3 style={{ margin: '0 0 9px', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#1e40af' }}>{label}</h3>
                              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, color: '#1f2937', whiteSpace: 'pre-line', textAlign: 'justify' }}>{text}</p>
                            </section>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* TAB 3: EVIDENCE INTELLIGENCE — STRENGTH METER + CLAIM CLUSTERS */}
              {activeTab === 'evidence' && (
                <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 20px' }}>

                  {/* Parse-failure panel — never dump raw model output */}
                  {evidenceParseFailed && (
                    <div style={{ maxWidth: 680, margin: '0 auto 16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12.5, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      The AI response could not be read as an evidence review.
                      <button
                        onClick={async () => {
                          setRetryingEvidence(true)
                          try { await saveEvidenceFromAi() } finally { setRetryingEvidence(false) }
                        }}
                        disabled={retryingEvidence || evidenceLoading}
                        style={{ height: 28, padding: '0 12px', border: 'none', borderRadius: 7, background: retryingEvidence ? '#fecaca' : '#dc2626', color: '#fff', cursor: retryingEvidence ? 'wait' : 'pointer', fontWeight: 700, fontSize: 11.5, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        {retryingEvidence ? 'Retrying…' : 'Retry AI Review'}
                      </button>
                    </div>
                  )}

                  {documents.length === 0 && !evidenceParseFailed && (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No documents uploaded for this case yet.</div>
                  )}

                  {/* Regenerate row */}
                  {documents.length > 0 && !evidenceParseFailed && (
                    <div style={{ maxWidth: 780, margin: '0 auto 14px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => saveEvidenceFromAi()} disabled={evidenceLoading} style={REGEN_BTN}>
                        {evidenceLoading ? 'Regenerating…' : '↻ Regenerate'}
                      </button>
                    </div>
                  )}

                  {evidenceLoading && (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                      Reading every uploaded document and ranking it by the claim it serves…
                    </div>
                  )}

                  {!evidenceLoading && !evidenceParseFailed && documents.length > 0 && evidenceCards.length === 0 && (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No evidence review yet.</div>
                  )}

                  {!evidenceLoading && evidenceCards.length > 0 && (() => {
                    const h = evidenceCards.filter(c => (c.impact ?? '').toLowerCase() === 'high').length
                    const m = evidenceCards.filter(c => (c.impact ?? '').toLowerCase() === 'medium').length
                    const l = evidenceCards.filter(c => (c.impact ?? '').toLowerCase() === 'low').length
                    const total = h + m + l
                    // Low documents count in the denominator — a file of skippable docs
                    // honestly drags the score down instead of vanishing from the math
                    const score = total ? Math.round(((h * 3 + m * 2) / (total * 3)) * 100) : 0
                    const band = score >= 67 ? 'STRONG' : score >= 34 ? 'MODERATE' : 'WEAK'
                    const bandColor = score >= 67 ? '#15803d' : score >= 34 ? '#a16207' : '#dc2626'
                    const bandBg = score >= 67 ? '#f0fdf4' : score >= 34 ? '#fefce8' : '#fef2f2'
                    const bandBd = score >= 67 ? '#86efac' : score >= 34 ? '#fde047' : '#fca5a5'

                    const rank = (v?: string) => (({ high: 0, medium: 1, low: 2 }) as Record<string, number>)[(v ?? '').toLowerCase()] ?? 3
                    const activeSorted = evidenceCards.filter(c => (c.impact ?? '').toLowerCase() !== 'low').sort((a, b) => rank(a.impact) - rank(b.impact))
                    const lowDocs = evidenceCards.filter(c => (c.impact ?? '').toLowerCase() === 'low').sort((a, b) => rank(a.impact) - rank(b.impact))

                    // Group by the model's stable claim label — identical labels cluster together
                    const groups: { claim: string; docs: EvidenceCard[] }[] = []
                    for (const c of activeSorted) {
                      const k = (c.claim ?? '').trim() || 'Unmapped'
                      let g = groups.find(x => x.claim === k)
                      if (!g) { g = { claim: k, docs: [] }; groups.push(g) }
                      g.docs.push(c)
                    }
                    groups.sort((a, b) => {
                      if (a.claim === 'Unmapped') return 1
                      if (b.claim === 'Unmapped') return -1
                      return Math.min(...a.docs.map(d => rank(d.impact))) - Math.min(...b.docs.map(d => rank(d.impact)))
                    })

                    const docRow = (ev: EvidenceCard, i: number) => {
                      const badge = impactBadge(ev.impact)
                      const muted = badge.label.startsWith('LOW')
                      return (
                        <div key={i} style={{ background: '#ffffff', border: `1px solid ${muted ? '#f1f5f9' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px', opacity: muted ? 0.85 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                              <i className="ti ti-file-text" style={{ fontSize: 14, color: muted ? '#94a3b8' : '#334155', flexShrink: 0 }} />
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ev.documentName || 'Unnamed document'}
                              </span>
                            </div>
                            <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, padding: '2px 10px', borderRadius: 10, background: badge.bg, border: `1px solid ${badge.bd}`, color: badge.fg }}>
                              {badge.label}
                            </span>
                          </div>
                          <div style={{ marginBottom: 7 }}>
                            <span style={{ display: 'inline-block', fontSize: 10.5, padding: '3px 9px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 600, lineHeight: 1.55 }}>
                              ⚖ {ev.supports || 'Claim mapping not stated'}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: '#334155', whiteSpace: 'pre-line' }}>{ev.summary}</p>
                        </div>
                      )
                    }

                    return (
                      <>
                        {/* Missing-evidence warning — specific gaps named by the review */}
                        {missingEvidence.length > 0 && (
                          <div style={{ maxWidth: 780, margin: '0 auto 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '13px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#dc2626', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 9 }}>
                              <i className="ti ti-alert-triangle" style={{ fontSize: 14 }} />
                              Missing Evidence — {missingEvidence.length} gap{missingEvidence.length > 1 ? 's' : ''} in the uploaded record
                            </div>
                            {missingEvidence.map((g, i) => (
                              <div key={i} style={{ borderLeft: '3px solid #f87171', paddingLeft: 10, marginTop: i > 0 ? 8 : 0, fontSize: 12, lineHeight: 1.65, color: '#991b1b' }}>
                                🚩 {g}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Aggregate evidence-strength meter */}
                        <div style={{ maxWidth: 780, margin: '0 auto 16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 9 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>Evidence Strength</span>
                            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
                              <strong style={{ fontSize: 20, fontVariantNumeric: 'tabular-nums', color: bandColor }}>{score}%</strong>
                              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, color: bandColor, background: bandBg, border: `1px solid ${bandBd}`, borderRadius: 10, padding: '2px 9px' }}>{band}</span>
                            </span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${score}%`, height: 8, background: bandColor, borderRadius: 4, transition: 'width .4s ease' }} />
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5, color: '#64748b', flexWrap: 'wrap' }}>
                            <span>● {h} High</span><span>● {m} Medium</span><span>● {l} Low</span>
                            <span style={{ marginLeft: 'auto' }}>scored across all {total} reviewed document{total === 1 ? '' : 's'} — Low documents drag it down honestly</span>
                          </div>
                        </div>

                        {/* Claim clusters — everything backing each claim, together */}
                        <div style={{ maxWidth: 780, margin: '0 auto' }}>
                          {groups.map(g => (
                            <div key={g.claim} style={{ marginBottom: 18 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: '#1e40af' }}>⚖</span>
                                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: '#334155' }}>{g.claim}</span>
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>{g.docs.length} document{g.docs.length === 1 ? '' : 's'}</span>
                                <span style={{ flex: 1, borderTop: '1px dashed #e2e8f0' }} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {g.docs.map(docRow)}
                              </div>
                            </div>
                          ))}

                          {/* Low-impact collapse — skippable docs sink here, closed by default */}
                          {lowDocs.length > 0 && (
                            <div style={{ marginBottom: 6 }}>
                              <button
                                onClick={() => setShowLowEvidence(v => !v)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 10, padding: '9px 13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                <i className={`ti ${showLowEvidence ? 'ti-chevron-down' : 'ti-chevron-right'}`} style={{ fontSize: 13, color: '#64748b' }} />
                                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: '#64748b' }}>
                                  Low impact ({lowDocs.length}) — likely safe to skip
                                </span>
                              </button>
                              {showLowEvidence && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                  {lowDocs.map(docRow)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
