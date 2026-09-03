'use client'

export interface WitnessBrief {
  witnessName?:                       string
  side?:                              string
  witnessProfile?: {
    role?:                            string
    relationshipToParties?:           string
    whatTheyAreExpectedToEstablish?:  string
    basisOfKnowledge?:                string
  }
  admissionsAlreadyMade?:             string[]
  omissions?:                         string[]
  biasAndCredibility?:                string[]
  weakPointsVsCaseRecord?:            string[]
  strongPointsInTestimony?:           string[]
  documentsToProduceThroughWitness?:  { document: string; purpose?: string; exhibitNumber?: string }[]
  documentsToConfront?:               { document: string; contradiction?: string; questionToAsk?: string }[]
  likelyQuestionsFromCourt?:          string[]
  likelyQuestionsFromOpposingCounsel?: string[]
  preparationTips?:                   string[]
  crossExaminationQuestions?:         string[]
  doNotAsk?:                          string[]
  overallAssessment?:                 string
}

/** Robustly extract the witness brief from an LLM response. null on ANY failure — never render raw text. */
export function parseWitnessBrief(raw: unknown): WitnessBrief | null {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as WitnessBrief
  if (typeof raw !== 'string' || !raw.trim()) return null
  let t = raw.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  const first = t.indexOf('{')
  const last  = t.lastIndexOf('}')
  if (first === -1 || last <= first) return null
  try {
    const obj = JSON.parse(t.slice(first, last + 1))
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj) ? (obj as WitnessBrief) : null
  } catch { return null }
}

function Block({ icon, title, accent, children }: { icon: string; title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color: accent }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function ListBlock({ icon, title, accent, items, ordered, color }: { icon: string; title: string; accent: string; items: string[]; ordered?: boolean; color?: string }) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <Block icon={icon} title={title} accent={accent}>
      <List style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: color ?? '#334155' }}>
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </List>
    </Block>
  )
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}

export default function WitnessCard({ brief }: { brief: WitnessBrief }) {
  const ours = (brief.side ?? '').toLowerCase() === 'ours'
  const p = brief.witnessProfile
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Witness profile */}
      {p && (p.role || p.relationshipToParties || p.whatTheyAreExpectedToEstablish || p.basisOfKnowledge) && (
        <Block icon="ti-user" title="Witness Profile" accent="#1d4ed8">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ProfileRow label="Role" value={p.role} />
            <ProfileRow label="Relationship to Parties" value={p.relationshipToParties} />
            <ProfileRow label="Expected to Establish" value={p.whatTheyAreExpectedToEstablish} />
            <ProfileRow label="Basis of Knowledge" value={p.basisOfKnowledge} />
          </div>
        </Block>
      )}

      {/* Admissions already made */}
      {!!brief.admissionsAlreadyMade?.length && (
        <ListBlock icon="ti-quote" title="Admissions Already Made" accent="#b45309" items={brief.admissionsAlreadyMade} color="#92400e" />
      )}

      {/* Omissions */}
      {!!brief.omissions?.length && (
        <ListBlock icon="ti-eye-off" title="Omissions" accent="#7c3aed" items={brief.omissions} color="#4c1d95" />
      )}

      {/* Bias and credibility */}
      {!!brief.biasAndCredibility?.length && (
        <ListBlock icon="ti-scale-outline" title="Bias & Credibility" accent="#dc2626" items={brief.biasAndCredibility} color="#991b1b" />
      )}

      {/* Weak points vs case record */}
      {!!brief.weakPointsVsCaseRecord?.length && (
        <ListBlock icon="ti-alert-triangle" title="Weak Points vs Case Record" accent="#dc2626" items={brief.weakPointsVsCaseRecord} color="#991b1b" />
      )}

      {/* Strong points in testimony */}
      {!!brief.strongPointsInTestimony?.length && (
        <ListBlock icon="ti-shield-check" title="Strong Points in Testimony" accent="#15803d" items={brief.strongPointsInTestimony} color="#14532d" />
      )}

      {/* Documents to produce through witness */}
      {!!brief.documentsToProduceThroughWitness?.length && (
        <Block icon="ti-file-upload" title="Documents to Produce Through Witness" accent="#1d4ed8">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.documentsToProduceThroughWitness.map((d, i) => (
              <div key={i} style={{ borderLeft: '3px solid #3b82f6', paddingLeft: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>
                  📄 {d.document}
                  {d.exhibitNumber && <span style={{ fontWeight: 400, color: '#64748b' }}> (Exhibit: {d.exhibitNumber})</span>}
                </div>
                {d.purpose && (
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Purpose: </span>{d.purpose}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* Documents to confront */}
      {!!brief.documentsToConfront?.length && (
        <Block icon="ti-file-search" title="Documents to Confront" accent="#b45309">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brief.documentsToConfront.map((d, i) => (
              <div key={i} style={{ borderLeft: '3px solid #f59e0b', paddingLeft: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>📄 {d.document}</div>
                {d.contradiction && (
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Contradiction: </span>{d.contradiction}
                  </div>
                )}
                {d.questionToAsk && (
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Question: </span>{d.questionToAsk}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* Likely questions from court */}
      {!!brief.likelyQuestionsFromCourt?.length && (
        <ListBlock icon="ti-gavel" title="Likely Questions from Court" accent="#1d4ed8" items={brief.likelyQuestionsFromCourt} ordered color="#334155" />
      )}

      {/* Ours → likely questions from opposing counsel (prep the witness) */}
      {ours && !!brief.likelyQuestionsFromOpposingCounsel?.length && (
        <ListBlock icon="ti-messages" title="Likely Questions from Opposing Counsel" accent="#b45309" items={brief.likelyQuestionsFromOpposingCounsel} ordered color="#92400e" />
      )}

      {/* Ours → preparation tips */}
      {ours && !!brief.preparationTips?.length && (
        <ListBlock icon="ti-shield-check" title="Preparation Tips" accent="#15803d" items={brief.preparationTips} color="#14532d" />
      )}

      {/* Opposing → cross-examination plan */}
      {!ours && !!brief.crossExaminationQuestions?.length && (
        <ListBlock icon="ti-swords" title="Cross-Examination Plan" accent="#b45309" items={brief.crossExaminationQuestions} ordered color="#92400e" />
      )}

      {/* Opposing → do not ask */}
      {!ours && !!brief.doNotAsk?.length && (
        <ListBlock icon="ti-ban" title="Do Not Ask" accent="#dc2626" items={brief.doNotAsk} color="#991b1b" />
      )}

      {/* Overall assessment */}
      {brief.overallAssessment && (
        <Block icon="ti-clipboard-text" title="Overall Assessment" accent="#0f172a">
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#334155' }}>{brief.overallAssessment}</p>
        </Block>
      )}
    </div>
  )
}
