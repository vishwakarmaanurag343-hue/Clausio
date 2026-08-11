'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, casesApi, parseAiJson } from '@/lib/api'

import IncomeReality         from '@/components/financial/IncomeReality'
import MaintenanceRange      from '@/components/financial/MaintenanceRange'
import MaintenanceCalculator from '@/components/financial/MaintenanceCalculator'
import SettlementCalculator  from '@/components/financial/SettlementCalculator'
import TaxDemandCalculator   from '@/components/financial/TaxDemandCalculator'
import PreDepositCalculator  from '@/components/financial/PreDepositCalculator'
import BailCalculator        from '@/components/financial/BailCalculator'
import NiActCalculator       from '@/components/financial/NiActCalculator'
import CourtFeeCalculator    from '@/components/financial/CourtFeeCalculator'
import DamagesCalculator     from '@/components/financial/DamagesCalculator'
import AnalyzeFinancialModal from '@/components/financial/AnalyzeFinancialModal'

// Tabs per case type
function getTabsForCaseType(ct: string): string[] {
  const t = ct.toLowerCase()
  if (t.includes('family'))              return ['AI Analysis', 'Maintenance Calculator', 'Settlement Calculator']
  if (t.includes('gst'))                 return ['AI Analysis', 'Tax Demand Calculator', 'Pre-deposit Calculator']
  if (t.includes('income tax'))          return ['AI Analysis', 'Tax Demand Calculator', 'Interest Calculator']
  if (t.includes('ni act'))              return ['AI Analysis', 'NI Act Calculator', 'Court Fee Calculator']
  if (t.includes('criminal'))            return ['AI Analysis', 'Bail Calculator', 'Fine Estimator']
  if (t.includes('civil'))               return ['AI Analysis', 'Court Fee Calculator', 'Damages Calculator']
  if (t.includes('consumer'))            return ['AI Analysis', 'Damages Calculator', 'Court Fee Calculator']
  if (t.includes('labour'))              return ['AI Analysis', 'Damages Calculator', 'Court Fee Calculator']
  if (t.includes('corporate') || t.includes('arbitration') || t.includes('rera')) return ['AI Analysis', 'Damages Calculator', 'Court Fee Calculator']
  return ['AI Analysis'] // fallback
}

export default function FinancialPage() {
  const { selectedCaseId } = useCaseStore()
  const [activeTab,  setActiveTab]  = useState('AI Analysis')
  const [showModal,  setShowModal]  = useState(false)
  const [analysis,   setAnalysis]   = useState<any>(null)
  const [rawText,    setRawText]    = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [caseType,   setCaseType]   = useState('')
  const [caseName,   setCaseName]   = useState('')
  const [tabs,       setTabs]       = useState(['AI Analysis'])

  // Load case type when case changes
  useEffect(() => {
    if (!selectedCaseId) { setCaseType(''); setCaseName(''); setTabs(['AI Analysis']); setActiveTab('AI Analysis'); return }
    casesApi.getById(selectedCaseId)
      .then((c: any) => {
        const ct = c.caseType ?? c.type ?? ''
        setCaseType(ct)
        setCaseName(c.name ?? '')
        const newTabs = getTabsForCaseType(ct)
        setTabs(newTabs)
        setActiveTab(newTabs[0])
        // Reset analysis when case changes
        setAnalysis(null)
        setRawText('')
      })
      .catch(() => {})
  }, [selectedCaseId])

  const analyse = useCallback(async () => {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    setLoading(true); setError('')
    try {
      const res    = await aiApi.getFinancial(selectedCaseId)
      const raw    = res.analysis ?? res.result ?? ''
      const parsed = parseAiJson<any>(raw)
      setAnalysis(parsed); setRawText(parsed ? '' : raw)
    } catch (err: any) {
      setError(err.message || 'Failed to analyse financials.')
    } finally { setLoading(false) }
  }, [selectedCaseId])

  function renderTab() {
    const t  = activeTab
    const ct = caseType.toLowerCase()

    if (t === 'AI Analysis') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '42% 58%', gap: 24 }}>
          <IncomeReality    analysis={analysis} rawText={rawText} loading={loading} onAnalyse={analyse} caseType={caseType} />
          <MaintenanceRange analysis={analysis} rawText={rawText} loading={loading} caseId={selectedCaseId} caseType={caseType} />
        </div>
      )
    }

    // Family
    if (t === 'Maintenance Calculator') return <MaintenanceCalculator caseId={selectedCaseId} />
    if (t === 'Settlement Calculator')  return <SettlementCalculator  caseId={selectedCaseId} />

    // GST / Income Tax
    if (t === 'Tax Demand Calculator')  return <TaxDemandCalculator  caseType={caseType} caseId={selectedCaseId} />
    if (t === 'Pre-deposit Calculator' || t === 'Interest Calculator') return <PreDepositCalculator caseType={caseType} caseId={selectedCaseId} />

    // Criminal
    if (t === 'Bail Calculator')        return <BailCalculator  caseId={selectedCaseId} />
    if (t === 'Fine Estimator')         return <DamagesCalculator label="Fine & Compensation Estimator" caseId={selectedCaseId} caseType={caseType} />

    // NI Act
    if (t === 'NI Act Calculator')      return <NiActCalculator caseId={selectedCaseId} />

    // Civil / Consumer / Labour / Corporate
    if (t === 'Court Fee Calculator')   return <CourtFeeCalculator caseId={selectedCaseId} caseType={caseType} />
    if (t === 'Damages Calculator')     return <DamagesCalculator  label="Damages & Compensation Calculator" caseId={selectedCaseId} caseType={caseType} />

    return null
  }

  return (
    <>
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Financial Intelligence
            </h1>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
              {caseType
                ? <><span style={{ color: '#2563eb', fontWeight: 700 }}>{caseType}</span> — AI financial analysis and calculators for this case type.</>
                : 'Select a case to see relevant financial calculators.'}
            </p>
            {/* Case info */}
            {caseName && selectedCaseId && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '2px 10px', borderRadius: 20, border: '1px solid #e2e8f0' }}>{caseName}</span>
                {caseType && <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '2px 10px', borderRadius: 20, border: '1px solid #bfdbfe' }}>{caseType}</span>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {activeTab === 'AI Analysis' && (
              <button onClick={analyse} disabled={loading || !selectedCaseId}
                style={{ padding: '0 16px', height: 38, borderRadius: 10, border: 'none', background: loading ? '#93c5fd' : '#7c3aed', color: '#fff', cursor: loading || !selectedCaseId ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: !selectedCaseId ? 0.5 : 1, fontFamily: 'inherit' }}>
                <i className="ti ti-sparkles" />{loading ? 'Analysing...' : analysis ? 'Re-analyse' : 'Run AI Analysis'}
              </button>
            )}
            <button onClick={() => setShowModal(true)} disabled={!selectedCaseId}
              style={{ padding: '0 16px', height: 38, borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', cursor: !selectedCaseId ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: !selectedCaseId ? 0.5 : 1, fontFamily: 'inherit' }}>
              <i className="ti ti-chart-bar" />Detailed Analysis
            </button>
          </div>
        </div>

        {/* No case selected */}
        {!selectedCaseId && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <i className="ti ti-folder-open" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Case Selected</div>
            <div style={{ fontSize: 13 }}>Go to the Dashboard and select a case to see relevant financial calculators.</div>
          </div>
        )}

        {selectedCaseId && (
          <>
            {/* Dynamic tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: '10px 16px', border: 'none', borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: 'transparent', whiteSpace: 'nowrap', color: activeTab === tab ? '#1e40af' : '#64748b', transition: 'all 0.15s' }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                <span>{error}</span>
                <button onClick={analyse} style={{ fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Retry</button>
              </div>
            )}

            {/* Tab content */}
            {renderTab()}
          </>
        )}
      </div>

      {showModal && (
        <AnalyzeFinancialModal
          onClose={() => setShowModal(false)}
          onAnalyse={async () => { await analyse(); setShowModal(false) }}
        />
      )}
    </>
  )
}
