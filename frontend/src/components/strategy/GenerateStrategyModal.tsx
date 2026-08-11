'use client'

import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, actionPlansApi, researchApi, contradictionsApi, parseAiJson } from '@/lib/api'

interface Props {
  caseType?:    string
  court?:       string
  onClose:      () => void
  onGenerated?: () => void
}

function getObjectivesForCaseType(ct: string): string[] {
  const t = ct.toLowerCase()
  if (t.includes('family'))     return ['Win Interim Maintenance', 'Secure Divorce Decree', 'Win Child Custody', 'Obtain Injunction', 'Final Settlement']
  if (t.includes('criminal'))   return ['Secure Bail', 'Get Acquittal', 'Minimize Sentence', 'Challenge FIR', 'Get Anticipatory Bail']
  if (t.includes('gst'))        return ['Set Aside SCN', 'Win Appeal', 'Obtain Stay of Demand', 'Penalty Reduction', 'ITC Restoration']
  if (t.includes('income tax')) return ['Win CIT(A) Appeal', 'Obtain Stay', 'Penalty Waiver', 'Rectification', 'ITAT Appeal']
  if (t.includes('ni act'))     return ['Secure Conviction', 'Maximum Compensation', 'Summary Acquittal', 'Compounding']
  if (t.includes('civil'))      return ['Win Decree', 'Interim Injunction', 'Summary Judgment', 'Settlement', 'Execution of Decree']
  if (t.includes('consumer'))   return ['Get Refund + Compensation', 'Maximum Compensation', 'Service Restoration']
  if (t.includes('labour'))     return ['Reinstatement', 'Back Wages', 'Compensation', 'VRS Settlement']
  return ['Win the Case', 'Obtain Interim Relief', 'Settlement', 'Appeal']
}

function getCourtsForCaseType(ct: string): string[] {
  const t = ct.toLowerCase()
  if (t.includes('family'))     return ['Family Court', 'District Court', 'High Court']
  if (t.includes('criminal'))   return ['Magistrate Court', 'Sessions Court', 'High Court', 'Supreme Court']
  if (t.includes('gst'))        return ['GST Appellate Authority', 'GSTAT', 'High Court']
  if (t.includes('income tax')) return ['CIT(A)', 'ITAT', 'High Court', 'Supreme Court']
  if (t.includes('ni act'))     return ['Magistrate Court', 'Sessions Court', 'High Court']
  if (t.includes('civil'))      return ['Civil Judge Court', 'District Court', 'High Court', 'Commercial Court']
  if (t.includes('consumer'))   return ['District Consumer Commission', 'State Consumer Commission', 'NCDRC']
  if (t.includes('labour'))     return ['Labour Court', 'Industrial Tribunal', 'High Court']
  return ['District Court', 'High Court', 'Supreme Court']
}

export default function GenerateStrategyModal({ caseType = '', court = '', onClose, onGenerated }: Props) {
  const { selectedCaseId } = useCaseStore()

  const objectives = getObjectivesForCaseType(caseType)
  const courts     = getCourtsForCaseType(caseType)

  const [objective,        setObjective]        = useState(objectives[0])
  const [depth,            setDepth]            = useState('Detailed')
  const [jurisdiction,     setJurisdiction]     = useState(court || courts[0])
  const [notes,            setNotes]            = useState('')
  const [includeCaseLaw,   setIncludeCaseLaw]   = useState(true)
  const [includeRisk,      setIncludeRisk]      = useState(true)
  const [includeCross,     setIncludeCross]     = useState(true)
  const [includeDocuments, setIncludeDocuments] = useState(true)

  const [generating, setGenerating] = useState(false)
  const [progress,   setProgress]   = useState('')
  const [error,      setError]      = useState('')

  // Update defaults when case type changes
  useEffect(() => {
    setObjective(getObjectivesForCaseType(caseType)[0])
    setJurisdiction(court || getCourtsForCaseType(caseType)[0])
  }, [caseType, court])

  async function handleGenerate() {
    if (!selectedCaseId) { setError('Please select a case first from the dashboard.'); return }
    setGenerating(true); setError(''); setProgress('Generating action plan...')

    try {
      // Step 1 — Action Plan
      const actionPlanRes = await aiApi.getActionPlan(selectedCaseId)
      setProgress('Finding relevant judgments...')

      // Step 2 — Legal Research
      const researchRes = await aiApi.getLegalResearch(selectedCaseId)
      setProgress('Detecting contradictions...')

      // Step 3 — Contradictions
      const contradictionsRes = await aiApi.getContradictions(selectedCaseId)
      setProgress('Saving to database...')

      const actionItems    = parseAiJson<any[]>(actionPlanRes.actionPlan    ?? actionPlanRes.result    ?? '') ?? []
      const judgments      = parseAiJson<any[]>(researchRes.judgments       ?? researchRes.result      ?? '') ?? []
      const contradictions = parseAiJson<any[]>(contradictionsRes.contradictions ?? contradictionsRes.result ?? '') ?? []

      // Save to DB
      await Promise.all([
        ...actionItems.slice(0, 10).map((item: any) => actionPlansApi.create(selectedCaseId, {
          title:       item.title       ?? 'Action',
          description: item.description ?? item.title ?? '',
          priority:    item.priority    ?? 'Medium',
          dueBy:       item.dueBy,
          assignedTo:  item.assignedTo  ?? 'Lawyer',
        })),
        ...judgments.slice(0, 5).map((j: any) => researchApi.create(selectedCaseId, {
          citation:       j.citation       ?? '',
          court:          j.court          ?? '',
          year:           j.year           ?? new Date().getFullYear(),
          ratioDecidendi: j.ratioDecidendi ?? j.ratio ?? '',
          relevance:      j.relevance      ?? '',
          howToUse:       j.howToUse       ?? '',
          strength:       j.strength       ?? 'Medium',
        })),
        ...contradictions.slice(0, 5).map((c: any) => contradictionsApi.create(selectedCaseId, {
          claim:          c.claim          ?? '',
          claimSource:    c.claimSource    ?? '',
          evidence:       c.evidence       ?? '',
          evidenceSource: c.evidenceSource ?? '',
          courtArgument:  c.courtArgument  ?? '',
          strength:       c.strength       ?? 'Medium',
        })),
      ])

      setProgress('')
      onGenerated?.()
    } catch (err: any) {
      setError(err.message || 'Error generating strategy. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>

        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Generate AI Strategy</h2>
            <p style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
              Configure the litigation strategy for this {caseType || 'case'}.
            </p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, border: 'none', borderRadius: 8, background: '#f1f5f9', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          <Field label="Primary Objective">
            <select value={objective} onChange={e => setObjective(e.target.value)} style={inputSt}>
              {objectives.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="Analysis Depth">
            <select value={depth} onChange={e => setDepth(e.target.value)} style={inputSt}>
              <option>Quick</option>
              <option>Detailed</option>
              <option>Senior Counsel Level</option>
            </select>
          </Field>

          <Field label="Court / Jurisdiction">
            <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} style={inputSt}>
              {courts.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Expected Outcome">
            <select style={inputSt}>
              <option>Settlement</option>
              <option>Interim Relief</option>
              <option>Final Order / Decree</option>
              <option>Acquittal / Dismissal</option>
            </select>
          </Field>

          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Include in Strategy">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Check checked={includeCaseLaw}   onChange={() => setIncludeCaseLaw(!includeCaseLaw)}     label="Relevant Case Laws"  />
                <Check checked={includeRisk}      onChange={() => setIncludeRisk(!includeRisk)}           label="Risk Assessment"     />
                <Check checked={includeCross}     onChange={() => setIncludeCross(!includeCross)}         label="Cross Examination"   />
                <Check checked={includeDocuments} onChange={() => setIncludeDocuments(!includeDocuments)} label="Document Checklist"  />
              </div>
            </Field>
          </div>

          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Additional Instructions (optional)">
              <textarea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={`E.g. Focus on ${objectives[0].toLowerCase()}, anticipate defence, identify missing evidence...`}
                style={{ ...inputSt, resize: 'vertical', height: 'auto', padding: '10px 12px' }}
              />
            </Field>
          </div>

          {/* Error */}
          {error && (
            <div style={{ gridColumn: '1 / span 2', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div style={{ gridColumn: '1 / span 2', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} />{progress}
            </div>
          )}

          {/* AI Preview */}
          <div style={{ gridColumn: '1 / span 2', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 10, fontSize: 13 }}>AI will generate and save:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Case Strength & Weakness Analysis', 'Winning Probability', '30-Day Action Plan', 'Relevant Indian Judgments', 'Contradiction Analysis', 'Document Gaps Checklist'].map((item, i) => (
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
            {generating ? 'Generating Strategy...' : 'Generate Strategy'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 7, fontWeight: 600, fontSize: 13, color: '#334155' }}>{label}</div>
      {children}
    </div>
  )
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155', padding: '8px 12px', background: checked ? '#eff6ff' : '#f8fafc', border: `1px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 8, transition: 'all 0.15s' }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}

const inputSt: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }
