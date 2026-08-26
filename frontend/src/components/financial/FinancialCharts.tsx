'use client'

/* Zero-dependency chart primitives shared by every Financial-page calculator so any
   result is presentable to a client in a meeting, not just a final figure. */

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

export interface ChartItem { label: string; value: number; color: string }

/** Horizontal component-breakdown bars, scaled to the largest component, with ₹ + share labels. */
export function HBars({ title, items }: { title: string; items: ChartItem[] }) {
  const shown = items.filter(i => i.value > 0)
  if (!shown.length) return null
  const total = shown.reduce((s, i) => s + i.value, 0)
  const max   = Math.max(...shown.map(i => i.value))

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{title}</div>
      <div role="img" aria-label={`${title}: ${shown.map(i => `${i.label} ${inr(i.value)}`).join(', ')}`}>
        {shown.map(i => (
          <div key={i.label} style={{ marginBottom: 9 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5, marginBottom: 3 }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>{i.label}</span>
              <span style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                {inr(i.value)} · {Math.round((i.value / total) * 100)}%
              </span>
            </div>
            <div style={{ height: 10, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(3, (i.value / max) * 100)}%`, background: i.color, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9', fontSize: 12 }}>
        <span style={{ color: '#64748b', fontWeight: 600 }}>Total</span>
        <strong style={{ color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{inr(total)}</strong>
      </div>
    </div>
  )
}

/** SVG donut with side legend and centre total. Segments with value ≤ 0 are skipped. */
export function Donut({ title, segments, centerLabel }: { title: string; segments: ChartItem[]; centerLabel?: string }) {
  const shown = segments.filter(s => s.value > 0)
  const total = shown.reduce((s, x) => s + x.value, 0)
  const compact = (n: number) => n >= 10000000 ? `${(n / 10000000).toFixed(1)}Cr` : n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${Math.round(n / 1000)}k`

  const R = 48, C = 2 * Math.PI * R
  let acc = 0

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{title}</div>
      {total === 0 ? (
        <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>No values to plot yet.</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }} role="img" aria-label={`${title}: ${shown.map(s => `${s.label} ${inr(s.value)}`).join(', ')}`}>
          <svg viewBox="0 0 130 130" width={130} height={130} style={{ flexShrink: 0 }}>
            <circle cx={65} cy={65} r={R} fill="none" stroke="#f1f5f9" strokeWidth={17} />
            {shown.map(s => {
              const frac = s.value / total
              const seg = (
                <circle key={s.label} cx={65} cy={65} r={R} fill="none" stroke={s.color} strokeWidth={17}
                  strokeDasharray={`${Math.max(0.5, frac * C - 1.5)} ${C}`}
                  strokeDashoffset={-acc * C}
                  transform="rotate(-90 65 65)" strokeLinecap="butt" />
              )
              acc += frac
              return seg
            })}
            <text x={65} y={62} textAnchor="middle" fontSize={15} fontWeight={800} fill="#0f172a">{compact(total)}</text>
            <text x={65} y={78} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="#94a3b8" letterSpacing={1}>{(centerLabel ?? 'TOTAL').toUpperCase()}</text>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 150 }}>
            {shown.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#334155', fontWeight: 600 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />{s.label}
                </span>
                <strong style={{ color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{inr(s.value)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Month compliance grid — green paid / amber partial / red unpaid cells. */
export type PayStatus = 'Paid' | 'Partial' | 'Unpaid' | 'None'

export function ComplianceGrid({ months }: { months: { label: string; status: PayStatus }[] }) {
  const styleFor: Record<PayStatus, { bg: string; fg: string }> = {
    Paid:    { bg: '#dcfce7', fg: '#15803d' },
    Partial: { bg: '#fef9c3', fg: '#a16207' },
    Unpaid:  { bg: '#fee2e2', fg: '#b91c1c' },
    None:    { bg: '#f1f5f9', fg: '#94a3b8' },
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 6 }}>
        {months.map(m => (
          <div key={m.label} title={`${m.label}: ${m.status}`} style={{
            background: styleFor[m.status].bg, borderRadius: 8, padding: '7px 2px',
            textAlign: 'center', border: `1px solid ${styleFor[m.status].bg}`,
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: styleFor[m.status].fg }}>{m.label.split(' ')[0]}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: styleFor[m.status].fg, opacity: 0.75 }}>{m.label.split(' ')[1]}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
        {(['Paid', 'Partial', 'Unpaid'] as PayStatus[]).map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600, color: '#64748b' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: styleFor[s].bg, border: `1px solid ${styleFor[s].fg}33` }} />{s}
          </span>
        ))}
      </div>
    </div>
  )
}
