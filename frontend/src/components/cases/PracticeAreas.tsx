'use client'

const practiceAreas = [
  { title: 'Family Law',     match: 'family',     description: 'Divorce, custody, maintenance & domestic matters', color: '#2563eb', icon: 'ti ti-users' },
  { title: 'Civil Litigation', match: 'civil',     description: 'Property, recovery suits & injunctions',           color: '#16a34a', icon: 'ti ti-scale' },
  { title: 'Criminal Law',   match: 'criminal',    description: 'Bail, FIR, criminal trials & appeals',             color: '#dc2626', icon: 'ti ti-shield' },
  { title: 'Corporate',      match: 'corporate',   description: 'Companies Act, compliance & contracts',            color: '#7c3aed', icon: 'ti ti-building-bank' },
  { title: 'GST',            match: 'gst',         description: 'GST notices, appeals & litigation',                color: '#ea580c', icon: 'ti ti-receipt-tax' },
  { title: 'Income Tax',     match: 'income tax',  description: 'Assessment, appeals & tax disputes',                color: '#0891b2', icon: 'ti ti-cash-banknote' },
  { title: 'NI Act',         match: 'ni act',      description: 'Cheque bounce matters under Section 138',          color: '#f59e0b', icon: 'ti ti-file-certificate' },
  { title: 'Arbitration',    match: 'arbitration', description: 'Commercial arbitration & ADR',                     color: '#0f766e', icon: 'ti ti-gavel' },
]

interface Props {
  cases:    any[]
  selected: string
  onSelect: (match: string) => void
}

export default function PracticeAreas({ cases, selected, onSelect }: Props) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700, letterSpacing: '-0.3px' }}>
            Practice Areas
          </h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 12 }}>
            Select a practice area to filter matters below.
          </p>
        </div>
        {selected && (
          <button onClick={() => onSelect('')} style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            Clear filter ✕
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {practiceAreas.map((area) => {
          const count = cases.filter(c => c.caseType?.toLowerCase().includes(area.match)).length
          return (
            <PracticeCard key={area.title} {...area} count={count} active={selected === area.match} onClick={() => onSelect(selected === area.match ? '' : area.match)} />
          )
        })}
      </div>
    </div>
  )
}

function PracticeCard({ title, description, count, color, icon, active, onClick }: { title: string, description: string, count: number, color: string, icon: string, active: boolean, onClick: () => void }) {
  return (
    <div className="glass-card" onClick={onClick} style={{ padding: 16, cursor: 'pointer', transition: '.25s', display: 'flex', flexDirection: 'column', outline: active ? `2px solid ${color}` : 'none' }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: color, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12, boxShadow: `0 4px 12px ${color}40` }}>
        <i className={icon} style={{ color: '#fff', fontSize: 20 }} />
      </div>

      <h3 style={{ margin: 0, color: '#0f172a', fontSize: 15, fontWeight: 700 }}>
        {title}
      </h3>
      <p style={{ marginTop: 6, color: '#64748b', lineHeight: 1.4, minHeight: 40, fontSize: 11, fontWeight: 500 }}>
        {description}
      </p>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color, fontWeight: 700, fontSize: 14 }}>
          {count} Cases
        </span>
        <div style={{ color, fontWeight: 600, fontSize: 12, padding: '4px 8px', background: `${color}15`, borderRadius: 8 }}>
          {active ? 'Selected ✓' : 'View →'}
        </div>
      </div>
    </div>
  )
}