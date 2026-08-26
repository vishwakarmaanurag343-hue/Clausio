'use client'

/* Document-grounded financial-profile flashcards for the Financial page AI Analysis tab.
   Renders the strict { financialProfile, flaggedDiscrepancies[], summary } JSON from the
   FinancialProfile template in the PrepBriefCard idiom. */

interface IncomeSource  { source?: string; monthlyAmount?: number | null; document?: string | null }
interface Liability     { type?: string; monthlyEmi?: number | null; outstanding?: number | null }
interface Asset         { type?: string; value?: number | null }
interface KeyTransaction{ date?: string; description?: string; amount?: number | null; relevance?: string }
interface FinancialProfile {
  monthlyIncome?:    number | null
  annualIncome?:     number | null
  incomeSources?:    IncomeSource[]
  monthlyExpenses?:  { rent?: number | null; education?: number | null; medical?: number | null; other?: number | null }
  liabilities?:      Liability[]
  assets?:           Asset[]
  keyTransactions?:  KeyTransaction[]
  suitValuation?:    number | null
  claimAmount?:      number | null
}
export interface FinancialAnalysis {
  financialProfile?:     FinancialProfile
  flaggedDiscrepancies?: string[]
  summary?:              string
}

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const numOrNull = (v: any): number | null => (typeof v === 'number' && isFinite(v) && v > 0 ? Math.round(v) : null)

/* PrepBriefCard idiom: white card, #e2e8f0 border, radius 10, ti-icon + uppercase accent title */
function Section({ icon, title, accent, children }: { icon: string; title: string; accent: string; children: React.ReactNode }) {
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

export default function FinancialProfileCards({ analysis, rawText, loading, caseType, suggestedTab, onOpenTab, onAnalyse, canAnalyse }: {
  analysis:     FinancialAnalysis | null
  rawText:      string
  loading:      boolean
  caseType:     string
  suggestedTab?: string
  onOpenTab:    (tab: string) => void
  onAnalyse:    () => void
  canAnalyse:   boolean
}) {
  const profile = analysis?.financialProfile ?? null

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
        <i className="ti ti-loader-2" style={{ fontSize: 34, display: 'block', marginBottom: 10, animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>Reading the uploaded financial documents…</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Bank statements, ITRs and salary slips are being extracted.</div>
      </div>
    )
  }

  // Raw-output fallback when the model ignored the JSON contract
  if (!profile && rawText) {
    return (
      <div style={{ padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, color: '#78350f', fontSize: 12.5, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {rawText}
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <button onClick={onAnalyse} disabled={!canAnalyse}
          style={{ padding: '0 20px', height: 40, borderRadius: 10, border: 'none', background: canAnalyse ? '#2563eb' : '#93c5fd', color: '#fff', cursor: canAnalyse ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-sparkles" />Run AI Financial Analysis
        </button>
        <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', maxWidth: 420, margin: '12px auto 0', lineHeight: 1.6 }}>
          Upload bank statements, ITRs or salary slips first — Clausio reads them and builds a grounded
          financial profile, then auto-fills the calculator below.
        </div>
      </div>
    )
  }

  const exp = profile.monthlyExpenses ?? {}
  const discrepancies = Array.isArray(analysis?.flaggedDiscrepancies) ? analysis!.flaggedDiscrepancies! : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Summary card */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-report-money" /> FINANCIAL PROFILE
          </span>
          {caseType && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', whiteSpace: 'nowrap' }}>
              {caseType.toUpperCase()}
            </span>
          )}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.65, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{analysis?.summary}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>

        {/* Income */}
        <Section icon="ti-cash" title="Income" accent="#15803d">
          {numOrNull(profile.monthlyIncome) !== null ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>{fmt(numOrNull(profile.monthlyIncome)!)}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>per month, as per documents</div>
            </>
          ) : numOrNull(profile.annualIncome) !== null ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>{fmt(numOrNull(profile.annualIncome)!)}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>per year, as per documents</div>
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: '#94a3b8', padding: '4px 0 8px' }}>Not visible in documents</div>
          )}
          {!!profile.incomeSources?.length && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {profile.incomeSources.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>
                    {s.source || 'Source'}
                    {s.document && <span style={{ color: '#94a3b8', fontWeight: 500 }}> · 📄 {s.document}</span>}
                  </span>
                  <strong style={{ color: '#0f172a' }}>{numOrNull(s.monthlyAmount) !== null ? fmt(numOrNull(s.monthlyAmount)!) : '—'}</strong>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Monthly expenses */}
        <Section icon="ti-receipt-2" title="Monthly Expenses" accent="#b45309">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[['Rent', exp.rent], ['Education', exp.education], ['Medical', exp.medical], ['Other', exp.other]].map(([label, v]) => (
              <div key={String(label)} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 9px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 }}>{String(label)}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#78350f' }}>{numOrNull(v as any) !== null ? fmt(numOrNull(v as any)!) : '—'}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Liabilities + assets */}
        <Section icon="ti-building-bank" title="Liabilities & Assets" accent="#7c3aed">
          {!!profile.liabilities?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: profile.assets?.length ? 10 : 0 }}>
              {profile.liabilities.map((l, i) => (
                <div key={i} style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: 9 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{l.type || 'Loan'}</div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>
                    EMI {numOrNull(l.monthlyEmi) !== null ? fmt(numOrNull(l.monthlyEmi)!) : '—'}
                    {numOrNull(l.outstanding) !== null && <> · Outstanding {fmt(numOrNull(l.outstanding)!)}</>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: profile.assets?.length ? 10 : 0 }}>No liabilities visible in documents</div>
          )}
          {!!profile.assets?.length && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.assets.map((a, i) => (
                <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 12, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6d28d9', fontWeight: 600 }}>
                  {a.type}{numOrNull(a.value) !== null ? ` · ${fmt(numOrNull(a.value)!)}` : ''}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Claim / valuation */}
        {(numOrNull(profile.claimAmount) !== null || numOrNull(profile.suitValuation) !== null) && (
          <Section icon="ti-scale" title="Claim & Valuation" accent="#1d4ed8">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {numOrNull(profile.claimAmount) !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: '#64748b' }}>Claim amount</span><strong>{fmt(numOrNull(profile.claimAmount)!)}</strong>
                </div>
              )}
              {numOrNull(profile.suitValuation) !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: '#64748b' }}>Suit valuation</span><strong>{fmt(numOrNull(profile.suitValuation)!)}</strong>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>

      {/* Key transactions */}
      {!!profile.keyTransactions?.length && (
        <Section icon="ti-arrows-exchange" title="Key Transactions" accent="#6d28d9">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profile.keyTransactions.map((t, i) => (
              <div key={i} style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{t.description || t.date}</div>
                  {numOrNull(t.amount) !== null && <strong style={{ fontSize: 12.5, color: '#0f172a', whiteSpace: 'nowrap' }}>{fmt(numOrNull(t.amount)!)}</strong>}
                </div>
                {t.relevance && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, lineHeight: 1.5 }}>{t.relevance}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Flagged discrepancies */}
      <Section icon="ti-alert-triangle" title="Flagged Discrepancies" accent={discrepancies.length ? '#dc2626' : '#15803d'}>
        {discrepancies.length === 0 ? (
          <div style={{ fontSize: 12.5, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-circle-check" /> No discrepancies found between documents.
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {discrepancies.map((d, i) => (
              <li key={i} style={{ fontSize: 12.5, lineHeight: 1.55, color: '#991b1b' }}>{d}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* Auto-fill strip */}
      {suggestedTab && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px' }}>
          <span style={{ fontSize: 12, color: '#1d4ed8' }}>
            <i className="ti ti-bolt" style={{ marginRight: 4 }} />
            These figures auto-fill the <strong>{suggestedTab}</strong> — every field stays editable there.
          </span>
          <button onClick={() => onOpenTab(suggestedTab)}
            style={{ fontSize: 11.5, fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: '1px solid #bfdbfe', background: '#ffffff', color: '#1d4ed8', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            Open {suggestedTab} →
          </button>
        </div>
      )}
    </div>
  )
}
