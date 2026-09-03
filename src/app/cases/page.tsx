'use client'

import CasesHeader from '@/components/cases/CasesHeader'
import CasesSearch from '@/components/cases/CasesSearch'
import CaseStats from '@/components/cases/CaseStats'
import PracticeAreas from '@/components/cases/PracticeAreas'

export default function CasesPage() {
  return (
    <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>
      {/* Header */}

      <CasesHeader />

      {/* Search */}

      <div
        style={{
          marginTop: 28,
        }}
      >
        <CasesSearch />
      </div>

      {/* Statistics */}

      <div
        style={{
          marginTop: 28,
        }}
      >
        <CaseStats />
      </div>

      {/* Practice Areas */}

      <div
        style={{
          marginTop: 36,
        }}
      >
        <PracticeAreas />
      </div>
    </div>
  )
}