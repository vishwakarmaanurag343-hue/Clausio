'use client'

import { useRouter } from 'next/navigation'

const practiceAreas = [
  {
    title: 'Family Law',
    description: 'Divorce, custody, maintenance & domestic matters',
    cases: 32,
    color: '#2563eb',
    icon: 'ti ti-users',
    route: '/cases/family',
  },
  {
    title: 'Civil Litigation',
    description: 'Property, recovery suits & injunctions',
    cases: 28,
    color: '#16a34a',
    icon: 'ti ti-scale',
    route: '/cases/civil',
  },
  {
    title: 'Criminal Law',
    description: 'Bail, FIR, criminal trials & appeals',
    cases: 18,
    color: '#dc2626',
    icon: 'ti ti-shield',
    route: '/cases/criminal',
  },
  {
    title: 'Corporate',
    description: 'Companies Act, compliance & contracts',
    cases: 15,
    color: '#7c3aed',
    icon: 'ti ti-building-bank',
    route: '/cases/corporate',
  },
  {
    title: 'GST',
    description: 'GST notices, appeals & litigation',
    cases: 12,
    color: '#ea580c',
    icon: 'ti ti-receipt-tax',
    route: '/cases/gst',
  },
  {
    title: 'Income Tax',
    description: 'Assessment, appeals & tax disputes',
    cases: 14,
    color: '#0891b2',
    icon: 'ti ti-cash-banknote',
    route: '/cases/income-tax',
  },
  {
    title: 'NI Act',
    description: 'Cheque bounce matters under Section 138',
    cases: 20,
    color: '#f59e0b',
    icon: 'ti ti-file-certificate',
    route: '/cases/ni-act',
  },
  {
    title: 'Arbitration',
    description: 'Commercial arbitration & ADR',
    cases: 9,
    color: '#0f766e',
    icon: 'ti ti-gavel',
    route: '/cases/arbitration',
  },
]

export default function PracticeAreas() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700, letterSpacing: '-0.3px' }}>
            Practice Areas
          </h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 12 }}>
            Select a practice area to view all related matters.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {practiceAreas.map((area) => (
          <PracticeCard key={area.title} {...area} />
        ))}
      </div>
    </div>
  )
}

function PracticeCard({ title, description, cases, color, icon, route }: { title: string, description: string, cases: number, color: string, icon: string, route: string }) {
  const router = useRouter()
  return (
    <div className="glass-card" onClick={() => router.push(route)} style={{ padding: 16, cursor: 'pointer', transition: '.25s', display: 'flex', flexDirection: 'column' }}>
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
          {cases} Cases
        </span>
        <div style={{ color, fontWeight: 600, fontSize: 12, padding: '4px 8px', background: `${color}15`, borderRadius: 8 }}>
          View →
        </div>
      </div>
    </div>
  )
}