'use client'

interface SettingsSidebarProps {
  activeSection: string
  onChange: (section: string) => void
}

const SECTIONS = [
  {
    title: 'General',
    items: [
      { name: 'Profile', icon: 'ti-user-circle' },
      { name: 'Workspace', icon: 'ti-building' },
      { name: 'Appearance', icon: 'ti-palette' },
    ],
  },
  {
    title: 'AI & Legal',
    items: [
      { name: 'AI', icon: 'ti-brain' },
      { name: 'Legal', icon: 'ti-scale' },
      { name: 'Integrations', icon: 'ti-plug-connected' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { name: 'Notifications', icon: 'ti-bell' },
      { name: 'Security', icon: 'ti-lock' },
      { name: 'Billing', icon: 'ti-credit-card' },
      { name: 'Team', icon: 'ti-users' },
      { name: 'Backup', icon: 'ti-database-export' },
      { name: 'About', icon: 'ti-info-circle' },
    ],
  },
]

export default function SettingsSidebar({
  activeSection,
  onChange,
}: SettingsSidebarProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 18,
        height: 'fit-content',
      }}
    >
      {SECTIONS.map((group) => (
        <div key={group.title} style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 12,
            }}
          >
            {group.title}
          </div>

          {group.items.map((item) => {
            const active = activeSection === item.name

            return (
              <button
                key={item.name}
                onClick={() => onChange(item.name)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  marginBottom: 6,
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: active
                    ? '#eff6ff'
                    : 'transparent',
                  color: active
                    ? '#2563eb'
                    : '#475569',
                  fontWeight: active ? 600 : 500,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  transition: '.2s',
                }}
              >
                <i
                  className={`ti ${item.icon}`}
                  style={{
                    fontSize: 18,
                    width: 20,
                    textAlign: 'center',
                  }}
                />

                <span>{item.name}</span>

                {active && (
                  <i
                    className="ti ti-chevron-right"
                    style={{
                      marginLeft: 'auto',
                      fontSize: 16,
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}