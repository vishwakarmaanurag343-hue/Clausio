'use client'

import AIInsights from '@/components/dashboard/AIInsights'

export default function ChatPage() {
  return (
    <div
      className="glass-panel"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        margin: '16px',
        borderRadius: 24,
        overflow: 'hidden',
        background: '#f8fafc',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <AIInsights />
      </div>
    </div>
  )
}
