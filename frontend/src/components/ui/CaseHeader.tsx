'use client'

import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'
import { casesApi } from '@/lib/api'

interface Props {
  title:    string
  subtitle?: string
  children?: React.ReactNode
}

export default function CaseHeader({ title, subtitle, children }: Props) {
  const { selectedCaseId } = useCaseStore()
  const [caseData, setCaseData] = useState<any>(null)

  useEffect(() => {
    if (!selectedCaseId) { setCaseData(null); return }
    casesApi.getById(selectedCaseId)
      .then(setCaseData)
      .catch(() => {})
  }, [selectedCaseId])

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ marginTop: 4, fontSize: 13, color: '#64748b', fontWeight: 500 }}>{subtitle}</p>
        )}

        {/* Case info bar */}
        {caseData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {/* Case name */}
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20, border: '1px solid #e2e8f0' }}>
              {caseData.name}
            </span>
            {/* Case number */}
            {caseData.caseNumber && (
              <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '3px 10px', borderRadius: 20, border: '1px solid #bfdbfe' }}>
                {caseData.caseNumber}
              </span>
            )}
            {/* Court */}
            {caseData.court && (
              <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-building" style={{ fontSize: 12 }} />
                {caseData.court}
              </span>
            )}
            {/* Stage */}
            {caseData.stage && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f0fdf4', color: '#15803d', fontWeight: 600, border: '1px solid #86efac' }}>
                {caseData.stage}
              </span>
            )}
          </div>
        )}

        {/* No case selected */}
        {!selectedCaseId && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-folder-open" style={{ fontSize: 13 }} />
            No case selected — go to Dashboard to select a case
          </div>
        )}
      </div>

      {/* Right side — buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}
