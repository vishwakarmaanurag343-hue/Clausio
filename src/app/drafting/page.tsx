'use client'

import DraftsTab from '@/components/drafts/DraftsTab'

export default function DraftingPage() {
  return (
    <div
      className="glass-panel"
      style={{
        flex: 1,
        overflow: 'hidden',
        margin: '16px',
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DraftsTab />
    </div>
  )
}