'use client'

import { useState } from 'react'
import ProfileSettings      from '@/components/settings/ProfileSettings'
import SecuritySettings     from '@/components/settings/SecuritySettings'
import AISettings           from '@/components/settings/AISettings'
import LegalSettings        from '@/components/settings/LegalSettings'
import AboutClausio         from '@/components/settings/AboutClausio'

const SECTIONS = [
  {
    group: 'Account — Live',
    items: [
      { name: 'Profile',    icon: 'ti-user-circle', live: true  },
      { name: 'Security',   icon: 'ti-lock',        live: true  },
    ],
  },
  {
    group: 'Preferences — Live',
    items: [
      { name: 'AI',         icon: 'ti-brain',       live: true  },
      { name: 'Legal',      icon: 'ti-scale',       live: true  },
    ],
  },
  {
    group: 'Coming Soon',
    items: [
      { name: 'Notifications', icon: 'ti-bell',        live: false },
      { name: 'Team',          icon: 'ti-users',       live: false },
      { name: 'Billing',       icon: 'ti-credit-card', live: false },
    ],
  },
  {
    group: 'Support',
    items: [
      { name: 'About',      icon: 'ti-info-circle', live: true  },
    ],
  },
]

export default function SettingsPage() {
  const [active, setActive] = useState('Profile')

  function renderContent() {
    const section = SECTIONS.flatMap(s => s.items).find(i => i.name === active)
    if (section && !section.live) return <ComingSoon name={active} />
    switch (active) {
      case 'Profile':  return <ProfileSettings />
      case 'Security': return <SecuritySettings />
      case 'AI':       return <AISettings />
      case 'Legal':    return <LegalSettings />
      case 'About':    return <AboutClausio />
      default:         return <ProfileSettings />
    }
  }

  return (
    <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 28, borderRadius: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Settings</h1>
        <p style={{ marginTop: 6, fontSize: 14, color: '#64748b' }}>Manage your account and preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, position: 'sticky', top: 0 }}>
          {SECTIONS.map(section => (
            <div key={section.group} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, paddingLeft: 4 }}>
                {section.group}
              </div>
              {section.items.map(item => {
                const isActive = active === item.name
                return (
                  <button
                    key={item.name}
                    onClick={() => setActive(item.name)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 4, border: 'none', borderRadius: 10, cursor: 'pointer', background: isActive ? '#eff6ff' : 'transparent', color: isActive ? '#1e40af' : item.live ? '#475569' : '#94a3b8', fontWeight: isActive ? 600 : 400, fontSize: 13, fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s' }}
                  >
                    <i className={`ti ${item.icon}`} style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {!item.live && <span style={{ fontSize: 9, padding: '2px 6px', background: '#fef3c7', color: '#d97706', borderRadius: 10, fontWeight: 700 }}>SOON</span>}
                    {isActive && item.live && <i className="ti ti-chevron-right" style={{ fontSize: 14 }} />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, minHeight: 500 }}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

function ComingSoon({ name }: { name: string }) {
  const details: Record<string, { icon: string; desc: string; features: string[] }> = {
    Notifications: {
      icon: 'ti-bell',
      desc: 'Smart notifications to keep you ahead of every hearing and deadline.',
      features: ['WhatsApp alerts before hearings', 'SMS reminders for court deadlines', 'Email digest of daily case activity', 'Push notifications for urgent orders'],
    },
    Team: {
      icon: 'ti-users',
      desc: 'Manage your firm — add junior advocates, clerks and assign cases.',
      features: ['Add junior advocates and clerks', 'Assign cases to team members', 'Role-based access control', 'Activity log per team member'],
    },
    Billing: {
      icon: 'ti-credit-card',
      desc: 'Manage your Clausio subscription and payment history.',
      features: ['View current plan and usage', 'Upgrade or downgrade subscription', 'Download invoices and receipts', 'Manage payment methods'],
    },
  }

  const d = details[name] ?? { icon: 'ti-clock', desc: 'This feature is coming soon.', features: [] }

  return (
    <div style={{ textAlign: 'center', padding: '48px 32px' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <i className={`ti ${d.icon}`} style={{ fontSize: 36, color: '#d97706' }} />
      </div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{name} — Coming Soon</h2>
      <p style={{ marginTop: 8, fontSize: 14, color: '#64748b', maxWidth: 360, margin: '10px auto 0' }}>{d.desc}</p>
      {d.features.length > 0 && (
        <div style={{ marginTop: 28, background: '#f8fafc', borderRadius: 12, padding: 20, textAlign: 'left', maxWidth: 360, margin: '28px auto 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>What is coming</div>
          {d.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: '#334155' }}>
              <i className="ti ti-clock" style={{ fontSize: 14, color: '#d97706', flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 28, padding: '10px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, display: 'inline-block' }}>
        <span style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>Expected in next release · support@clausio.io</span>
      </div>
    </div>
  )
}
