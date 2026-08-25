'use client'

export interface WitnessBrief {
  witnessName?:               string
  side?:                      string
  likelyQuestionsFromCourt?:  string[]
  weakPointsVsCaseRecord?:    string[]
  preparationTips?:           string[]
  crossExaminationQuestions?: string[]
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

export default function WitnessCard({ brief }: { brief: WitnessBrief }) {
  const ours = (brief.side ?? '').toLowerCase() === 'ours'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Likely questions from court */}
      {!!brief.likelyQuestionsFromCourt?.length && (
        <Block icon="ti-gavel" title="Likely Questions from Court" accent="#1d4ed8">
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: '#334155' }}>
            {brief.likelyQuestionsFromCourt.map((q, i) => <li key={i}>{q}</li>)}
          </ol>
        </Block>
      )}

      {/* Weak points vs case record */}
      {!!brief.weakPointsVsCaseRecord?.length && (
        <Block icon="ti-alert-triangle" title="Weak Points vs Case Record" accent="#dc2626">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: '#991b1b' }}>
            {brief.weakPointsVsCaseRecord.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </Block>
      )}

      {/* Ours → preparation tips */}
      {ours && !!brief.preparationTips?.length && (
        <Block icon="ti-shield-check" title="Preparation Tips" accent="#15803d">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: '#14532d' }}>
            {brief.preparationTips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </Block>
      )}

      {/* Opposing → cross-examination plan */}
      {!ours && !!brief.crossExaminationQuestions?.length && (
        <Block icon="ti-swords" title="Cross-Examination Plan" accent="#b45309">
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: '#92400e' }}>
            {brief.crossExaminationQuestions.map((q, i) => <li key={i}>{q}</li>)}
          </ol>
        </Block>
      )}
    </div>
  )
}
