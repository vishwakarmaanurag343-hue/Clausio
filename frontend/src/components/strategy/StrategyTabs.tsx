'use client'
// src/components/strategy/StrategyTabs.tsx
// NO CHANGES NEEDED — already working perfectly
// Keeping exact same code as original

interface Props {
  activeTab: string
  onChange:  (tab: string) => void
}

const tabs = [
  'Risk Assessment',
  'Recommendations',
  'Action Plan',
  'Document Gaps',
  'Legal Research',
]

export default function StrategyTabs({ activeTab, onChange }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, borderBottom: '1px solid #e2e8f0', marginBottom: 22 }}>
      {tabs.map((tab) => {
        const active = activeTab === tab
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{ position: 'relative', padding: '12px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#2563eb' : '#64748b', transition: '.2s' }}
          >
            {tab}
            {active && (
              <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: '#2563eb', borderRadius: 10 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
