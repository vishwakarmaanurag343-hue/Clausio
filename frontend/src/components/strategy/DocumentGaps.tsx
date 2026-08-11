'use client'

import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'
import { casesApi, documentsApi } from '@/lib/api'

// Required documents per case type
const REQUIRED_DOCS: Record<string, { category: string; docs: string[] }[]> = {
  family: [
    { category: 'Marriage Documents', docs: ['Marriage Certificate', 'Marriage Photograph', 'Invitation Card'] },
    { category: 'Identity Documents', docs: ['Aadhar Card — Petitioner', 'PAN Card — Petitioner', 'Aadhar Card — Respondent'] },
    { category: 'Financial Documents', docs: ['Bank Statements — 12 months', 'ITR — Last 3 years', 'Salary Slips', 'Property Documents'] },
    { category: 'Evidence Documents', docs: ['Medical Records', 'FIR Copy (if any)', 'WhatsApp Screenshots', 'Photographs of Injuries'] },
    { category: 'Child Related', docs: ['Birth Certificate', 'School Records', 'Medical Records of Child'] },
  ],
  criminal: [
    { category: 'FIR & Police Documents', docs: ['FIR Copy', 'Charge Sheet', 'Case Diary', 'Police Report'] },
    { category: 'Bail Documents', docs: ['Bail Application', 'Surety Bond', 'Property Documents of Surety'] },
    { category: 'Identity & Personal', docs: ['Aadhar Card', 'PAN Card', 'Passport / Voter ID'] },
    { category: 'Evidence', docs: ['Witness List', 'Alibi Evidence', 'Medical Reports', 'CCTV Footage'] },
  ],
  civil: [
    { category: 'Plaint Documents', docs: ['Plaint Copy', 'Vakalatnama', 'Court Fee Receipt', 'Process Fee Receipt'] },
    { category: 'Property Documents', docs: ['Sale Deed', 'Title Documents', 'Property Tax Receipts', 'Survey Records'] },
    { category: 'Agreement Documents', docs: ['Contract / Agreement Copy', 'Correspondence Letters', 'Notice Copy', 'Reply to Notice'] },
    { category: 'Evidence', docs: ['Witness Affidavits', 'Expert Reports', 'Photographs', 'Revenue Records'] },
  ],
  gst: [
    { category: 'SCN & Orders', docs: ['Show Cause Notice', 'GSTIN Certificate', 'Registration Certificate'] },
    { category: 'Returns', docs: ['GSTR-1 Returns', 'GSTR-3B Returns', 'Annual Return GSTR-9'] },
    { category: 'Financial', docs: ['Purchase Invoices', 'ITC Ledger', 'Cash Ledger', 'Bank Statements'] },
    { category: 'Appeal Documents', docs: ['Appeal Memo', 'Pre-deposit Challan', 'Stay Application'] },
  ],
  'income tax': [
    { category: 'Assessment Documents', docs: ['Assessment Order', 'Notice u/s 143(2)', 'ITR Filed Copy'] },
    { category: 'Financial', docs: ['Bank Statements', 'Books of Accounts', 'Balance Sheet', 'P&L Statement'] },
    { category: 'Appeal', docs: ['Form 35 — Appeal to CIT(A)', 'Grounds of Appeal', 'Stay Application'] },
    { category: 'Evidence', docs: ['Source of Investment Proof', 'Gift Deeds', 'Loan Documents'] },
  ],
  'ni act': [
    { category: 'Cheque Documents', docs: ['Original Dishonoured Cheque', 'Bank Return Memo', 'Bank Certificate'] },
    { category: 'Notice', docs: ['Legal Notice Copy', 'RPAD Receipt', 'Acknowledgment of Notice'] },
    { category: 'Complaint', docs: ['Complaint Copy', 'Sworn Affidavit', 'Vakalatnama'] },
    { category: 'Financial Proof', docs: ['Loan Agreement / Invoice', 'Account Statement showing debt', 'Payment History'] },
  ],
}

const DEFAULT_DOCS = [
  { category: 'Identity Documents', docs: ['Aadhar Card', 'PAN Card', 'Address Proof'] },
  { category: 'Case Documents', docs: ['Plaint / Petition Copy', 'Vakalatnama', 'Court Fee Receipt'] },
  { category: 'Evidence', docs: ['Documentary Evidence', 'Witness List', 'Affidavits'] },
]

export default function DocumentGaps() {
  const { selectedCaseId } = useCaseStore()
  const [caseData,   setCaseData]   = useState<any>(null)
  const [documents,  setDocuments]  = useState<any[]>([])
  const [loading,    setLoading]    = useState(false)
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!selectedCaseId) { setCaseData(null); setDocuments([]); return }
    setLoading(true)
    Promise.all([
      casesApi.getById(selectedCaseId),
      documentsApi.getByCaseId(selectedCaseId),
    ]).then(([c, d]) => {
      setCaseData(c)
      setDocuments(Array.isArray(d) ? d : [])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [selectedCaseId])

  function getRequiredDocs() {
    if (!caseData?.caseType) return DEFAULT_DOCS
    const lower = caseData.caseType.toLowerCase()
    for (const [key, val] of Object.entries(REQUIRED_DOCS)) {
      if (lower.includes(key)) return val
    }
    return DEFAULT_DOCS
  }

  function isUploaded(docName: string) {
    return documents.some(d =>
      d.fileName?.toLowerCase().includes(docName.toLowerCase().split(' ')[0]) ||
      d.documentType?.toLowerCase().includes(docName.toLowerCase())
    )
  }

  function toggleCheck(key: string) {
    setCheckedMap(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const requiredDocs = getRequiredDocs()
  const totalDocs    = requiredDocs.reduce((acc, cat) => acc + cat.docs.length, 0)
  const uploadedCount = requiredDocs.reduce((acc, cat) =>
    acc + cat.docs.filter(d => isUploaded(d) || checkedMap[d]).length, 0)
  const completionPct = totalDocs > 0 ? Math.round((uploadedCount / totalDocs) * 100) : 0

  if (!selectedCaseId) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 40, textAlign: 'center' }}>
        <i className="ti ti-folder-open" style={{ fontSize: 36, color: '#94a3b8', display: 'block', marginBottom: 8 }} />
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Select a case to see document gaps</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Document Gaps</h2>
          <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>
            Checklist of required documents for {caseData?.caseType ?? 'this case type'}.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: completionPct >= 70 ? '#16a34a' : completionPct >= 40 ? '#d97706' : '#dc2626' }}>
            {completionPct}%
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{uploadedCount}/{totalDocs} complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ height: '100%', width: `${completionPct}%`, background: completionPct >= 70 ? '#22c55e' : completionPct >= 40 ? '#f59e0b' : '#ef4444', borderRadius: 4, transition: 'width 0.5s' }} />
      </div>

      {/* Uploaded files summary */}
      {documents.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#15803d' }}>
          <i className="ti ti-files" style={{ marginRight: 6 }} />
          {documents.length} file{documents.length > 1 ? 's' : ''} already uploaded to this case
        </div>
      )}

      {/* Document categories */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading...</div>
      ) : (
        requiredDocs.map((category, ci) => (
          <div key={ci} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {category.category}
            </div>
            {category.docs.map((doc, di) => {
              const uploaded  = isUploaded(doc)
              const checked   = checkedMap[doc] || false
              const isDone    = uploaded || checked
              return (
                <div key={di} onClick={() => !uploaded && toggleCheck(doc)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, marginBottom: 6, cursor: uploaded ? 'default' : 'pointer', background: isDone ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isDone ? '#86efac' : '#e2e8f0'}`, transition: 'all 0.15s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isDone ? '#22c55e' : '#cbd5e1'}`, background: isDone ? '#22c55e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isDone && <i className="ti ti-check" style={{ fontSize: 11, color: '#fff' }} />}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: isDone ? '#15803d' : '#475569', fontWeight: isDone ? 600 : 400, textDecoration: isDone ? 'none' : 'none' }}>
                    {doc}
                  </span>
                  {uploaded && (
                    <span style={{ fontSize: 10, padding: '2px 7px', background: '#dcfce7', color: '#15803d', borderRadius: 10, fontWeight: 700, flexShrink: 0 }}>
                      ✓ Uploaded
                    </span>
                  )}
                  {!uploaded && checked && (
                    <span style={{ fontSize: 10, padding: '2px 7px', background: '#eff6ff', color: '#2563eb', borderRadius: 10, fontWeight: 700, flexShrink: 0 }}>
                      ✓ Confirmed
                    </span>
                  )}
                  {!uploaded && !checked && (
                    <span style={{ fontSize: 10, padding: '2px 7px', background: '#fef2f2', color: '#dc2626', borderRadius: 10, fontWeight: 600, flexShrink: 0 }}>
                      Missing
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}

      {/* Footer note */}
      <div style={{ marginTop: 8, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
        <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
        Click any item to mark it as confirmed. Green items are auto-detected from uploaded files.
      </div>
    </div>
  )
}
