'use client'

interface Props {
  activeTab: string
  onChange: (tab: string) => void
}

const tabs = ['Overview']

export default function ReadinessTabs({ activeTab, onChange }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 20 }}>
      {tabs.map((tab) => {
        const active = activeTab === tab
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{ position: 'relative', padding: '10px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#0f172a' : '#64748b' }}
          >
            {tab}
            {active && (
              <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 10, background: '#0f172a' }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
