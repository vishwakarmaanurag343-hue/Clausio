'use client'
// src/components/cases/CaseStats.tsx
// EXACT SAME UI — counts derived from the real case list passed down by the Cases page.
// Note: the backend's /api/stats/overview does not expose "today's hearings" or "overdue"
// at case-list granularity (it only returns totalCases/activeCases/totalClients/
// upcomingHearings/averageReadinessScore), so those two cards are computed client-side.

interface Props {
  cases: any[]
}

export default function CaseStats({ cases }: Props) {
  const today = new Date().toDateString()
  const stats = {
    total:   cases.length,
    active:  cases.filter(c => c.status === 'Active').length,
    today:   cases.filter(c => c.nextHearing && new Date(c.nextHearing).toDateString() === today).length,
    overdue: 0,
  }

  // EXACT SAME card design as original
  const statCards = [
    { title: 'Total Cases',       value: stats.total.toString(),   change: 'All matters', icon: 'ti ti-folder',         color: '#2563eb', background: '#eff6ff' },
    { title: 'Active Cases',      value: stats.active.toString(),  change: 'In progress', icon: 'ti ti-briefcase',      color: '#16a34a', background: '#ecfdf5' },
    { title: "Today's Hearings",  value: stats.today.toString(),   change: 'Today',       icon: 'ti ti-calendar-event', color: '#f59e0b', background: '#fffbeb' },
    { title: 'Overdue Tasks',     value: stats.overdue.toString(), change: 'Needs action', icon: 'ti ti-alert-circle',  color: '#ef4444', background: '#fef2f2' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 20 }}>
      {statCards.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}

function StatCard({ title, value, change, icon, color, background }: { title: string; value: string; change: string; icon: string; color: string; background: string }) {
  return (
    // EXACT SAME as original
    <div className="glass-card" style={{ padding: 16, transition: '.25s', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <i className={icon} style={{ color, fontSize: 18 }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, padding: '2px 6px', borderRadius: 6 }}>
          {change}
        </span>
      </div>
      <h2 style={{ margin: '12px 0 2px', fontSize: 24, color: '#0f172a', fontWeight: 700, letterSpacing: '-0.5px' }}>
        {value}
      </h2>
      <p style={{ margin: 0, color: '#64748b', fontSize: 12, fontWeight: 600 }}>
        {title}
      </p>
      <div style={{ marginTop: 12, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ width: title === 'Total Cases' ? '80%' : title === 'Active Cases' ? '65%' : title === "Today's Hearings" ? '45%' : '30%', height: '100%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  )
}
