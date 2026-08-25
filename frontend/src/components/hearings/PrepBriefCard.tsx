'use client'

export interface PrepBrief {
  caseSnapshot?:                 string
  todaysObjective?:              string
  keyArguments?:                 { point: string; legalBasis?: string }[]
  anticipatedOpposingArguments?: { theirArgument: string; ourCounter?: string }[]
  documentsToCarry?:             string[]
  proceduralChecklist?:          { item: string; status?: string }[]
  openingStatement?:             string
  riskFlags?:                    string[]
  nextStepsIfAdjourned?:         string[]
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
  if (/done|complete|filed|ready|submitted/.test(s))               return { bg: '#f0fdf4', fg: '#15803d', bd: '#86efac' }
  if (/pend|progress|todo|upcoming|await|due/.test(s))             return { bg: '#fefce8', fg: '#a16207', bd: '#fde047' }
  if (/not found|missing|unknown|absent|n\/a|unavailable/.test(s)) return { bg: '#f1f5f9', fg: '#64748b', bd: '#e2e8f0' }
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

export default function PrepBriefCard({ brief }: { brief: PrepBrief }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Case snapshot */}
      {brief.caseSnapshot && (
        <Section icon="ti-folder" title="Case Snapshot" accent="#1d4ed8">
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#334155' }}>{brief.caseSnapshot}</p>
        </Section>
      )}

      {/* Today's objective */}
      {brief.todaysObjective && (
        <Section icon="ti-target" title="Today's Objective" accent="#7c3aed">
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#334155', fontWeight: 500 }}>{brief.todaysObjective}</p>
        </Section>
      )}

      {/* Key arguments — point + legal basis tag */}
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
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Anticipated opposing arguments — red vs green rows */}
      {!!brief.anticipatedOpposingArguments?.length && (
        <Section icon="ti-swords" title="Anticipated Opposition & Counters" accent="#dc2626">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.anticipatedOpposingArguments.map((o, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', letterSpacing: 1, marginBottom: 3 }}>THEY WILL SAY</div>
                  <div style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.5 }}>{o.theirArgument}</div>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#15803d', letterSpacing: 1, marginBottom: 3 }}>OUR COUNTER</div>
                  <div style={{ fontSize: 11, color: '#14532d', lineHeight: 1.5 }}>{o.ourCounter || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Documents to carry — chips */}
      {!!brief.documentsToCarry?.length && (
        <Section icon="ti-briefcase" title="Documents to Carry" accent="#b45309">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {brief.documentsToCarry.map((d, i) => (
              <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontWeight: 600 }}>
                📄 {d}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Procedural checklist — status pills */}
      {!!brief.proceduralChecklist?.length && (
        <Section icon="ti-list-check" title="Procedural Checklist" accent="#1d4ed8">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {brief.proceduralChecklist.map((c, i) => {
              const p = statusPill(c.status)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>{c.item}</span>
                  <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: p.bg, border: `1px solid ${p.bd}`, color: p.fg }}>
                    {c.status || 'Pending'}
                  </span>
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

      {/* Risk flags */}
      {!!brief.riskFlags?.length && (
        <Section icon="ti-alert-triangle" title="Risk Flags" accent="#dc2626">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: '#991b1b' }}>
            {brief.riskFlags.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Section>
      )}

      {/* Next steps if adjourned */}
      {!!brief.nextStepsIfAdjourned?.length && (
        <Section icon="ti-calendar-time" title="If Adjourned — Next Steps" accent="#6d28d9">
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: '#4c1d95' }}>
            {brief.nextStepsIfAdjourned.map((n, i) => <li key={i}>{n}</li>)}
          </ol>
        </Section>
      )}
    </div>
  )
}
