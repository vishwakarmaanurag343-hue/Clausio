'use client'

const stats = [
  {
    title: 'Total Cases',
    value: '154',
    change: '+12%',
    icon: 'ti ti-folder',
    color: '#2563eb',
    background: '#eff6ff',
  },
  {
    title: 'Active Cases',
    value: '98',
    change: '+8%',
    icon: 'ti ti-briefcase',
    color: '#16a34a',
    background: '#ecfdf5',
  },
  {
    title: "Today's Hearings",
    value: '8',
    change: 'Today',
    icon: 'ti ti-calendar-event',
    color: '#f59e0b',
    background: '#fffbeb',
  },
  {
    title: 'Overdue Tasks',
    value: '12',
    change: '-3%',
    icon: 'ti ti-alert-circle',
    color: '#ef4444',
    background: '#fef2f2',
  },
]

export default function CaseStats() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 20 }}>
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}

function StatCard({ title, value, change, icon, color, background }: { title: string, value: string, change: string, icon: string, color: string, background: string }) {
  return (
    <div className="glass-card" style={{ padding: 16, transition: '.25s', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: background, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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