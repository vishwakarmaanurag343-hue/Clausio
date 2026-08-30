'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, parseAiJson } from '@/lib/api'
import AIResponseFormatter from '@/components/common/AIResponseFormatter'

const WITNESS_TYPES = ['Respondent', 'Petitioner', 'Independent Witness', 'Expert Witness', 'Character Witness']

const OBJECTIVE_MAP: Record<string, string[]> = {
  'Respondent':          ['Challenge income declaration', 'Expose lifestyle contradiction', 'Attack credibility', 'Contradict affidavit', 'Establish cruelty'],
  'Petitioner':          ['Establish financial need', 'Confirm timeline of events', 'Corroborate assault', 'Establish cohabitation'],
  'Independent Witness': ['Test reliability', 'Challenge memory', 'Expose bias', 'Contradict statement'],
  'Expert Witness':      ['Challenge methodology', 'Expose lack of qualification', 'Attack basis of opinion'],
  'Character Witness':   ['Expose limited knowledge', 'Challenge basis of opinion', 'Establish contrary character evidence'],
}

export default function CrossExamination() {
  const { selectedCaseId } = useCaseStore()
  const [witnessName,    setWitnessName]    = useState('')
  const [witnessType,    setWitnessType]    = useState('Respondent')
  const [witnessRole,    setWitnessRole]    = useState('')
  const [statement,      setStatement]      = useState('')
  const [objectives,     setObjectives]     = useState<string[]>([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [result,         setResult]         = useState<any>(null)
  const [rawText,        setRawText]        = useState('')
  const [copiedIdx,      setCopiedIdx]      = useState<number | null>(null)
  const [copiedAll,      setCopiedAll]      = useState(false)

  function toggleObj(obj: string) {
    setObjectives(prev => prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj])
  }

  async function generate() {
    if (!selectedCaseId) { setError('Please select a case from the dashboard first.'); return }
    if (!witnessName.trim()) { setError('Please enter the witness name.'); return }
    setLoading(true); setError(''); setResult(null); setRawText('')
    try {
      const res = await aiApi.getWitness(selectedCaseId, {
        witnessName,
        witnessType,
        witnessRole,
        statement,
        objectives,
      })
      const raw    = res.intelligence ?? res.result ?? ''
      const parsed = parseAiJson<any>(raw)
      if (parsed) setResult(parsed)
      else        setRawText(raw)
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions.')
    } finally { setLoading(false) }
  }

  function getAllQuestions(): string[] {
    if (!result) return []
    const qs: string[] = []
    if (Array.isArray(result.crossExaminationQuestions)) {
      result.crossExaminationQuestions.forEach((q: string) => qs.push(q))
    }
    if (Array.isArray(result.witnesses)) {
      result.witnesses.forEach((w: any) => {
        if (Array.isArray(w.crossExamRisks)) w.crossExamRisks.forEach((r: string) => qs.push(r))
      })
    }
    return qs
  }

  function copyQ(idx: number, text: string) {
    navigator.clipboard.writeText(text); setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  function copyAll() {
    const allQs = getAllQuestions().map((q, i) => `${i + 1}. ${q}`).join('\n')
    navigator.clipboard.writeText(`Cross Examination — ${witnessName} (${witnessType})\n\n${allQs}`)
    setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000)
  }

  const questions = getAllQuestions()
  const availableObjectives = OBJECTIVE_MAP[witnessType] ?? OBJECTIVE_MAP['Respondent']

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Cross Examination</h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
            AI generates targeted cross-examination questions based on case facts and witness profile.
          </p>
        </div>
        {questions.length > 0 && (
          <button onClick={copyAll} style={{ height: 36, padding: '0 14px', background: copiedAll ? '#f0fdf4' : '#f8fafc', border: `1px solid ${copiedAll ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: copiedAll ? '#15803d' : '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className={`ti ${copiedAll ? 'ti-check' : 'ti-copy'}`} /> {copiedAll ? 'Copied!' : `Copy All (${questions.length})`}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result || rawText ? '400px 1fr' : '1fr', gap: 20 }}>

        {/* LEFT — Witness form */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Witness Profile</div>

          <Field label="Witness Name *">
            <input value={witnessName} onChange={e => setWitnessName(e.target.value)}
              placeholder="e.g. Rohit Sharma / Dr. Mehta" style={inputSt} />
          </Field>

          <Field label="Witness Type *">
            <select value={witnessType} onChange={e => { setWitnessType(e.target.value); setObjectives([]) }} style={inputSt}>
              {WITNESS_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Role in Case">
            <input value={witnessRole} onChange={e => setWitnessRole(e.target.value)}
              placeholder="e.g. BMW owner, Income affidavit signatory" style={inputSt} />
          </Field>

          {/* Objectives */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>Cross Exam Objectives</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {availableObjectives.map(obj => {
                const selected = objectives.includes(obj)
                return (
                  <button key={obj} onClick={() => toggleObj(obj)}
                    style={{ padding: '5px 10px', borderRadius: 20, border: `1px solid ${selected ? '#2563eb' : '#e2e8f0'}`, background: selected ? '#eff6ff' : '#f8fafc', color: selected ? '#1d4ed8' : '#475569', fontSize: 11, fontWeight: selected ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {selected ? '✓ ' : ''}{obj}
                  </button>
                )
              })}
            </div>
          </div>

          <Field label="Known Statement / Affidavit Content (optional)">
            <textarea value={statement} onChange={e => setStatement(e.target.value)} rows={4}
              placeholder="Paste any known statement or affidavit content of this witness. AI will generate questions to contradict it."
              style={{ ...inputSt, height: 'auto', resize: 'vertical', padding: '10px 12px' }} />
          </Field>

          {error && <div style={{ marginBottom: 14, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{error}</div>}

          <button onClick={generate} disabled={loading || !witnessName.trim()}
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading || !witnessName.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !witnessName.trim() ? 0.6 : 1 }}>
            <i className={`ti ${loading ? 'ti-loader animate-spin' : 'ti-sparkles'}`} />
            {loading ? 'Generating Questions...' : 'Generate Cross Exam Questions'}
          </button>

          {/* What AI generates */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>What Clausio generates</div>
            {['Credibility attack questions', 'Income/asset contradiction questions', 'Timeline inconsistency questions', 'Statement contradiction questions', 'Witness bias exposure questions'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#334155', marginBottom: 4 }}>
                <span style={{ color: '#2563eb' }}>✓</span>{item}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Results */}
        {(result || rawText) && (
          <div>
            {/* Structured questions from JSON */}
            {result && questions.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    Cross Examination — {witnessName} ({witnessType})
                  </div>
                  <span style={{ padding: '3px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {questions.length} questions
                  </span>
                </div>
                <div style={{ padding: 16 }}>
                  {questions.map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: i % 2 === 0 ? '#f8fafc' : '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>Q{i+1}</div>
                      <div style={{ flex: 1, fontSize: 13, color: '#0f172a', lineHeight: 1.6 }}>{q}</div>
                      <button onClick={() => copyQ(i, q)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedIdx === i ? '#16a34a' : '#94a3b8', fontSize: 13, flexShrink: 0, padding: '2px 4px' }}>
                        <i className={`ti ${copiedIdx === i ? 'ti-check' : 'ti-copy'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full structured result via flash cards */}
            {result && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
                <AIResponseFormatter content={result} />
              </div>
            )}

            {/* Raw text fallback */}
            {rawText && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
                <AIResponseFormatter content={rawText} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={labelSt}>{label}</label>{children}</div>
}

const labelSt: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inputSt: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', fontFamily: 'inherit' }
