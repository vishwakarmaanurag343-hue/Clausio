'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { readinessApi, casesApi } from '@/lib/api'

import ReadinessTabs          from '@/components/readiness/ReadinessTabs'
import EmergencyResponse      from '@/components/readiness/EmergencyResponse'
import ReadinessScore         from '@/components/readiness/ReadinessScore'
import GapAnalysis            from '@/components/readiness/GapAnalysis'
import StrengthAnalysis       from '@/components/readiness/StrengthAnalysis'
import GenerateReadinessModal from '@/components/readiness/GenerateReadinessModal'

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
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>

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
                <EmergencyResponse />
                <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: 24, marginTop: 24 }}>
                  <ReadinessScore readiness={readiness} loading={loading} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <GapAnalysis      readiness={readiness} loading={loading} />
                    <StrengthAnalysis readiness={readiness} loading={loading} />
                  </div>
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

      {showModal && (
        <GenerateReadinessModal
          onClose={() => setShowModal(false)}
          onGenerated={() => { setShowModal(false); load() }}
        />
      )}
    </>
  )
}
