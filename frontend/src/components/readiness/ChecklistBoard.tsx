'use client'

interface ChecklistItem {
  item:               string
  caseTypeRelevance?: string
  status?:            string
  controllable?:      boolean
  actionNeeded?:      string | null
}

interface Props {
  readiness: any
  loading:   boolean
}

const STATUS_ORDER: Record<string, number> = { 'At Risk': 0, Pending: 1, Done: 2 }

function statusPill(status?: string) {
  switch ((status ?? '').toLowerCase()) {
    case 'done':    return { bg: '#f0fdf4', fg: '#15803d', bd: '#86efac' }
    case 'at risk': return { bg: '#fef2f2', fg: '#b91c1c', bd: '#fecaca' }
    default:        return { bg: '#fefce8', fg: '#a16207', bd: '#fde047' }   // Pending
  }
}

function Flashcard({ item }: { item: ChecklistItem }) {
  const p = statusPill(item.status)
  const edge = item.status === 'At Risk' ? '#ef4444' : item.status === 'Done' ? '#22c55e' : '#f59e0b'
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ borderLeft: `3px solid ${edge}`, paddingLeft: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.45 }}>{item.item}</div>
          {item.caseTypeRelevance && (
            <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.55, color: '#475569' }}>{item.caseTypeRelevance}</div>
          )}
        </div>
        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: p.bg, border: `1px solid ${p.bd}`, color: p.fg }}>
          {item.status || 'Pending'}
        </span>
      </div>
      {item.actionNeeded && (
        <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e', letterSpacing: 1, marginBottom: 3 }}>
            <i className="ti ti-arrow-right" style={{ fontSize: 10 }} /> ACTION NEEDED
          </div>
          <div style={{ fontSize: 11.5, color: '#78350f', lineHeight: 1.5 }}>{item.actionNeeded}</div>
        </div>
      )}
    </div>
  )
}

function Group({ icon, title, accent, pillBg, pillFg, pillBd, items }: {
  icon: string; title: string; accent: string; pillBg: string; pillFg: string; pillBd: string; items: ChecklistItem[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color: accent }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: pillBg, border: `1px solid ${pillBd}`, color: pillFg }}>
          {items.length}
        </span>
      </div>
      {items.map((item, i) => <Flashcard key={i} item={item} />)}
    </div>
  )
}

export default function ChecklistBoard({ readiness, loading }: Props) {
  const all: ChecklistItem[] = Array.isArray(readiness?.checklist) ? readiness.checklist : []
  const byStatus = (a: ChecklistItem, b: ChecklistItem) =>
    (STATUS_ORDER[a.status ?? ''] ?? 1) - (STATUS_ORDER[b.status ?? ''] ?? 1)
  const mine     = all.filter(i => i.controllable !== false).sort(byStatus)
  const external = all.filter(i => i.controllable === false).sort(byStatus)

  if (loading) return <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading...</div>
  if (!readiness) return <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No assessment yet — click Generate AI Report.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {all.length === 0 && (
        <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: '#16a34a', fontSize: 13 }}>
          All clear — nothing outstanding on the checklist.
        </div>
      )}

      {mine.length > 0 && (
        <Group icon="ti-user-check" title="Needs Your Action" accent="#1d4ed8"
          pillBg="#eff6ff" pillFg="#1d4ed8" pillBd="#bfdbfe" items={mine} />
      )}

      {external.length > 0 && (
        <Group icon="ti-gavel" title="Outside Your Control" accent="#6d28d9"
          pillBg="#f5f3ff" pillFg="#6d28d9" pillBd="#ddd6fe" items={external} />
      )}
    </div>
  )
}
