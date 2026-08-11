'use client'

import React from 'react'
import DraftsTab from '@/components/drafts/DraftsTab'

export default function DraftsPage() {
  return (
    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: 16, borderRadius: 24 }}>
      <DraftsTab />
    </div>
  )
}