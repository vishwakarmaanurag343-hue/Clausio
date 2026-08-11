'use client'

import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'
import { casesApi } from '@/lib/api'

// ✅ Hook — reads selected case type dynamically
export function useCaseType() {
  const { selectedCaseId } = useCaseStore()
  const [caseType, setCaseType] = useState<string>('')
  const [caseData, setCaseData] = useState<any>(null)

  useEffect(() => {
    if (!selectedCaseId) { setCaseType(''); setCaseData(null); return }
    casesApi.getById(selectedCaseId)
      .then(data => {
        setCaseData(data)
        setCaseType(data?.caseType ?? '')
      })
      .catch(() => { setCaseType(''); setCaseData(null) })
  }, [selectedCaseId])

  return { caseType, caseData }
}

// ✅ Color mapping per case type
const CASE_TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Family Law':        { bg: 'rgba(37,99,235,0.1)',  color: '#1d4ed8', border: 'rgba(37,99,235,0.2)'  },
  'Family':            { bg: 'rgba(37,99,235,0.1)',  color: '#1d4ed8', border: 'rgba(37,99,235,0.2)'  },
  'Civil':             { bg: 'rgba(22,163,74,0.1)',  color: '#15803d', border: 'rgba(22,163,74,0.2)'  },
  'Civil Litigation':  { bg: 'rgba(22,163,74,0.1)',  color: '#15803d', border: 'rgba(22,163,74,0.2)'  },
  'Criminal':          { bg: 'rgba(220,38,38,0.1)',  color: '#dc2626', border: 'rgba(220,38,38,0.2)'  },
  'Criminal Law':      { bg: 'rgba(220,38,38,0.1)',  color: '#dc2626', border: 'rgba(220,38,38,0.2)'  },
  'Corporate':         { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: 'rgba(124,58,237,0.2)' },
  'GST':               { bg: 'rgba(234,88,12,0.1)',  color: '#ea580c', border: 'rgba(234,88,12,0.2)'  },
  'Income Tax':        { bg: 'rgba(8,145,178,0.1)',  color: '#0891b2', border: 'rgba(8,145,178,0.2)'  },
  'Tax':               { bg: 'rgba(8,145,178,0.1)',  color: '#0891b2', border: 'rgba(8,145,178,0.2)'  },
  'NI Act':            { bg: 'rgba(245,158,11,0.1)', color: '#d97706', border: 'rgba(245,158,11,0.2)' },
  'NI Act 138':        { bg: 'rgba(245,158,11,0.1)', color: '#d97706', border: 'rgba(245,158,11,0.2)' },
  'Arbitration':       { bg: 'rgba(15,118,110,0.1)', color: '#0f766e', border: 'rgba(15,118,110,0.2)' },
  'Labour':            { bg: 'rgba(79,70,229,0.1)',  color: '#4f46e5', border: 'rgba(79,70,229,0.2)'  },
  'Consumer':          { bg: 'rgba(219,39,119,0.1)', color: '#db2777', border: 'rgba(219,39,119,0.2)' },
  'RERA':              { bg: 'rgba(101,163,13,0.1)', color: '#65a30d', border: 'rgba(101,163,13,0.2)' },
}

function getColors(caseType: string) {
  // Try exact match first
  if (CASE_TYPE_COLORS[caseType]) return CASE_TYPE_COLORS[caseType]
  // Try partial match
  const lower = caseType.toLowerCase()
  for (const [key, val] of Object.entries(CASE_TYPE_COLORS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val
  }
  // Default blue
  return { bg: 'rgba(59,130,246,0.1)', color: '#2563eb', border: 'rgba(59,130,246,0.2)' }
}

// ✅ Component — dynamic badge replacing hardcoded "Family & Matrimonial"
interface Props {
  fallback?: string
  style?: React.CSSProperties
}

export default function CaseTypeBadge({ fallback = 'Select a case', style }: Props) {
  const { caseType } = useCaseType()
  const label = caseType || fallback
  const colors = getColors(label)

  return (
    <div style={{
      padding: '4px 10px',
      borderRadius: 999,
      fontWeight: 600,
      fontSize: 11,
      background: colors.bg,
      color: colors.color,
      border: `1px solid ${colors.border}`,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {label}
    </div>
  )
}
