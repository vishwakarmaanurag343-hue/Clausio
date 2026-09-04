'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore, useCaseStore } from '@/lib/store'
import { authApi, casesApi, hearingsApi, documentsApi, actionPlansApi, aiApi, parseAiJson } from '@/lib/api'
import CaseList from '@/components/cases/CaseList'
import AIInsights from '@/components/dashboard/AIInsights'
import ScheduleMeetingModal from '@/components/dashboard/ScheduleMeetingModal'
import {
  DocumentsTab,
  HearingsTab,
} from '@/components/dashboard/DashboardTabs'

const TABS = [
  { id: 'Overview', icon: 'ti-layout-dashboard' },
  { id: 'Documents', icon: 'ti-files' },
  { id: 'Hearings', icon: 'ti-gavel' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { caseListVisible, aiPanelVisible, aiPanelExpanded, aiPanelWidth, toggleAIPanel, toggleSidebar } = useUIStore()
  const { selectedCaseId, selectedCaseName, setSelectedCase } = useCaseStore()

  const [activeTab, setActiveTab] = useState('Overview')
  const [caseData, setCaseData] = useState<any>(null)
  const [allCases, setAllCases] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [hearings, setHearings] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [genPlan, setGenPlan] = useState(false)
  const [genErr, setGenErr] = useState('')
  const [taskBusyId, setTaskBusyId] = useState<string | null>(null)
  const [caseSummary, setCaseSummary] = useState<{
    docCount: number
    readyDocs: number
    hearingCount: number
    nextHearing: string | null
  } | null>(null)

  useEffect(() => {
    if (!selectedCaseId) {
      setCaseSummary(null)
      return
    }
    Promise.all([
      documentsApi.getByCaseId(selectedCaseId).catch(() => []),
      hearingsApi.getByCaseId(selectedCaseId).catch(() => []),
    ]).then(([docs, hearings]) => {
      const docList = Array.isArray(docs) ? docs : []
      const hearingList = Array.isArray(hearings) ? hearings : []
      const readyDocs = docList.filter(
        (d: any) => d.ocrStatus === 'Completed' || d.ocrStatus === 'Done'
      ).length
      const upcoming = hearingList
        .filter((h: any) => {
          const date = new Date(h.hearingDate || h.HearingDate || '')
          return date > new Date()
        })
        .sort((a: any, b: any) =>
          new Date(a.hearingDate || a.HearingDate || '').getTime() -
          new Date(b.hearingDate || b.HearingDate || '').getTime()
        )[0]
      const nextDate = upcoming
        ? new Date(upcoming.hearingDate || upcoming.HearingDate || '').toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null
      setCaseSummary({
        docCount: docList.length,
        readyDocs,
        hearingCount: hearingList.length,
        nextHearing: nextDate,
      })
    })
  }, [selectedCaseId])

  // Auto-select first case of current user
  useEffect(() => {
    const token = localStorage.getItem('clausio_token')
    if (!token) return
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5123/api').replace(/\/+$/, '')
    const url = apiBase.endsWith('/api') ? `${apiBase}/cases` : `${apiBase}/api/cases`
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(cases => {
        if (Array.isArray(cases)) {
          setAllCases(cases)
          // If no cases exist for this user, reset selection
          if (cases.length === 0) {
            setSelectedCase('', '')
            setCaseData(null)
          } else {
            // Deep link from Google Calendar events: /dashboard?case=<id>
            let wanted = selectedCaseId
            if (!wanted && typeof window !== 'undefined') {
              const qp = new URLSearchParams(window.location.search).get('case')
              if (qp && cases.some((c: any) => c.id === qp)) {
                wanted = qp
                window.history.replaceState({}, '', '/dashboard')
              }
            }
            // Fall back to the first case when nothing valid is selected
            if (!wanted || !cases.some((c: any) => c.id === wanted)) {
              wanted = cases[0].id
            }
            const match = cases.find((c: any) => c.id === wanted)!
            setSelectedCase(match.id, match.name)
          }
        }
      })
      .catch(() => { })
  }, [selectedCaseId, setSelectedCase])

  const loadHearings = useCallback(() => {
    if (!selectedCaseId) return
    hearingsApi.getByCaseId(selectedCaseId)
      .then(d => setHearings(Array.isArray(d) ? d : []))
      .catch(() => { })
  }, [selectedCaseId])

  const loadTasks = useCallback(() => {
    if (!selectedCaseId) return
    actionPlansApi.getByCaseId(selectedCaseId)
      .then(d => setTasks(Array.isArray(d) ? d : []))
      .catch(() => { })
  }, [selectedCaseId])

  useEffect(() => {
    if (!selectedCaseId) return
    setCaseData(null)
    setHearings([])
    setDocuments([])
    setTasks([])

    casesApi.getById(selectedCaseId).then(setCaseData).catch(() => { })
    loadHearings()
    documentsApi.getByCaseId(selectedCaseId)
      .then(d => setDocuments(Array.isArray(d) ? d : [])).catch(() => { })
    loadTasks()
    setGenErr('')
  }, [selectedCaseId, loadHearings, loadTasks])

  const allOrders = hearings.flatMap(h => (h.orders ?? []).map((o: any) => ({ ...o, hearingId: h.id })))
  const overdueOrders = allOrders.filter(o => !o.done && o.deadline && new Date(o.deadline) < new Date())
  const pendingTasks = tasks.filter(t => !t.done)
  const lastHearing = hearings.sort((a, b) => new Date(b.hearingDate).getTime() - new Date(a.hearingDate).getTime())[0]
  const nextHearingDate = caseData?.nextHearing ? new Date(caseData.nextHearing) : null
  const daysToHearing = nextHearingDate ? Math.ceil((nextHearingDate.getTime() - Date.now()) / 86400000) : null

  async function markOrderDone(hearingId: string, orderId: string) {
    if (!selectedCaseId) return
    setMarkingId(orderId)
    try {
      await hearingsApi.markOrderDone(selectedCaseId, hearingId, orderId)
      loadHearings()
    } catch { } finally { setMarkingId(null) }
  }

  // Turn the AI's "relative to hearing" hint into a real calendar date so every task
  // has a sensible due date (the DB column is non-nullable — a missing date stores as
  // year 0001, which is what "Due 1 Jan" bugs came from).
  function resolveDueDate(rel: unknown): string {
    const r = String(rel ?? '').toLowerCase()
    const nh = caseData?.nextHearing ? new Date(caseData.nextHearing) : null
    const shift = (base: Date, days: number) => {
      const d = new Date(base); d.setDate(d.getDate() + days); return d.toISOString()
    }
    if (r.includes('immediat') || r.includes('asap') || r.includes('urgent') || r.includes('now')) return shift(new Date(), 2)
    const m = r.match(/(\d+)\s*days?\s*before/)
    if (m && nh) return shift(nh, -parseInt(m[1], 10))
    if (nh && (r.includes('before') || r.includes('hearing'))) return shift(nh, -1)
    if (nh) return shift(nh, -3)
    return shift(new Date(), 7)
  }

  async function generateActionPlan() {
    if (!selectedCaseId || genPlan) return
    setGenPlan(true); setGenErr('')
    try {
      const res = await aiApi.getActionPlan(selectedCaseId)
      const obj = parseAiJson<any>(res.actionPlan ?? res.result ?? '')
      const items: any[] = Array.isArray(obj) ? obj : Array.isArray(obj?.tasks) ? obj.tasks : []
      const cleaned = items
        .filter(it => it && typeof it === 'object' && (it.task || it.title))
        .map(it => ({
          title:       String(it.task ?? it.title).trim(),
          description: String(it.reason ?? it.description ?? '').trim(),
          priority:    ['Critical', 'High', 'Medium', 'Low'].includes(it.priority) ? it.priority : 'Medium',
          assignedTo:  ['Advocate', 'Client', 'Clerk', 'Lawyer'].includes(it.owner) ? it.owner : (it.assignedTo || 'Advocate'),
          dueBy:       resolveDueDate(it.dueRelativeToHearing ?? it.dueBy),
        }))
      if (cleaned.length === 0) {
        setGenErr('The AI could not build a plan from this case file. Please try again.')
        return
      }
      // Don't re-add tasks already in the plan (prevents duplicates on repeat generate)
      const existing = new Set(tasks.map(t => String(t.title ?? '').trim().toLowerCase()))
      const toCreate = cleaned.filter(t => !existing.has(t.title.toLowerCase()))
      if (toCreate.length === 0) {
        setGenErr('Every AI action item is already in your plan.')
        return
      }
      await Promise.all(toCreate.map(t => actionPlansApi.create(selectedCaseId, t)))
      loadTasks()
    } catch (e: any) {
      setGenErr(e?.message || 'Failed to generate the action plan.')
    } finally {
      setGenPlan(false)
    }
  }

  async function toggleTaskDone(task: any) {
    if (!selectedCaseId || taskBusyId) return
    setTaskBusyId(task.id)
    try {
      if (task.done) await actionPlansApi.markUndone(selectedCaseId, task.id)
      else await actionPlansApi.markDone(selectedCaseId, task.id)
      loadTasks()
    } catch { } finally { setTaskBusyId(null) }
  }

  async function deleteTask(task: any) {
    if (!selectedCaseId || taskBusyId) return
    setTaskBusyId(task.id)
    try {
      await actionPlansApi.remove(selectedCaseId, task.id)
      loadTasks()
    } catch { } finally { setTaskBusyId(null) }
  }

  function fmtTaskDue(d: unknown): string | null {
    if (!d) return null
    const dt = new Date(String(d))
    if (isNaN(+dt) || dt.getFullYear() < 2000) return null
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="glass-panel mobile-dashboard-container" style={{ height: 'calc(100% - 32px)', margin: '16px 16px 16px 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── DESKTOP TOP BAR ── */}
      <div className="desktop-dashboard-topbar" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        {/* Case name + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
              {caseData?.name ?? 'Select a case'}
            </span>
            {caseData && (
              <>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: caseData.status === 'Active' ? '#f0fdf4' : '#f1f5f9', color: caseData.status === 'Active' ? '#15803d' : '#64748b', border: `1px solid ${caseData.status === 'Active' ? '#86efac' : '#e2e8f0'}` }}>
                  {caseData.status}
                </span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                  {caseData.priority} Priority
                </span>
                {overdueOrders.length > 0 && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', animation: 'pulse 2s infinite' }}>
                    ⚠ {overdueOrders.length} Overdue
                  </span>
                )}
              </>
            )}
          </div>
          {caseData && (
            <div style={{ display: 'flex', gap: 12, marginTop: 3, fontSize: 11, color: '#64748b' }}>
              <span>{caseData.court}</span>
              <span>·</span>
              <span>{caseData.caseNumber}</span>
              <span>·</span>
              <span>{caseData.caseType}</span>
              {daysToHearing !== null && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: daysToHearing <= 2 ? '#fef2f2' : '#fff7ed', color: daysToHearing <= 2 ? '#dc2626' : '#c2410c', fontWeight: 600 }}>
                  Next: {nextHearingDate ? nextHearingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} ({daysToHearing === 0 ? 'Today' : `${daysToHearing}d`})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action pills */}
        <div className="dashboard-topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {overdueOrders.length > 0 && (
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-alert-triangle" /> {overdueOrders.length} Emergency
            </span>
          )}
          <button onClick={() => router.push('/drafting')} style={{ padding: '4px 10px', fontSize: 11, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>
            📝 Draft
          </button>
          <button onClick={toggleAIPanel} className="desktop-header-item" style={{ padding: '4px 10px', fontSize: 11, background: aiPanelVisible ? '#eff6ff' : '#f1f5f9', color: aiPanelVisible ? '#1d4ed8' : '#475569', border: `1px solid ${aiPanelVisible ? '#bfdbfe' : '#cbd5e1'}`, borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
            <i className="ti ti-sparkles" /> AI
          </button>
        </div>
      </div>

      {/* ── MOBILE HEADER HERO CONTAINER (Matching Prototype 3: Flat top, rounded bottom) ── */}
      <div className="mobile-dashboard-hero-card" style={{ display: 'none', padding: '16px 14px 22px 14px', margin: '0 0 16px 0', flexDirection: 'column', gap: 12 }}>

        {/* Case Info White Card */}
        <div style={{ background: '#ffffff', borderRadius: 22, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
              {caseData?.name ?? 'Select a Case'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {caseData && (
                <>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, fontWeight: 700, background: '#e2e8f0', color: '#475569' }}>
                    {caseData.status || 'Active'}
                  </span>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, fontWeight: 600, background: '#e2e8f0', color: '#475569' }}>
                    {caseData.priority || 'Normal'} Priority
                  </span>
                </>
              )}
            </div>
          </div>

          {caseData && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, background: '#e2e8f0', padding: '3px 8px', borderRadius: 12, color: '#475569', fontWeight: 500 }}>
                  {caseData.court || 'Court'}
                </span>
                <span style={{ fontSize: 10, background: '#e2e8f0', padding: '3px 8px', borderRadius: 12, color: '#475569', fontWeight: 500 }}>
                  {caseData.caseNumber || 'No #'}
                </span>
                <span style={{ fontSize: 10, background: '#e2e8f0', padding: '3px 8px', borderRadius: 12, color: '#475569', fontWeight: 500 }}>
                  {caseData.caseType || 'General'}
                </span>
              </div>
              {nextHearingDate && (
                <div style={{ fontSize: 11, background: '#cbd5e1', padding: '4px 10px', borderRadius: 14, color: '#1e293b', fontWeight: 600 }}>
                  Next : {nextHearingDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({daysToHearing === 0 ? 'Today' : `${daysToHearing}d`})
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Case / Client Input Pill */}
        <div style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: 24,
              padding: '10px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <i className="ti ti-search" style={{ fontSize: 16, color: '#475569', marginRight: 10, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search Case, Client"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 13,
                color: '#0f172a',
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Quick Real-Time Search Results in Mobile Dashboard */}
          {searchQuery && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#ffffff', borderRadius: 16, boxShadow: '0 12px 32px rgba(0,0,0,0.15)', zIndex: 1000, padding: 6, maxHeight: 200, overflowY: 'auto' }}>
              {allCases.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.caseNumber && c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()))).map(c => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedCase(c.id, c.name); setSearchQuery('') }}
                  style={{ padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>{c.name}</span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>#{c.caseNumber}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE PILL TABS BAR (Matching Prototype 3) ── */}
      <div className="mobile-pill-tabs-bar" style={{ display: 'none', background: '#cbd5e1', borderRadius: 20, padding: '4px 6px', margin: '0 0 16px 0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 'max-content' }}>
          {TABS.map(t => {
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0f172a' : '#475569',
                  border: 'none',
                  borderRadius: 16,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {t.id}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Case list left drawer (Desktop) */}
        {caseListVisible && <CaseList />}

        {/* Main tabs + content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Desktop Tabs */}
          <div className="desktop-tabs-bar responsive-tabs" style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, padding: '0 4px' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px', fontSize: 12, cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === t.id ? '#3b82f6' : 'transparent'}`, color: activeTab === t.id ? '#1e40af' : '#64748b', fontWeight: activeTab === t.id ? 600 : 400, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}
              >
                <i className={`ti ${t.icon}`} style={{ fontSize: 13 }} />
                {t.id}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px 20px 4px' }}>

            {selectedCaseId && caseSummary && (
              <div style={{
                display: 'flex',
                gap: 12,
                padding: '14px 20px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                marginBottom: 20,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0f172a',
                  marginRight: 8,
                }}>
                  📁 {selectedCaseName || 'Current Case'}
                </div>
                <div style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontSize: 13,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <i className="ti ti-files"
                      style={{ color: '#2563eb' }} />
                    {caseSummary.docCount} document
                    {caseSummary.docCount !== 1
                      ? 's' : ''}
                    {caseSummary.readyDocs > 0
                      && ` · ${caseSummary.readyDocs} ready`}
                  </span>
                  <span style={{
                    fontSize: 13,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <i className="ti ti-calendar"
                      style={{ color: '#7c3aed' }} />
                    {caseSummary.hearingCount} hearing
                    {caseSummary.hearingCount !== 1
                      ? 's' : ''}
                  </span>
                  {caseSummary.nextHearing && (
                    <span style={{
                      fontSize: 13,
                      color: '#16a34a',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <i className="ti ti-calendar-event" />
                      Next: {caseSummary.nextHearing}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* No case */}
            {!selectedCaseId && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-folder-open" style={{ fontSize: 32, color: '#3b82f6' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>No case selected</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 300 }}>
                  Select a case from the left panel or create a new case to get started
                </p>
                <button onClick={() => router.push('/cases')} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Go to Cases →
                </button>
              </div>
            )}

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'Overview' && caseData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Metrics row (Desktop 4 cards, Mobile 2x2 grid matching prototype 3) */}
                <div className="dashboard-overview-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { icon: 'ti-gavel', label: 'Hearings', value: hearings.length, sub: hearings.length > 0 ? `Last: ${new Date(lastHearing?.hearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'None recorded', color: '#3b82f6' },
                    { icon: 'ti-files', label: 'Documents', value: documents.length, sub: `${documents.length} filed`, color: '#8b5cf6' },
                    { icon: 'ti-checklist', label: 'Pending Tasks', value: pendingTasks.length, sub: pendingTasks.length > 0 ? `${pendingTasks.filter(t => t.priority === 'High' || t.priority === 'Critical').length} high priority` : 'All clear', color: pendingTasks.length > 0 ? '#f59e0b' : '#10b981' },
                    { icon: 'ti-alert-circle', label: 'Overdue Orders', value: overdueOrders.length, sub: overdueOrders.length > 0 ? 'Immediate action needed' : 'No overdue orders', color: overdueOrders.length > 0 ? '#ef4444' : '#10b981' },
                  ].map((m, i) => (
                    <div key={i} className="dashboard-metric-card" style={{ background: '#ffffff', borderRadius: 20, padding: '18px 16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{m.label}</span>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`ti ${m.icon}`} style={{ fontSize: 16, color: m.color }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: m.color, marginTop: 6, fontWeight: 500 }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Main grid */}
                <div className="dashboard-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  {/* Hearing Diary */}
                  <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="ti ti-notebook" style={{ fontSize: 16, color: '#3b82f6' }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Court Orders & Diary</span>
                      </div>
                      <button onClick={() => router.push('/hearings')} style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        Add Hearing →
                      </button>
                    </div>

                    {allOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                        <i className="ti ti-clipboard" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
                        <div style={{ fontSize: 12 }}>No court orders recorded yet</div>
                        <button onClick={() => router.push('/hearings')} style={{ marginTop: 8, fontSize: 11, padding: '4px 12px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                          Record Hearing
                        </button>
                      </div>
                    ) : (
                      allOrders.slice(0, 5).map((order, i) => {
                        const overdue = !order.done && order.deadline && new Date(order.deadline) < new Date()
                        return (
                          <div key={order.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < Math.min(allOrders.length, 5) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: order.done ? '#10b981' : overdue ? '#dc2626' : '#3b82f6', flexShrink: 0, marginTop: 5 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, color: order.done ? '#94a3b8' : '#0f172a', lineHeight: 1.4, fontWeight: 500, textDecoration: order.done ? 'line-through' : 'none' }}>
                                {order.text}
                                {overdue && <span style={{ marginLeft: 6, fontSize: 9, padding: '2px 6px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}>OVERDUE</span>}
                              </div>
                              {order.deadline && (
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                  Due {new Date(order.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.responsible}
                                </div>
                              )}
                            </div>
                            {!order.done && (
                              <button onClick={() => markOrderDone(order.hearingId, order.id)} disabled={markingId === order.id} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>
                                {markingId === order.id ? '...' : '✓ Done'}
                              </button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Action Plan */}
                  <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="ti ti-checklist" style={{ fontSize: 16, color: '#f59e0b' }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Action Plan</span>
                        {tasks.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: '#f1f5f9', color: '#475569' }}>
                            {tasks.filter(t => t.done).length}/{tasks.length} done
                          </span>
                        )}
                      </div>
                      <button
                        onClick={generateActionPlan}
                        disabled={genPlan || !selectedCaseId}
                        style={{ fontSize: 11, color: genPlan ? '#94a3b8' : '#3b82f6', background: 'none', border: 'none', cursor: genPlan || !selectedCaseId ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className={`ti ${genPlan ? 'ti-loader animate-spin' : 'ti-sparkles'}`} style={{ fontSize: 13 }} />
                        {genPlan ? 'Generating…' : (tasks.length > 0 ? 'Regenerate' : 'Generate with AI')}
                      </button>
                    </div>

                    {genErr && (
                      <div style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '7px 10px', marginBottom: 12 }}>
                        {genErr}
                      </div>
                    )}

                    {genPlan && pendingTasks.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '18px 0', color: '#7c3aed' }}>
                        <i className="ti ti-loader animate-spin" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
                        <div style={{ fontSize: 12 }}>AI is reading the case file and building the plan…</div>
                      </div>
                    )}

                    {!genPlan && pendingTasks.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                        <i className="ti ti-sparkles" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
                        <div style={{ fontSize: 12 }}>{tasks.length > 0 ? 'All tasks completed 🎉' : 'No action items yet'}</div>
                        {tasks.length === 0 && (
                          <button onClick={generateActionPlan} disabled={!selectedCaseId} style={{ marginTop: 8, fontSize: 11, padding: '4px 12px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 6, cursor: selectedCaseId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 600 }}>
                            Generate Action Plan
                          </button>
                        )}
                      </div>
                    )}

                    {pendingTasks.slice(0, 6).map((task, i) => {
                      const pColor = task.priority === 'Critical' || task.priority === 'High' ? '#dc2626' : task.priority === 'Medium' ? '#d97706' : '#16a34a'
                      const due = fmtTaskDue(task.dueBy)
                      const busy = taskBusyId === task.id
                      return (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < Math.min(pendingTasks.length, 6) - 1 ? '1px solid #f1f5f9' : 'none', opacity: busy ? 0.5 : 1 }}>
                          <input
                            type="checkbox"
                            checked={false}
                            disabled={busy}
                            onChange={() => toggleTaskDone(task)}
                            title="Mark done"
                            style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2, cursor: busy ? 'wait' : 'pointer', accentColor: '#16a34a' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{task.title}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                              {due ? `Due ${due}` : 'Before next hearing'}{task.assignedTo ? ` · ${task.assignedTo}` : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: `${pColor}15`, color: pColor, fontWeight: 700, flexShrink: 0 }}>{task.priority}</span>
                          <button onClick={() => deleteTask(task)} disabled={busy} title="Remove" style={{ background: 'none', border: 'none', cursor: busy ? 'wait' : 'pointer', color: '#cbd5e1', flexShrink: 0, padding: 0, lineHeight: 1 }}>
                            <i className="ti ti-x" style={{ fontSize: 13 }} />
                          </button>
                        </div>
                      )
                    })}

                    {(pendingTasks.length > 6 || tasks.some(t => t.done)) && (
                      <button onClick={() => router.push('/strategy')} style={{ marginTop: 10, fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, padding: 0 }}>
                        Open full Action Plan →
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom grid */}
                <div className="mobile-overview-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

                  {/* Recent hearings */}
                  <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <i className="ti ti-history" style={{ fontSize: 16, color: '#8b5cf6' }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Hearings</span>
                    </div>
                    {hearings.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>No hearings recorded yet.</div>
                    ) : (
                      hearings.slice(0, 3).map((h, i) => (
                        <div key={h.id} style={{ padding: '10px 0', borderBottom: i < Math.min(hearings.length, 3) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                                {new Date(h.hearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{h.whatHappened}</div>
                              {h.judgeObservation && (
                                <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 4, fontStyle: 'italic' }}>
                                  Judge: "{h.judgeObservation}"
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#f5f3ff', color: '#7c3aed', fontWeight: 600, flexShrink: 0 }}>{h.stage}</span>
                          </div>
                        </div>
                      ))
                    )}
                    {hearings.length > 3 && (
                      <button onClick={() => setActiveTab('Hearings')} style={{ marginTop: 8, fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, padding: 0 }}>
                        View all {hearings.length} hearings →
                      </button>
                    )}
                  </div>

                  {/* Case info */}
                  <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <i className="ti ti-info-circle" style={{ fontSize: 16, color: '#3b82f6' }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Case Details</span>
                    </div>
                    {[
                      { label: 'Filed On', value: caseData?.filedOn ? new Date(caseData.filedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                      { label: 'Stage', value: caseData?.stage ?? '—' },
                      { label: 'Opposing Adv', value: caseData?.opposingAdv || 'Not recorded' },
                      { label: 'Client', value: caseData?.client ? `${caseData.client.firstName} ${caseData.client.lastName}` : '—' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{item.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
                      </div>
                    ))}
                    {caseData?.description
                      || caseData?.notes
                      || caseData?.summary ? (
                      <div style={{
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        marginTop: 12,
                      }}>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: 6,
                        }}>
                          Case Description
                        </div>
                        <p style={{
                          fontSize: 13,
                          color: '#374151',
                          lineHeight: 1.6,
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                        }}>
                          {caseData?.description
                            || caseData?.notes
                            || caseData?.summary}
                        </p>
                      </div>
                    ) : null}
                    <button onClick={() => router.push('/cases')} style={{ marginTop: 12, width: '100%', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Edit Case Details
                    </button>
                  </div>
                </div>

                {/* Quick actions */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Quick Actions</div>
                  <div className="dashboard-quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                    {[
                      { icon: 'ti-calendar-plus', label: 'Client Meeting', action: () => setShowMeetingModal(true), color: '#0d9488', bg: '#f0fdfa' },
                      { icon: 'ti-alert-triangle', label: 'Emergency', route: '/readiness', color: '#dc2626', bg: '#fef2f2' },
                      { icon: 'ti-clipboard-list', label: 'Hearing Brief', route: '/hearings', color: '#1e40af', bg: '#eff6ff' },
                      { icon: 'ti-message', label: 'Client Update', route: '/client', color: '#15803d', bg: '#f0fdf4' },
                      { icon: 'ti-sparkles', label: 'AI Strategy', route: '/strategy', color: '#7c3aed', bg: '#f5f3ff' },
                      { icon: 'ti-file-text', label: 'Draft Document', route: '/drafting', color: '#0369a1', bg: '#f0f9ff' },
                      { icon: 'ti-chart-bar', label: 'Financial', route: '/financial', color: '#c2410c', bg: '#fff7ed' },
                    ].map((a, i) => (
                      <button key={i} onClick={() => a.action ? a.action() : router.push(a.route!)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', background: a.bg, border: `1px solid ${a.color}22`, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                      >
                        <i className={`ti ${a.icon}`} style={{ fontSize: 20, color: a.color }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: a.color, textAlign: 'center', lineHeight: 1.2 }}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs */}
            {activeTab === 'Documents' && selectedCaseId && <DocumentsTab caseId={selectedCaseId} />}
            {activeTab === 'Hearings' && selectedCaseId && <HearingsTab caseId={selectedCaseId} />}

          </div>
        </div>

        {/* Schedule Client Meeting modal (Quick Actions) */}
        {showMeetingModal && selectedCaseId && (
          <ScheduleMeetingModal
            caseId={selectedCaseId}
            caseName={allCases.find(c => c.id === selectedCaseId)?.name}
            onClose={() => setShowMeetingModal(false)}
          />
        )}

        {/* AI Insights panel - Inline layout on desktop, hidden on mobile dashboard */}
        <div className="desktop-ai-panel-wrapper" style={{ flexShrink: 0, overflow: 'hidden', width: aiPanelVisible ? aiPanelWidth : 0 }}>
          <AIInsights />
        </div>

      </div>
    </div>
  )
}
