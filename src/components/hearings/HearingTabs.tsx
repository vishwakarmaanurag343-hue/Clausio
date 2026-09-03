'use client'

interface HearingTabsProps {
  activeTab: string
  onChange: (tab: string) => void
}

const tabs = [
  'Hearing Diary',
  'Prep Brief',
  'Witness Intelligence',
]

export default function HearingTabs({ activeTab, onChange }: HearingTabsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 12 }}>
      {tabs.map((tab) => {
        const active = activeTab === tab
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: '.2s',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              background: active ? '#fff' : 'transparent',
              color: active ? '#0f172a' : '#64748b',
              boxShadow: active ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
            }}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}