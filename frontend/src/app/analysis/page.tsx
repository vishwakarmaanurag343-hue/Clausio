'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { documentsApi, timelineApi, aiApi, casesApi, parseAiJson, BASE } from '@/lib/api'
import FlashCard from '@/components/common/FlashCard'

type AnalysisStatus = 'idle' | 'uploading' | 'completed'

interface EvidenceCard {
  documentName?: string; documentType?: string; dateOrPeriod?: string
  impact?: string; claim?: string; supports?: string
  whatItShows?: string; whatItDoesNotProve?: string; admissibilityNotes?: string
  contradictions?: string | null; howToUseInCourt?: string
  summary?: string // legacy field — older cached reviews
}

interface SummaryCards {
  caseTitle?: string; caseType?: string; court?: string; stage?: string
  overview?: string
  issuesForDetermination?: string[]
  parties?: string; reliefSought?: string; clientCase?: string; opposingCase?: string
  keyFacts?: string; proceduralHistory?: string; evidenceOverview?: string; applicableLaw?: string
  strengths?: string[]; weaknesses?: string[]
  currentPosition?: string
  nextSteps?: string[]; openQuestions?: string[]
}

// Timeline event categories — colors double as legend and dot fills
const CATEGORY_COLORS: Record<string, string> = { Medical: '#ef4444', Financial: '#10b981', Procedural: '#2563eb', Incident: '#f59e0b' }
const CATEGORY_ICONS: Record<string, string> = { Medical: 'ti-heartbeat', Financial: 'ti-coin', Procedural: 'ti-gavel', Incident: 'ti-bolt' }
const catColor = (c?: string | null) => CATEGORY_COLORS[(c ?? '').trim()] ?? '#94a3b8'
const catIcon  = (c?: string | null) => CATEGORY_ICONS[(c ?? '').trim()] ?? 'ti-point'
const CATEGORIES = ['Medical', 'Financial', 'Procedural', 'Incident'] as const

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

// ── Case-brief section model — drives both the on-screen brief and Copy / Export ──
type BriefTone = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate'
const TONE: Record<BriefTone, { bar: string; head: string; band: string; chip: string }> = {
  blue:   { bar: '#3b82f6', head: '#1e40af', band: '#eff6ff', chip: '#dbeafe' },
  green:  { bar: '#10b981', head: '#15803d', band: '#f0fdf4', chip: '#dcfce7' },
  red:    { bar: '#ef4444', head: '#b91c1c', band: '#fef2f2', chip: '#fee2e2' },
  amber:  { bar: '#f59e0b', head: '#b45309', band: '#fffbeb', chip: '#fef3c7' },
  purple: { bar: '#8b5cf6', head: '#7e22ce', band: '#faf5ff', chip: '#f3e8ff' },
  slate:  { bar: '#94a3b8', head: '#475569', band: '#f8fafc', chip: '#f1f5f9' },
}

const SUMMARY_SNAPSHOT: { key: keyof SummaryCards; label: string }[] = [
  { key: 'caseTitle', label: 'Case' },
  { key: 'caseType',  label: 'Nature' },
  { key: 'court',     label: 'Court / Forum' },
  { key: 'stage',     label: 'Stage' },
]

const SUMMARY_SECTIONS: { key: keyof SummaryCards; label: string; icon: string; tone: BriefTone; kind: 'prose' | 'list' }[] = [
  { key: 'overview',               label: 'Overview',                      icon: 'ti-eye',            tone: 'blue',   kind: 'prose' },
  { key: 'issuesForDetermination', label: 'Issues for Determination',      icon: 'ti-help-circle',    tone: 'purple', kind: 'list'  },
  { key: 'parties',                label: 'Parties',                       icon: 'ti-users',          tone: 'slate',  kind: 'prose' },
  { key: 'reliefSought',           label: 'Relief Sought',                 icon: 'ti-target-arrow',   tone: 'blue',   kind: 'prose' },
  { key: 'clientCase',             label: 'Our Case',                      icon: 'ti-scale',          tone: 'green',  kind: 'prose' },
  { key: 'opposingCase',           label: "Opposing Party's Case",         icon: 'ti-scale',          tone: 'red',    kind: 'prose' },
  { key: 'keyFacts',               label: 'Key Facts',                     icon: 'ti-list-details',   tone: 'slate',  kind: 'prose' },
  { key: 'proceduralHistory',      label: 'Procedural History',            icon: 'ti-gavel',          tone: 'slate',  kind: 'prose' },
  { key: 'evidenceOverview',       label: 'Evidence Overview',             icon: 'ti-folder',         tone: 'blue',   kind: 'prose' },
  { key: 'applicableLaw',          label: 'Applicable Law',                icon: 'ti-book-2',         tone: 'purple', kind: 'prose' },
  { key: 'strengths',              label: 'Strengths',                     icon: 'ti-thumb-up',       tone: 'green',  kind: 'list'  },
  { key: 'weaknesses',             label: 'Weaknesses',                    icon: 'ti-alert-triangle', tone: 'amber',  kind: 'list'  },
  { key: 'currentPosition',        label: 'Current Position & Limitation', icon: 'ti-map-pin',        tone: 'amber',  kind: 'prose' },
  { key: 'nextSteps',              label: 'Next Steps',                    icon: 'ti-checklist',      tone: 'blue',   kind: 'list'  },
  { key: 'openQuestions',          label: 'Open Questions to Verify',      icon: 'ti-question-mark',  tone: 'red',    kind: 'list'  },
]

const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()) : []
const asText = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/** Full brief as headed plain text — shared by Copy and Export PDF. */
function briefToText(sc: SummaryCards): { header: string; sections: [string, string][] } {
  const snap = SUMMARY_SNAPSHOT
    .map(({ key, label }) => [label, asText(sc[key])] as [string, string])
    .filter(([, t]) => t)
  const header = snap.map(([l, t]) => `${l}: ${t}`).join('\n')
  const sections = SUMMARY_SECTIONS
    .map(({ key, label, kind }) => {
      const body = kind === 'list'
        ? asList(sc[key]).map(x => `• ${x}`).join('\n')
        : asText(sc[key])
      return [label, body] as [string, string]
    })
    .filter(([, t]) => t)
  return { header, sections }
}

// Turn a raw API/network error into an advocate-readable message.
function friendlyAnalysisError(err: any, fallback: string): string {
  const msg = err?.message || ''
  if (msg.includes('INSUFFICIENT_CREDITS')) return 'You have run out of AI credits. Contact support@clausiotech.com.'
  if (/timeout/i.test(msg)) return 'The AI took too long to respond. This happens with large cases. Please try again.'
  if (msg.toLowerCase().includes('context') || msg.includes('16000')) return 'Too many documents to process at once. Please try with fewer documents.'
  return msg || fallback
}

const LOADING_STEPS = [
  'Loading the case documents...',
  'Extracting key entities, dates, and party details...',
  'Running cross-document chronology parsing & index compilation...',
  'Evaluating case summary and evidence...',
]

export default function AnalysisPage() {
  const { selectedCaseId, selectedCaseName, setSelectedCase } = useCaseStore()

  const [cases, setCases] = useState<Array<{ id: string; title: string; caseNumber?: string }>>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseDocuments, setCaseDocuments] = useState<Array<{
    id: string
    fileName: string
    documentType?: string
    ocrStatus: string
    sizeBytes: number
  }>>([])
  const [docsLoading, setDocsLoading] = useState(false)

  const [status,       setStatus]       = useState<AnalysisStatus>('idle')
  const [loadingStep,  setLoadingStep]  = useState<number>(0)
  const [activeTab,    setActiveTab]    = useState<'chronology' | 'summary' | 'evidence'>('chronology')
  const [error,        setError]        = useState('')

  const [documents, setDocuments] = useState<any[]>([])
  const [timeline,  setTimeline]  = useState<any[]>([])
  const [summaryCards, setSummaryCards] = useState<SummaryCards | null>(null)
  const [summaryParseFailed, setSummaryParseFailed] = useState(false)
  const [retryingSummary, setRetryingSummary] = useState(false)
  const [copiedBrief, setCopiedBrief] = useState(false)
  const [chronologyParseFailed, setChronologyParseFailed] = useState(false)
  const [retryingChronology, setRetryingChronology] = useState(false)
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null)
  const [chronoFilter, setChronoFilter] = useState<'all' | typeof CATEGORIES[number]>('all')
  const [sourceHint, setSourceHint] = useState('')
  const [showLowEvidence, setShowLowEvidence] = useState(false)

  const [evidenceCards, setEvidenceCards]     = useState<EvidenceCard[]>([])
  const [evidenceSummary, setEvidenceSummary] = useState<string>('')
  const [missingEvidence, setMissingEvidence] = useState<string[]>([])
  const [evidenceParseFailed, setEvidenceParseFailed] = useState(false)
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [evidenceFetched, setEvidenceFetched] = useState(false)
  const [retryingEvidence, setRetryingEvidence] = useState(false)

  // Load the advocate's cases once, for the case selector.
  useEffect(() => {
    setCasesLoading(true)
    casesApi.getAll()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.cases ?? data?.data ?? []
        setCases(list.map((c: any) => ({
          id: c.id,
          title: c.name || c.title || c.caseTitle || 'Untitled Case',
          caseNumber: c.caseNumber || c.cnrNumber || '',
        })))
      })
      .catch(() => setCases([]))
      .finally(() => setCasesLoading(false))
  }, [])

  // Load the selected case's documents + any saved timeline. Results persist across
  // refresh; a case that has never been analysed stays on the selector so the advocate
  // can review its documents before running.
  useEffect(() => {
    if (!selectedCaseId) {
      setDocuments([])
      setCaseDocuments([])
      setTimeline([])
      return
    }
    setDocsLoading(true)
    Promise.all([
      documentsApi.getByCaseId(selectedCaseId),
      timelineApi.getByCaseId(selectedCaseId),
    ]).then(([docs, tl]) => {
      const docsArr = Array.isArray(docs) ? docs : (docs?.documents ?? docs?.data ?? [])
      const tlArr   = Array.isArray(tl) ? tl : []
      setDocuments(docsArr)
      setCaseDocuments(docsArr.map((d: any) => ({
        id: d.id,
        fileName: d.fileName || d.name || '',
        documentType: d.documentType || d.category || '',
        ocrStatus: d.ocrStatus || d.status || 'Unknown',
        sizeBytes: d.sizeBytes || d.fileSize || d.size || 0,
      })))
      setTimeline(tlArr)
      if (tlArr.length > 0) setStatus('completed')
    }).catch(err => {
      console.error(err)
      setDocuments([])
      setCaseDocuments([])
    }).finally(() => setDocsLoading(false))
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
      setEvidenceSummary(obj && typeof obj?.evidenceSummary === 'string' ? obj.evidenceSummary : '')
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
    const { header, sections } = briefToText(summaryCards)
    const text = [
      header,
      ...sections.map(([h, t]) => `${h.toUpperCase()}\n${t}`),
    ].filter(Boolean).join('\n\n')
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
    const { header, sections } = briefToText(summaryCards)
    const headerHtml = header ? `<div class="snapshot">${paras(header)}</div>` : ''
    const sectionsHtml = sections
      .map(([h, t]) => `<h2>${esc(h)}</h2>${paras(t)}`)
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
        .snapshot{background:#f6f7f9;border:1px solid #e3e6ea;border-radius:6px;padding:12px 16px;margin-bottom:22px}
        .snapshot p{margin:0 0 4px;font-size:12.5px;text-align:left}
        @media print{body{margin:24px auto}}
      </style></head><body>
      <h1>${esc(selectedCaseName)}</h1>
      <div class="meta">Case Brief · generated by Clausio AI · grounded in uploaded documents · ${new Date().toLocaleDateString('en-IN')}</div>
      ${headerHtml}
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
    if (caseDocuments.length === 0) {
      setError('This case has no documents to analyse. Upload documents in the Documents section first.')
      return
    }

    setStatus('uploading')
    setLoadingStep(0)
    setError('')

    try {
      setLoadingStep(1)
      await saveChronologyFromAi()
      setLoadingStep(2)

      await saveSummaryFromAi()
      setLoadingStep(3)
      setEvidenceFetched(false) // re-review the evidence next time the Evidence tab opens

      setStatus('completed')
      setActiveTab('chronology')
    } catch (err: any) {
      setError(friendlyAnalysisError(err, 'Analysis failed. Please try again.'))
      setStatus('idle')
    }
  }, [selectedCaseId, caseDocuments, saveChronologyFromAi, saveSummaryFromAi])

  const handleReset = () => {
    setStatus('idle')
    setLoadingStep(0)
    setError('')
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
            Select a case to analyse all of its documents together.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Top actions */}
          {status === 'completed' && (
            <button
              className="glass-button"
              onClick={handleReset}
              style={{ height: 38, padding: '0 16px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="ti ti-refresh" style={{ fontSize: 14 }} />
              Change case
            </button>
          )}

          {status === 'idle' && (() => {
            const blocked = !selectedCaseId
              ? 'Select a case first'
              : caseDocuments.length === 0
              ? 'Upload documents to this case first'
              : undefined
            const disabled = !!blocked
            return (
              <button
                className="glass-button"
                onClick={handleRunAnalysis}
                disabled={disabled}
                title={blocked}
                style={{ height: 38, padding: '0 16px', background: disabled ? '#93c5fd' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: disabled ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)' }}
              >
                <i className="ti ti-brain" style={{ fontSize: 14 }} />
                Run analysis
              </button>
            )
          })()}
        </div>
      </div>

      {/* ── CORE VIEWS ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {error && (
          <div style={{ maxWidth: 760, margin: '0 auto 16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 8 }}>{error}</div>
            <button
              onClick={() => { setError(''); handleRunAnalysis() }}
              disabled={!selectedCaseId || caseDocuments.length === 0}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !selectedCaseId || caseDocuments.length === 0 ? 0.5 : 1 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── STATE 1: IDLE / UPLOAD AREA ── */}
        {status === 'idle' && (
          <div style={{ maxWidth: 760, margin: '20px auto 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Case selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Select Case
                </label>
                <select
                  value={selectedCaseId || ''}
                  onChange={(e) => {
                    const id = e.target.value
                    const picked = cases.find(c => c.id === id)
                    setSelectedCase(id, picked?.title ?? '')
                  }}
                  disabled={casesLoading}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
                    background: '#fff', fontSize: 14, color: '#0f172a', fontFamily: 'inherit',
                    cursor: casesLoading ? 'wait' : 'pointer', outline: 'none',
                  }}
                >
                  <option value="">
                    {casesLoading ? 'Loading cases...' : '— Select a case —'}
                  </option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}{c.caseNumber ? ` · ${c.caseNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Document list — shows after case selected */}
            {selectedCaseId && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  {docsLoading
                    ? 'Loading documents...'
                    : `${caseDocuments.length} Document${caseDocuments.length !== 1 ? 's' : ''} Found`}
                </div>

                {docsLoading ? (
                  <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
                    <i className="ti ti-loader animate-spin" style={{ fontSize: 18 }} />
                  </div>
                ) : caseDocuments.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
                    No documents uploaded for this case yet. Upload documents in the Documents section first.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {caseDocuments.map(doc => {
                      const ready = doc.ocrStatus === 'Done' || doc.ocrStatus === 'Completed'
                      return (
                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <i className="ti ti-file-text" style={{ fontSize: 14, color: '#2563eb', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.fileName}
                            </div>
                            {doc.documentType && (
                              <div style={{ fontSize: 11, color: '#64748b' }}>{doc.documentType}</div>
                            )}
                          </div>
                          <span style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, flexShrink: 0,
                            background: ready ? '#dcfce7' : '#fef9c3', color: ready ? '#16a34a' : '#a16207',
                          }}>
                            {ready ? '✓ Ready' : 'Processing'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {caseDocuments.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-info-circle" style={{ fontSize: 14 }} />
                    All {caseDocuments.length} documents will be analysed together. For best results ensure all documents show ✓ Ready status.
                  </div>
                )}
              </div>
            )}

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
              {activeTab === 'chronology' && (() => {
                const sorted = [...timeline].sort((a, b) => new Date(a.eventDate ?? 0).getTime() - new Date(b.eventDate ?? 0).getTime())
                const counts: Record<string, number> = { Medical: 0, Financial: 0, Procedural: 0, Incident: 0 }
                for (const ev of sorted) { const c = (ev.category ?? '').trim(); if (c in counts) counts[c]++ }
                const validDates = sorted
                  .map(ev => (ev.eventDate ? new Date(ev.eventDate) : null))
                  .filter(d => d && !isNaN(+d) && +d !== 0) as Date[]
                const span = validDates.length
                  ? `${validDates[0].toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} — ${validDates[validDates.length - 1].toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
                  : ''
                const visible = chronoFilter === 'all' ? sorted : sorted.filter(ev => (ev.category ?? '').trim() === chronoFilter)
                const regen = async () => { setRetryingChronology(true); try { await saveChronologyFromAi() } finally { setRetryingChronology(false) } }
                const chip = (val: 'all' | typeof CATEGORIES[number], label: string, count: number, color: string) => {
                  const active = chronoFilter === val
                  return (
                    <button key={val} onClick={() => setChronoFilter(val)} disabled={count === 0 && val !== 'all'}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, fontFamily: 'inherit',
                        fontSize: 11, fontWeight: 700, cursor: count === 0 && val !== 'all' ? 'default' : 'pointer',
                        border: `1px solid ${active ? color : '#e2e8f0'}`, background: active ? `${color}14` : '#fff',
                        color: active ? color : (count === 0 && val !== 'all' ? '#cbd5e1' : '#64748b'), transition: 'all .12s' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                      {label}<span style={{ fontSize: 10, opacity: 0.75 }}>{count}</span>
                    </button>
                  )
                }
                let lastYear = ''
                return (
                  <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 20px' }}>

                    {/* Parse-failure panel — never dump raw model output */}
                    {chronologyParseFailed && (
                      <div style={{ maxWidth: 720, margin: '0 auto 16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12.5, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        The AI response could not be read as a verified timeline.
                        <button onClick={regen} disabled={retryingChronology}
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
                      <div style={{ maxWidth: 760, margin: '0 auto' }}>

                        {/* Header strip */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>Case Chronology</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                              {sorted.length} verified event{sorted.length === 1 ? '' : 's'}{span ? ` · ${span}` : ''}
                            </div>
                          </div>
                          <button onClick={regen} disabled={retryingChronology} style={REGEN_BTN}>
                            {retryingChronology ? 'Regenerating…' : '↻ Regenerate'}
                          </button>
                        </div>

                        {/* Category filter chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
                          {chip('all', 'All', sorted.length, '#334155')}
                          {CATEGORIES.map(cat => chip(cat, cat, counts[cat], catColor(cat)))}
                        </div>

                        {/* Timeline */}
                        {visible.length === 0 ? (
                          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                            No {chronoFilter !== 'all' ? `“${chronoFilter}” ` : ''}events to show.
                          </div>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            {visible.map((ev, i) => {
                              const d = ev.eventDate ? new Date(ev.eventDate) : null
                              const valid = d && !isNaN(+d) && +d !== 0
                              const unparsedNote: string | null =
                                typeof ev.legalSignificance === 'string' && ev.legalSignificance.startsWith('Date as in document:')
                                  ? ev.legalSignificance.replace('Date as in document: ', '')
                                  : null
                              const conflict: string | null = !unparsedNote && ev.legalSignificance ? ev.legalSignificance : null
                              const rowKey = String(ev.id ?? i)
                              const expanded = expandedTimelineId === rowKey
                              const toggle = () => setExpandedTimelineId(expanded ? null : rowKey)
                              const cat = typeof ev.category === 'string' ? ev.category.trim() : ''
                              const color = catColor(cat)
                              const yr = valid ? String(d!.getFullYear()) : ''
                              const showYear = !!yr && yr !== lastYear
                              if (showYear) lastYear = yr
                              return (
                                <div key={rowKey}>
                                  {showYear && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px', paddingLeft: 90 }}>
                                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{yr}</span>
                                      <span style={{ flex: 1, borderTop: '1px dashed #e2e8f0' }} />
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: 12 }}>
                                    {/* Date column */}
                                    <div style={{ width: 78, flexShrink: 0, textAlign: 'right', paddingTop: 13 }}>
                                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
                                        {valid ? `${d!.getDate()} ${d!.toLocaleDateString('en-IN', { month: 'short' })}` : '—'}
                                      </div>
                                      {unparsedNote && (
                                        <div style={{ fontSize: 9, fontWeight: 500, color: '#94a3b8', marginTop: 2 }}>{unparsedNote}</div>
                                      )}
                                    </div>
                                    {/* Rail + node */}
                                    <div style={{ position: 'relative', width: 14, flexShrink: 0 }}>
                                      <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 2, background: 'linear-gradient(#e2e8f0, #eef2f7)' }} />
                                      <button
                                        onClick={toggle}
                                        aria-label={`Toggle event on ${valid ? d!.toLocaleDateString('en-IN') : 'unknown date'}`}
                                        title={`${cat || 'Uncategorised'}${conflict ? ' · conflicting dates' : ''}`}
                                        style={{ position: 'absolute', left: 0, top: 12, width: 14, height: 14, borderRadius: '50%', padding: 0, cursor: 'pointer',
                                          background: color, border: '2px solid #fff', boxShadow: `0 0 0 3px ${color}33`, outline: conflict ? '2px solid #f59e0b' : 'none' }} />
                                    </div>
                                    {/* Event card */}
                                    <div
                                      onClick={toggle}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggle() }}
                                      style={{ flex: 1, minWidth: 0, marginBottom: expanded ? 16 : 9,
                                        background: conflict && !expanded ? '#fffbeb' : '#fff',
                                        border: `1px solid ${expanded ? '#cbd5e1' : conflict ? '#fde68a' : '#e8edf3'}`,
                                        borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '11px 14px', cursor: 'pointer',
                                        boxShadow: expanded ? '0 6px 20px rgba(15,23,42,0.07)' : '0 1px 2px rgba(15,23,42,0.03)', transition: 'box-shadow .15s' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
                                          color: color === '#94a3b8' ? '#64748b' : color, background: `${color}14`, border: `1px solid ${color}44`, borderRadius: 8, padding: '2px 8px' }}>
                                          <i className={`ti ${catIcon(cat)}`} style={{ fontSize: 11 }} />
                                          {cat || 'Other'}
                                        </span>
                                        {conflict && !expanded && (
                                          <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '1px 7px' }}>
                                            ⚠ date conflict
                                          </span>
                                        )}
                                        <span style={{ flex: 1 }} />
                                        <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ flexShrink: 0, fontSize: 13, color: '#94a3b8' }} />
                                      </div>

                                      {!expanded && (
                                        <p style={{ margin: '7px 0 0', fontSize: 12.5, lineHeight: 1.5, color: '#334155', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                          {ev.event ?? ''}
                                        </p>
                                      )}

                                      {expanded && (
                                        <>
                                          <p style={{ margin: '9px 0 0', fontSize: 12.5, lineHeight: 1.75, color: '#0f172a', whiteSpace: 'pre-line' }}>{ev.event}</p>
                                          {conflict && (
                                            <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 11px', fontSize: 11.5, lineHeight: 1.6, color: '#92400e' }}>
                                              ⚠ <strong>Conflicting date:</strong> another document gives “{conflict}”. Verify against both originals before relying on this entry.
                                            </div>
                                          )}
                                          {ev.source && (
                                            <div style={{ marginTop: 10 }}>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); openSourceDocument(ev.source) }}
                                                title="Open the source document"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '4px 11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                📄 {ev.source} — open ↗
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {sourceHint && (
                      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: '#0f172a', color: '#fff', fontSize: 12, padding: '8px 16px', borderRadius: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
                        {sourceHint}
                      </div>
                    )}
                  </div>
                )
              })()}

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
                    const sc = summaryCards
                    const snapshot = SUMMARY_SNAPSHOT
                      .map(({ key, label }) => ({ label, value: asText(sc[key]) }))
                      .filter(s => s.value)
                    const sections = SUMMARY_SECTIONS
                      .map(s => ({ ...s, prose: s.kind === 'prose' ? asText(sc[s.key]) : '', list: s.kind === 'list' ? asList(sc[s.key]) : [] }))
                      .filter(s => s.prose || s.list.length)
                    const words = sections.reduce((n, s) =>
                      n + (s.prose ? s.prose.split(/\s+/).filter(Boolean).length : 0)
                        + s.list.reduce((k, t) => k + t.split(/\s+/).filter(Boolean).length, 0), 0)
                    const minutes = Math.max(1, Math.round(words / 200))
                    return (
                      <div style={{ maxWidth: 780, margin: '0 auto' }}>
                        {/* Brief header: identity + read time + actions */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                          <div style={{ minWidth: 0 }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                              {asText(sc.caseTitle) || selectedCaseName || 'Case'} — Case Brief
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span>📖 {minutes} min read</span>·<span>{sections.length} sections</span>·<span>grounded in {documents.length || 'the uploaded'} document{documents.length === 1 ? '' : 's'}</span>
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

                        {/* Snapshot card */}
                        {snapshot.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                            {snapshot.map(s => (
                              <div key={s.label} style={{ background: '#fff', padding: '11px 14px' }}>
                                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3 }}>{s.label}</div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>{s.value}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* The brief itself — one continuous document */}
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                          {sections.map((s, i) => {
                            const t = TONE[s.tone]
                            return (
                              <section key={s.key as string} style={{ borderTop: i === 0 ? 'none' : '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: t.band, borderLeft: `3px solid ${t.bar}` }}>
                                  <i className={`ti ${s.icon}`} style={{ fontSize: 14, color: t.head }} />
                                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: t.head }}>{s.label}</span>
                                </div>
                                <div style={{ padding: '14px 24px 18px' }}>
                                  {s.prose && (
                                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, color: '#1f2937', whiteSpace: 'pre-line', textAlign: 'justify' }}>{s.prose}</p>
                                  )}
                                  {s.list.length > 0 && (
                                    <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                      {s.list.map((item, k) => (
                                        <li key={k} style={{ fontSize: 13, lineHeight: 1.7, color: '#1f2937' }}>{item}</li>
                                      ))}
                                    </ol>
                                  )}
                                </div>
                              </section>
                            )
                          })}
                        </div>

                        <p style={{ margin: '12px 2px 0', fontSize: 10.5, color: '#94a3b8', lineHeight: 1.6 }}>
                          Generated by Clausio AI from the uploaded record. Verify every date, figure and citation against the originals before relying on this brief in court.
                        </p>
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

                    const docDetail = (label: string, val?: string | null, color = '#475569') => {
                      const v = (val ?? '').trim()
                      if (!v || /^(none|null|n\/?a|nil)\.?$/i.test(v)) return null
                      return (
                        <div style={{ marginTop: 6, fontSize: 11.5, lineHeight: 1.6, color }}>
                          <span style={{ fontWeight: 700, color: '#334155' }}>{label} </span>{v}
                        </div>
                      )
                    }
                    const docRow = (ev: EvidenceCard, i: number) => {
                      const badge = impactBadge(ev.impact)
                      const muted = badge.label.startsWith('LOW')
                      const meta = [ev.documentType, ev.dateOrPeriod].map(x => (x ?? '').trim()).filter(Boolean).join(' · ')
                      const body = asText(ev.whatItShows) || asText(ev.summary)
                      return (
                        <div key={i} style={{ background: '#ffffff', border: `1px solid ${muted ? '#f1f5f9' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px', opacity: muted ? 0.85 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: meta ? 4 : 7 }}>
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
                          {meta && <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 7, paddingLeft: 20 }}>{meta}</div>}
                          <div style={{ marginBottom: 7 }}>
                            <span style={{ display: 'inline-block', fontSize: 10.5, padding: '3px 9px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 600, lineHeight: 1.55 }}>
                              ⚖ {ev.supports || 'Claim mapping not stated'}
                            </span>
                          </div>
                          {body && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: '#334155', whiteSpace: 'pre-line' }}>{body}</p>}
                          {docDetail('Does not prove:', ev.whatItDoesNotProve, '#92400e')}
                          {docDetail('Admissibility:', ev.admissibilityNotes)}
                          {docDetail('Contradiction:', ev.contradictions, '#b91c1c')}
                          {docDetail('Say in court:', ev.howToUseInCourt, '#1d4ed8')}
                        </div>
                      )
                    }

                    return (
                      <>
                        {/* Overall evidence picture — the model's case-level read */}
                        {evidenceSummary.trim() && (
                          <div style={{ maxWidth: 780, margin: '0 auto 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '13px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#334155', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 7 }}>
                              <i className="ti ti-clipboard-text" style={{ fontSize: 14, color: '#1d4ed8' }} />
                              Evidence — Overall Picture
                            </div>
                            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-line' }}>{evidenceSummary}</p>
                          </div>
                        )}

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
