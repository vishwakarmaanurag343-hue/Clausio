'use client'

interface Props { analysis: any; rawText: string; loading: boolean; onAnalyse: () => void; caseType?: string }

function getCaseTypeLabel(caseType: string): { title: string; incomeLabel: string; suspiciousLabel: string } {
  const ct = caseType.toLowerCase()
  if (ct.includes('gst'))        return { title: 'Business Income Reality', incomeLabel: 'Declared Turnover', suspiciousLabel: 'GST Evasion Indicators' }
  if (ct.includes('income tax')) return { title: 'Income Reality Check', incomeLabel: 'Declared Income', suspiciousLabel: 'Tax Evasion Indicators' }
  if (ct.includes('criminal'))   return { title: 'Financial Background Check', incomeLabel: 'Known Income', suspiciousLabel: 'Financial Irregularities' }
  if (ct.includes('ni act'))     return { title: 'Drawer Financial Analysis', incomeLabel: 'Declared Income', suspiciousLabel: 'Payment Capacity Issues' }
  if (ct.includes('civil'))      return { title: 'Party Financial Analysis', incomeLabel: 'Declared Assets', suspiciousLabel: 'Concealed Assets' }
  if (ct.includes('consumer'))   return { title: 'Opposite Party Financials', incomeLabel: 'Company Revenue', suspiciousLabel: 'Deficiency Indicators' }
  if (ct.includes('labour'))     return { title: 'Employer Financial Analysis', incomeLabel: 'Company Turnover', suspiciousLabel: 'Payment Defaults' }
  return { title: 'Income Reality Check', incomeLabel: 'Declared Income', suspiciousLabel: 'Suspicious Patterns' }
}

export default function IncomeReality({ analysis, rawText, loading, onAnalyse, caseType = 'Family' }: Props) {
  const labels    = getCaseTypeLabel(caseType)
  const suspicious: any[] = analysis?.suspiciousPatterns ?? analysis?.incomeConcealment ?? []
  const assets:     any[] = analysis?.assets ?? []
  const sources:    any[] = analysis?.incomeSources ?? []
  const hasData           = !!(analysis || rawText)
  const fmt = (val: any) => val ? `₹${Number(val).toLocaleString('en-IN')}` : '—'

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{labels.title}</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>AI analysis of declared vs actual financial position.</p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#7c3aed' }}>
          <i className="ti ti-loader-2" style={{ fontSize: 30, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>Analysing financials...</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>15-20 seconds</div>
        </div>
      )}

      {!loading && !hasData && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <i className="ti ti-chart-bar" style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>No Analysis Yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Run AI Analysis to investigate financials.</div>
          <button onClick={onAnalyse} style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
            <i className="ti ti-sparkles" style={{ marginRight: 6 }} />Run AI Analysis
          </button>
        </div>
      )}

      {!loading && hasData && (
        <>
          {(analysis?.declaredIncome || analysis?.estimatedActualIncome) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <ICard title={labels.incomeLabel}   value={fmt(analysis?.declaredIncome)}        color="#dc2626" bg="#fef2f2" />
              <ICard title="Estimated Actual"      value={fmt(analysis?.estimatedActualIncome)} color="#d97706" bg="#fff7ed" />
            </div>
          )}

          {analysis?.incomeRatio && (
            <div style={{ padding: '10px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e', marginBottom: 14, fontWeight: 500 }}>
              ⚠ {analysis.incomeRatio}
            </div>
          )}

          {sources.length > 0 && (
            <Section title="Income Sources">
              {sources.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ color: '#475569' }}>{s.source}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#dc2626', fontSize: 11 }}>Declared: {fmt(s.declared)}</span>
                    <span style={{ color: '#d97706', fontSize: 11 }}>Actual: {fmt(s.estimated)}</span>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {suspicious.length > 0 && (
            <Section title={labels.suspiciousLabel}>
              {suspicious.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', marginTop: 6, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>
                    {typeof item === 'string' ? item : item.method ?? item.title ?? item.description ?? JSON.stringify(item)}
                    {item.evidence && <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 2 }}>Evidence: {item.evidence}</span>}
                    {item.documentToObtain && <span style={{ display: 'block', fontSize: 11, color: '#2563eb', marginTop: 2 }}>→ Obtain: {item.documentToObtain}</span>}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {assets.length > 0 && (
            <Section title="Assets Identified">
              {assets.map((a: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ color: '#475569' }}>{typeof a === 'string' ? a : `${a.asset ?? ''}${a.registeredIn ? ` (${a.registeredIn})` : ''}`}</span>
                  {a.value && <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmt(a.value)}</span>}
                </div>
              ))}
            </Section>
          )}

          {analysis?.documentationRequired?.length > 0 && (
            <Section title="Documents to Obtain">
              {analysis.documentationRequired.map((d: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 12, color: '#334155' }}>
                  <i className="ti ti-file-plus" style={{ color: '#2563eb', fontSize: 13, flexShrink: 0 }} />{d}
                </div>
              ))}
            </Section>
          )}

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 14, marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <i className="ti ti-sparkles" style={{ color: '#2563eb' }} />
              <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 12 }}>AI Financial Summary</span>
            </div>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {analysis?.summary ?? rawText?.slice(0, 500) ?? 'No summary available.'}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ICard({ title, value, color, bg }: { title: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: bg, border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
      <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
      <div style={{ color, fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
      {children}
    </div>
  )
}
