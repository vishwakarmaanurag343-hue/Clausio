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
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>

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
          <button onClick={() => setShowModal(true)} disabled={!selectedCaseId}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', height: 40, border: 'none', borderRadius: 10, cursor: selectedCaseId ? 'pointer' : 'not-allowed', background: selectedCaseId ? '#2563eb' : '#94a3b8', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', boxShadow: selectedCaseId ? '0 4px 12px rgba(37,99,235,.3)' : 'none' }}>
            <i className="ti ti-sparkles" style={{ fontSize: 15 }} />Run AI Strategy
          </button>
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
