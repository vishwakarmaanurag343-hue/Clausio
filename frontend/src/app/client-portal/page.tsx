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
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return d && new Date(d) >= today
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
  const [activeView, setActiveView] = useState<'home' | 'mycase' | 'hearing' | 'actions' | 'documents' | 'settings' | 'about'>('home')
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
    if (!c) return
    const caseId = c.id ?? c.Id
    if (!caseId) return
    hearingsApi.getByCaseId(caseId)
      .then((data: any) => {
        const list = Array.isArray(data) ? data :
          data?.hearings ?? data?.data ?? []
        setHearings(list)
      })
      .catch(() => {})
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
    if (activeView !== 'documents' || !selectedCase) return
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

    // Check file size — max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum size is 10MB.')
      return
    }

    setUploading(true)
    try {
      const caseId = selectedCase.id ?? selectedCase.Id
      await documentsApi.upload(caseId, file, 'Uploaded Document')
      const d = await documentsApi.getByCaseId(caseId)
      const list = Array.isArray(d) ? d : (d as any)?.documents ?? []
      // refresh documents in My Case view if open
      setDocuments(list)
    } catch (e: any) {
      // S3 not configured locally —
      // show helpful message instead of raw error
      const msg = e?.message ?? ''
      if (msg.includes('500') || msg.includes('Failed')) {
        alert(
          'Document upload requires the production ' +
          'server. This will work when deployed. ' +
          'For now, describe your documents in the ' +
          '"Describe your situation" box instead.'
        )
      } else {
        alert('Upload failed: ' + msg)
      }
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

  function riskBorderColor(s: string) {
    if (s === 'High') return '#dc2626'
    if (s === 'Medium') return '#f59e0b'
    return '#16a34a'
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

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }

    if (activeFeature === 'risk') {
      const risks: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.risks) ? parsed.risks : []
      if (risks.length === 0) return fallback
      const severityBadgeStyle = (s: string) => {
        if (s === 'High') return { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }
        if (s === 'Medium') return { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }
        return { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
      }
      return (
        <div>
          {risks.map((r, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '20px 22px', marginBottom: 14,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
              borderLeft: `4px solid ${riskBorderColor(r.severity)}`,
              transition: 'all 0.2s ease', animation: 'fadeIn 0.3s ease', animationDelay: `${i * 0.05}s`, animationFillMode: 'both',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px', color: '#0f172a' }}>{r.risk}</div>
                <span style={{ ...severityBadgeStyle(r.severity), fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>{r.severity}</span>
              </div>
              <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, marginTop: 10 }}>{r.explanation}</div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Why this matters</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{r.whyItMatters}</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What to do</div>
                <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginTop: 6 }}>{r.whatToDo}</div>
              </div>
              {r.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                  <i className="ti ti-clock" style={{ fontSize: 13 }} />
                  <span>{r.deadline}</span>
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
            <div key={i} style={{ ...cardStyle, borderLeft: '4px solid #2563eb', boxShadow: '0 2px 8px rgba(37,99,235,0.08)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#2563eb', textTransform: 'uppercase' }}>{q.topic}</div>
                {q.category && badge(q.category, categoryStyle(q.category))}
              </div>
              <div style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.6, fontStyle: 'italic', marginTop: 6 }}>{q.question}</div>
              {q.whyAsk && <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>{q.whyAsk}</div>}
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
              width: '100%', padding: '15px',
              borderRadius: 12, background: '#25D366',
              color: 'white', border: 'none',
              fontSize: 15, fontWeight: 600,
              boxShadow: '0 4px 12px rgba(37,211,102,0.25)',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit', cursor: 'pointer',
              marginTop: 20
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
    return <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', ...extra }}>{text}</div>
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
        { key: 'documents', label: 'Documents', icon: 'ti-files', onClick: () => { setActiveView('documents'); setActiveFeature(null) } },
        { key: 'settings', label: 'Settings', icon: 'ti-settings', onClick: () => { setActiveView('settings'); setActiveFeature(null) } },
      ],
    },
  ]

  function isSidebarItemActive(key: string) {
    if (key === 'risk' || key === 'ask-advocate' || key === 'contradiction' || key === 'evidence') {
      return activeFeature === key
    }
    if (key === 'documents' || key === 'settings') {
      return activeView === key
    }
    return activeFeature === null && activeView === key
  }

  // ── Desktop sidebar ────────────────────────────────────────────────────────
  function DesktopSidebar() {
    return (
      <div style={{
        position: 'fixed', left: 0, top: 0, width: 240, height: '100vh',
        background: '#0f172a', borderRight: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', zIndex: 100,
      }}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-scale" style={{ fontSize: 16, color: '#fff' }} />
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>Clausio</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 10, padding: '3px 10px', borderRadius: 4, display: 'inline-block', marginTop: 6, letterSpacing: '0.06em' }}>
            Client portal
          </div>
        </div>

        <div style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '10px 12px 6px' }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const active = isSidebarItemActive(item.key)
                return (
                  <div
                    key={item.key}
                    onClick={item.onClick}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 0,
                      fontSize: 14, cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s ease',
                      borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                      background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <i className={`ti ${item.icon}`} style={{ fontSize: 18, color: active ? '#fff' : 'rgba(255,255,255,0.4)' }} />
                    {item.label}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', fontSize: 10, fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Client</div>
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
    { key: 'documents', label: 'Docs', icon: 'ti-files' },
    { key: 'settings', label: 'Settings', icon: 'ti-settings' },
  ] as const

  function BottomNav() {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 -8px 32px rgba(0,0,0,0.10)', display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 12px', paddingBottom: 'env(safe-area-inset-bottom, 12px)', zIndex: 200,
      }}>
        {BOTTOM_NAV_ITEMS.map(item => {
          const active = activeView === item.key
          return (
            <div
              key={item.key}
              onClick={() => { setActiveView(item.key); setActiveFeature(null) }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', transition: 'all 0.2s ease',
                padding: active ? '4px 10px' : '4px 8px',
                background: active ? '#f1f5f9' : 'transparent',
                borderRadius: active ? 12 : 0,
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 22, color: active ? '#0f172a' : '#94a3b8' }} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? '#0f172a' : '#94a3b8' }}>{item.label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Feature full screen ────────────────────────────────────────────────────
  function FeatureScreen() {
    if (!activeFeature) return (
      <div style={{ display: 'none' }} />
    )
    const card = FEATURE_CARDS.find(c => c.type === activeFeature)
    // actionplan keeps its result in featureContent (loadActionPlan's own state) —
    // deriving "generated" from that directly (rather than featureGenerated) means
    // this also recognises an action plan generated via the Actions tab's own
    // "Generate Action Plan" button, which calls loadActionPlan() directly.
    const isGenerated = activeFeature === 'actionplan' ? actionItems.length > 0 : !!featureGenerated[activeFeature]
    const hasActionItems = activeFeature === 'actionplan' && actionItems.length > 0
    const hasAnyContent = activeFeature === 'actionplan' ? featureContent !== '' : !!featureContents[activeFeature]

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: isDesktop ? 240 : 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: '#f8fafc',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.3s ease',
        opacity: activeFeature ? 1 : 0,
        pointerEvents: activeFeature ? 'auto' : 'none',
        transition: 'opacity 0.2s ease',
      }}>
        <div style={{ padding: isDesktop ? '18px 40px' : 16, borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 20, background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => setActiveFeature(null)}
            style={{ width: 38, height: 38, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 16, color: '#0f172a' }} />
          </div>
          {card && (
            <div style={{ width: 42, height: 42, borderRadius: 12, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${card.icon}`} style={{ fontSize: 17, color: card.iconColor }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: isDesktop ? 24 : 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a' }}>{FEATURE_META[activeFeature]?.title}</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>{FEATURE_META[activeFeature]?.subtitle}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: isDesktop ? '28px 40px' : 16, paddingBottom: 100, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
          {featureLoading && (
            <div>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                  <div style={{ height: 16, width: '60%', background: '#f1f5f9', borderRadius: 4, marginBottom: 12, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 12, width: '100%', background: '#f8fafc', borderRadius: 4, marginBottom: 8, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 12, width: '80%', background: '#f8fafc', borderRadius: 4, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          )}

          {!featureLoading && !isGenerated && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '52px 32px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', maxWidth: 480, margin: '20px auto' }}>
              {card && (
                <div style={{ width: 80, height: 80, borderRadius: 24, background: card.iconBg, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <i className={`ti ${card.icon}`} style={{ fontSize: 36, color: card.iconColor }} />
                </div>
              )}
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a', marginTop: 4 }}>{FEATURE_META[activeFeature]?.title}</div>
              <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65, marginTop: 10, maxWidth: 360, margin: '10px auto 0' }}>
                Click the button below to analyse your case and get personalised insights
              </div>
              <button
                onClick={() => runFeatureAI(activeFeature)}
                style={{ marginTop: 28, background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 48px', fontSize: 16, fontWeight: 700, letterSpacing: '0.02em', boxShadow: '0 8px 24px rgba(15,23,42,0.25)', transition: 'all 0.2s ease', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {GENERATE_LABELS[activeFeature ?? ''] ?? 'Run Analysis'} →
              </button>
            </div>
          )}

          {!featureLoading && isGenerated && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {hasAnyContent && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <button
                    onClick={() => runFeatureAI(activeFeature!)}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s ease', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
                  >
                    <i className="ti ti-refresh" style={{ fontSize: 14 }} /> Regenerate
                  </button>
                </div>
              )}

              {activeFeature === 'actionplan' ? (
                hasActionItems ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {actionItems.map((item, i) => {
                      const pStyle = priorityStyle(item.priority)
                      return (
                      <div
                        key={i}
                        onClick={() => toggleChecked(i)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 16,
                          background: '#fff', borderRadius: 14, padding: 20,
                          border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                          cursor: 'pointer', marginBottom: 2,
                          animation: 'fadeIn 0.3s ease', animationDelay: `${i * 0.05}s`, animationFillMode: 'both',
                        }}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: 8, flexShrink: 0, marginTop: 2,
                          border: checkedActions[i] ? '2px solid #0f172a' : '2px solid #e2e8f0',
                          background: checkedActions[i] ? '#0f172a' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {checkedActions[i] && <i className="ti ti-check" style={{ fontSize: 12, color: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: checkedActions[i] ? '#94a3b8' : '#0f172a', textDecoration: checkedActions[i] ? 'line-through' : 'none' }}>{item.title}</div>
                          <span style={{ ...pStyle, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: `1px solid ${pStyle.color}`, marginTop: 4, display: 'inline-block' }}>{item.priority}</span>
                          {item.howToDoIt && (
                            <div style={{
                              fontSize: 14, color: '#64748b', marginTop: 8,
                              lineHeight: 1.6
                            }}>
                              {item.howToDoIt}
                            </div>
                          )}
                          {item.deadline && (
                            <div style={{
                              fontSize: 12, color: '#94a3b8', marginTop: 6,
                              display: 'flex', alignItems: 'center', gap: 6
                            }}>
                              <i className="ti ti-clock" style={{fontSize: 12}} />
                              {item.deadline}
                            </div>
                          )}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                ) : null
              ) : (
                renderFeatureContent()
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Home view ──────────────────────────────────────────────────────────────
  function HomeView() {
    return (
      <div style={{ paddingBottom: isDesktop ? 0 : 80, animation: 'fadeIn 0.3s ease' }}>
        <div style={{ padding: isDesktop ? '36px 40px 32px' : '24px 20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              {(() => {
                const court = selectedCase?.court ?? selectedCase?.Court ?? ''
                if (!court || court === 'To be determined' || court === 'To be confirmed') return null
                return (
                  <div style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 11, padding: '3px 10px', borderRadius: 4, display: 'inline-block', marginBottom: 10 }}>
                    {court}
                  </div>
                )
              })()}
              <div style={{ fontSize: isDesktop ? 36 : 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.8px', marginBottom: 4 }}>
                {greeting}, {user?.firstName || 'there'}
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
                {(() => {
                  if (!selectedCase) return 'No case selected'
                  const name = selectedCase?.name ?? selectedCase?.Name ?? ''
                  const stage = selectedCase?.stage ?? selectedCase?.Stage ?? ''
                  const court = selectedCase?.court ?? selectedCase?.Court ?? ''

                  // If name is very long (description used as name)
                  // show stage + court instead
                  if (name.length > 40) {
                    if (stage && court &&
                        court !== 'To be determined' &&
                        court !== 'To be confirmed') {
                      return `${stage} · ${court}`
                    }
                    if (stage && stage !== 'Initial Consultation') {
                      return `${stage} stage`
                    }
                    return 'Active case'
                  }
                  return name
                })()}
              </div>
            </div>
            {isDesktop && (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 500, fontSize: 16, flexShrink: 0 }}>
                {initials}
              </div>
            )}
          </div>

          {cases.length > 1 && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cases.map((c: any) => {
                const caseId = c.id ?? c.Id
                const selectedId = selectedCase?.id ?? selectedCase?.Id
                const isSelected = caseId === selectedId
                const name = c.name ?? c.Name ?? 'Unnamed case'
                // Show max 25 chars
                const shortName = name.length > 25 ? name.substring(0, 25) + '...' : name
                return (
                  <div
                    key={caseId}
                    onClick={() => {
                      const found = cases.find((x: any) => (x.id ?? x.Id) === caseId)
                      if (found) selectCase(found)
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: isSelected ?
                        'rgba(255,255,255,0.25)' :
                        'rgba(255,255,255,0.08)',
                      color: isSelected ?
                        '#fff' : 'rgba(255,255,255,0.6)',
                      border: isSelected ?
                        '1px solid rgba(255,255,255,0.4)' :
                        '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    {shortName}
                  </div>
                )
              })}
            </div>
          )}

          {cases.length > 0 && (
            <div style={{
              marginTop: 24, display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: 12,
            }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '16px 18px', transition: 'all 0.2s ease' }}>
                <i className="ti ti-calendar-event" style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block' }} />
                <div style={{ fontSize: isDesktop ? 20 : 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                  {displayHearingDate ? fmtDate(displayHearingRaw) : 'No hearing scheduled'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: displayHearingSoon ? '#f87171' : 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                  {displayDaysAway === null ? 'No upcoming hearings' : displayDaysAway <= 0 ? 'Today' : `${displayDaysAway} days away`}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '16px 18px', transition: 'all 0.2s ease' }}>
                <i className="ti ti-flag" style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block' }} />
                <div style={{ fontSize: isDesktop ? 20 : 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>{selectedCase?.stage ?? selectedCase?.Stage ?? 'Active'}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Case stage</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '16px 18px', transition: 'all 0.2s ease' }}>
                <i className="ti ti-files" style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block' }} />
                <div style={{ fontSize: isDesktop ? 20 : 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                  {documents.length > 0 ? `${documents.length} file${documents.length > 1 ? 's' : ''}` : 'No docs'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                  Documents
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '16px 18px', transition: 'all 0.2s ease' }}>
                <i className="ti ti-building" style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'block' }} />
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>
                  {(() => {
                    const c = selectedCase?.court ??
                              selectedCase?.Court ??
                              nextHearingObj?.courtHall ??
                              nextHearingObj?.CourtHall ??
                              nextHearingObj?.court ?? ''
                    return (!c || c === 'To be determined' || c === 'To be confirmed') ? 'Not set yet' : c
                  })()}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Court</div>
                {(nextHearingObj?.judge ?? nextHearingObj?.Judge) && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{nextHearingObj?.judge ?? nextHearingObj?.Judge}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: '#f8fafc', padding: isDesktop ? '28px 40px' : '20px 16px' }}>

        {selectedCase && displayDaysAway !== null && displayDaysAway >= 0 && displayDaysAway <= 7 && (
          <div
            onClick={() => {
              setActiveView('hearing')
              setActiveFeature(null)
            }}
            style={{
              background: displayDaysAway <= 1 ?
                'linear-gradient(135deg,#dc2626,#b91c1c)' :
                'linear-gradient(135deg,#d97706,#b45309)',
              borderRadius: 14, padding: '16px 20px',
              marginBottom: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              gap: 14, transition: 'all 0.2s ease',
              boxShadow: displayDaysAway <= 1 ?
                '0 4px 16px rgba(220,38,38,0.25)' :
                '0 4px 16px rgba(217,119,6,0.25)',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <i className="ti ti-gavel" style={{ fontSize: 22, color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
                {displayDaysAway === 0 ?
                  'Your hearing is TODAY' :
                  displayDaysAway === 1 ?
                  'Your hearing is TOMORROW' :
                  `Your hearing is in ${displayDaysAway} days`}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
                {fmtDate(displayHearingRaw)} · Tap to prepare →
              </div>
            </div>
            <i className="ti ti-chevron-right" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
          </div>
        )}

        {(cases.length === 0 || !selectedCase) ? (
          // ── ONBOARDING — NO CASES ──
          <div style={{ background: '#fff', borderRadius: 20, padding: isDesktop ? '48px 52px' : '32px 24px', textAlign: 'center', maxWidth: 560, margin: '16px auto', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: isDesktop ? 32 : 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.6px', marginBottom: 8 }}>
              Welcome to Clausio, {user?.firstName || ''}
            </div>
            <div style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, marginBottom: 32 }}>
              To get started, tell us about your situation
            </div>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
              <div
                onClick={() => setShowDescribeModal(true)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '22px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-pencil" style={{ fontSize: 20, color: '#16a34a' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Describe what happened</div>
                  <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>Tell us in your own words what legal problem you are facing</div>
                </div>
              </div>

              <div
                onClick={() => alert('Coming soon — your advocate will add your case to Clausio')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '22px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-upload" style={{ fontSize: 20, color: '#2563eb' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Upload a document</div>
                  <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>FIR, legal notice, court order, or any document related to your case</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>What do you want to know?</div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
              gap: 14, marginBottom: 24,
            }}>
              {(() => {
                const nothingGenerated = Object.keys(featureContents).length === 0 && actionItems.length === 0
                return FEATURE_CARDS.map((card, idx) => {
                  const showStartHere = idx === 0 && nothingGenerated
                  return (
                    <div
                      key={card.type}
                      className="feature-card"
                      onClick={() => openFeature(card.type)}
                      style={{
                        background: '#fff',
                        border: showStartHere ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                        boxShadow: showStartHere ? '0 4px 16px rgba(22,163,74,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                        borderRadius: 16, padding: '20px 18px', cursor: 'pointer', transition: 'all 0.25s ease',
                        position: 'relative',
                      }}
                    >
                      {showStartHere && (
                        <div style={{
                          position: 'absolute', top: -8, right: -8,
                          background: '#16a34a', color: '#fff',
                          fontSize: 10, fontWeight: 700,
                          padding: '3px 8px', borderRadius: 10,
                        }}>
                          Start here
                        </div>
                      )}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                        background: card.iconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
                      }}>
                        <i className={`ti ${card.icon}`} style={{ fontSize: 19, color: card.iconColor }} />
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px', marginBottom: 4 }}>
                        {FEATURE_META[card.type].title}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                        {FEATURE_META[card.type].subtitle}
                      </div>
                      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Go →</span>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            {hearings.length > 0 && (() => {
              const lastHearing = hearings
                .filter(h => {
                  const d = h.hearingDate ?? h.HearingDate ?? h.date
                  return d && new Date(d) < new Date()
                })
                .sort((a, b) =>
                  new Date(b.hearingDate ?? b.HearingDate ?? b.date).getTime() -
                  new Date(a.hearingDate ?? a.HearingDate ?? a.date).getTime()
                )[0]

              const notes = lastHearing?.whatHappened ?? lastHearing?.WhatHappened ?? lastHearing?.notes ?? lastHearing?.Notes ?? ''

              if (!notes) return null

              return (
                <div style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14, padding: '18px 20px',
                  marginTop: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Last hearing update
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                    {notes}
                  </div>
                  {displayHearingDate && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className="ti ti-clock" style={{ fontSize: 13 }} />
                      Next hearing: {fmtDate(displayHearingRaw)}
                    </div>
                  )}
                </div>
              )
            })()}
          </>
        )}

        <div style={{ paddingTop: 20 }}>
          <div style={{ fontSize: 10, color: '#cbd5e1' }}>
            AI analysis · Not legal advice · Always consult your advocate before acting
          </div>
        </div>
        </div>
      </div>
    )
  }

  // ── Hearing view ───────────────────────────────────────────────────────────
  function HearingView() {
    const [showAddForm, setShowAddForm] = useState(false)
    const [showDoneModal, setShowDoneModal] = useState(false)
    const [editingHearingId, setEditingHearingId] = useState<string | null>(null)
    const [hearingPrep, setHearingPrep] = useState<any>(null)
    const [prepLoading, setPrepLoading] = useState(false)
    const [bringChecked, setBringChecked] = useState<boolean[]>([])
    const [doneNotes, setDoneNotes] = useState('')
    const [doneJudge, setDoneJudge] = useState('')
    const [doneNextDate, setDoneNextDate] = useState('')
    const [saving, setSaving] = useState(false)
    const [addForm, setAddForm] = useState({
      date: '', court: '', stage: 'Evidence', judge: '',
      lastWhatHappened: '', lastJudgeSaid: '', whatIsPending: '',
    })

    const upcomingHearings = hearings
      .filter(h => {
        const d = h.hearingDate ?? h.HearingDate ?? h.date
        return d && new Date(d) >= new Date()
      })
      .sort((a, b) =>
        new Date(a.hearingDate ?? a.HearingDate ?? a.date).getTime() -
        new Date(b.hearingDate ?? b.HearingDate ?? b.date).getTime()
      )

    const pastHearings = hearings
      .filter(h => {
        const d = h.hearingDate ?? h.HearingDate ?? h.date
        return d && new Date(d) < new Date()
      })
      .sort((a, b) =>
        new Date(b.hearingDate ?? b.HearingDate ?? b.date).getTime() -
        new Date(a.hearingDate ?? a.HearingDate ?? a.date).getTime()
      )

    const nextHearing = upcomingHearings[0] ?? null
    const nextHearingDateVal = nextHearing ? new Date(nextHearing.hearingDate ?? nextHearing.HearingDate ?? nextHearing.date) : null
    const daysAway = nextHearingDateVal ? Math.ceil((nextHearingDateVal.getTime() - Date.now()) / 86400000) : null

    const lastHearingWithNotes = pastHearings.find((h: any) => {
      const n = h.whatHappened ?? h.WhatHappened ?? h.notes ?? h.Notes ?? ''
      return n && n.trim().length > 0
    })

    // Re-fetches this case's hearings and pushes the result into the outer
    // `hearings` state (setHearings is in the parent component's scope —
    // HearingView closes over it the same way DesktopSidebar/FeatureScreen
    // close over other outer state, so no prop drilling is needed).
    function refreshHearings() {
      if (!selectedCase) return
      const caseId = selectedCase.id ?? selectedCase.Id
      hearingsApi.getByCaseId(caseId).then((data: any) => {
        const list = Array.isArray(data) ? data : data?.hearings ?? data?.data ?? []
        setHearings(list)
      }).catch(() => {})
    }

    // NOTE: CreateHearingDto/UpdateHearingDto on the backend use courtHall /
    // judge / whatHappened / judgeObservation — not court / judgeName / notes /
    // observations. ASP.NET model binding silently drops unrecognised JSON
    // properties rather than erroring, so using the wrong names here would
    // "work" but save nothing — using the real field names throughout.
    async function addHearing() {
      if (!selectedCase || !addForm.date) return
      setSaving(true)
      try {
        const caseId = selectedCase.id ?? selectedCase.Id
        await hearingsApi.create(caseId, {
          hearingDate: new Date(addForm.date + 'T00:00:00').toISOString(),
          courtHall: addForm.court || (selectedCase.court ?? selectedCase.Court ?? ''),
          stage: addForm.stage,
          judge: addForm.judge || undefined,
          // "What happened last time" — feeds the case context so the AI
          // hearing-prep generation is grounded in this hearing's actual
          // history instead of producing generic guidance.
          whatHappened: addForm.lastWhatHappened || undefined,
          judgeObservation: addForm.lastJudgeSaid || undefined,
          nextObjective: addForm.whatIsPending || undefined,
        })
        setAddForm({ date: '', court: '', stage: 'Evidence', judge: '', lastWhatHappened: '', lastJudgeSaid: '', whatIsPending: '' })
        setShowAddForm(false)
        refreshHearings()
        casesApi.getById(caseId).then((updated: any) => {
          if (updated) selectCase(updated)
        }).catch(() => {})
      } catch(e: any) {
        console.error('Add hearing error:', e)
        alert('Could not save hearing: ' + (e?.message ?? 'Please try again.'))
      } finally {
        setSaving(false)
      }
    }

    async function markDone() {
      if (!selectedCase) return
      const targetId = editingHearingId ?? (nextHearing?.id ?? nextHearing?.Id)
      if (!targetId) return
      setSaving(true)
      try {
        const caseId = selectedCase.id ?? selectedCase.Id
        await hearingsApi.update(caseId, targetId, {
          whatHappened: doneNotes,
          judgeObservation: doneJudge,
        })
        if (doneNextDate) {
          await hearingsApi.create(caseId, {
            hearingDate: new Date(doneNextDate + 'T00:00:00').toISOString(),
            courtHall: (() => {
              const c = nextHearing?.courtHall ?? nextHearing?.CourtHall ?? ''
              if (!c || c === 'To be determined' || c === 'To be confirmed') {
                return selectedCase?.court ?? selectedCase?.Court ?? ''
              }
              return c
            })(),
            stage: nextHearing?.stage ?? nextHearing?.Stage ?? 'Evidence',
          })
        }
        setShowDoneModal(false)
        setDoneNotes('')
        setDoneJudge('')
        setDoneNextDate('')
        setHearingPrep(null)
        setEditingHearingId(null)
        refreshHearings()
        casesApi.getById(caseId).then((updated: any) => {
          if (updated) selectCase(updated)
        }).catch(() => {})
      } catch(e: any) {
        console.error('markDone error:', e)
        alert('Could not save: ' + (e?.message ?? 'Please try again.'))
      } finally {
        setSaving(false)
      }
    }

    async function loadHearingPrep() {
      if (!selectedCase) return
      setPrepLoading(true)
      try {
        const caseId = selectedCase.id ?? selectedCase.Id
        const res = await aiApi.getHearingPrep(caseId)
        const raw = typeof res?.result === 'string' ? res.result : JSON.stringify(res?.result ?? res)
        const parsed = parseAiJson<any>(raw)
        setHearingPrep(parsed)
        if (parsed?.whatToBring) {
          setBringChecked(parsed.whatToBring.map(() => false))
        }
      } catch {
        alert('Could not generate preparation. Please try again.')
      } finally {
        setPrepLoading(false)
      }
    }

    function shareHearingPrepOnWhatsApp() {
      if (!hearingPrep) return
      const questions = (hearingPrep.questionsToAskAdvocate ?? [])
        .map((q: any, i: number) => `${i + 1}. ${q.question}`)
        .join('\n')
      const text = `${hearingPrep.hearingSummary ?? ''}\n\nQuestions to ask my advocate:\n${questions}`
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: isDesktop ? '22px 26px' : 18, marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }
    const tag = (text: string, bg = '#f1f5f9', color = '#64748b') => (
      <div style={{ background: bg, color, fontSize: 10, padding: '3px 10px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block', marginBottom: 10 }}>{text}</div>
    )

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#f8fafc', paddingBottom: isDesktop ? 40 : 80, minHeight: 0, overflowY: 'auto' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#fff',
          padding: isDesktop ? '20px 36px' : 16,
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div
            onClick={() => setActiveView('home')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease' }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 18, color: '#0f172a' }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', color: '#0f172a' }}>My Hearings</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>{upcomingHearings.length} upcoming · {pastHearings.length} past</div>
          </div>
        </div>

        <div style={{ padding: isDesktop ? '24px 36px' : 16, maxWidth: '100%' }}>
          {/* ── Upcoming hearing ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Upcoming hearing</div>
            {!nextHearing && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'all 0.2s ease' }}
              >
                <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add hearing
              </button>
            )}
          </div>

          {lastHearingWithNotes && (() => {
            const hDate = lastHearingWithNotes.hearingDate ?? lastHearingWithNotes.HearingDate
            const hNotes = lastHearingWithNotes.whatHappened ?? lastHearingWithNotes.WhatHappened ?? lastHearingWithNotes.notes ?? ''
            const hJudge = lastHearingWithNotes.judgeObservation ?? lastHearingWithNotes.JudgeObservation ?? ''
            return (
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '18px 20px',
                marginBottom: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: '#94a3b8', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <i className="ti ti-history" style={{ fontSize: 13 }} />
                  Last hearing — {fmtDate(hDate)}
                </div>

                {hNotes && (
                  <div style={{
                    fontSize: 14, color: '#374151',
                    lineHeight: 1.6, marginBottom: hJudge ? 10 : 0,
                  }}>
                    {hNotes.length > 120 ? hNotes.substring(0, 120) + '...' : hNotes}
                  </div>
                )}

                {hJudge && (
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 8, padding: '10px 14px',
                    marginTop: 8,
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color: '#94a3b8', textTransform: 'uppercase',
                      letterSpacing: '0.06em', marginBottom: 4,
                    }}>
                      Judge said
                    </div>
                    <div style={{
                      fontSize: 13, color: '#475569',
                      fontStyle: 'italic', lineHeight: 1.5,
                    }}>
                      {hJudge.length > 100 ? hJudge.substring(0, 100) + '...' : hJudge}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {!nextHearing ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-calendar-event" style={{ fontSize: 28, color: '#94a3b8' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>No upcoming hearing added</div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 8, maxWidth: 320, margin: '8px auto 0' }}>Add your next hearing date so we can help you prepare for it</div>
              <button
                onClick={() => setShowAddForm(true)}
                style={{ marginTop: 24, background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
              >
                + Add your next hearing
              </button>
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              borderRadius: 14,
              padding: isDesktop ? '28px 32px' : 20,
              marginBottom: 16,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(15,23,42,0.2)',
            }}>
              <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -80, right: -80, pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>
                      Next hearing
                    </div>
                    <div style={{ fontSize: isDesktop ? 36 : 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                      {fmtDate(nextHearingDateVal?.toISOString() ?? null)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '7px 16px', fontSize: 13, color: '#fff', fontWeight: 500 }}>
                      {daysAway === 0 ? 'Today!' : daysAway === 1 ? 'Tomorrow' : daysAway !== null ? `${daysAway} days away` : ''}
                    </span>
                    <button
                      onClick={() => { setEditingHearingId(null); setShowDoneModal(true) }}
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
                    >
                      Mark as done
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 10, marginTop: 20 }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="ti ti-building" style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)' }} />
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Court</div>
                      <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, marginTop: 2 }}>
                        {(() => {
                          const c = nextHearing.courtHall ?? nextHearing.CourtHall ?? nextHearing.court ?? nextHearing.Court ?? ''
                          if (!c || c === 'To be determined' || c === 'To be confirmed') {
                            return selectedCase?.court ?? selectedCase?.Court ?? '—'
                          }
                          return c
                        })()}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="ti ti-flag" style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)' }} />
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stage</div>
                      <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, marginTop: 2 }}>
                        {nextHearing.stage ?? nextHearing.Stage ?? 'Active'}
                      </div>
                    </div>
                  </div>

                  {(nextHearing.judge ?? nextHearing.Judge) && (
                    <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="ti ti-user" style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)' }} />
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Judge</div>
                        <div style={{ fontSize: 13, color: '#fff', fontWeight: 500, marginTop: 2 }}>
                          {nextHearing.judge ?? nextHearing.Judge}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={loadHearingPrep}
                  disabled={prepLoading}
                  style={{
                    marginTop: 16, width: '100%',
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 10, padding: 14,
                    fontSize: 14, fontWeight: 600, color: '#fff',
                    cursor: prepLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {prepLoading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Preparing your hearing guide...
                    </>
                  ) : hearingPrep ? (
                    <><i className="ti ti-refresh" /> Regenerate preparation</>
                  ) : (
                    <><i className="ti ti-sparkles" /> Prepare me for this hearing →</>
                  )}
                </button>
              </div>
            </div>
          )}

          {nextHearing && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                width: '100%', padding: '13px',
                background: 'white',
                border: '1.5px dashed #cbd5e1',
                borderRadius: 12, fontSize: 14,
                fontWeight: 500, color: '#64748b',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                marginBottom: 16,
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: 16, color: '#94a3b8' }} />
              Add another hearing date
            </button>
          )}

          {/* ── Hearing prep output ── */}
          {hearingPrep && (
            <>
              {hearingPrep.hearingSummary && (
                <div style={cardStyle}>
                  {tag('Overview')}
                  <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.7 }}>{hearingPrep.hearingSummary}</div>
                </div>
              )}

              {Array.isArray(hearingPrep.whatToBring) && hearingPrep.whatToBring.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>What to bring</div>
                    <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 12, padding: '4px 12px', borderRadius: 20 }}>
                      {bringChecked.filter(Boolean).length} of {hearingPrep.whatToBring.length} packed
                    </span>
                  </div>
                  <div style={{ height: 1, background: '#f8fafc', margin: '12px 0' }} />
                  {hearingPrep.whatToBring.map((item: any, i: number) => {
                    const checked = !!bringChecked[i]
                    return (
                      <div
                        key={i}
                        onClick={() => setBringChecked(prev => prev.map((v, idx) => idx === i ? !v : v))}
                        style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < hearingPrep.whatToBring.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', alignItems: 'flex-start' }}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                          border: checked ? '2px solid #16a34a' : '2px solid #e2e8f0',
                          background: checked ? '#16a34a' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {checked && <i className="ti ti-check" style={{ fontSize: 13, color: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: checked ? '#94a3b8' : '#0f172a', textDecoration: checked ? 'line-through' : 'none' }}>{item.item}</div>
                          {item.why && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{item.why}</div>}
                          {!checked && item.howToGet && <div style={{ fontSize: 12, color: '#2563eb', marginTop: 3, fontStyle: 'italic' }}>{item.howToGet}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {hearingPrep.whatToExpect && (
                <div style={cardStyle}>
                  {tag('At the hearing')}
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>What will happen</div>
                  <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>{hearingPrep.whatToExpect}</div>
                </div>
              )}

              {Array.isArray(hearingPrep.whatOtherSideMayArgue) && hearingPrep.whatOtherSideMayArgue.length > 0 && (
                <div style={cardStyle}>
                  {tag('Be prepared')}
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>What the other side may say</div>
                  {hearingPrep.whatOtherSideMayArgue.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < hearingPrep.whatOtherSideMayArgue.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ti ti-alert-triangle" style={{ fontSize: 15, color: '#dc2626' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{item.argument}</div>
                        {item.howToStayCalm && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.howToStayCalm}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(hearingPrep.tipsForTheDay) && hearingPrep.tipsForTheDay.length > 0 && (
                <div style={cardStyle}>
                  {tag('On the day')}
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Tips for court</div>
                  {hearingPrep.tipsForTheDay.map((tip: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < hearingPrep.tipsForTheDay.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 6 }} />
                      <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(hearingPrep.questionsToAskAdvocate) && hearingPrep.questionsToAskAdvocate.length > 0 && (
                <div style={cardStyle}>
                  {tag('Ask your advocate')}
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Questions to ask before or at the hearing</div>
                  {hearingPrep.questionsToAskAdvocate.map((q: any, i: number) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: '3px solid #2563eb', borderRadius: 8, padding: '12px 14px', marginBottom: i < hearingPrep.questionsToAskAdvocate.length - 1 ? 8 : 0 }}>
                      <div style={{ fontSize: 14, color: '#0f172a', fontStyle: 'italic' }}>{q.question}</div>
                      {q.whyImportant && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{q.whyImportant}</div>}
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(hearingPrep.urgentActionsBeforeHearing) && hearingPrep.urgentActionsBeforeHearing.length > 0 && (
                <div style={cardStyle}>
                  {tag('Do this now', '#fee2e2', '#dc2626')}
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Things to do before the hearing</div>
                  {hearingPrep.urgentActionsBeforeHearing.map((a: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < hearingPrep.urgentActionsBeforeHearing.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{a.action}</div>
                        {a.deadline && (
                          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="ti ti-clock" style={{ fontSize: 12 }} /> {a.deadline}
                          </div>
                        )}
                        {a.howTo && <div style={{ fontSize: 13, color: '#64748b', marginTop: 5, lineHeight: 1.5 }}>{a.howTo}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hearingPrep.emotionalPreparation && (
                <div style={{ background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', border: '1px solid #dbeafe', borderRadius: 14, padding: isDesktop ? '24px 28px' : 20, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <i className="ti ti-heart" style={{ fontSize: 20, color: '#2563eb' }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>You've got this</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{hearingPrep.emotionalPreparation}</div>
                </div>
              )}

              <button
                onClick={shareHearingPrepOnWhatsApp}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '15px',
                  borderRadius: 12, background: '#25D366',
                  color: 'white', border: 'none',
                  fontSize: 15, fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(37,211,102,0.25)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit', cursor: 'pointer',
                  marginBottom: 16,
                }}
              >
                <i className="ti ti-brand-whatsapp" />
                Share this preparation with my advocate
              </button>
            </>
          )}

          {/* ── Past hearings ── */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, marginTop: 24 }}>Past hearings</div>
          <div style={cardStyle}>
            {pastHearings.length > 0 ? (
              pastHearings.map((h: any, i: number) => {
                const hDate = h.hearingDate ?? h.HearingDate ?? h.date
                const hNotes = h.whatHappened ?? h.WhatHappened ?? h.notes ?? h.Notes ?? h.observations ?? h.Observations ?? ''
                const hJudge = h.judgeObservation ?? h.JudgeObservation ?? h.judgeNotes ?? h.JudgeNotes ?? ''
                console.log('hearing obj:', JSON.stringify(pastHearings[0] ?? {}).substring(0, 300))
                const hStage = h.stage ?? h.Stage ?? ''
                const hCourt = h.courtHall ?? h.CourtHall ?? h.court ?? h.Court ?? selectedCase?.court ?? selectedCase?.Court ?? ''
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 14,
                    paddingBottom: i < pastHearings.length - 1 ? 20 : 0,
                    borderBottom: i < pastHearings.length - 1 ? '1px solid #f8fafc' : 'none',
                    marginBottom: i < pastHearings.length - 1 ? 20 : 0,
                  }}>
                    <div style={{ width: 76, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{fmtDate(hDate)}</div>
                      {hStage && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{hStage}</div>}
                      {hCourt && hCourt !== 'To be determined' && (
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                          {hCourt}
                        </div>
                      )}
                    </div>
                    <div style={{ width: 12, flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, background: hNotes ? '#16a34a' : '#e2e8f0', borderRadius: '50%', marginTop: 5 }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        {hNotes && <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: hJudge ? 8 : 0 }}>{hNotes}</div>}
                        {hJudge && (
                          <>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 4 }}>Judge's order:</div>
                            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, fontStyle: 'italic' }}>{hJudge}</div>
                          </>
                        )}
                        {!hNotes && !hJudge && <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No notes recorded</div>}
                      </div>
                      <button
                        onClick={() => {
                          setDoneNotes(hNotes)
                          setDoneJudge(hJudge)
                          setDoneNextDate('')
                          setShowDoneModal(true)
                          setEditingHearingId(h.id ?? h.Id ?? null)
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11, fontWeight: 500,
                          color: '#94a3b8', cursor: 'pointer',
                          fontFamily: 'inherit',
                          marginLeft: 'auto',
                          flexShrink: 0,
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>Your past hearings will appear here after you mark hearings as done</div>
            )}
          </div>
        </div>

        {/* ── Add hearing modal ── */}
        {showAddForm && (
          <div onClick={() => !saving && setShowAddForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: isDesktop ? 440 : 'calc(100% - 32px)', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Add upcoming hearing</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Enter your next court date</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Hearing date *</label>
                <input
                  type="date"
                  required
                  value={addForm.date}
                  onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Court name</label>
                <input
                  type="text"
                  value={addForm.court}
                  placeholder={selectedCase?.court ?? selectedCase?.Court ?? 'e.g. Family Court Mumbai'}
                  onChange={e => setAddForm(p => ({ ...p, court: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Case stage</label>
                <select
                  value={addForm.stage}
                  onChange={e => setAddForm(p => ({ ...p, stage: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                >
                  {['Evidence', 'Arguments', 'Final Arguments', 'Judgment', 'Mediation', 'Settlement', 'Other'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Judge name (optional)</label>
                <input
                  type="text"
                  value={addForm.judge}
                  onChange={e => setAddForm(p => ({ ...p, judge: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0 20px' }} />

              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>What happened last time (optional)</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>What happened at the last hearing</label>
                <textarea
                  rows={2}
                  value={addForm.lastWhatHappened}
                  placeholder="e.g. Judge reviewed our documents and asked for salary slips from the other side..."
                  onChange={e => setAddForm(p => ({ ...p, lastWhatHappened: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>What did the judge say or order</label>
                <textarea
                  rows={2}
                  value={addForm.lastJudgeSaid}
                  placeholder="e.g. Judge ordered the other side to submit salary slips before next hearing..."
                  onChange={e => setAddForm(p => ({ ...p, lastJudgeSaid: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>What is pending before the next hearing</label>
                <textarea
                  rows={2}
                  value={addForm.whatIsPending}
                  placeholder="e.g. I need to submit my expense statement. Other side needs to submit documents..."
                  onChange={e => setAddForm(p => ({ ...p, whatIsPending: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => {
                    setAddForm({
                      date: '', court: '', stage: 'Evidence', judge: '',
                      lastWhatHappened: '', lastJudgeSaid: '', whatIsPending: '',
                    })
                    setShowAddForm(false)
                  }}
                  style={{ flex: 1, padding: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={addHearing}
                  disabled={!addForm.date || saving}
                  style={{ flex: 2, padding: 12, background: !addForm.date || saving ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: !addForm.date || saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  {saving ? 'Saving...' : 'Save hearing'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Mark done modal ── */}
        {showDoneModal && (
          <div onClick={() => !saving && (setShowDoneModal(false), setEditingHearingId(null))} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: isDesktop ? 440 : 'calc(100% - 32px)', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{editingHearingId ? 'Edit hearing record' : 'How did the hearing go?'}</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>{nextHearingDateVal ? fmtDate(nextHearingDateVal.toISOString()) : ''}</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>What happened at the hearing</label>
                <textarea
                  rows={3}
                  value={doneNotes}
                  placeholder="e.g. Judge reviewed documents. Next date given..."
                  onChange={e => setDoneNotes(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>What did the judge say or order</label>
                <textarea
                  rows={3}
                  value={doneJudge}
                  placeholder="e.g. Judge directed other side to submit salary slips..."
                  onChange={e => setDoneJudge(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Next hearing date (if given)</label>
                <input
                  type="date"
                  value={doneNextDate}
                  onChange={e => setDoneNextDate(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => { setShowDoneModal(false); setEditingHearingId(null) }}
                  style={{ flex: 1, padding: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={markDone}
                  disabled={saving}
                  style={{ flex: 2, padding: 12, background: saving ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  {saving ? 'Saving...' : 'Save hearing record'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── My Case view ───────────────────────────────────────────────────────────
  function MyCaseView() {
    const [caseDocs, setCaseDocs] = useState<any[]>([])
    const [docsLoading, setDocsLoading] = useState(false)
    const [showEditCase, setShowEditCase] = useState(false)
    const [editForm, setEditForm] = useState({
      court: '',
      stage: '',
      nextHearing: '',
      caseNumber: '',
    })
    const [editSaving, setEditSaving] = useState(false)

    useEffect(() => {
      if (!selectedCase) return
      setEditForm({
        court: selectedCase.court ?? selectedCase.Court ?? '',
        stage: selectedCase.stage ?? selectedCase.Stage ?? '',
        nextHearing: selectedCase.nextHearing ?? selectedCase.NextHearing ?? '',
        caseNumber: selectedCase.caseNumber ?? selectedCase.CaseNumber ?? '',
      })
    }, [selectedCase?.id ?? selectedCase?.Id])

    async function saveCase() {
      if (!selectedCase) return
      setEditSaving(true)
      try {
        const caseId = selectedCase.id ?? selectedCase.Id
        await casesApi.update(caseId, {
          Stage: editForm.stage || undefined,
          Court: editForm.court || undefined,
          NextHearing: editForm.nextHearing && editForm.nextHearing.trim() !== '' ? new Date(editForm.nextHearing + 'T00:00:00').toISOString() : undefined,
          Description: selectedCase.description ?? selectedCase.Description ?? undefined,
        })
        // Same refresh pattern used elsewhere in this file (loadCases/
        // refreshHearings) — re-fetch and push the updated record into the
        // outer `selectedCase` state via the existing selectCase() setter.
        const updated = await casesApi.getById(caseId)
        selectCase(updated)
        setShowEditCase(false)
      } catch (e: any) {
        alert('Could not save: ' + (e?.message ?? 'Please try again.'))
      } finally {
        setEditSaving(false)
      }
    }

    useEffect(() => {
      if (!selectedCase) return
      const caseId = selectedCase.id ?? selectedCase.Id
      setDocsLoading(true)
      documentsApi.getByCaseId(caseId)
        .then((data: any) => {
          const list = Array.isArray(data) ? data : data?.documents ?? data?.data ?? []
          setCaseDocs(list)
        })
        .catch(() => setCaseDocs([]))
        .finally(() => setDocsLoading(false))
    }, [selectedCase?.id ?? selectedCase?.Id])

    const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }

    // Same derivation as HearingView — kept local since HearingView's own
    // pastHearings/nextHearing are scoped to that function, not shared.
    const pastHearings = hearings
      .filter(h => {
        const d = h.hearingDate ?? h.HearingDate ?? h.date
        return d && new Date(d) < new Date()
      })
      .sort((a, b) =>
        new Date(a.hearingDate ?? a.HearingDate ?? a.date).getTime() -
        new Date(b.hearingDate ?? b.HearingDate ?? b.date).getTime()
      )

    const timelineEvents = [
      {
        date: selectedCase?.createdAt ?? selectedCase?.CreatedAt,
        title: 'Case filed on Clausio',
        description: 'You described your situation and your case was created.',
        type: 'filed' as const,
      },
      ...pastHearings.map((h: any) => ({
        date: h.hearingDate ?? h.HearingDate ?? h.date,
        title: 'Court hearing — ' + (h.stage ?? h.Stage ?? ''),
        description: h.whatHappened ?? h.WhatHappened ?? 'Hearing took place.',
        type: 'hearing' as const,
      })),
      ...(nextHearingObj ? [{
        date: nextHearingObj.hearingDate ?? nextHearingObj.HearingDate ?? nextHearingObj.date,
        title: 'Next hearing scheduled',
        description: nextHearingObj.courtHall ?? nextHearingObj.CourtHall ?? nextHearingObj.court ?? nextHearingObj.Court ?? '',
        type: 'upcoming' as const,
      }] : []),
    ]
      .filter(e => e.date)
      .sort((a, b) => {
        // filed event always first
        if (a.type === 'filed') return -1
        if (b.type === 'filed') return 1
        // upcoming always last
        if (a.type === 'upcoming') return 1
        if (b.type === 'upcoming') return -1
        // past hearings by date
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

    return (
      <div style={{ paddingBottom: isDesktop ? 0 : 80 }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#fff',
          padding: isDesktop ? '20px 36px' : 16,
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div
            onClick={() => setActiveView('home')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 18, color: '#0f172a' }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', color: '#0f172a' }}>My Case</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>{selectedCase?.name ?? ''}</div>
          </div>
          {selectedCase && (
            <button
              onClick={() => setShowEditCase(true)}
              style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '8px 14px',
                fontSize: 13, fontWeight: 500,
                color: '#64748b', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <i className="ti ti-edit" style={{ fontSize: 14 }} />
              Edit details
            </button>
          )}
        </div>

        {!selectedCase ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '40px 0' }}>No case selected.</div>
        ) : (
          <div style={{ padding: isDesktop ? '24px 36px' : 16, display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: isDesktop ? 40 : 80 }}>
            {/* ── Section 1: Case status banner ── */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius: 16, padding: isDesktop ? '24px 28px' : 18, boxShadow: '0 8px 32px rgba(15,23,42,0.2)', border: 'none', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px' }}>
                  {(() => {
                    const stageDisplay = selectedCase?.stage ?? selectedCase?.Stage ?? ''
                    const stageLabel = stageDisplay === 'Initial Consultation' ? 'Active' : stageDisplay || 'Active'
                    return <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{stageLabel}</div>
                  })()}
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Current stage</div>
                </div>
                <div style={{ flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px' }}>
                  {(() => {
                    const courtDisplay = selectedCase?.court ?? selectedCase?.Court ?? ''
                    return <div style={{ color: !courtDisplay ? 'rgba(255,255,255,0.5)' : '#fff', fontSize: 16, fontWeight: 700 }}>{courtDisplay || 'Add court details'}</div>
                  })()}
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Court</div>
                </div>
                <div style={{ flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ color: !displayHearingRaw ? 'rgba(255,255,255,0.5)' : displayHearingSoon ? '#f87171' : '#fff', fontSize: 16, fontWeight: 700 }}>
                    {displayHearingRaw ? fmtDate(displayHearingRaw) : 'Not scheduled yet'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Next hearing</div>
                </div>
                <div style={{ flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{fmtDate(selectedCase?.createdAt ?? selectedCase?.CreatedAt)}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Filed on</div>
                </div>
              </div>
            </div>

            {/* ── Section 2: About my case ── */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: isDesktop ? '24px 28px' : 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>About my case</div>
              </div>
              {selectedCase?.description ?? selectedCase?.Description ? (
                <div style={{ fontSize: 15, lineHeight: 1.8, color: '#374151', marginTop: 12 }}>
                  {selectedCase?.description ?? selectedCase?.Description}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic', marginTop: 12 }}>No description added yet.</div>
              )}
              {(selectedCase?.caseNumber ?? selectedCase?.CaseNumber) && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-hash" style={{ color: '#94a3b8' }} />
                  <span style={{ fontSize: 13, color: '#64748b' }}>Case number: {selectedCase?.caseNumber ?? selectedCase?.CaseNumber}</span>
                </div>
              )}
            </div>

            {/* ── Section 3: My documents ── */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>My documents</div>
                <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 12, padding: '4px 12px', borderRadius: 20 }}>{caseDocs.length}</span>
              </div>
              {docsLoading ? (
                <>
                  {[0, 1].map(i => (
                    <div key={i} style={{ height: 44, background: '#f8fafc', borderRadius: 8, marginBottom: 8, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  ))}
                </>
              ) : caseDocs.length > 0 ? (
                caseDocs.map((doc: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', alignItems: 'center', borderBottom: i < caseDocs.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ti ti-file" style={{ fontSize: 18, color: '#64748b' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{doc.name ?? doc.Name ?? doc.fileName ?? doc.FileName ?? 'Document'}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{doc.fileType ?? doc.FileType ?? doc.type ?? doc.Type ?? ''}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <i className="ti ti-cloud-upload" style={{ fontSize: 32, color: '#e2e8f0' }} />
                  <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>No documents uploaded yet</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Upload documents from the home screen to strengthen your case</div>
                </div>
              )}
            </div>

            {/* ── Section 4: Case timeline ── */}
            <div style={cardStyle}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Case timeline</div>
              {timelineEvents.length > 0 ? (
                timelineEvents.map((event, i) => {
                  const dotColor = event.type === 'filed' ? '#0f172a' : event.type === 'upcoming' ? '#2563eb' : '#16a34a'
                  const isLast = i === timelineEvents.length - 1
                  const dotSize = event.type === 'filed' ? 14 : event.type === 'upcoming' ? 14 : 12
                  return (
                    <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: isLast ? 0 : 20 }}>
                      <div style={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{fmtDate(event.date)}</div>
                      </div>
                      <div style={{ flexShrink: 0, position: 'relative', width: dotSize }}>
                        <div style={{
                          width: dotSize, height: dotSize, borderRadius: '50%',
                          background: event.type === 'upcoming' ? '#2563eb' : dotColor,
                          border: event.type === 'upcoming' ? '3px solid #bfdbfe' : 'none',
                        }} />
                        {!isLast && (
                          <div style={{ position: 'absolute', top: dotSize, left: '50%', transform: 'translateX(-50%)', width: 2, height: '100%', background: '#f1f5f9' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{event.title}</div>
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginTop: 3 }}>{event.description}</div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Your case timeline will appear here as your case progresses.</div>
              )}
            </div>

          </div>
        )}

        {/* ── Edit case details modal ── */}
        {showEditCase && (
          <div onClick={() => !editSaving && setShowEditCase(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: isDesktop ? 480 : 'calc(100% - 32px)', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Update case details</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Keep your case information up to date</div>

              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Court name</label>
              <input
                type="text"
                placeholder="e.g. Family Court Pune"
                value={editForm.court}
                onChange={e => setEditForm(p => ({ ...p, court: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Case stage</label>
              <select
                value={editForm.stage}
                onChange={e => setEditForm(p => ({ ...p, stage: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 16, boxSizing: 'border-box', background: '#fff' }}
              >
                {['Initial Consultation', 'Evidence', 'Arguments', 'Final Arguments', 'Judgment', 'Mediation', 'Settlement', 'Active', 'Closed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Next hearing date</label>
              <input
                type="date"
                value={editForm.nextHearing ? new Date(editForm.nextHearing).toISOString().split('T')[0] : ''}
                onChange={e => setEditForm(p => ({ ...p, nextHearing: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Case number (if you have it)</label>
              <input
                type="text"
                placeholder="e.g. FC/2026/123"
                value={editForm.caseNumber}
                onChange={e => setEditForm(p => ({ ...p, caseNumber: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, marginBottom: 16 }}>Case number is assigned by the court. Ask your advocate to update this.</div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setShowEditCase(false)}
                  style={{ flex: 1, padding: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveCase}
                  disabled={editSaving}
                  style={{ flex: 2, padding: 12, background: editSaving ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: editSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  {editSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Actions view ───────────────────────────────────────────────────────────
  function ActionsView() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#f8fafc', paddingBottom: isDesktop ? 40 : 80 }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#fff',
          padding: isDesktop ? '18px 40px' : 16,
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-clipboard-check" style={{ fontSize: 17, color: '#2563eb' }} />
          </div>
          <div>
            <div style={{ fontSize: isDesktop ? 24 : 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a' }}>Your action plan</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>Things you need to do</div>
          </div>
        </div>

        <div style={{ padding: isDesktop ? '28px 40px' : 16, paddingBottom: 100 }}>
          {featureLoading && (
            <div>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                  <div style={{ height: 16, width: '60%', background: '#f1f5f9', borderRadius: 4, marginBottom: 12, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 12, width: '100%', background: '#f8fafc', borderRadius: 4, marginBottom: 8, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 12, width: '80%', background: '#f8fafc', borderRadius: 4, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          )}

          {!featureLoading && actionItems.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '52px 32px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', maxWidth: 480, margin: '20px auto' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: '#eff6ff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <i className="ti ti-clipboard-check" style={{ fontSize: 36, color: '#2563eb' }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a', marginTop: 4 }}>Your action plan</div>
              <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65, marginTop: 10, maxWidth: 360, margin: '10px auto 0' }}>
                Click the button below to generate a step-by-step action plan for your case
              </div>
              <button
                onClick={loadActionPlan}
                disabled={!selectedCase || featureLoading}
                style={{ marginTop: 28, background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 48px', fontSize: 16, fontWeight: 700, letterSpacing: '0.02em', boxShadow: '0 8px 24px rgba(15,23,42,0.25)', transition: 'all 0.2s ease', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {featureLoading ? 'Generating...' : 'Generate Action Plan →'}
              </button>
            </div>
          )}

          {!featureLoading && actionItems.length > 0 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button
                  onClick={loadActionPlan}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s ease', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
                >
                  <i className="ti ti-refresh" style={{ fontSize: 14 }} /> Regenerate
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${actionPct}%`, background: '#0f172a', transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{actionPct}%</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {actionItems.map((item, i) => {
                  const pStyle = priorityStyle(item.priority)
                  return (
                    <div
                      key={i}
                      onClick={() => toggleChecked(i)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 16,
                        background: '#fff', borderRadius: 14, padding: 20,
                        border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        cursor: 'pointer', marginBottom: 2,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: 8, flexShrink: 0, marginTop: 2,
                        border: checkedActions[i] ? '2px solid #0f172a' : '2px solid #e2e8f0',
                        background: checkedActions[i] ? '#0f172a' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {checkedActions[i] && <i className="ti ti-check" style={{ fontSize: 12, color: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: checkedActions[i] ? '#94a3b8' : '#0f172a', textDecoration: checkedActions[i] ? 'line-through' : 'none' }}>{item.title}</div>
                        <span style={{ ...pStyle, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: `1px solid ${pStyle.color}`, marginTop: 6, display: 'inline-block' }}>{item.priority}</span>
                        {item.howToDoIt && (
                          <div style={{ fontSize: 14, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>
                            {item.howToDoIt}
                          </div>
                        )}
                        {item.deadline && (
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="ti ti-clock" style={{ fontSize: 12 }} />
                            {item.deadline}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={shareActionsOnWhatsApp}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: 15, borderRadius: 12, background: '#25D366', color: '#fff',
                  border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(37,211,102,0.25)', transition: 'all 0.2s ease', marginTop: 16,
                }}
              >
                <i className="ti ti-brand-whatsapp" /> Share with my advocate
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Documents view ─────────────────────────────────────────────────────────
  function DocumentsView() {
    function fileIcon(doc: any) {
      const name: string = (doc.fileName ?? doc.FileName ?? doc.name ?? doc.Name ?? '').toLowerCase()
      if (name.endsWith('.pdf')) return { icon: 'ti-file-type-pdf', bg: '#fee2e2', color: '#dc2626' }
      if (name.endsWith('.doc') || name.endsWith('.docx')) return { icon: 'ti-file-type-doc', bg: '#dbeafe', color: '#2563eb' }
      if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) return { icon: 'ti-photo', bg: '#f0fdf4', color: '#16a34a' }
      return { icon: 'ti-file', bg: '#f8fafc', color: '#64748b' }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#f8fafc', maxWidth: '100%' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#fff',
          padding: isDesktop ? '20px 36px' : 16,
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', color: '#0f172a' }}>My Documents</div>
          <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 500, marginLeft: 'auto' }}>{documents.length} files</span>
        </div>

        <div style={{ padding: isDesktop ? '24px 36px' : 16 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {docsLoading ? (
              <div>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ height: 64, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f1f5f9', flexShrink: 0, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, width: '50%', background: '#f1f5f9', borderRadius: 4, marginBottom: 8, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                      <div style={{ height: 10, width: '30%', background: '#f8fafc', borderRadius: 4, animation: 'shimmer 1.5s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : documents.length > 0 ? (
              documents.map((doc: any, i: number) => {
                const fi = fileIcon(doc)
                const ready = doc.ocrStatus === 'Completed' || doc.ocrStatus === 'Done'
                return (
                  <div key={doc.id || doc.Id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < documents.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'all 0.2s ease' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: fi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${fi.icon}`} style={{ fontSize: 20, color: fi.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.fileName ?? doc.FileName ?? doc.name ?? doc.Name ?? 'Document'}
                      </div>
                      <div style={{ marginTop: 3, fontSize: 12, color: '#94a3b8' }}>Uploaded {fmtDate(doc.createdAt ?? doc.CreatedAt)}</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                      display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      background: ready ? '#f0fdf4' : '#fffbeb',
                      color: ready ? '#16a34a' : '#d97706',
                      border: ready ? '1px solid #bbf7d0' : '1px solid #fde68a',
                    }}>
                      <i className={`ti ${ready ? 'ti-check' : 'ti-loader'}`} style={{ fontSize: 12 }} />
                      {ready ? 'Ready' : 'Processing'}
                    </span>
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: '#f1f5f9', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-files" style={{ fontSize: 32, color: '#94a3b8' }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>No documents yet</div>
                <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 280, margin: '8px auto 0', textAlign: 'center' }}>
                  Upload your case documents to help your advocate understand your situation
                </div>
              </div>
            )}

            <div style={{ padding: '16px 20px', borderTop: '1px solid #f8fafc' }}>
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: 14,
                background: selectedCase && !uploading ? 'linear-gradient(135deg,#0f172a,#1e3a5f)' : '#f1f5f9',
                color: selectedCase && !uploading ? 'white' : '#94a3b8',
                borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: selectedCase && !uploading ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                boxShadow: selectedCase ? '0 4px 16px rgba(15,23,42,0.2)' : 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }}>
                <i className="ti ti-upload" style={{ fontSize: 18 }} />
                {uploading ? 'Uploading...' : 'Upload document'}
                <input
                  type="file"
                  onChange={handleUploadDocument}
                  disabled={!selectedCase || uploading}
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                />
              </label>
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>Supported formats: PDF, Word, JPG, PNG · Max 10MB</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Settings view ──────────────────────────────────────────────────────────
  function SettingsView() {
    const credits = user?.credits ?? user?.Credits ?? user?.walletBalance ?? user?.wallet?.credits ?? null

    const SUPPORT_ROWS: { icon: string; iconBg: string; iconColor: string; label: string; sublabel: string; onClick: () => void }[] = [
      {
        icon: 'ti-headset', iconBg: '#eff6ff', iconColor: '#2563eb',
        label: 'Help & support', sublabel: 'Contact our support team',
        onClick: () => window.open('mailto:support@clausiotech.com', '_blank'),
      },
      {
        icon: 'ti-info-circle', iconBg: '#f0fdf4', iconColor: '#16a34a',
        label: 'About Clausio', sublabel: 'v1.0 · AI litigation intelligence',
        onClick: () => { setActiveView('about'); setActiveFeature(null) },
      },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#f8fafc', maxWidth: '100%' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#fff',
          padding: isDesktop ? '20px 36px' : 16,
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', color: '#0f172a' }}>Settings</div>
        </div>

        <div style={{ padding: isDesktop ? '24px 36px' : 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ── Card 1: Profile ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#0f172a', color: '#fff', fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: '#0f172a' }}>{user?.firstName} {user?.lastName}</div>
                <div style={{ fontSize: 14, color: '#64748b', marginTop: 3 }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb', borderRadius: 10, padding: '14px 20px', border: '1px solid #fde68a' }}>
                <i className="ti ti-bolt" style={{ fontSize: 20, color: '#d97706' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>AI Credits</div>
                  <div style={{ fontSize: 13, color: '#92400e', marginTop: 2 }}>
                    {credits !== null ? `${credits} credits remaining` : 'Credits information not available'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Card 2: Support & Info ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid #f8fafc', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Support
            </div>
            {SUPPORT_ROWS.map((row, i) => (
              <div
                key={row.label}
                onClick={row.onClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                  borderBottom: i < SUPPORT_ROWS.length - 1 ? '1px solid #f8fafc' : 'none',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: row.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${row.icon}`} style={{ fontSize: 18, color: row.iconColor }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{row.sublabel}</div>
                </div>
                <i className="ti ti-chevron-right" style={{ color: '#cbd5e1', fontSize: 16, marginLeft: 'auto' }} />
              </div>
            ))}
          </div>

          {/* ── Card 3: Account actions ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-logout" style={{ fontSize: 18, color: '#dc2626' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>Log out</div>
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>Sign out of your account</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── About view ─────────────────────────────────────────────────────────────
  function AboutView() {
    const steps = [
      { title: 'Describe your situation', desc: 'Tell us about your legal problem in simple words. No legal knowledge needed.' },
      { title: 'Get AI insights', desc: 'Our AI analyses your case and explains risks, recommendations and what to expect — all in plain language.' },
      { title: 'Prepare for hearings', desc: 'Know exactly what to bring, what will happen and what questions to ask your advocate before every hearing.' },
    ]
    const points = [
      'Your case information is encrypted and stored securely.',
      'We never share your information with third parties without your consent.',
      'You can request deletion of your data at any time by contacting support.',
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#f8fafc', paddingBottom: isDesktop ? 40 : 80 }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#fff',
          padding: isDesktop ? '20px 36px' : 16,
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div
            onClick={() => setActiveView('settings')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 18, color: '#0f172a' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', color: '#0f172a' }}>About Clausio</div>
        </div>

        <div style={{ padding: isDesktop ? '32px 36px' : 20, maxWidth: 600, margin: '0 auto', width: '100%' }}>
          {/* ── Hero ── */}
          <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius: 20, padding: '40px 32px', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-scale" style={{ fontSize: 36, color: '#fff' }} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.8px' }}>Clausio</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>AI Litigation Intelligence</div>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '6px 16px', display: 'inline-block', marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
              Client Portal · Version 1.0
            </div>
          </div>

          {/* ── What is Clausio ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>What is Clausio?</div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>
              Clausio is an AI-powered litigation intelligence platform that helps you understand your legal case better. We translate complex legal proceedings into simple language so you always know what is happening in your case.
            </div>
          </div>

          {/* ── How it works ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>How it works</div>
            {steps.map((step, i) => (
              <div key={step.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < steps.length - 1 ? 16 : 0 }}>
                <div style={{ width: 36, height: 36, background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 700, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginTop: 3 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Your data & privacy ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 14 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Your data & privacy</div>
            {points.map((point, i) => (
              <div key={point} style={{ display: 'flex', gap: 10, marginBottom: i < points.length - 1 ? 10 : 0 }}>
                <div style={{ width: 20, height: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-check" style={{ fontSize: 12, color: '#16a34a' }} />
                </div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{point}</div>
              </div>
            ))}
          </div>

          {/* ── Contact ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div
              onClick={() => window.open('mailto:support@clausiotech.com', '_blank')}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-mail" style={{ fontSize: 18, color: '#2563eb' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Contact support</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>support@clausiotech.com</div>
              </div>
              <i className="ti ti-chevron-right" style={{ color: '#cbd5e1', marginLeft: 'auto' }} />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>© 2026 Clausio Technologies Private Limited</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>All rights reserved</div>
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
    if (activeView === 'documents') return <DocumentsView />
    if (activeView === 'settings') return <SettingsView />
    if (activeView === 'about') return <AboutView />
    return <DocumentsView />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style suppressHydrationWarning>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { opacity: 1 } 50% { opacity: 0.4 } 100% { opacity: 1 } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        .feature-card {
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important;
          border-color: #0f172a !important;
        }
        .nav-item {
          transition: all 0.15s ease;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.08) !important;
        }
        .sidebar-item {
          transition: all 0.15s ease;
        }
        .sidebar-item:hover {
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>

      {screenSize === 'desktop' && <DesktopSidebar />}

      <div style={{
        flex: 1,
        marginLeft: screenSize === 'desktop' ? 240 : 0,
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
