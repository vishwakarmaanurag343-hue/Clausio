'use client'

import { useState } from 'react'

import FinancialTabs from '@/components/financial/FinancialTabs'
import IncomeReality from '@/components/financial/IncomeReality'
import MaintenanceRange from '@/components/financial/MaintenanceRange'
import MaintenanceCalculator from '@/components/financial/MaintenanceCalculator'
import SettlementCalculator from '@/components/financial/SettlementCalculator'
import AnalyzeFinancialModal from '@/components/financial/AnalyzeFinancialModal'

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState('Financial Intelligence')
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>
        {/* ================= HEADER ================= */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Financial Intelligence
            </h1>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
              AI-powered financial investigation and maintenance analysis.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Case Badge */}
            <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 600, fontSize: 11, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              Family & Matrimonial
            </div>

            {/* Analyze Button */}
            <button
              className="glass-button"
              onClick={() => setShowModal(true)}
              style={{ padding: '0 16px', height: 38, borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            >
              <i className="ti ti-chart-bar" />
              Analyse
            </button>
          </div>
        </div>

        {/* ================= Tabs ================= */}

        <FinancialTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* ================= Content ================= */}

        <div style={{ marginTop: 24 }}>

          {activeTab === 'Financial Intelligence' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '42% 58%',
                gap: 24,
              }}
            >
              <IncomeReality />

              <MaintenanceRange />
            </div>
          )}

          {activeTab === 'Maintenance Calculator' && (
            <MaintenanceCalculator />
          )}

          {activeTab === 'Settlement Calculator' && (
            <SettlementCalculator />
          )}

        </div>
      </div>

      {/* ================= Modal ================= */}

      {showModal && (
        <AnalyzeFinancialModal
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}