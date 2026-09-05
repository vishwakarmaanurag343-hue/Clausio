'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { readinessApi, casesApi } from '@/lib/api'

import ReadinessTabs          from '@/components/readiness/ReadinessTabs'
import EmergencyResponse      from '@/components/readiness/EmergencyResponse'
import ReadinessScore         from '@/components/readiness/ReadinessScore'
import ChecklistBoard         from '@/components/readiness/ChecklistBoard'
import StrengthsGaps          from '@/components/readiness/StrengthsGaps'
import GenerateReadinessModal from '@/components/readiness/GenerateReadinessModal'
import CaseHeader             from '@/components/layout/CaseHeader'

function ComingSoonCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}

export default function ReadinessPage() {
  const { selectedCaseId } = useCaseStore()
  const [activeTab, setActiveTab] = useState('Overview')
  const [showModal, setShowModal] = useState(false)
  const [readiness, setReadiness] = useState<any>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [caseData,  setCaseData]  = useState<any>(null)

  const load = useCallback(() => {
    if (!selectedCaseId) return
    setLoading(true); setError('')
    readinessApi.getByCaseId(selectedCaseId)
      .then(setReadiness)
      .catch(err => setError(err.message || 'Failed to load readiness'))
      .finally(() => setLoading(false))
  }, [selectedCaseId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selectedCaseId) { setCaseData(null); return }
    casesApi.getById(selectedCaseId).then(setCaseData).catch(() => {})
  }, [selectedCaseId])

  const caseType = caseData?.caseType ?? caseData?.type ?? ''

  return (
    <>
      <div className="glass-panel mobile-readiness-container" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>

        {/* ── DESKTOP READINESS VIEW ── */}
        <div className="desktop-readiness-view" style={{ display: 'flex', flexDirection: 'column' }}>
          <CaseHeader />
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Case Readiness</h1>
              <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                AI readiness assessment before your next hearing.
              </p>
              {/* Case info */}
              {caseData && (
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '2px 10px', borderRadius: 20, border: '1px solid #e2e8f0' }}>
                    {caseData.name}
                  </span>
                  {caseType && (
                    <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '2px 10px', borderRadius: 20, border: '1px solid #bfdbfe' }}>
                      {caseType}
                    </span>
                  )}
                </div>
              )}
              {!selectedCaseId && (
                <p style={{ marginTop: 6, fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                  ⚠ Select a case from the dashboard first.
                </p>
              )}
            </div>

            <button onClick={() => setShowModal(true)} disabled={!selectedCaseId}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, border: 'none', borderRadius: 10, cursor: selectedCaseId ? 'pointer' : 'not-allowed', background: selectedCaseId ? '#3b82f6' : '#94a3b8', color: '#fff', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', opacity: !selectedCaseId ? 0.6 : 1 }}>
              <i className="ti ti-sparkles" />Generate AI Report
            </button>
          </div>

          {/* No case selected */}
          {!selectedCaseId && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <i className="ti ti-folder-open" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Case Selected</div>
              <div style={{ fontSize: 13 }}>Go to the Dashboard and select a case to generate readiness report.</div>
            </div>
          )}

          {selectedCaseId && (
            <>
              <ReadinessTabs activeTab={activeTab} onChange={setActiveTab} />

              {error && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginTop: 16 }}>
                  {error} <button onClick={load} style={{ marginLeft: 8, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Retry</button>
                </div>
              )}

              {activeTab === 'Overview' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '38% 1fr', gap: 24, marginTop: 24, alignItems: 'start' }}>
                    <ReadinessScore readiness={readiness} loading={loading} />
                    <ChecklistBoard readiness={readiness} loading={loading} />
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <StrengthsGaps readiness={readiness} loading={loading} />
                  </div>
                  {/* Emergency triage stays available below the readiness report */}
                  <div style={{ marginTop: 24 }}>
                    <EmergencyResponse />
                  </div>
                </>
              )}

              {activeTab === 'Evidence' && (
                <ComingSoonCard icon="ti-file-search" title="Evidence Analysis" description="AI will analyse evidence quality, contradictions, missing exhibits and witness support." />
              )}

              {activeTab === 'Arguments' && (
                <ComingSoonCard icon="ti-scale" title="Arguments Review" description="Analyse legal arguments, probable objections and counter-strategies before court." />
              )}

              {activeTab === 'Witnesses' && (
                <ComingSoonCard icon="ti-users" title="Witness Preparation" description="AI generates cross-examination questions and credibility assessment for each witness." />
              )}
            </>
          )}
        </div>

        {/* ── MOBILE READINESS VIEW (Matching Prototype) ── */}
        <div className="mobile-readiness-view" style={{ display: 'none', flexDirection: 'column', gap: 16 }}>
          {/* Top Pill Tabs Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: 30,
              padding: '6px 8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              gap: 6,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {['Overview', 'Evidence', 'Arguments', 'Witnesses'].map((tab) => {
              const isSelected = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 20,
                    background: isSelected ? '#cbd5e1' : 'transparent',
                    color: '#0f172a',
                    border: 'none',
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Main Solid Grey Section */}
          <div
            style={{
              background: '#cbd5e1',
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: '24px 16px 40px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              margin: '8px -16px 0 -16px',
              flex: 1,
            }}
          >
            {/* Header: Readiness */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 2px 6px', fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  Case Readiness
                </h2>
                <p style={{ margin: '0 0 14px 6px', fontSize: 11, fontWeight: 600, color: '#475569' }}>
                  {caseData ? caseData.name : 'Select a case'} · {activeTab}
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                disabled={!selectedCaseId}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: selectedCaseId ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Generate Report
              </button>
            </div>

            {/* 3 Top Readiness Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 12,
              }}
            >
              {(() => {
                const checklist: any[] = Array.isArray(readiness?.checklist) ? readiness.checklist : []
                const mineCount = checklist.filter((i: any) => i.controllable !== false).length
                const extCount  = checklist.filter((i: any) => i.controllable === false).length
                return [
                  { title: 'Score', value: readiness ? `${readiness.overallScore ?? 0}` : '—', sub: 'Overall' },
                  { title: 'Yours To Do', value: readiness ? String(mineCount) : '—', sub: 'Needs Your Action' },
                  { title: 'Waiting', value: readiness ? String(extCount) : '—', sub: 'Court / Other Side' },
                ]
              })().map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#e2e8f0',
                    borderRadius: 22,
                    padding: '16px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: 110,
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{item.value}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 4 }}>{item.title}</span>
                </div>
              ))}
            </div>

            {/* Main Content Area */}
            {!selectedCaseId ? (
              <div style={{ background: '#e2e8f0', borderRadius: 24, padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                <i className="ti ti-folder-open" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.5 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>No Case Selected</div>
                <p style={{ fontSize: 12, margin: '4px 0 0' }}>Select a case from the dashboard first.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeTab === 'Overview' && (
                  <>
                    <EmergencyResponse />
                    <ReadinessScore readiness={readiness} loading={loading} />
                    <ChecklistBoard readiness={readiness} loading={loading} />
                    <StrengthsGaps readiness={readiness} loading={loading} columns={1} />
                  </>
                )}
                {activeTab === 'Evidence' && (
                  <ComingSoonCard icon="ti-file-search" title="Evidence Analysis" description="AI will analyse evidence quality, contradictions, missing exhibits and witness support." />
                )}
                {activeTab === 'Arguments' && (
                  <ComingSoonCard icon="ti-scale" title="Arguments Review" description="Analyse legal arguments, probable objections and counter-strategies before court." />
                )}
                {activeTab === 'Witnesses' && (
                  <ComingSoonCard icon="ti-users" title="Witness Preparation" description="AI generates cross-examination questions and credibility assessment for each witness." />
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {showModal && (
        <GenerateReadinessModal
          onClose={() => setShowModal(false)}
          onGenerated={() => { setShowModal(false); load() }}
        />
      )}
    </>
  )
}
