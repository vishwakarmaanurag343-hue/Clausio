'use client'

import { useCaseStore } from '@/lib/store'

export default function CaseHeader() {
  const { selectedCaseId, selectedCaseName } = useCaseStore()

  if (!selectedCaseId) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 16px',
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: 10,
      marginBottom: 20,
      width: '100%',
      boxSizing: 'border-box' as const,
      flexShrink: 0,
    }}>
      <div style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: '#0284c7',
        flexShrink: 0,
      }} />
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#38bdf8',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        flexShrink: 0,
        fontFamily: 'inherit',
      }}>
        Working on:
      </span>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: '#0c4a6e',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        flex: 1,
        fontFamily: 'inherit',
      }}>
        {selectedCaseName || 'Selected Case'}
      </span>
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: '#0284c7',
        background: '#e0f2fe',
        padding: '2px 8px',
        borderRadius: 20,
        flexShrink: 0,
        whiteSpace: 'nowrap' as const,
      }}>
        Active
      </span>
    </div>
  )
}
