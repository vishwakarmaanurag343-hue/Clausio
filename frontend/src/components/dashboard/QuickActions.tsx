'use client'

import { useRouter } from 'next/navigation'

const ACTIONS = [
  { icon: 'ti-alert-triangle', label: 'Emergency Response', danger: true,  route: '/readiness'  },
  { icon: 'ti-clipboard-list', label: 'Hearing Brief',      danger: false, route: '/hearings'   },
  { icon: 'ti-message',        label: 'Client Update',      danger: false, route: '/client'     },
  { icon: 'ti-sparkles',       label: 'AI Strategy',        danger: false, route: '/strategy'   },
  { icon: 'ti-file-text',      label: 'Draft Petition',     danger: false, route: '/drafting'   },
  { icon: 'ti-chart-bar',      label: 'Financial Analysis', danger: false, route: '/financial'  },
]

export default function QuickActions() {
  const router = useRouter()

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, paddingLeft: 4 }}>
        Quick Actions
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {ACTIONS.map((a, i) => (
          <button
            key={i}
            onClick={() => router.push(a.route)}
            className="glass-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: a.danger ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.6)',
              border: a.danger ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(255,255,255,0.8)',
              borderRadius: 12,
              fontSize: 12,
              color: a.danger ? '#dc2626' : '#0f172a',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = a.danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.9)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = a.danger ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.6)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            }}
          >
            <i className={`ti ${a.icon}`} style={{ fontSize: 15, flexShrink: 0, color: a.danger ? '#dc2626' : '#3b82f6' }} />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
