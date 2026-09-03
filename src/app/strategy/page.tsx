'use client'

import { useState } from 'react'

import StrategyTabs from '@/components/strategy/StrategyTabs'
import RiskAssessment from '@/components/strategy/RiskAssessment'
import ActionPlan from '@/components/strategy/ActionPlan'
import RecommendationPanel from '@/components/strategy/RecommendationPanel'
import LegalResearch from '@/components/strategy/LegalResearch'
import GenerateStrategyModal from '@/components/strategy/GenerateStrategyModal'

export default function StrategyPage() {
  const [showModal, setShowModal] = useState(false)

  const [activeTab, setActiveTab] = useState('Risk Assessment')

  return (
    <>
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Strategy
            </h1>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
              AI litigation strategy and recommendations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 600, fontSize: 11, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              Family & Matrimonial
            </div>
            <button
              className="glass-button"
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, border: 'none', borderRadius: 10, cursor: 'pointer', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            >
              <i className="ti ti-sparkles" />
              Run AI
            </button>
          </div>
        </div>

        <StrategyTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div style={{ marginTop: 24 }}>

          {activeTab === 'Risk Assessment' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '38% 62%',
                gap: 24,
              }}
            >
              <RiskAssessment />
              <ActionPlan />
            </div>
          )}

          {activeTab === 'Recommendations' && (
            <RecommendationPanel />
          )}

          {activeTab === 'Action Plan' && (
            <ActionPlan />
          )}

          {activeTab === 'Document Gaps' && (
            <div
              style={{
                background: '#fff',
                padding: 30,
                borderRadius: 16,
                border: '1px solid #e2e8f0',
              }}
            >
              Document Gaps Component Coming Soon
            </div>
          )}

          {activeTab === 'Legal Research' && (
            <LegalResearch />
          )}

        </div>
      </div>

      {showModal && (
        <GenerateStrategyModal
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}