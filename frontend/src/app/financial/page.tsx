'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, casesApi, parseAiJson } from '@/lib/api'

import FinancialProfileCards from '@/components/financial/FinancialProfileCards'
import MaintenanceCalculator from '@/components/financial/MaintenanceCalculator'
import SettlementCalculator  from '@/components/financial/SettlementCalculator'
import TaxDemandCalculator   from '@/components/financial/TaxDemandCalculator'
import PreDepositCalculator  from '@/components/financial/PreDepositCalculator'
import NiActCalculator       from '@/components/financial/NiActCalculator'
import CourtFeeCalculator    from '@/components/financial/CourtFeeCalculator'
import DamagesCalculator     from '@/components/financial/DamagesCalculator'
import AnalyzeFinancialModal from '@/components/financial/AnalyzeFinancialModal'

// Compoundable offences that carry a real financial component (compensation/fine in lieu
// of punishment). A Criminal case shows the Fine & Compensation Calculator only when its
// subtype or name matches one of these; otherwise the Financial page has nothing to
// compute for that case and the tab set is empty.
const COMPOUNDABLE_FINANCIAL = [
  '498a', '406', '420', 'cheat', 'cheating', 'defamation', '500', '499',
  '323', '324', '337', '338', 'hurt', '447', '426', '427', 'mischief',
  'trespass', '506', '138', 'dishonour', 'dishonor', 'breach of trust', 'compoundable',
]

function isCompoundableFinancialCriminal(name: string, subType: string) {
  const hay = `${subType} ${name}`.toLowerCase()
  return COMPOUNDABLE_FINANCIAL.some(k => hay.includes(k))
}

// Tabs per case type
function getTabsForCaseType(ct: string, subType = '', caseName = ''): string[] {
  const t = ct.toLowerCase()
  const family      = t.includes('family') || t.includes('matrimonial') || t.includes('divorce')
  const civilFamily = t.includes('civil') || t.includes('property') || t.includes('commercial')
                   || t.includes('consumer') || t.includes('labour') || t.includes('arbitration')
                   || t.includes('rera') || t.includes('corporate')

  if (family)      return ['AI Analysis', 'Maintenance Calculator', 'Settlement Calculator']
  if (t.includes('gst') || t.includes('income tax')) return ['AI Analysis', 'Tax Demand Calculator', 'Pre-deposit Calculator']
  if (t.includes('ni act')) return ['AI Analysis', 'NI Act Calculator', 'Court Fee Calculator']
  if (t.includes('criminal')) {
    return isCompoundableFinancialCriminal(caseName, subType)
      ? ['AI Analysis', 'Fine & Compensation Calculator']
      : [] // Non-compoundable offence with no financial component — no calculator applies
  }
  if (civilFamily) return ['AI Analysis', 'Damages & Interest Calculator', 'Court Fee Calculator']
  return ['AI Analysis'] // unknown type — analysis still works, calculators withheld
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
  const [profile,    setProfile]    = useState<any>(null)

  // Load case type when case changes
  useEffect(() => {
    if (!selectedCaseId) { setCaseType(''); setCaseName(''); setTabs(['AI Analysis']); setActiveTab('AI Analysis'); return }
    casesApi.getById(selectedCaseId)
      .then((c: any) => {
        const ct = c.caseType ?? c.type ?? ''
        setCaseType(ct)
        setCaseName(c.name ?? '')
        const newTabs = getTabsForCaseType(ct, c.subType ?? '', c.name ?? '')
        setTabs(newTabs)
        setActiveTab(newTabs[0] ?? 'AI Analysis')
        // Reset analysis when case changes
        setAnalysis(null)
        setProfile(null)
        setRawText('')
      })
      .catch(() => {})
  }, [selectedCaseId])

  const analyse = useCallback(async (options?: any) => {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    setLoading(true); setError('')
    try {
      const res    = await aiApi.getFinancial(selectedCaseId, options)
      const raw    = res.analysis ?? res.result ?? ''
      const parsed = parseAiJson<any>(raw)
      setAnalysis(parsed)
      setProfile(parsed?.financialProfile ?? null)
      setRawText(parsed ? '' : raw)
    } catch (err: any) {
      setError(err.message || 'Failed to analyse financials.')
    } finally { setLoading(false) }
  }, [selectedCaseId])

  // Map the AI-extracted profile onto each calculator's input fields. Only real numbers
  // land — the calculators ignore nulls and keep their editable defaults.
  function autoFillFor(tab: string): Record<string, number | null | undefined> | undefined {
    if (!profile) return undefined
    const e = profile.monthlyExpenses ?? {}
    switch (tab) {
      case 'Maintenance Calculator':
        return { husbandIncome: profile.monthlyIncome, rent: e.rent, education: e.education, medical: e.medical, otherExpense: e.other }
      case 'Settlement Calculator':
        return { monthly: profile.monthlyIncome }
      case 'Damages & Interest Calculator':
      case 'Fine & Compensation Calculator':
        return { actualLoss: profile.claimAmount ?? profile.suitValuation }
      case 'Court Fee Calculator':
        return { claimAmount: profile.claimAmount ?? profile.suitValuation }
      default:
        return undefined
    }
  }

  function renderTab() {
    const t = activeTab

    if (t === 'AI Analysis') {
      // Non-compoundable criminal case — no calculator applies to it at all
      if (tabs.length === 0) {
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <i className="ti ti-ban" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No financial tools for this case</div>
            <div style={{ fontSize: 13, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              This criminal case does not appear to involve a compoundable offence with a financial component,
              so fine/compensation calculation does not apply. Document analysis remains available above.
            </div>
          </div>
        )
      }
      return (
        <FinancialProfileCards
          analysis={analysis}
          rawText={rawText}
          loading={loading}
          caseType={caseType}
          suggestedTab={tabs.find(x => x !== 'AI Analysis')}
          onOpenTab={(tab) => setActiveTab(tab)}
          onAnalyse={() => analyse()}
          canAnalyse={!!selectedCaseId}
        />
      )
    }

    // Family
    if (t === 'Maintenance Calculator') return <MaintenanceCalculator caseId={selectedCaseId} initialValues={autoFillFor(t)} />
    if (t === 'Settlement Calculator')  return <SettlementCalculator  caseId={selectedCaseId} initialValues={autoFillFor(t)} />

    // GST / Income Tax
    if (t === 'Tax Demand Calculator')  return <TaxDemandCalculator  caseType={caseType} caseId={selectedCaseId} />
    if (t === 'Pre-deposit Calculator' || t === 'Interest Calculator') return <PreDepositCalculator caseType={caseType} caseId={selectedCaseId} />

    // Criminal (compoundable with financial component only)
    if (t === 'Fine & Compensation Calculator')
      return <DamagesCalculator label="Fine & Compensation Calculator" caseId={selectedCaseId} caseType={caseType} initialValues={autoFillFor(t)} />

    // NI Act
    if (t === 'NI Act Calculator')      return <NiActCalculator caseId={selectedCaseId} />

    // Civil / Property / Commercial / Consumer / Labour / Corporate / RERA / Arbitration
    if (t === 'Court Fee Calculator')   return <CourtFeeCalculator caseId={selectedCaseId} caseType={caseType} initialValues={autoFillFor(t)} />
    if (t === 'Damages & Interest Calculator')
      return <DamagesCalculator label="Damages & Interest Calculator" caseId={selectedCaseId} caseType={caseType} initialValues={autoFillFor(t)} />

    return null
  }

  return (
    <>
      <div className="glass-panel mobile-financial-container" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>

        {/* ── DESKTOP FINANCIAL VIEW ── */}
        <div className="desktop-financial-view" style={{ display: 'flex', flexDirection: 'column' }}>
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
                <button onClick={() => analyse()} disabled={loading || !selectedCaseId}
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
                  <button onClick={() => analyse()} style={{ fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>Retry</button>
                </div>
              )}

              {/* Tab content */}
              {renderTab()}
            </>
          )}
        </div>

        {/* ── MOBILE FINANCIAL VIEW (Matching Prototype) ── */}
        <div className="mobile-financial-view" style={{ display: 'none', flexDirection: 'column', gap: 16 }}>
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
            {tabs.map((tab) => {
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 2px 6px', fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  Financial Intelligence
                </h2>
                <p style={{ margin: '0 0 14px 6px', fontSize: 11, fontWeight: 600, color: '#475569' }}>
                  {caseName || 'Select a case'} · {activeTab}
                </p>
              </div>
              <button
                onClick={() => analyse()}
                disabled={loading || !selectedCaseId}
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
                {loading ? 'Analysing...' : 'Analyse'}
              </button>
            </div>

            {/* 3 Top Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 12,
              }}
            >
              {[
                {
                  title: 'Est. Income',
                  value: profile?.monthlyIncome ? `₹${(profile.monthlyIncome / 1000).toFixed(0)}k` : '—',
                  sub:   'Monthly',
                },
                {
                  title: 'Claim',
                  value: (profile?.claimAmount || profile?.suitValuation) ? `₹${(((profile.claimAmount ?? 0) || (profile.suitValuation ?? 0)) / 100000).toFixed(1)}L` : '—',
                  sub:   'Valuation',
                },
                {
                  title: 'Flags',
                  value: String(Array.isArray(analysis?.flaggedDiscrepancies) ? analysis.flaggedDiscrepancies.length : 0),
                  sub:   'Discrepancies',
                },
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

            {/* Main Content Area */}
            {!selectedCaseId ? (
              <div style={{ background: '#e2e8f0', borderRadius: 24, padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                <i className="ti ti-folder-open" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.5 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>No Case Selected</div>
                <p style={{ fontSize: 12, margin: '4px 0 0' }}>Select a case from the dashboard first.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {renderTab()}
              </div>
            )}

          </div>
        </div>

      </div>

      {showModal && (
        <AnalyzeFinancialModal
          onClose={() => setShowModal(false)}
          onAnalyse={async (options) => { await analyse(options); setShowModal(false) }}
        />
      )}
    </>
  )
}
