'use client'

export interface PrepBrief {
  caseSnapshot?:                    string
  currentProceduralStage?:          string
  previousHearingOutcome?:          string
  todaysObjective?:                 string
  pendingApplications?:             string[]
  keyChronology?:                   string[]
  keyArguments?:                    { point: string; legalBasis?: string; supportingEvidence?: string }[]
  anticipatedOpposingArguments?:    { theirArgument: string; ourCounter?: string; ourWeakPoint?: string }[]
  contradictionsAndVulnerabilities?: string[]
  missingDocuments?:                { document: string; whyItMatters?: string; howToObtain?: string }[]
  documentsToCarry?:               { document: string; whichArgumentItSupports?: string; status?: string }[]
  judgesLikelyQuestions?:           string[]
  section65BAlert?:                 string
  proceduralChecklist?:             { item: string; status?: string; note?: string }[]
  openingStatement?:                string
  riskFlags?:                       { risk: string; basis?: string; howToHandle?: string }[]
  immediateActionItems?:            string[]
  nextStepsIfAdjourned?:            string[]
  overallAssessment?:               string
}

/** Robustly extract the brief object from an LLM response. Returns null on ANY failure — callers must never render raw text. */
export function parsePrepBrief(raw: unknown): PrepBrief | null {
  // Already-parsed object (e.g. if middleware ever pre-parses JSON responses)
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as PrepBrief
  if (typeof raw !== 'string' || !raw.trim()) return null
  let t = raw.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  const first = t.indexOf('{')
  const last  = t.lastIndexOf('}')
  if (first === -1 || last <= first) return null
  try {
    const obj = JSON.parse(t.slice(first, last + 1))
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj) ? (obj as PrepBrief) : null
  } catch { return null }
}

const SECTION_TITLE: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }

function statusPill(status?: string) {
  const s = (status ?? '').toLowerCase()
  if (/done|complete|filed|ready|submitted|on record/.test(s))     return { bg: '#f0fdf4', fg: '#15803d', bd: '#86efac' }
  if (/pend|progress|todo|upcoming|await|due|to be filed/.test(s)) return { bg: '#fefce8', fg: '#a16207', bd: '#fde047' }
  if (/not found|missing|unknown|absent|n\/a|unavailable|not available/.test(s)) return { bg: '#f1f5f9', fg: '#64748b', bd: '#e2e8f0' }
  return                                                           { bg: '#eff6ff', fg: '#1d4ed8', bd: '#bfdbfe' }
}

function Section({ icon, title, accent, children }: { icon: string; title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color: accent }} />
        <span style={{ ...SECTION_TITLE, color: accent, marginBottom: 0 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function TextSection({ icon, title, accent, text, italic }: { icon: string; title: string; accent: string; text: string; italic?: boolean }) {
  return (
    <Section icon={icon} title={title} accent={accent}>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#334155', fontStyle: italic ? 'italic' : 'normal' }}>{text}</p>
    </Section>
  )
}

function BulletSection({ icon, title, accent, items, ordered, color }: { icon: string; title: string; accent: string; items: string[]; ordered?: boolean; color?: string }) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <Section icon={icon} title={title} accent={accent}>
      <List style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: color ?? '#334155' }}>
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </List>
    </Section>
  )
}

export default function PrepBriefCard({ brief }: { brief: PrepBrief }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Case snapshot */}
      {brief.caseSnapshot && (
        <TextSection icon="ti-folder" title="Case Snapshot" accent="#1d4ed8" text={brief.caseSnapshot} />
      )}

      {/* Current procedural stage */}
      {brief.currentProceduralStage && (
        <TextSection icon="ti-stairs" title="Current Procedural Stage" accent="#0891b2" text={brief.currentProceduralStage} />
      )}

      {/* Previous hearing outcome */}
      {brief.previousHearingOutcome && (
        <TextSection icon="ti-history" title="Previous Hearing Outcome" accent="#64748b" text={brief.previousHearingOutcome} />
      )}

      {/* Today's objective */}
      {brief.todaysObjective && (
        <Section icon="ti-target" title="Today's Objective" accent="#7c3aed">
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#334155', fontWeight: 500 }}>{brief.todaysObjective}</p>
        </Section>
      )}

      {/* Pending applications */}
      {!!brief.pendingApplications?.length && (
        <BulletSection icon="ti-file-stack" title="Pending Applications" accent="#b45309" items={brief.pendingApplications} color="#92400e" />
      )}

      {/* Key chronology */}
      {!!brief.keyChronology?.length && (
        <BulletSection icon="ti-timeline" title="Key Chronology" accent="#0f766e" items={brief.keyChronology} ordered color="#334155" />
      )}

      {/* Key arguments — point + legal basis + supporting evidence */}
      {!!brief.keyArguments?.length && (
        <Section icon="ti-scale" title="Key Arguments" accent="#15803d">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.keyArguments.map((a, i) => (
              <div key={i} style={{ borderLeft: '3px solid #22c55e', paddingLeft: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>{a.point}</div>
                {a.legalBasis && (
                  <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 600 }}>
                    ⚖ {a.legalBasis}
                  </span>
                )}
                {a.supportingEvidence && (
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Supporting evidence: </span>{a.supportingEvidence}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Anticipated opposing arguments — red vs green rows + weak point */}
      {!!brief.anticipatedOpposingArguments?.length && (
        <Section icon="ti-swords" title="Anticipated Opposition & Counters" accent="#dc2626">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {brief.anticipatedOpposingArguments.map((o, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', letterSpacing: 1, marginBottom: 3 }}>THEIR ARGUMENT</div>
                    <div style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.5 }}>{o.theirArgument}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#15803d', letterSpacing: 1, marginBottom: 3 }}>OUR COUNTER</div>
                    <div style={{ fontSize: 11, color: '#14532d', lineHeight: 1.5 }}>{o.ourCounter || '—'}</div>
                  </div>
                </div>
                {o.ourWeakPoint && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#b45309', letterSpacing: 1 }}>OUR WEAK POINT: </span>
                    <span style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>{o.ourWeakPoint}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Contradictions and vulnerabilities */}
      {!!brief.contradictionsAndVulnerabilities?.length && (
        <BulletSection icon="ti-alert-octagon" title="Contradictions & Vulnerabilities" accent="#dc2626" items={brief.contradictionsAndVulnerabilities} color="#991b1b" />
      )}

      {/* Missing documents — document + why it matters + how to obtain */}
      {!!brief.missingDocuments?.length && (
        <Section icon="ti-file-alert" title="Missing Documents" accent="#b45309">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.missingDocuments.map((d, i) => (
              <div key={i} style={{ borderLeft: '3px solid #f59e0b', paddingLeft: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>{d.document}</div>
                {d.whyItMatters && (
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Why it matters: </span>{d.whyItMatters}
                  </div>
                )}
                {d.howToObtain && (
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>How to obtain: </span>{d.howToObtain}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Documents to carry — document, which argument it supports, status */}
      {!!brief.documentsToCarry?.length && (
        <Section icon="ti-briefcase" title="Documents to Carry" accent="#b45309">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {brief.documentsToCarry.map((d, i) => {
              const p = statusPill(d.status)
              return (
                <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600, lineHeight: 1.5 }}>
                      📄 {d.document}
                      {d.whichArgumentItSupports && <span style={{ fontWeight: 400 }}> — {d.whichArgumentItSupports}</span>}
                    </div>
                    {d.status && (
                      <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: p.bg, border: `1px solid ${p.bd}`, color: p.fg, whiteSpace: 'nowrap' }}>
                        {d.status}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Judge's likely questions */}
      {!!brief.judgesLikelyQuestions?.length && (
        <BulletSection icon="ti-help-circle" title="Judge's Likely Questions" accent="#1d4ed8" items={brief.judgesLikelyQuestions} ordered color="#334155" />
      )}

      {/* Section 65B alert */}
      {brief.section65BAlert && (
        <Section icon="ti-device-laptop" title="Section 65B Alert" accent="#dc2626">
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#991b1b', whiteSpace: 'pre-wrap' }}>{brief.section65BAlert}</p>
        </Section>
      )}

      {/* Procedural checklist — item, status pill, optional note */}
      {!!brief.proceduralChecklist?.length && (
        <Section icon="ti-list-check" title="Procedural Checklist" accent="#1d4ed8">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {brief.proceduralChecklist.map((c, i) => {
              const p = statusPill(c.status)
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>{c.item}</span>
                    <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: p.bg, border: `1px solid ${p.bd}`, color: p.fg }}>
                      {c.status || 'Pending'}
                    </span>
                  </div>
                  {c.note && <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{c.note}</span>}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Opening statement */}
      {brief.openingStatement && (
        <div style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.06), rgba(59,130,246,0.04))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-message-2" /> Suggested Opening Statement
          </div>
          <p style={{ margin: 0, fontSize: 12, fontStyle: 'italic', lineHeight: 1.7, color: '#1e3a8a' }}>"{brief.openingStatement}"</p>
        </div>
      )}

      {/* Risk flags — risk, basis, how to handle */}
      {!!brief.riskFlags?.length && (
        <Section icon="ti-alert-triangle" title="Risk Flags" accent="#dc2626">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.riskFlags.map((r, i) => (
              <div key={i} style={{ borderLeft: '3px solid #ef4444', paddingLeft: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#991b1b', lineHeight: 1.5 }}>{r.risk}</div>
                {r.basis && (
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Basis: </span>{r.basis}
                  </div>
                )}
                {r.howToHandle && (
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>How to handle: </span>{r.howToHandle}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Immediate action items */}
      {!!brief.immediateActionItems?.length && (
        <BulletSection icon="ti-checkbox" title="Immediate Action Items" accent="#b45309" items={brief.immediateActionItems} ordered color="#92400e" />
      )}

      {/* Next steps if adjourned */}
      {!!brief.nextStepsIfAdjourned?.length && (
        <Section icon="ti-calendar-time" title="If Adjourned — Next Steps" accent="#6d28d9">
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: '#4c1d95' }}>
            {brief.nextStepsIfAdjourned.map((n, i) => <li key={i}>{n}</li>)}
          </ol>
        </Section>
      )}

      {/* Overall assessment */}
      {brief.overallAssessment && (
        <TextSection icon="ti-clipboard-text" title="Overall Assessment" accent="#0f172a" text={brief.overallAssessment} />
      )}
    </div>
  )
}
