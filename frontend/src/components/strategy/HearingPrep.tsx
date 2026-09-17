'use client'

import React, { useState, useEffect } from 'react'
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

  // Restore cached output when case changes
  useEffect(() => {
    if (!selectedCaseId) return
    try {
      const cached = localStorage.getItem(`clausio_hearing_${selectedCaseId}`)
      if (cached) { setBrief(cached); setSection(null) }
      else setBrief('')
    } catch {}
  }, [selectedCaseId])

  async function generate() {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    setLoading(true); setError(''); setBrief('')
    try {
      let accumulated = ''
      for await (const chunk of aiApi.getPrepStream(selectedCaseId)) {
        accumulated += chunk
        setBrief(accumulated)
      }
      try { localStorage.setItem(`clausio_hearing_${selectedCaseId}`, accumulated) } catch {}
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
            <i className="ti ti-sparkles" />{loading ? 'Generating...' : brief ? 'Regenerate Brief' : 'Generate Brief'}
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
      {!loading && brief && (() => {
        // Try to parse JSON first
        let parsed: any = null
        try {
          const cleaned = brief.replace(/\[sys\][^\[]*/g, '').trim()
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
        } catch (_) {}

        if (parsed) {
          // Rich JSON card rendering
          const card = (title: string, icon: string, bg: string, bd: string, titleColor: string, children: React.ReactNode) => (
            <div style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: titleColor, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' as const }}>{icon} {title}</div>
              {children}
            </div>
          )

          return (
            <>
              {/* Case Snapshot */}
              {parsed.caseSnapshot && card('Case Snapshot', '📋', '#f8fafc', '#e2e8f0', '#475569',
                <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.7 }}>{parsed.caseSnapshot}</p>
              )}

              {/* Today's Objective */}
              {parsed.todaysObjective && parsed.todaysObjective !== 'Not available in the case record.' && card("Today's Objective", '🎯', '#eff6ff', '#bfdbfe', '#1d4ed8',
                <p style={{ margin: 0, fontSize: 13, color: '#1e3a8a', lineHeight: 1.7, fontWeight: 600 }}>{parsed.todaysObjective}</p>
              )}

              {/* Previous Hearing */}
              {parsed.previousHearingOutcome && parsed.previousHearingOutcome !== 'Not available in the case record.' && card('Previous Hearing Outcome', '⚖️', '#fdf4ff', '#e9d5ff', '#7e22ce',
                <p style={{ margin: 0, fontSize: 13, color: '#581c87', lineHeight: 1.7 }}>{parsed.previousHearingOutcome}</p>
              )}

              {/* Key Arguments */}
              {parsed.keyArguments && parsed.keyArguments.length > 0 && card('Key Arguments', '💡', '#f0fdf4', '#bbf7d0', '#15803d',
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {parsed.keyArguments.map((a: any, i: number) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #dcfce7' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#14532d', fontWeight: 600, lineHeight: 1.6 }}>{a.point || a}</p>
                      {a.legalBasis && a.legalBasis !== 'Not available in the case record.' && (
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#16a34a' }}>⚖ {a.legalBasis}</p>
                      )}
                      {a.supportingEvidence && (
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4ade80' }}>📄 {a.supportingEvidence}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Anticipated Opposition */}
              {parsed.anticipatedOpposingArguments && parsed.anticipatedOpposingArguments.length > 0 && card('Anticipated Opposition & Counters', '⚔️', '#fff7ed', '#fed7aa', '#c2410c',
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {parsed.anticipatedOpposingArguments.map((a: any, i: number) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #fed7aa' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9a3412', letterSpacing: 1, marginBottom: 4 }}>THEIR ARGUMENT</div>
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#7c2d12' }}>{a.theirArgument || a}</p>
                      {a.ourCounter && <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', letterSpacing: 1, marginBottom: 4 }}>OUR COUNTER</div>
                        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#14532d' }}>{a.ourCounter}</p>
                      </>}
                      {a.ourWeakPoint && a.ourWeakPoint !== 'Not identified in the record.' && (
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#dc2626', fontStyle: 'italic' }}>⚠ Weak point: {a.ourWeakPoint}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Documents to Carry */}
              {parsed.documentsToCarry && parsed.documentsToCarry.length > 0 && card('Documents to Carry', '📁', '#fefce8', '#fde68a', '#a16207',
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {parsed.documentsToCarry.map((d: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff', borderRadius: 8, padding: '8px 12px', border: '1px solid #fde68a' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>📄</span>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#78350f' }}>{d.document || d}</p>
                        {d.whichArgumentItSupports && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#92400e' }}>{d.whichArgumentItSupports}</p>}
                        {d.status && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: d.status === 'On record' ? '#dcfce7' : '#fef3c7', color: d.status === 'On record' ? '#15803d' : '#92400e', marginTop: 4, display: 'inline-block' }}>{d.status}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Judge's Likely Questions */}
              {parsed.judgesLikelyQuestions && parsed.judgesLikelyQuestions.length > 0 && card("Judge's Likely Questions", '👨‍⚖️', '#fdf2f8', '#fbcfe8', '#be185d',
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {parsed.judgesLikelyQuestions.map((q: any, i: number) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '8px 12px', border: '1px solid #fbcfe8' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#831843', fontStyle: 'italic' }}>"{typeof q === 'string' ? q : q.question}"</p>
                      {q.suggestedAnswer && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9d174d' }}>💬 {q.suggestedAnswer}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* What Not To Say */}
              {parsed.whatNotToSay && parsed.whatNotToSay.length > 0 && card('What NOT To Say', '🚫', '#fef2f2', '#fecaca', '#dc2626',
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {parsed.whatNotToSay.map((w: any, i: number) => (
                    <p key={i} style={{ margin: 0, fontSize: 13, color: '#991b1b', padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #fecaca' }}>🚫 {w}</p>
                  ))}
                </div>
              )}

              {/* Procedural Checklist */}
              {parsed.proceduralChecklist && parsed.proceduralChecklist.length > 0 && card('Procedural Checklist', '✅', '#f0fdf4', '#bbf7d0', '#15803d',
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {parsed.proceduralChecklist.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{item.status === 'Done' ? '✅' : item.status === 'Pending' ? '⏳' : '❓'}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, color: '#14532d', fontWeight: 600 }}>{item.item || item}</span>
                        {item.note && <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 6 }}>· {item.note}</span>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: item.status === 'Done' ? '#dcfce7' : item.status === 'Pending' ? '#fef3c7' : '#f1f5f9', color: item.status === 'Done' ? '#15803d' : item.status === 'Pending' ? '#92400e' : '#64748b' }}>{item.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Opening Statement */}
              {parsed.openingStatement && card('Suggested Opening Statement', '🗣️', '#eff6ff', '#bfdbfe', '#1d4ed8',
                <div style={{ background: '#fff', borderRadius: 8, padding: '12px 14px', border: '1px solid #bfdbfe' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#1e3a8a', lineHeight: 1.8, fontStyle: 'italic' }}>"{parsed.openingStatement}"</p>
                </div>
              )}

              {/* Risk Flags */}
              {parsed.riskFlags && parsed.riskFlags.length > 0 && card('Risk Flags', '🚩', '#fff7ed', '#fed7aa', '#c2410c',
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {parsed.riskFlags.map((r: any, i: number) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #fed7aa' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#7c2d12', fontWeight: 600 }}>{r.risk || r}</p>
                      {r.basis && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9a3412' }}>Basis: {r.basis}</p>}
                      {r.howToHandle && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#15803d' }}>✓ {r.howToHandle}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Immediate Action Items */}
              {parsed.immediateActionItems && parsed.immediateActionItems.length > 0 && card('Immediate Action Items', '⚡', '#fdf4ff', '#e9d5ff', '#7e22ce',
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {parsed.immediateActionItems.map((item: any, i: number) => (
                    <p key={i} style={{ margin: 0, fontSize: 13, color: '#581c87', padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #e9d5ff' }}>⚡ {item}</p>
                  ))}
                </div>
              )}

              {/* If Adjourned */}
              {parsed.nextStepsIfAdjourned && parsed.nextStepsIfAdjourned.length > 0 && card('If Adjourned — Next Steps', '📅', '#f8fafc', '#e2e8f0', '#475569',
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {parsed.nextStepsIfAdjourned.map((item: any, i: number) => (
                    <p key={i} style={{ margin: 0, fontSize: 13, color: '#334155', padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0' }}>{i + 1}. {item}</p>
                  ))}
                </div>
              )}

              {/* Section 65B Alert */}
              {parsed.section65BAlert && parsed.section65BAlert !== 'No electronic documents identified in the case record.' && card('Section 65B Alert', '⚠️', '#fef3c7', '#fde68a', '#92400e',
                <p style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>{parsed.section65BAlert}</p>
              )}

              {/* Print button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => window.print()} style={{ height: 36, padding: '0 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-printer" />Print Brief
                </button>
              </div>
            </>
          )
        }

        // Fallback: plain text display
        return (
          <>
            {sections.length > 1 ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <button onClick={() => setSection(null)} style={{ padding: '6px 14px', border: `1px solid ${section === null ? '#2563eb' : '#e2e8f0'}`, borderRadius: 20, background: section === null ? '#2563eb' : '#fff', color: section === null ? '#fff' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Full Brief</button>
                  {sections.map((s, i) => (
                    <button key={i} onClick={() => setSection(s.title)} style={{ padding: '6px 14px', border: `1px solid ${section === s.title ? '#2563eb' : '#e2e8f0'}`, borderRadius: 20, background: section === s.title ? '#eff6ff' : '#fff', color: section === s.title ? '#1e40af' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{s.title.substring(0, 30)}</button>
                  ))}
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                  <pre style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                    {section === null ? brief : sections.find(s => s.title === section)?.content}
                  </pre>
                </div>
              </>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
                <pre style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{brief}</pre>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => window.print()} style={{ height: 36, padding: '0 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-printer" />Print Brief
              </button>
            </div>
          </>
        )
      })()}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
