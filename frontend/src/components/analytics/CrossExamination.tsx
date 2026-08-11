'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, parseAiJson } from '@/lib/api'

const WITNESS_TYPES = ['Petitioner', 'Respondent', 'Independent Witness', 'Expert Witness', 'Character Witness']

export default function CrossExamination() {
  const { selectedCaseId } = useCaseStore()

  const [witnessName,    setWitnessName]    = useState('')
  const [witnessType,    setWitnessType]    = useState('Respondent')
  const [witnessRole,    setWitnessRole]    = useState('')
  const [statement,      setStatement]      = useState('')
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [result,         setResult]         = useState<any>(null)
  const [rawText,        setRawText]        = useState('')
  const [copiedIdx,      setCopiedIdx]      = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')

  async function generate() {
    if (!selectedCaseId) { setError('Please select a case from the dashboard first.'); return }
    if (!witnessName.trim()) { setError('Please enter the witness name.'); return }
    setLoading(true)
    setError('')
    setResult(null)
    setRawText('')
    try {
      const res = await aiApi.getWitness(selectedCaseId)
      const raw = res.intelligence ?? res.result ?? ''
      const parsed = parseAiJson<any>(raw)
      if (parsed) {
        setResult(parsed)
      } else {
        setRawText(raw)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function copyQ(idx: number, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  function copyAll() {
    const allQs = getAllQuestions().map((q, i) => `${i + 1}. ${q}`).join('\n')
    navigator.clipboard.writeText(`Cross Examination Questions — ${witnessName}\n\n${allQs}`)
  }

  function getAllQuestions(): string[] {
    if (!result) return []
    const qs: string[] = []
    if (result.crossExaminationQuestions) {
      result.crossExaminationQuestions.forEach((q: string) => qs.push(q))
    }
    if (result.witnesses) {
      result.witnesses.forEach((w: any) => {
        if (w.crossExamRisks) w.crossExamRisks.forEach((r: string) => qs.push(r))
      })
    }
    return qs
  }

  const questions = getAllQuestions()
  const categories = ['all', 'credibility', 'contradiction', 'financial', 'timeline']

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Cross Examination</h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>AI generates court-ready cross-examination questions based on case facts and witness profile.</p>
        </div>
        {result && (
          <button onClick={copyAll} style={{ height: 36, padding: '0 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#15803d', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-copy" /> Copy All Questions
          </button>
        )}
      </div>

      {/* Witness form */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Witness Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelSt}>Witness Name *</label>
            <input value={witnessName} onChange={e => setWitnessName(e.target.value)} placeholder="Dr. Mehta / Respondent's Father" style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Witness Type *</label>
            <select value={witnessType} onChange={e => setWitnessType(e.target.value)} style={inputSt}>
              {WITNESS_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>Role in Case</label>
            <input value={witnessRole} onChange={e => setWitnessRole(e.target.value)} placeholder="Treating doctor / Respondent's employer" style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Key Statement (optional)</label>
            <input value={statement} onChange={e => setStatement(e.target.value)} placeholder="What this witness claims..." style={inputSt} />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <button onClick={generate} disabled={loading}
          style={{ marginTop: 16, height: 44, padding: '0 24px', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-sparkles" />
          {loading ? 'Generating Questions...' : 'Generate Cross-Examination Questions'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#7c3aed' }}>
          <i className="ti ti-loader-2" style={{ fontSize: 32, display: 'block', marginBottom: 10, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 14, fontWeight: 500 }}>AI is analysing case facts and generating questions...</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>This may take 15-20 seconds</div>
        </div>
      )}

      {/* Raw text fallback */}
      {rawText && !loading && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Cross-Examination Questions</div>
          <pre style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{rawText}</pre>
        </div>
      )}

      {/* Structured result */}
      {result && !loading && (
        <div>
          {/* Witness cards */}
          {result.witnesses?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Witness Analysis</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {result.witnesses.map((w: any, i: number) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{w.name ?? witnessName}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{w.role}</div>
                      </div>
                      {w.credibilityScore && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: w.credibilityScore >= 70 ? '#15803d' : '#d97706' }}>{w.credibilityScore}%</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>Credibility</div>
                        </div>
                      )}
                    </div>
                    {w.keyTestimony && <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>{w.keyTestimony}</p>}
                    {w.preparation && (
                      <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#15803d', fontWeight: 500 }}>
                        💡 {w.preparation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions list */}
          {questions.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Cross-Examination Questions
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b', fontWeight: 400 }}>({questions.length} questions)</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {questions.map((q: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', width: 24, flexShrink: 0, paddingTop: 1 }}>Q{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{q}</span>
                    <button onClick={() => copyQ(i, q)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, flexShrink: 0 }}>
                      <i className={`ti ${copiedIdx === i ? 'ti-check' : 'ti-copy'}`} style={{ color: copiedIdx === i ? '#22c55e' : '#94a3b8', fontSize: 14 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const labelSt: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inputSt: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', background: '#f8fafc', color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box' }
