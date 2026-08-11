'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi } from '@/lib/api'

interface Props { caseType?: string }

function getHearingTypesForCaseType(ct: string): string[] {
  const t = ct.toLowerCase()
  if (t.includes('family'))     return ['Interim Maintenance', 'Final Arguments', 'Evidence', 'Execution', 'Mediation']
  if (t.includes('criminal'))   return ['Bail Hearing', 'Framing of Charges', 'Trial / Evidence', 'Final Arguments']
  if (t.includes('gst'))        return ['Personal Hearing (SCN)', 'Stay Application', 'Appeal Hearing']
  if (t.includes('income tax')) return ['Assessment Hearing', 'CIT(A) Appeal', 'ITAT Hearing', 'Stay Application']
  if (t.includes('ni act'))     return ['Complaint Hearing', 'Evidence', 'Final Arguments']
  if (t.includes('civil'))      return ['Interim Injunction', 'Evidence', 'Final Arguments', 'Execution']
  if (t.includes('consumer'))   return ['Admission', 'Evidence', 'Arguments', 'Final Order']
  if (t.includes('labour'))     return ['Conciliation', 'Evidence', 'Arguments', 'Award']
  return ['Next Hearing', 'Evidence', 'Arguments', 'Final Hearing']
}

export default function HearingPrep({ caseType = '' }: Props) {
  const { selectedCaseId } = useCaseStore()
  const [hearingType, setHearingType] = useState(getHearingTypesForCaseType(caseType)[0])
  const [hearingDate, setHearingDate] = useState('')
  const [brief,       setBrief]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [copied,      setCopied]      = useState(false)
  const [section,     setSection]     = useState<string|null>(null)

  const hearingTypes = getHearingTypesForCaseType(caseType)

  async function generate() {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    setLoading(true); setError('')
    try {
      const res  = await aiApi.getPrep(selectedCaseId)
      const text = res.brief ?? res.preparation ?? res.result ?? ''
      setBrief(text)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  function copyBrief() {
    navigator.clipboard.writeText(brief)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // Parse brief into sections if it's structured
  function parseSections(text: string): { title: string; content: string }[] {
    const lines = text.split('\n')
    const sections: { title: string; content: string }[] = []
    let current: { title: string; lines: string[] } | null = null

    for (const line of lines) {
      if (line.match(/^#{1,3}\s/) || line.match(/^\d+\.\s[A-Z]/) || line.match(/^[A-Z][A-Z\s]{4,}:/)) {
        if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() })
        current = { title: line.replace(/^#{1,3}\s/, '').replace(/:$/, ''), lines: [] }
      } else if (current) {
        current.lines.push(line)
      }
    }
    if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() })
    return sections.filter(s => s.content.trim().length > 0)
  }

  const sections = brief ? parseSections(brief) : []

  return (
    <div>
      {/* Config panel */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, marginBottom: 20, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Hearing Preparation</h2>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
              AI generates a complete day-of-hearing brief — opening, arguments, documents, cross-examination.
            </p>
          </div>
          {brief && (
            <button onClick={copyBrief} style={{ height: 36, padding: '0 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: copied ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: 13 }} />{copied ? 'Copied!' : 'Copy Brief'}
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 14, alignItems: 'flex-end' }}>
          <div>
            <label style={lbl}>Hearing Type</label>
            <select value={hearingType} onChange={e => setHearingType(e.target.value)} style={inp}>
              {hearingTypes.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Hearing Date</label>
            <input type="date" value={hearingDate} onChange={e => setHearingDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Urgency</label>
            <select style={inp}>
              <option>Normal</option>
              <option>Urgent</option>
              <option>Emergency</option>
            </select>
          </div>
          <button onClick={generate} disabled={loading}
            style={{ height: 42, padding: '0 20px', border: 'none', borderRadius: 10, background: loading ? '#93c5fd' : '#2563eb', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <i className="ti ti-sparkles" />{loading ? 'Generating...' : 'Generate Brief'}
          </button>
        </div>

        {error && <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{error}</div>}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#7c3aed' }}>
          <i className="ti ti-loader-2" style={{ fontSize: 36, display: 'block', marginBottom: 12, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>AI is preparing your hearing brief...</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Analysing case facts, judgments and documents. 20-30 seconds.</div>
        </div>
      )}

      {/* Empty */}
      {!loading && !brief && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <i className="ti ti-gavel" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>No Brief Generated Yet</div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Select hearing type above and click Generate Brief.</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>AI will create: opening submission, key arguments, documents to carry, cross-examination questions and anticipated objections.</div>
        </div>
      )}

      {/* Brief output */}
      {!loading && brief && (
        <>
          {/* Section tabs if structured */}
          {sections.length > 1 ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={() => setSection(null)}
                  style={{ padding: '6px 14px', border: `1px solid ${section === null ? '#2563eb' : '#e2e8f0'}`, borderRadius: 20, background: section === null ? '#2563eb' : '#fff', color: section === null ? '#fff' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                  Full Brief
                </button>
                {sections.map((s, i) => (
                  <button key={i} onClick={() => setSection(s.title)}
                    style={{ padding: '6px 14px', border: `1px solid ${section === s.title ? '#2563eb' : '#e2e8f0'}`, borderRadius: 20, background: section === s.title ? '#eff6ff' : '#fff', color: section === s.title ? '#1e40af' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                    {s.title.substring(0, 30)}
                  </button>
                ))}
              </div>

              {section === null ? (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                  <pre style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{brief}</pre>
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 16 }}>{section}</div>
                  <pre style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                    {sections.find(s => s.title === section)?.content}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>
                  Hearing Brief — {hearingType}
                  {hearingDate && <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400, marginLeft: 8 }}>· {new Date(hearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                </div>
              </div>
              <pre style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{brief}</pre>
            </div>
          )}

          {/* Print button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => window.print()} style={{ height: 36, padding: '0 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-printer" />Print Brief
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
