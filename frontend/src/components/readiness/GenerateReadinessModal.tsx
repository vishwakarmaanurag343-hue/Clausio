'use client'

import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'
import { readinessApi, casesApi } from '@/lib/api'

interface Props { onClose: () => void; onGenerated?: () => void }

// ── Case type config ──────────────────────────────────────────────

function getConfig(ct: string) {
  const t = ct.toLowerCase()

  if (t.includes('family')) return {
    hearingTypes: ['Interim Application', 'Evidence', 'Arguments', 'Final Hearing', 'Mediation', 'Execution'],
    courts:       ['Family Court', 'District Court', 'High Court'],
    objectives:   ['Secure Interim Maintenance', 'Win Divorce Decree', 'Child Custody Order', 'Domestic Violence Relief', 'Permanent Alimony'],
    checks:       ['Evidence Strength', 'Document Completeness', 'Financial Analysis', 'Cross Examination', 'Witness Preparation'],
  }

  if (t.includes('criminal')) return {
    hearingTypes: ['Bail Hearing', 'Framing of Charges', 'Trial / Evidence', 'Arguments', 'Sentencing', 'Anticipatory Bail'],
    courts:       ['Magistrate Court', 'Sessions Court', 'High Court', 'Supreme Court'],
    objectives:   ['Secure Bail', 'Get Acquittal', 'Challenge FIR/Chargesheet', 'Minimize Sentence', 'Anticipatory Bail'],
    checks:       ['Evidence Strength', 'Document Completeness', 'Witness Preparation', 'Cross Examination', 'Triple Test (Bail)'],
  }

  if (t.includes('gst')) return {
    hearingTypes: ['Personal Hearing (SCN)', 'Stay Application', 'Appeal Hearing', 'GSTAT Hearing', 'High Court'],
    courts:       ['GST Appellate Authority', 'GSTAT', 'High Court', 'Supreme Court'],
    objectives:   ['Set Aside SCN', 'Obtain Stay of Demand', 'Win Appeal', 'ITC Restoration', 'Penalty Reduction'],
    checks:       ['Document Completeness', 'Tax Demand Analysis', 'Legal Arguments', 'Evidence Strength', 'Judgment Research'],
  }

  if (t.includes('income tax')) return {
    hearingTypes: ['Assessment Hearing', 'CIT(A) Appeal', 'ITAT Hearing', 'Stay Application', 'High Court'],
    courts:       ['CIT(A)', 'ITAT', 'High Court', 'Supreme Court'],
    objectives:   ['Win CIT(A) Appeal', 'Obtain Stay', 'Penalty Waiver', 'ITAT Appeal', 'Rectification'],
    checks:       ['Document Completeness', 'Tax Demand Analysis', 'Legal Arguments', 'Evidence Strength', 'Judgment Research'],
  }

  if (t.includes('ni act')) return {
    hearingTypes: ['Complaint Filing', 'Evidence', 'Arguments', 'Final Hearing', 'Compounding'],
    courts:       ['Magistrate Court', 'Sessions Court', 'High Court'],
    objectives:   ['Secure Conviction', 'Maximum Compensation', 'Summary Trial', 'Compounding Settlement'],
    checks:       ['Evidence Strength', 'Document Completeness', 'Cross Examination', 'Limitation Compliance', 'Notice Validity'],
  }

  if (t.includes('civil')) return {
    hearingTypes: ['Interim Injunction', 'Evidence', 'Arguments', 'Final Hearing', 'Execution', 'Appeal'],
    courts:       ['Civil Judge Court', 'District Court', 'Commercial Court', 'High Court'],
    objectives:   ['Win Interim Injunction', 'Win Decree', 'Settlement', 'Execution of Decree'],
    checks:       ['Evidence Strength', 'Document Completeness', 'Cross Examination', 'Financial Analysis', 'Legal Arguments'],
  }

  if (t.includes('consumer')) return {
    hearingTypes: ['Admission Hearing', 'Evidence', 'Arguments', 'Final Order', 'Appeal'],
    courts:       ['District Consumer Commission', 'State Consumer Commission', 'NCDRC'],
    objectives:   ['Get Refund + Compensation', 'Maximum Compensation', 'Service Restoration'],
    checks:       ['Evidence Strength', 'Document Completeness', 'Financial Damages', 'Legal Arguments', 'Expert Opinion'],
  }

  if (t.includes('labour')) return {
    hearingTypes: ['Conciliation', 'Evidence', 'Arguments', 'Award', 'Appeal'],
    courts:       ['Labour Court', 'Industrial Tribunal', 'High Court'],
    objectives:   ['Reinstatement', 'Back Wages', 'Compensation', 'VRS Settlement'],
    checks:       ['Evidence Strength', 'Document Completeness', 'Financial Analysis', 'Legal Arguments', 'Witness Preparation'],
  }

  // Default
  return {
    hearingTypes: ['Interim Application', 'Evidence', 'Arguments', 'Final Hearing', 'Appeal'],
    courts:       ['District Court', 'High Court', 'Supreme Court'],
    objectives:   ['Win the Case', 'Obtain Interim Relief', 'Settlement', 'Appeal'],
    checks:       ['Evidence Strength', 'Document Completeness', 'Cross Examination', 'Financial Analysis', 'Legal Arguments'],
  }
}

export default function GenerateReadinessModal({ onClose, onGenerated }: Props) {
  const { selectedCaseId } = useCaseStore()
  const [caseType,    setCaseType]    = useState('')
  const [config,      setConfig]      = useState(getConfig(''))
  const [hearingType, setHearingType] = useState('')
  const [objective,   setObjective]   = useState('')
  const [court,       setCourt]       = useState('')
  const [urgency,     setUrgency]     = useState('Normal')
  const [notes,       setNotes]       = useState('')
  const [checks,      setChecks]      = useState<string[]>([])
  const [generating,  setGenerating]  = useState(false)
  const [error,       setError]       = useState('')

  // Load case type
  useEffect(() => {
    if (!selectedCaseId) return
    casesApi.getById(selectedCaseId).then((c: any) => {
      const ct = c.caseType ?? c.type ?? ''
      setCaseType(ct)
      const cfg = getConfig(ct)
      setConfig(cfg)
      setHearingType(cfg.hearingTypes[0])
      setObjective(cfg.objectives[0])
      setCourt(cfg.courts[0])
      setChecks(cfg.checks)
    }).catch(() => {})
  }, [selectedCaseId])

  function toggleCheck(check: string) {
    setChecks(prev => prev.includes(check) ? prev.filter(c => c !== check) : [...prev, check])
  }

  async function handleGenerate() {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    setGenerating(true); setError('')
    try {
      await readinessApi.generate(selectedCaseId)
      onGenerated?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to generate readiness report')
    } finally { setGenerating(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>

        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Generate Case Readiness</h2>
            <p style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
              Let Clausio analyse your {caseType || 'case'} before the next hearing.
            </p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, border: 'none', borderRadius: 8, background: '#f1f5f9', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          <Field label="Hearing Type">
            <select value={hearingType} onChange={e => setHearingType(e.target.value)} style={inp}>
              {config.hearingTypes.map(h => <option key={h}>{h}</option>)}
            </select>
          </Field>

          <Field label="Court / Forum">
            <select value={court} onChange={e => setCourt(e.target.value)} style={inp}>
              {config.courts.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Primary Objective">
            <select value={objective} onChange={e => setObjective(e.target.value)} style={inp}>
              {config.objectives.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="Urgency">
            <select value={urgency} onChange={e => setUrgency(e.target.value)} style={inp}>
              <option>Normal</option>
              <option>Urgent</option>
              <option>Emergency</option>
            </select>
          </Field>

          {/* Dynamic checkboxes */}
          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="What to Analyse">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {config.checks.map(check => (
                  <label key={check} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155', padding: '8px 12px', background: checks.includes(check) ? '#eff6ff' : '#f8fafc', border: `1px solid ${checks.includes(check) ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 8, transition: 'all 0.15s' }}>
                    <input type="checkbox" checked={checks.includes(check)} onChange={() => toggleCheck(check)} />
                    {check}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Notes */}
          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Additional Instructions (optional)">
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder={`e.g. Focus on ${config.objectives[0].toLowerCase()}, identify missing documents...`}
                style={{ ...inp, resize: 'vertical', height: 'auto', padding: '10px 12px' }} />
            </Field>
          </div>

          {error && (
            <div style={{ gridColumn: '1 / span 2', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* AI Preview */}
          <div style={{ gridColumn: '1 / span 2', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 10, fontSize: 13 }}>Clausio AI will generate</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Overall Readiness Score', 'Top Strengths', 'Critical Weaknesses / Gaps', 'Missing Documents Checklist', 'Cross Examination Questions', 'Recommended Next Actions', 'Timeline Review', 'Hearing Preparation Notes'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#334155', alignItems: 'center' }}>
                  <i className="ti ti-check" style={{ color: '#2563eb', fontSize: 12 }} />{item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '18px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={handleGenerate} disabled={generating}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: generating ? '#93c5fd' : '#2563eb', color: '#fff', cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-sparkles" />
            {generating ? 'Generating...' : 'Generate Readiness Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 7, fontWeight: 600, fontSize: 13, color: '#334151' }}>{label}</div>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }
