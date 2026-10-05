'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BASE, casesApi, documentsApi, aiApi, parseAiJson, hearingsApi, readinessApi } from '@/lib/api'

// ── Static metadata for the 6 home-screen feature cards ─────────────────────
const FEATURE_META: Record<string, { title: string; subtitle: string }> = {
  risk:             { title: 'Risks in my case',      subtitle: 'What could go wrong' },
  recommendations:  { title: 'Recommendations',       subtitle: 'What your advocate should do next' },
  actionplan:       { title: 'Your action plan',      subtitle: 'Things you need to do' },
  contradiction:    { title: 'Gaps in their story',   subtitle: 'Where their version does not add up' },
  evidence:         { title: 'My evidence',           subtitle: 'Is your evidence strong enough?' },
  'ask-advocate':   { title: 'Ask your advocate',     subtitle: 'Questions to ask before next hearing' },
}

const GENERATE_LABELS: Record<string, string> = {
  'risk': 'Run Risk Analysis',
  'recommendations': 'Get Recommendations',
  'actionplan': 'Generate Action Plan',
  'contradiction': 'Find Contradictions',
  'evidence': 'Analyse My Evidence',
  'ask-advocate': 'Generate Questions',
}

const FEATURE_CARDS = [
  { type: 'risk',            icon: 'ti-alert-triangle',     iconBg: '#fef2f2', iconColor: '#dc2626' },
  { type: 'actionplan',      icon: 'ti-list-check',          iconBg: '#f0fdf4', iconColor: '#16a34a' },
  { type: 'ask-advocate',    icon: 'ti-message-question',    iconBg: '#fff7ed', iconColor: '#ea580c' },
  { type: 'contradiction',   icon: 'ti-git-compare',         iconBg: '#fefce8', iconColor: '#ca8a04' },
  { type: 'evidence',        icon: 'ti-zoom-question',       iconBg: '#f5f3ff', iconColor: '#7c3aed' },
  { type: 'recommendations', icon: 'ti-bulb',                iconBg: '#eff6ff', iconColor: '#2563eb' },
]

const NAV_ITEMS: { key: 'home' | 'mycase' | 'actions' | 'profile'; label: string; icon: string }[] = [
  { key: 'home',    label: 'Home',    icon: 'ti-home' },
  { key: 'mycase',  label: 'My Case', icon: 'ti-file-text' },
  { key: 'actions', label: 'Actions', icon: 'ti-list-check' },
  { key: 'profile', label: 'Profile', icon: 'ti-user' },
]

// Same cookie-read idiom already used elsewhere in the app (e.g. documents page).
function getCookieToken(): string {
  if (typeof document === 'undefined') return ''
  return document.cookie.split(';').find(c => c.trim().startsWith('clausio_token='))?.split('=')[1] ?? ''
}

// Flattens whatever shape an AI endpoint returned into readable prose.
function extractReadableText(res: any, keys: string[]): string {
  let raw: any
  for (const k of keys) {
    if (res?.[k] !== undefined) { raw = res[k]; break }
  }
  if (raw === undefined) raw = res?.result
  if (raw == null) return ''

  if (typeof raw === 'object') {
    try { return JSON.stringify(raw, null, 2) } catch { return String(raw) }
  }

  const text = String(raw).trim()
  const parsed = parseAiJson<any>(text)
  if (parsed) {
    if (Array.isArray(parsed)) {
      return parsed
        .map((p, i) => typeof p === 'string' ? `${i + 1}. ${p}` : `${i + 1}. ${p.title ?? p.task ?? p.point ?? JSON.stringify(p)}`)
        .join('\n\n')
    }
    if (typeof parsed === 'object') {
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('\n\n')
    }
  }
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
}

interface ActionItem {
  title: string
  priority: string
  howToDoIt?: string
  deadline?: string
}

function extractActionItems(res: any): ActionItem[] {
  const raw = res?.actionPlan ?? res?.result ?? res?.tasks ?? res?.items ?? ''
  const obj = parseAiJson<any>(typeof raw === 'string' ? raw : JSON.stringify(raw))
  const items: any[] = Array.isArray(obj) ? obj :
    Array.isArray(obj?.tasks) ? obj.tasks :
    Array.isArray(obj?.items) ? obj.items :
    (obj && typeof obj === 'object' && (obj.task || obj.title || obj.action)) ? [obj] :
    []

  return items
    .filter(it => it && typeof it === 'object' && (it.task || it.title || it.action))
    .map(it => ({
      title: String(it.task ?? it.title ?? it.action).trim(),
      priority: ['Critical', 'High', 'Medium', 'Low'].includes(it.priority) ? it.priority : 'Medium',
      howToDoIt: it.howToDoIt ?? it.details ?? it.description ?? '',
      deadline: it.deadline ?? '',
    }))
}

// Pulls the raw (un-flattened) value out of an AI response so it can still be
// JSON-parsed for card rendering — extractReadableText() below is meant for the
// final display string, but it collapses arrays/objects into prose, which
// destroys the structure renderFeatureContent() needs to parse back out.
function extractRawJson(res: any, keys: string[]): string {
  let raw: any
  for (const k of keys) {
    if (res?.[k] !== undefined) { raw = res[k]; break }
  }
  if (raw === undefined) raw = res?.result
  if (raw == null) return ''
  if (typeof raw === 'object') {
    try { return JSON.stringify(raw) } catch { return String(raw) }
  }
  return String(raw)
}

function fmtDate(d?: string | null): string {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' }
}

function getNextHearing(hearings: any[]) {
  if (!hearings?.length) return null
  const future = hearings
    .filter(h => {
      const d = h.hearingDate ?? h.HearingDate ?? h.date
      return d && new Date(d) >= new Date()
    })
    .sort((a, b) => {
      const da = new Date(a.hearingDate ?? a.HearingDate ?? a.date)
      const db = new Date(b.hearingDate ?? b.HearingDate ?? b.date)
      return da.getTime() - db.getTime()
    })
  return future[0] ?? hearings[hearings.length - 1]
}

export default function ClientPortalPage() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCaseState] = useState<any>(null)
  const [activeView, setActiveView] = useState<'home' | 'mycase' | 'hearing' | 'actions' | 'profile'>('home')
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  // Kept for backward compatibility — loadActionPlan() still writes its own
  // status marker ('ok' / "No action items...") here, since the actionplan
  // feature keeps its existing checklist rendering untouched. Every other
  // feature stores its result in featureContents below instead.
  const [featureContent, setFeatureContent] = useState<string>('')
  // Per-feature-type result cache, so switching away from a feature and back
  // (or to a different one) doesn't lose what was already generated.
  const [featureContents, setFeatureContents] = useState<Record<string, string>>({})
  // Tracks whether a feature has been run at least once, so the empty
  // "Generate" state only shows before the first run (including after an
  // error — the error message itself is shown via featureContents instead).
  const [featureGenerated, setFeatureGenerated] = useState<Record<string, boolean>>({})
  const [featureLoading, setFeatureLoading] = useState(false)
  const [checkedActions, setCheckedActions] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)

  // Structured action-plan items (needed for real checkboxes — featureContent
  // alone is a plain string and can't drive a checklist on its own).
  const [actionItems, setActionItems] = useState<ActionItem[]>([])

  // Profile → documents
  const [documents, setDocuments] = useState<any[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Onboarding — "describe your situation" modal
  const [showDescribeModal, setShowDescribeModal] = useState(false)
  const [describeText, setDescribeText] = useState('')
  const [describeError, setDescribeError] = useState('')
  const [describeSubmitting, setDescribeSubmitting] = useState(false)

  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('mobile')
  const [hearings, setHearings] = useState<any[]>([])
  const [readiness, setReadiness] = useState<any>(null)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  useEffect(() => {
    function check() {
      const w = window.innerWidth
      if (w < 768) setScreenSize('mobile')
      else if (w < 1280) setScreenSize('tablet')
      else setScreenSize('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function selectCase(c: any) {
    setSelectedCaseState(c)
  }

  // Shared cases(+hearings/readiness) loader — used on mount and again after
  // the onboarding "describe your situation" flow creates a new case.
  function loadCases() {
    return casesApi.getAll()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : []
        setCases(list)
        if (list.length > 0) {
          const first = list[0]
          selectCase(first)

          const caseId = first.id || first.Id
          if (caseId) {
            hearingsApi.getByCaseId(caseId)
              .then((data: any) => {
                const list = Array.isArray(data) ? data : data?.hearings ?? data?.data ?? []
                setHearings(list)
              })
              .catch(() => {})

            readinessApi.getByCaseId(caseId)
              .then(setReadiness)
              .catch(() => {})
          }
        }
      })
      .catch(() => setCases([]))
  }

  // ── Auth guard + initial data fetch ──────────────────────────────────────
  useEffect(() => {
    const token = getCookieToken()
    if (!token) {
      router.push('https://clausiotech.com/login')
      return
    }

    let parsedUser: any = null
    try { parsedUser = JSON.parse(localStorage.getItem('clausio_user') || 'null') } catch { parsedUser = null }

    if (!parsedUser || parsedUser.role !== 'Client') {
      router.push('/dashboard')
      return
    }

    setUser(parsedUser)

    loadCases().finally(() => setLoading(false))
  }, [router])

  // ── Lazy-load documents when Profile view is opened ──────────────────────
  useEffect(() => {
    if (activeView !== 'profile' || !selectedCase) return
    const caseId = selectedCase.id || selectedCase.Id
    setDocsLoading(true)
    documentsApi.getByCaseId(caseId)
      .then((d: any) => setDocuments(Array.isArray(d) ? d : []))
      .catch(() => setDocuments([]))
      .finally(() => setDocsLoading(false))
  }, [activeView, selectedCase])

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedCase) return
    const caseId = selectedCase.id || selectedCase.Id
    setUploading(true)
    try {
      await documentsApi.upload(caseId, file, 'Uploaded Document')
      const d = await documentsApi.getByCaseId(caseId)
      setDocuments(Array.isArray(d) ? d : [])
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // ── Shared action-plan loader (used by both the Home card and Actions tab) ──
  async function loadActionPlan() {
    if (!selectedCase) return
    setFeatureLoading(true)
    try {
      const caseId = selectedCase.id || selectedCase.Id
      const res = await aiApi.getActionPlan(caseId)
      console.log('ActionPlan response:', JSON.stringify(res).substring(0, 300))
      const items = extractActionItems(res)
      setActionItems(items)
      setCheckedActions(items.map(() => false))
      setFeatureContent(items.length > 0 ? 'ok' : 'No action items could be generated for this case yet.')
    } catch {
      setFeatureContent('Unable to load this analysis. Please try again.')
    } finally {
      setFeatureLoading(false)
    }
  }

  // Opening a feature only shows its screen now — it no longer runs the AI
  // automatically. The actual call is in runFeatureAI(), triggered by the
  // Generate / Regenerate button.
  function openFeature(type: string) {
    if (!selectedCase) return
    setActiveFeature(type)
  }

  // Extracted from the old openFeature() — the actual AI call per feature
  // type, now triggered explicitly by the Generate/Regenerate button rather
  // than automatically on open.
  async function runFeatureAI(type: string) {
    if (!selectedCase) return
    setFeatureLoading(true)

    const caseId = selectedCase.id || selectedCase.Id

    try {
      if (type === 'ask-advocate') {
        const res = await aiApi.getAskAdvocate(caseId)
        setFeatureContents(prev => ({ ...prev, [type]: extractRawJson(res, ['result']) }))
      } else if (type === 'actionplan') {
        // loadActionPlan() keeps its own existing logic/state untouched — it
        // manages featureContent, actionItems and featureLoading itself.
        await loadActionPlan()
      } else if (type === 'evidence') {
        const res = await aiApi.getCaseEvidence(caseId)
        setFeatureContents(prev => ({ ...prev, [type]: extractRawJson(res, ['evidence']) }))
      } else {
        const res =
          type === 'risk' ? await aiApi.getRisks(caseId) :
          type === 'recommendations' ? await aiApi.getRecommendations(caseId) :
          type === 'contradiction' ? await aiApi.getContradictions(caseId) :
          null

        setFeatureContents(prev => ({ ...prev, [type]: extractRawJson(res, ['risks', 'recommendations', 'contradictions']) }))
      }
    } catch {
      if (type !== 'actionplan') {
        setFeatureContents(prev => ({ ...prev, [type]: 'Unable to load this analysis. Please try again.' }))
      }
    } finally {
      setFeatureGenerated(prev => ({ ...prev, [type]: true }))
      setFeatureLoading(false)
    }
  }

  function toggleChecked(i: number) {
    setCheckedActions(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  function shareActionsOnWhatsApp() {
    const lines = actionItems.map((a, i) => `${i + 1}. ${a.title}${checkedActions[i] ? ' ✅' : ''}`)
    const text = `My Clausio action plan:\n\n${lines.join('\n')}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function handleLogout() {
    document.cookie = 'clausio_token=; path=/; max-age=0'
    localStorage.removeItem('clausio_token')
    localStorage.removeItem('clausio_user')
    localStorage.removeItem('clausio-auth')
    localStorage.removeItem('clausio_page_permissions')
    window.location.href = 'https://clausiotech.com/login'
  }

  async function handleDescribeSubmit() {
    const wordCount = describeText.trim().split(/\s+/).filter(Boolean).length
    if (wordCount < 50) {
      setDescribeError(`Please write at least 50 words (currently ${wordCount}).`)
      return
    }
    setDescribeSubmitting(true)
    try {
      await casesApi.create({
        name: describeText.trim().substring(0, 100),
        caseType: 'General',
        court: 'To be determined',
        clientId: '00000000-0000-0000-0000-000000000000',
        description: describeText.trim(),
        stage: 'Initial Consultation',
        priority: 'Medium',
      })
      await loadCases()
      setShowDescribeModal(false)
      setDescribeText('')
      setDescribeError('')
    } catch {
      setDescribeError('Could not create your case. Please try again.')
    } finally {
      setDescribeSubmitting(false)
    }
  }

  const initials = user ? `${(user.firstName ?? '')[0] ?? ''}${(user.lastName ?? '')[0] ?? ''}`.toUpperCase() : '—'
  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  const nextHearingRaw = selectedCase?.nextHearing || selectedCase?.NextHearing || null
  const nextHearingDate = nextHearingRaw ? new Date(nextHearingRaw) : null
  const daysToHearing = nextHearingDate ? Math.ceil((nextHearingDate.getTime() - Date.now()) / 86400000) : null
  const hearingSoon = daysToHearing !== null && daysToHearing >= 0 && daysToHearing <= 30

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #f1f5f9', borderTop: '2px solid #0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style suppressHydrationWarning>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const isDesktop = screenSize === 'desktop'
  const isMobile = screenSize === 'mobile'
  const completedCount = checkedActions.filter(Boolean).length
  const actionPct = actionItems.length > 0 ? Math.round((completedCount / actionItems.length) * 100) : 0

  // Real upcoming hearing derived from the fetched hearings list (falls back to
  // the case's own nextHearing field above when no hearings have loaded yet).
  const nextHearingObj = getNextHearing(hearings)
  const nextHearingObjDate = nextHearingObj ? (nextHearingObj.hearingDate ?? nextHearingObj.HearingDate ?? nextHearingObj.date) : null
  const displayHearingDate = nextHearingObjDate ? new Date(nextHearingObjDate) : nextHearingDate
  const displayHearingRaw = nextHearingObjDate ?? nextHearingRaw
  const displayDaysAway = displayHearingDate ? Math.ceil((displayHearingDate.getTime() - Date.now()) / 86400000) : null
  const displayHearingSoon = displayDaysAway !== null && displayDaysAway >= 0 && displayDaysAway <= 30

  const readinessScore = readiness?.overallScore ?? readiness?.score ?? readiness?.OverallScore ?? null
  const readinessColor = typeof readinessScore === 'number'
    ? (readinessScore >= 70 ? '#16a34a' : readinessScore >= 40 ? '#d97706' : '#dc2626')
    : '#0f172a'

  function priorityStyle(p: string) {
    if (p === 'High' || p === 'Critical') return { background: '#fee2e2', color: '#dc2626' }
    if (p === 'Low') return { background: '#dcfce7', color: '#16a34a' }
    return { background: '#fef9c3', color: '#d97706' }
  }

  // Severity/strength badge (risk: High/Medium/Low, contradiction: Strong/Medium/Weak)
  function severityStyle(s: string) {
    if (s === 'High' || s === 'Strong') return { background: '#fee2e2', color: '#dc2626' }
    if (s === 'Low' || s === 'Weak') return { background: '#dcfce7', color: '#16a34a' }
    return { background: '#fef9c3', color: '#d97706' }
  }

  function urgencyBorderColor(u: string) {
    if (u === 'Immediate' || u === 'High') return '#dc2626'
    if (u === 'This Week') return '#d97706'
    if (u === 'Before Next Hearing') return '#2563eb'
    return '#16a34a'
  }

  function badge(text: string, style: { background: string; color: string }) {
    return <span style={{ ...style, fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500, flexShrink: 0 }}>{text}</span>
  }

  // Card-based rendering per feature type — falls back to raw preformatted text
  // (via extractReadableText) whenever featureContent isn't the JSON shape its
  // template promises, so a malformed/empty response never renders blank.
  function renderFeatureContent() {
    const content = featureContents[activeFeature ?? ''] ?? ''

    const fallback = (
      <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 24, fontSize: 14, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {extractReadableText({ result: content }, ['result'])}
      </div>
    )

    const parsed = parseAiJson<any>(content)
    if (!parsed) return fallback

    const cardStyle = { background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }

    if (activeFeature === 'risk') {
      const risks: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.risks) ? parsed.risks : []
      if (risks.length === 0) return fallback
      return (
        <div>
          {risks.map((r, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{r.risk}</div>
                {badge(r.severity, severityStyle(r.severity))}
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 8 }}>{r.explanation}</div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Why this matters:</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{r.whyItMatters}</div>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
                <div style={{ fontSize: 10, color: '#0f172a', fontWeight: 600, textTransform: 'uppercase' }}>What to do:</div>
                <div style={{ fontSize: 12, color: '#374151', marginTop: 3 }}>{r.whatToDo}</div>
              </div>
              {r.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <i className="ti ti-clock" style={{ fontSize: 13, color: '#94a3b8' }} />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.deadline}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    if (activeFeature === 'recommendations') {
      const recs: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.recommendations) ? parsed.recommendations : []
      if (recs.length === 0) return fallback
      return (
        <div>
          {recs.map((r, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${urgencyBorderColor(r.urgency)}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{r.title}</div>
                {badge(r.urgency, { background: '#f1f5f9', color: urgencyBorderColor(r.urgency) })}
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 8 }}>{r.whatYourAdvocateShouldDo}</div>
              {r.whyItMattersToYou && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{r.whyItMattersToYou}</div>}
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
                <div style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 600, textTransform: 'uppercase' }}>Ask your advocate:</div>
                <div style={{ fontSize: 13, color: '#1e40af', fontStyle: 'italic', marginTop: 3 }}>{r.askYourAdvocate}</div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (activeFeature === 'contradiction') {
      const items: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.contradictions) ? parsed.contradictions : []
      if (items.length === 0) return fallback
      return (
        <div>
          {items.map((c, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{c.title}</div>
                {badge(c.strength, severityStyle(c.strength))}
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 6, padding: '8px 12px', marginTop: 8 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>What they said:</div>
                <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{c.whatTheySaid}</div>
              </div>
              <div style={{ background: '#fff', border: '0.5px solid #f1f5f9', borderRadius: 6, padding: '8px 12px', marginTop: 4 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>What actually happened:</div>
                <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{c.whatRealityShows}</div>
              </div>
              {c.whyThisHelpsYou && <div style={{ fontSize: 12, color: '#16a34a', marginTop: 8 }}>{c.whyThisHelpsYou}</div>}
              <div style={{ background: '#fef9c3', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
                <div style={{ fontSize: 13, color: '#854d0e', fontStyle: 'italic' }}>{c.questionForAdvocate}</div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (activeFeature === 'evidence') {
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback
      const score = typeof parsed.overallScore === 'number' ? parsed.overallScore : null
      const scoreColor = score === null ? '#0f172a' : score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
      const strong: any[] = Array.isArray(parsed.strongEvidence) ? parsed.strongEvidence : []
      const missing: any[] = Array.isArray(parsed.missingEvidence) ? parsed.missingEvidence : []
      return (
        <div>
          <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 500, color: scoreColor }}>{score !== null ? `${score}%` : '—'}</div>
            {score !== null && (
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score}%`, background: scoreColor }} />
              </div>
            )}
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 12, textAlign: 'left' }}>{parsed.overallMessage}</div>
          </div>

          {strong.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {sectionLabel('Strong evidence', { fontSize: 11, marginTop: 0, marginBottom: 10 })}
              {strong.map((e, i) => (
                <div key={i} style={{ ...cardStyle, borderLeft: '3px solid #16a34a', padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{e.document}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{e.whyStrong}</div>
                </div>
              ))}
            </div>
          )}

          {missing.length > 0 && (
            <div>
              {sectionLabel('Missing evidence', { fontSize: 11, marginTop: 20, marginBottom: 10 })}
              {missing.map((e, i) => (
                <div key={i} style={{ ...cardStyle, borderLeft: '3px solid #dc2626', padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{e.document}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{e.whyNeeded}</div>
                  <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>{e.howToGet}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (activeFeature === 'ask-advocate') {
      const items: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : []
      if (items.length === 0) return fallback

      const categoryStyle = (cat: string): { background: string; color: string } => {
        if (cat === 'Urgent') return { background: '#fee2e2', color: '#dc2626' }
        if (cat === 'Financial') return { background: '#dcfce7', color: '#16a34a' }
        if (cat === 'Evidence') return { background: '#f5f3ff', color: '#7c3aed' }
        if (cat === 'Hearing') return { background: '#dbeafe', color: '#2563eb' }
        if (cat === 'Opponent') return { background: '#fef9c3', color: '#d97706' }
        if (cat === 'Protection') return { background: '#f0fdf4', color: '#16a34a' }
        return { background: '#f1f5f9', color: '#64748b' }
      }

      return (
        <div>
          {items.map((q, i) => (
            <div key={i} style={{ ...cardStyle, borderLeft: '3px solid #2563eb' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 10, color: '#2563eb', textTransform: 'uppercase' }}>{q.topic}</div>
                {q.category && badge(q.category, categoryStyle(q.category))}
              </div>
              <div style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.5, fontStyle: 'italic', marginTop: 8 }}>{q.question}</div>
              {q.whyAsk && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{q.whyAsk}</div>}
              <div style={{ marginTop: 8 }}>
                {badge(q.urgency, severityStyle(q.urgency))}
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              const text = items.map((q, i) =>
                `${i+1}. ${q.topic}\n"${q.question}"\n${q.whyAsk}`
              ).join('\n\n')
              window.open(`https://wa.me/?text=${encodeURIComponent(
                'Questions to ask my advocate:\n\n' + text
              )}`)
            }}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px',
              borderRadius: 10, background: '#25D366',
              color: 'white', border: 'none',
              fontSize: 14, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer',
              marginTop: 16
            }}
          >
            <i className="ti ti-brand-whatsapp" />
            Share these questions with my advocate
          </button>
        </div>
      )
    }

    return fallback
  }

  function sectionLabel(text: string, extra?: React.CSSProperties) {
    return <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', ...extra }}>{text}</div>
  }

  // Sidebar feature items (Risks/Ask advocate/Gaps/Evidence/Recommendations) go
  // through openFeature, which no-ops if there's no selectedCase yet — so check
  // first rather than letting the click silently do nothing. setActiveFeature(null)
  // runs before setActiveView('home') so the view switch doesn't clear a feature
  // screen that hasn't been (re)opened yet; the setTimeout gives those state
  // updates a tick to land before openFeature reads activeView/activeFeature.
  function openFeatureFromSidebar(type: string) {
    setActiveFeature(null)
    setActiveView('home')
    if (!selectedCase) {
      alert('Please select a case first')
      return
    }
    setTimeout(() => openFeature(type), 100)
  }

  // ── Bold Modern sidebar nav groups (desktop only) ─────────────────────────
  const SIDEBAR_GROUPS: { label: string; items: { label: string; icon: string; onClick: () => void; key: string }[] }[] = [
    {
      label: 'Overview',
      items: [
        { key: 'home', label: 'Home', icon: 'ti-home', onClick: () => { setActiveView('home'); setActiveFeature(null) } },
        { key: 'mycase', label: 'My case', icon: 'ti-file-text', onClick: () => { setActiveView('mycase'); setActiveFeature(null) } },
        { key: 'hearing', label: 'Hearing', icon: 'ti-gavel', onClick: () => { setActiveView('hearing'); setActiveFeature(null) } },
      ],
    },
    {
      label: 'AI insights',
      items: [
        { key: 'risk', label: 'Risks', icon: 'ti-alert-triangle', onClick: () => openFeatureFromSidebar('risk') },
        { key: 'actions', label: 'Actions', icon: 'ti-list-check', onClick: () => { setActiveView('actions'); setActiveFeature(null) } },
        { key: 'recommendations', label: 'Recommendations', icon: 'ti-bulb', onClick: () => openFeatureFromSidebar('recommendations') },
        { key: 'ask-advocate', label: 'Ask advocate', icon: 'ti-message-question', onClick: () => openFeatureFromSidebar('ask-advocate') },
        { key: 'contradiction', label: 'Gaps', icon: 'ti-git-compare', onClick: () => openFeatureFromSidebar('contradiction') },
        { key: 'evidence', label: 'Evidence', icon: 'ti-zoom-question', onClick: () => openFeatureFromSidebar('evidence') },
      ],
    },
    {
      label: 'Files',
      items: [
        { key: 'profile', label: 'Documents', icon: 'ti-files', onClick: () => { setActiveView('profile'); setActiveFeature(null) } },
      ],
    },
  ]

  function isSidebarItemActive(key: string) {
    if (key === 'risk' || key === 'ask-advocate' || key === 'contradiction' || key === 'evidence') {
      return activeFeature === key
    }
    return activeFeature === null && activeView === key
  }

  // ── Desktop sidebar ────────────────────────────────────────────────────────
  function DesktopSidebar() {
    return (
      <div style={{
        position: 'fixed', left: 0, top: 0, width: 220, height: '100vh',
        background: '#f8fafc', borderRight: '0.5px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', zIndex: 100,
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '0.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-scale" style={{ fontSize: 16, color: '#0f172a' }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: '#0f172a' }}>Clausio</span>
          </div>
          <div style={{ background: '#f1f5f9', color: '#64748b', fontSize: 10, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4, letterSpacing: '0.04em' }}>
            Client portal
          </div>
        </div>

        <div style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 8px 4px', fontWeight: 500 }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const active = isSidebarItemActive(item.key)
                return (
                  <div
                    key={item.key}
                    onClick={item.onClick}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                      fontSize: 13, cursor: 'pointer', marginBottom: 2,
                      background: active ? '#0f172a' : 'transparent',
                      color: active ? '#fff' : '#64748b',
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    <i className={`ti ${item.icon}`} style={{ fontSize: 15, color: active ? '#fff' : '#94a3b8' }} />
                    {item.label}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '0.5px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0f172a', fontSize: 10, fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>Client</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Mobile/tablet bottom nav ───────────────────────────────────────────────
  const BOTTOM_NAV_ITEMS = [
    { key: 'home', label: 'Home', icon: 'ti-home' },
    { key: 'mycase', label: 'My Case', icon: 'ti-file-text' },
    { key: 'hearing', label: 'Hearing', icon: 'ti-gavel' },
    { key: 'actions', label: 'Actions', icon: 'ti-list-check' },
    { key: 'profile', label: 'Profile', icon: 'ti-user' },
  ] as const

  function BottomNav() {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
        borderTop: '0.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 12px', zIndex: 200,
      }}>
        {BOTTOM_NAV_ITEMS.map(item => {
          const active = activeView === item.key
          return (
            <div
              key={item.key}
              onClick={() => { setActiveView(item.key); setActiveFeature(null) }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 12px', cursor: 'pointer' }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: active ? '#0f172a' : '#94a3b8' }} />
              <span style={{ fontSize: 10, fontWeight: active ? 500 : 400, color: active ? '#0f172a' : '#94a3b8' }}>{item.label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Feature full screen ────────────────────────────────────────────────────
  function FeatureScreen() {
    if (!activeFeature) return null
    const card = FEATURE_CARDS.find(c => c.type === activeFeature)
    // actionplan keeps its result in featureContent (loadActionPlan's own state) —
    // deriving "generated" from that directly (rather than featureGenerated) means
    // this also recognises an action plan generated via the Actions tab's own
    // "Generate Action Plan" button, which calls loadActionPlan() directly.
    const isGenerated = activeFeature === 'actionplan' ? featureContent !== '' : !!featureGenerated[activeFeature]
    const hasActionItems = activeFeature === 'actionplan' && actionItems.length > 0
    const hasAnyContent = activeFeature === 'actionplan' ? featureContent !== '' : !!featureContents[activeFeature]

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: isDesktop ? '20px 32px' : 16, borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => setActiveFeature(null)}
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', border: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 16, color: '#0f172a' }} />
          </div>
          {card && (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${card.icon}`} style={{ fontSize: 17, color: card.iconColor }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#0f172a' }}>{FEATURE_META[activeFeature]?.title}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{FEATURE_META[activeFeature]?.subtitle}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: isDesktop ? '24px 32px' : 16, paddingBottom: 100, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
          {featureLoading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 32, height: 32, border: '2px solid #f1f5f9', borderTop: '2px solid #0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 16, textAlign: 'center' }}>Analysing your case...</div>
            </div>
          )}

          {!featureLoading && !isGenerated && (
            <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '40px 24px', textAlign: 'center', marginTop: 20 }}>
              {card && (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <i className={`ti ${card.icon}`} style={{ fontSize: 24, color: card.iconColor }} />
                </div>
              )}
              <div style={{ fontSize: 18, fontWeight: 500, color: '#0f172a', marginTop: 16 }}>{FEATURE_META[activeFeature]?.title}</div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 8, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                Click the button below to analyse your case and get personalised insights
              </div>
              <button
                onClick={() => runFeatureAI(activeFeature)}
                style={{ marginTop: 24, background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {GENERATE_LABELS[activeFeature ?? ''] ?? 'Run Analysis'} →
              </button>
            </div>
          )}

          {!featureLoading && isGenerated && (
            <>
              {hasAnyContent && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <button
                    onClick={() => runFeatureAI(activeFeature!)}
                    style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
                  >
                    <i className="ti ti-refresh" style={{ fontSize: 14 }} /> Regenerate
                  </button>
                </div>
              )}

              {activeFeature === 'actionplan' ? (
                hasActionItems ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {actionItems.map((item, i) => (
                      <div key={i} onClick={() => toggleChecked(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#fff', borderRadius: 10, padding: 16, border: '0.5px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                          border: checkedActions[i] ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                          background: checkedActions[i] ? '#0f172a' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {checkedActions[i] && <i className="ti ti-check" style={{ fontSize: 12, color: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: checkedActions[i] ? '#94a3b8' : '#0f172a', lineHeight: 1.5, textDecoration: checkedActions[i] ? 'line-through' : 'none' }}>{item.title}</div>
                          <span style={{ ...priorityStyle(item.priority), fontSize: 10, fontWeight: 500, borderRadius: 20, padding: '3px 10px', marginTop: 4, display: 'inline-block' }}>{item.priority}</span>
                          {item.howToDoIt && (
                            <div style={{
                              fontSize: 12, color: '#64748b', marginTop: 6,
                              lineHeight: 1.5
                            }}>
                              {item.howToDoIt}
                            </div>
                          )}
                          {item.deadline && (
                            <div style={{
                              fontSize: 11, color: '#94a3b8', marginTop: 4,
                              display: 'flex', alignItems: 'center', gap: 4
                            }}>
                              <i className="ti ti-clock" style={{fontSize: 12}} />
                              {item.deadline}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 24, fontSize: 14, lineHeight: 1.8, color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {featureContent}
                  </div>
                )
              ) : (
                renderFeatureContent()
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Home view ──────────────────────────────────────────────────────────────
  function HomeView() {
    return (
      <div style={{ paddingBottom: isDesktop ? 0 : 80 }}>
        <div style={{ padding: isDesktop ? '28px 32px 24px' : 16, borderBottom: '0.5px solid #f1f5f9', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ background: '#f1f5f9', color: '#64748b', fontSize: 11, padding: '3px 10px', borderRadius: 4, display: 'inline-block', marginBottom: 10 }}>
                {selectedCase?.court || selectedCase?.Court || 'Family Court Mumbai'}
              </div>
              <div style={{ fontSize: isDesktop ? 28 : 20, fontWeight: 500, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 4 }}>
                {greeting}, {user?.firstName || 'there'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{selectedCase?.name || selectedCase?.Name || 'No case selected'}</div>
            </div>
            {isDesktop && (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 500, fontSize: 16, flexShrink: 0 }}>
                {initials}
              </div>
            )}
          </div>

          {cases.length > 1 && (
            <div style={{ marginTop: 14 }}>
              <select
                value={(selectedCase?.id || selectedCase?.Id) ?? ''}
                onChange={e => {
                  const c = cases.find((x: any) => (x.id || x.Id) === e.target.value)
                  if (c) selectCase(c)
                }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#0f172a', outline: 'none' }}
              >
                {cases.map((c: any) => (
                  <option key={c.id || c.Id} value={c.id || c.Id}>{c.name || c.Name || 'Unnamed case'}</option>
                ))}
              </select>
            </div>
          )}

          {cases.length > 0 && (
            <div style={{
              marginTop: 20, display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{ padding: 16, borderRight: '0.5px solid #e2e8f0', borderBottom: isMobile ? '0.5px solid #e2e8f0' : 'none' }}>
                {sectionLabel('Next hearing')}
                <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.3px', color: displayHearingSoon ? '#dc2626' : '#0f172a', marginTop: 4 }}>
                  {displayHearingDate ? fmtDate(displayHearingRaw) : 'No hearing scheduled'}
                </div>
                <div style={{ fontSize: 11, color: displayDaysAway !== null && displayDaysAway <= 30 ? '#dc2626' : '#94a3b8', marginTop: 2 }}>
                  {displayDaysAway === null ? 'No upcoming hearings' : displayDaysAway <= 0 ? 'Today' : `${displayDaysAway} days away`}
                </div>
              </div>

              <div style={{ padding: 16, borderRight: isMobile ? 'none' : '0.5px solid #e2e8f0', borderBottom: isMobile ? '0.5px solid #e2e8f0' : 'none' }}>
                {sectionLabel('Case stage')}
                <div style={{ fontSize: 22, fontWeight: 500, color: '#0f172a', marginTop: 4 }}>{selectedCase?.stage ?? selectedCase?.Stage ?? 'Active'}</div>
              </div>

              <div style={{ padding: 16, borderRight: '0.5px solid #e2e8f0' }}>
                {sectionLabel('Case readiness')}
                <div style={{ fontSize: 22, fontWeight: 500, color: readinessColor, marginTop: 4 }}>
                  {typeof readinessScore === 'number' ? `${readinessScore}%` : '—'}
                </div>
                {typeof readinessScore === 'number' && (
                  <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${readinessScore}%`, background: readinessColor }} />
                  </div>
                )}
              </div>

              <div style={{ padding: 16 }}>
                {sectionLabel('Court')}
                <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginTop: 4 }}>
                  {nextHearingObj?.court ?? nextHearingObj?.Court ?? selectedCase?.court ?? selectedCase?.Court ?? '—'}
                </div>
                {(nextHearingObj?.judge ?? nextHearingObj?.Judge) && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{nextHearingObj?.judge ?? nextHearingObj?.Judge}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {(cases.length === 0 || !selectedCase) ? (
          // ── ONBOARDING — NO CASES ──
          <div style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <div style={{ fontSize: 28, fontWeight: 500, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 8 }}>
              Welcome to Clausio, {user?.firstName || ''}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 40 }}>
              To get started, tell us about your situation
            </div>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
              <div
                onClick={() => setShowDescribeModal(true)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-pencil" style={{ fontSize: 18, color: '#16a34a' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Describe what happened</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Tell us in your own words what legal problem you are facing</div>
                </div>
              </div>

              <div
                onClick={() => alert('Coming soon — your advocate will add your case to Clausio')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-upload" style={{ fontSize: 18, color: '#2563eb' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Upload a document</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>FIR, legal notice, court order, or any document related to your case</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: isDesktop ? '24px 32px 16px' : '16px 16px 12px' }}>
              {sectionLabel('What do you want to know?')}
            </div>

            <div style={{
              padding: isDesktop ? '0 32px 24px' : '0 16px 16px',
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: 10,
            }}>
              {FEATURE_CARDS.map((card, idx) => {
                const hovered = hoveredCard === idx
                return (
                  <div
                    key={card.type}
                    onClick={() => openFeature(card.type)}
                    onMouseEnter={() => setHoveredCard(idx)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: hovered ? '#0f172a' : '#fff',
                      border: hovered ? '0.5px solid #0f172a' : '0.5px solid #e2e8f0',
                      borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, marginBottom: 12,
                      background: hovered ? 'rgba(255,255,255,0.1)' : card.iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`ti ${card.icon}`} style={{ fontSize: 17, color: hovered ? '#fff' : card.iconColor, transition: 'color 0.2s' }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: hovered ? '#fff' : '#0f172a', marginBottom: 3, transition: 'color 0.2s' }}>
                      {FEATURE_META[card.type].title}
                    </div>
                    <div style={{ fontSize: 12, color: hovered ? 'rgba(255,255,255,0.5)' : '#64748b', lineHeight: 1.4, transition: 'color 0.2s' }}>
                      {FEATURE_META[card.type].subtitle}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, fontWeight: 500, color: hovered ? 'rgba(255,255,255,0.6)' : '#64748b', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}>
                      Tap to analyse <i className="ti ti-arrow-right" />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: isDesktop ? '0 32px 24px' : '0 16px 16px' }}>
              {sectionLabel('Latest case update', { marginBottom: 10 })}
              <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderLeft: '3px solid #0f172a', borderRadius: 10, padding: 16 }}>
                {hearings.length > 0 ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                      {fmtDate(hearings[hearings.length - 1]?.hearingDate ?? hearings[hearings.length - 1]?.HearingDate ?? hearings[hearings.length - 1]?.date)}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginTop: 4 }}>
                      {hearings[hearings.length - 1]?.notes ?? hearings[hearings.length - 1]?.Notes ?? hearings[hearings.length - 1]?.observations ?? 'No notes recorded for this hearing yet.'}
                    </div>
                    {displayHearingDate && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-clock" style={{ fontSize: 13 }} /> Next hearing: {fmtDate(displayHearingRaw)}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>No updates recorded yet. Your advocate will post updates here as the case progresses.</div>
                )}
              </div>
            </div>
          </>
        )}

        <div style={{ padding: isDesktop ? '0 32px 20px' : '12px 16px' }}>
          <div style={{ fontSize: 10, color: '#cbd5e1' }}>
            AI analysis · Not legal advice · Always consult your advocate before acting
          </div>
        </div>
      </div>
    )
  }

  // ── Hearing view ───────────────────────────────────────────────────────────
  function HearingView() {
    const pastHearings = hearings.slice(0, -1).reverse()
    const stage = selectedCase?.stage ?? selectedCase?.Stage ?? ''
    const whatToExpect = stage === 'Evidence'
      ? 'At the evidence stage, both sides present their documents and witnesses to the court. The judge may ask questions about the documents submitted. Your advocate will speak on your behalf — you do not need to speak unless the judge addresses you.'
      : 'At a typical court hearing, your advocate will represent you and update the judge on the case. Hearings are usually brief. Arrive early, bring your documents, and let your advocate lead unless the judge asks you something directly.'

    const defaultBring = [
      'Original case documents',
      "Advocate's contact number",
      'Court order copy from last hearing',
      'Any new evidence or documents',
      'Note of questions for judge',
    ]
    const readinessItems: string[] = Array.isArray(readiness?.checklist)
      ? readiness.checklist.filter((i: any) => i.controllable !== false).map((i: any) => i.title ?? i.description ?? i.item).filter(Boolean)
      : []
    const bringItems = readinessItems.length > 0 ? readinessItems : defaultBring

    return (
      <div style={{ paddingBottom: isDesktop ? 0 : 80 }}>
        <div style={{ padding: isDesktop ? '24px 32px 20px' : 16, borderBottom: '0.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => setActiveView('home')}
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', border: '0.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 16, color: '#0f172a' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#0f172a' }}>Upcoming hearing</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{displayHearingDate ? fmtDate(displayHearingRaw) : 'No hearing scheduled'}</div>
          </div>
        </div>

        <div style={{ padding: isDesktop ? '24px 32px' : 16, maxWidth: isDesktop ? 760 : '100%' }}>
          <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderLeft: '3px solid #dc2626', borderRadius: 10, padding: 20, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {sectionLabel('Next hearing')}
              {displayDaysAway !== null && (
                <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
                  {displayDaysAway <= 0 ? 'Today' : `${displayDaysAway}d away`}
                </span>
              )}
            </div>
            <div style={{ fontSize: 24, fontWeight: 500, color: '#0f172a', letterSpacing: '-0.3px', marginTop: 8 }}>
              {displayHearingDate ? fmtDate(displayHearingRaw) : 'No hearing scheduled'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr', gap: 10, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                <i className="ti ti-building" style={{ color: '#94a3b8' }} /> {nextHearingObj?.court ?? nextHearingObj?.Court ?? selectedCase?.court ?? selectedCase?.Court ?? '—'}
              </div>
              {(nextHearingObj?.judge ?? nextHearingObj?.Judge) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                  <i className="ti ti-user" style={{ color: '#94a3b8' }} /> {nextHearingObj?.judge ?? nextHearingObj?.Judge}
                </div>
              )}
              {(nextHearingObj?.time ?? nextHearingObj?.Time) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                  <i className="ti ti-clock" style={{ color: '#94a3b8' }} /> {nextHearingObj?.time ?? nextHearingObj?.Time}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                <i className="ti ti-flag" style={{ color: '#94a3b8' }} /> {nextHearingObj?.stage ?? nextHearingObj?.Stage ?? stage ?? 'Active'}
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 12 }}>What to bring to court</div>
            {bringItems.map((item: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < bringItems.length - 1 ? '0.5px solid #f1f5f9' : 'none' }}>
                <div style={{ width: 20, height: 20, border: '1.5px solid #e2e8f0', borderRadius: '50%', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#0f172a' }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 10 }}>What usually happens at this stage</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{whatToExpect}</div>
          </div>

          {pastHearings.length > 0 && (
            <div>
              {sectionLabel('Previous hearings', { marginBottom: 10 })}
              {pastHearings.map((h: any, i: number) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < pastHearings.length - 1 ? '0.5px solid #f1f5f9' : 'none' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {fmtDate(h.hearingDate ?? h.HearingDate ?? h.date)} — {h.notes ?? h.Notes ?? h.observations ?? 'No notes recorded'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── My Case view ───────────────────────────────────────────────────────────
  function MyCaseView() {
    const relief = selectedCase?.reliefClaimed || selectedCase?.ReliefClaimed || selectedCase?.description || selectedCase?.Description || ''
    const reliefLines = String(relief).split(/\n+/).map((l: string) => l.trim()).filter(Boolean)

    return (
      <div style={{ paddingBottom: isDesktop ? 0 : 80 }}>
        <div style={{ padding: isDesktop ? '28px 32px 24px' : 16, borderBottom: '0.5px solid #f1f5f9', background: '#fff' }}>
          <div style={{ fontSize: isDesktop ? 24 : 18, fontWeight: 500, color: '#0f172a' }}>My case</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{selectedCase?.name || selectedCase?.Name || ''}</div>
        </div>

        <div style={{ padding: isDesktop ? '24px 32px' : 16, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: isDesktop ? 760 : '100%' }}>
          {!selectedCase ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '40px 0' }}>No case selected.</div>
          ) : (
            <>
              <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                {sectionLabel('About your case', { marginBottom: 10 })}
                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
                  {selectedCase?.description || selectedCase?.Description || 'No description available yet.'}
                </div>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                {sectionLabel('What you are asking for', { marginBottom: 10 })}
                {reliefLines.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>Not recorded yet.</div>
                ) : (
                  reliefLines.map((line: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < reliefLines.length - 1 ? '0.5px solid #f8fafc' : 'none' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ti ti-check" style={{ fontSize: 12 }} />
                      </div>
                      <span style={{ fontSize: 13, color: '#374151' }}>{line}</span>
                    </div>
                  ))
                )}
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr' }}>
                  {[
                    { label: 'Court', value: selectedCase?.court || selectedCase?.Court || '—' },
                    { label: 'Case number', value: selectedCase?.caseNumber || selectedCase?.CaseNumber || '—' },
                    { label: 'Filed date', value: fmtDate(selectedCase?.createdAt || selectedCase?.CreatedAt) || '—' },
                    { label: 'Stage', value: selectedCase?.stage ?? selectedCase?.Stage ?? 'Active' },
                  ].map((row, i) => (
                    <div key={i} style={{ padding: '14px 0', borderBottom: '0.5px solid #f8fafc' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{row.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginTop: 2 }}>{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Actions view ───────────────────────────────────────────────────────────
  function ActionsView() {
    return (
      <div style={{ paddingBottom: isDesktop ? 0 : 80 }}>
        <div style={{ padding: isDesktop ? '28px 32px 0' : '16px 16px 0' }}>
          <div style={{ fontSize: isDesktop ? 24 : 18, fontWeight: 500, color: '#0f172a' }}>Your action plan</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{completedCount} of {actionItems.length} completed</div>
        </div>

        <div style={{ padding: isDesktop ? '24px 32px 0' : '16px 16px 0' }}>
          {actionItems.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${actionPct}%`, background: '#0f172a', transition: 'width 0.2s ease' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{actionPct}%</div>
            </div>
          )}

          {featureLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 32, height: 32, border: '2px solid #f1f5f9', borderTop: '2px solid #0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 12 }}>Analysing your case...</div>
            </div>
          )}

          {!featureLoading && actionItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>No action plan yet.</div>
              <button
                onClick={loadActionPlan}
                disabled={!selectedCase}
                style={{ padding: '12px 24px', background: selectedCase ? '#0f172a' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: selectedCase ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
              >
                Generate Action Plan
              </button>
            </div>
          )}
        </div>

        {!featureLoading && actionItems.length > 0 && (
          <>
            <div style={{ padding: isDesktop ? '0 32px' : '0 16px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {actionItems.map((item, i) => (
                <div key={i} onClick={() => toggleChecked(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                    border: checkedActions[i] ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                    background: checkedActions[i] ? '#0f172a' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checkedActions[i] && <i className="ti ti-check" style={{ fontSize: 12, color: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: checkedActions[i] ? '#94a3b8' : '#0f172a', lineHeight: 1.5, textDecoration: checkedActions[i] ? 'line-through' : 'none' }}>{item.title}</div>
                    <span style={{ ...priorityStyle(item.priority), fontSize: 10, fontWeight: 500, marginTop: 4, display: 'inline-block' }}>{item.priority}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ margin: isDesktop ? '0 32px' : '0 16px' }}>
              <button
                onClick={shareActionsOnWhatsApp}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: 13, borderRadius: 10, background: '#25D366', color: '#fff',
                  border: 'none', fontSize: 14, fontWeight: 500, width: '100%', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <i className="ti ti-brand-whatsapp" style={{ fontSize: 16 }} /> Share with my advocate
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Profile view ───────────────────────────────────────────────────────────
  function ProfileView() {
    return (
      <div style={{ paddingBottom: isDesktop ? 0 : 80 }}>
        <div style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0', padding: isDesktop ? '24px 32px' : 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0f172a', fontSize: 20, fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#0f172a' }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{user?.email}</div>
            <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 20, padding: '6px 14px', marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 500 }}>⚡ 15 AI credits remaining</span>
            </div>
          </div>
        </div>

        <div style={{ padding: isDesktop ? '24px 32px' : 16, maxWidth: isDesktop ? 760 : '100%' }}>
          {sectionLabel('My documents', { marginBottom: 10 })}
          <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
            {docsLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading documents...</div>
            ) : documents.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No documents yet.</div>
            ) : (
              documents.map((doc: any, i: number) => (
                <div key={doc.id || doc.Id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: i < documents.length - 1 ? '0.5px solid #f8fafc' : 'none' }}>
                  <i className="ti ti-file" style={{ fontSize: 16, color: '#64748b', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName || doc.FileName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(doc.createdAt || doc.CreatedAt)}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', flexShrink: 0 }}>
                    {doc.ocrStatus === 'Completed' || doc.ocrStatus === 'Done' ? 'Ready' : 'Processing'}
                  </span>
                </div>
              ))
            )}
          </div>

          <label style={{ display: 'block', width: '100%', padding: 12, background: '#0f172a', color: '#fff', textAlign: 'center', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: selectedCase ? 'pointer' : 'not-allowed', marginBottom: 24 }}>
            {uploading ? 'Uploading...' : 'Upload a document'}
            <input type="file" onChange={handleUploadDocument} disabled={!selectedCase || uploading} style={{ display: 'none' }} />
          </label>

          {sectionLabel('Account', { marginBottom: 10 })}
          <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            {[
              { icon: 'ti-bell', label: 'Notifications' },
              { icon: 'ti-shield', label: 'Privacy & data' },
              { icon: 'ti-help-circle', label: 'Help & support' },
            ].map((row, i) => (
              <div key={i} onClick={() => alert('Coming soon')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '0.5px solid #f8fafc', cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${row.icon}`} style={{ fontSize: 15, color: '#64748b' }} />
                </div>
                <span style={{ fontSize: 13, color: '#0f172a' }}>{row.label}</span>
                <i className="ti ti-chevron-right" style={{ marginLeft: 'auto', color: '#cbd5e1', fontSize: 16 }} />
              </div>
            ))}
            <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-logout" style={{ fontSize: 15, color: '#dc2626' }} />
              </div>
              <span style={{ fontSize: 13, color: '#dc2626' }}>Log out</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderCurrentView() {
    if (activeFeature !== null) return <FeatureScreen />
    if (activeView === 'home') return <HomeView />
    if (activeView === 'mycase') return <MyCaseView />
    if (activeView === 'hearing') return <HearingView />
    if (activeView === 'actions') return <ActionsView />
    return <ProfileView />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style suppressHydrationWarning>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {screenSize === 'desktop' && <DesktopSidebar />}

      <div style={{
        flex: 1,
        marginLeft: screenSize === 'desktop' ? 220 : 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#ffffff',
        position: 'relative',
      }}>
        {renderCurrentView()}
      </div>

      {screenSize !== 'desktop' && <BottomNav />}

      {/* ══════════════════ DESCRIBE-SITUATION MODAL ══════════════════ */}
      {showDescribeModal && (
        <div onClick={() => !describeSubmitting && setShowDescribeModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#0f172a', marginBottom: 16 }}>Describe your situation</div>
            <textarea
              value={describeText}
              onChange={e => { setDescribeText(e.target.value); setDescribeError('') }}
              style={{ width: '100%', height: 120, padding: 12, fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Tell us what happened. For example: I received a legal notice from my landlord, or I am going through a divorce..."
            />
            {(() => {
              const wordCount = describeText.trim().split(/\s+/).filter(Boolean).length
              const ok = wordCount >= 50
              return <div style={{ fontSize: 12, color: ok ? '#16a34a' : '#dc2626', marginTop: 6 }}>{wordCount} words</div>
            })()}
            {describeError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{describeError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowDescribeModal(false)} disabled={describeSubmitting} style={{ flex: 1, padding: '11px 0', background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#475569', cursor: describeSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button
                onClick={handleDescribeSubmit}
                disabled={describeText.trim().split(/\s+/).filter(Boolean).length < 50 || describeSubmitting}
                style={{
                  flex: 2, padding: '11px 0',
                  background: describeText.trim().split(/\s+/).filter(Boolean).length < 50 || describeSubmitting ? '#cbd5e1' : '#0f172a',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#fff',
                  cursor: describeText.trim().split(/\s+/).filter(Boolean).length < 50 || describeSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {describeSubmitting ? 'Analysing...' : 'Analyse my situation →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
