'use client'

import { motion } from 'framer-motion'
interface AnalyticsTabsProps {
  activeTab: string
  onChange: (tab: string) => void
}

export default function AnalyticsTabs({
  activeTab,
  onChange,
}: AnalyticsTabsProps) {
  const tabs = [
    'AI Chat',
    'Legal Research',
    'Cross Examination',
    'Strategy Assistant',
    'Judge Insights',
    'Prompt Library',
    'History',
    'Knowledge Base',
    'AI Tools',
    'Automation',
  ]

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 10,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        marginBottom: 20
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            position: 'relative',
            padding: '8px 16px',
            border: 'none',
            borderRadius: 999,
            cursor: 'pointer',
            transition: 'color 0.2s ease',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            background: 'transparent',
            color: activeTab === tab ? '#ffffff' : '#64748b',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab) {
              e.currentTarget.style.color = '#0f172a'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab) {
              e.currentTarget.style.color = '#64748b'
            }
          }}
        >
          {activeTab === tab && (
            <motion.div
              layoutId="activeAnalyticsTab"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: '#0f172a',
                borderRadius: 999,
                zIndex: -1,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>{tab}</span>
        </button>
      ))}
    </div>
  )
}