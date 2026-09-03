'use client'

import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'
import { casesApi } from '@/lib/api'

import RiskAssessment        from '@/components/strategy/RiskAssessment'
import ActionPlan            from '@/components/strategy/ActionPlan'
import RecommendationPanel   from '@/components/strategy/RecommendationPanel'
import LegalResearch         from '@/components/strategy/LegalResearch'
import DocumentGaps          from '@/components/strategy/DocumentGaps'
import Contradictions        from '@/components/strategy/Contradictions'
import GenerateStrategyModal from '@/components/strategy/GenerateStrategyModal'

const TABS = [
  { name: 'Risk Assessment',  icon: 'ti-shield-check'  },
  { name: 'Recommendations',  icon: 'ti-star'          },
  { name: 'Action Plan',      icon: 'ti-list-check'    },
  { name: 'Legal Research',   icon: 'ti-scale'         },
  { name: 'Contradictions',   icon: 'ti-alert-triangle'},
  { name: 'Document Gaps',    icon: 'ti-file-alert'    },
]

export default function StrategyPage() {
  const { selectedCaseId } = useCaseStore()
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('Risk Assessment')
  const [refresh,   setRefresh]   = useState(0)
  const [caseData,  setCaseData]  = useState<any>(null)

  useEffect(() => {
    if (!selectedCaseId) { setCaseData(null); return }
    casesApi.getById(selectedCaseId).then(setCaseData).catch(() => {})
  }, [selectedCaseId])

  const caseType = caseData?.caseType ?? caseData?.type ?? ''

  return (
    <>
      <div className="glass-panel mobile-strategy-container" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>

        {/* ── DESKTOP STRATEGY VIEW ── */}
        <div className="desktop-strategy-view" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Strategy</h1>
              <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>AI litigation strategy, research and hearing preparation.</p>
              {caseData && (
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '2px 10px', borderRadius: 20, border: '1px solid #e2e8f0' }}>{caseData.name}</span>
                  {caseType && <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '2px 10px', borderRadius: 20, border: '1px solid #bfdbfe' }}>{caseType}</span>}
                  {caseData.caseNumber && <span style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '2px 10px', borderRadius: 20, border: '1px solid #e2e8f0' }}>{caseData.caseNumber}</span>}
                </div>
              )}
              {!selectedCaseId && <p style={{ marginTop: 6, fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>⚠ Select a case from the dashboard first.</p>}
            </div>
          </div>

          {!selectedCaseId ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <i className="ti ti-folder-open" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Case Selected</div>
              <div style={{ fontSize: 13 }}>Go to the Dashboard and select a case to generate litigation strategy.</div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 24, overflowX: 'auto' }}>
                {TABS.map(tab => (
                  <button key={tab.name} onClick={() => setActiveTab(tab.name)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', border: 'none', borderBottom: activeTab === tab.name ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: 'transparent', whiteSpace: 'nowrap', color: activeTab === tab.name ? '#1e40af' : '#64748b', transition: 'all 0.15s' }}>
                    <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />{tab.name}
                  </button>
                ))}
              </div>

              {/* Content */}
              {activeTab === 'Risk Assessment' && (
                <div style={{ display: 'grid', gridTemplateColumns: '38% 62%', gap: 24 }}>
                  <RiskAssessment key={`risk-${refresh}`} />
                  <ActionPlan     key={`action-${refresh}`} />
                </div>
              )}
              {activeTab === 'Recommendations' && <RecommendationPanel key={`recs-${refresh}`} />}
              {activeTab === 'Action Plan'      && <ActionPlan         key={`plan-${refresh}`} fullView />}
              {activeTab === 'Legal Research'   && <LegalResearch      key={`research-${refresh}`} />}
              {activeTab === 'Contradictions'   && <Contradictions     key={`contra-${refresh}`} />}
              
              {activeTab === 'Document Gaps'    && <DocumentGaps       key={`gaps-${refresh}`} />}
            </>
          )}
        </div>

        {/* ── MOBILE STRATEGY VIEW (Matching Mobile Prototype) ── */}
        <div className="mobile-strategy-view" style={{ display: 'none', flexDirection: 'column', gap: 16 }}>
          
          {/* Top Pill Tabs Bar with horizontal scroll matching Prototype */}
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
            {TABS.map((tab) => {
              const isSelected = activeTab === tab.name
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
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
                  {tab.name}
                </button>
              )
            })}
          </div>

          {/* Main Solid Grey Section with Rounded Top extending full width */}
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
            {/* Header: Litigation Strategy */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 2px 6px', fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  Litigation Strategy
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
                Run AI Strategy
              </button>
            </div>

            {/* 3 Top Strategy Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 12,
              }}
            >
              {[
                { title: 'Readiness', value: '88%', sub: 'Score' },
                { title: 'Priority', value: 'High', sub: 'Urgency' },
                { title: 'Precedents', value: '6', sub: 'Indexed' },
              ].map((item, idx) => (
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

            {/* Main Content Area for Strategy */}
            {!selectedCaseId ? (
              <div style={{ background: '#e2e8f0', borderRadius: 24, padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                <i className="ti ti-folder-open" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.5 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>No Case Selected</div>
                <p style={{ fontSize: 12, margin: '4px 0 0' }}>Select a case from the dashboard first.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeTab === 'Risk Assessment' && <RiskAssessment key={`mob-risk-${refresh}`} />}
                {activeTab === 'Recommendations' && <RecommendationPanel key={`mob-recs-${refresh}`} />}
                {activeTab === 'Action Plan'      && <ActionPlan key={`mob-plan-${refresh}`} fullView />}
                {activeTab === 'Legal Research'   && <LegalResearch key={`mob-research-${refresh}`} />}
                {activeTab === 'Contradictions'   && <Contradictions key={`mob-contra-${refresh}`} />}
                {activeTab === 'Document Gaps'    && <DocumentGaps key={`mob-gaps-${refresh}`} />}
              </div>
            )}

          </div>

        </div>
      </div>

      {showModal && (
        <GenerateStrategyModal
          caseType={caseType}
          court={caseData?.court ?? ''}
          onClose={() => setShowModal(false)}
          onGenerated={() => { setShowModal(false); setRefresh(r => r + 1) }}
        />
      )}
    </>
  )
}
