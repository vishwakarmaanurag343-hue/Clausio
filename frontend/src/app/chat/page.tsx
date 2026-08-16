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
        background: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <AIInsights />
      </div>
    </div>
  )
}
