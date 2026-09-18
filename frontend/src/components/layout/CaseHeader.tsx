'use client'

import { useCaseStore } from '@/lib/store'

export default function CaseHeader() {
  const { selectedCaseId, selectedCaseName } = useCaseStore()

  if (!selectedCaseId) return null

  return (
    <div className="hidden md:flex" style={{
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.65)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      borderTop: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
      borderRadius: 16,
      marginBottom: 20,
      width: '100%',
      boxSizing: 'border-box' as const,
      flexShrink: 0,
      minWidth: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'rgba(0, 0, 0, 0.03)',
        flexShrink: 0,
      }}>
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}>
           <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
         </svg>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        gap: 2,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#64748b',
          fontFamily: 'inherit',
          lineHeight: 1,
          letterSpacing: '0.02em',
        }}>
          Working on
        </span>
        <span style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#0f172a',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
          fontFamily: 'inherit',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          {selectedCaseName || 'Selected Case'}
        </span>
      </div>
      
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 500,
        color: '#10b981',
        background: 'rgba(16, 185, 129, 0.1)',
        padding: '4px 10px',
        borderRadius: 20,
        flexShrink: 0,
        whiteSpace: 'nowrap' as const,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
        Active
      </span>
    </div>
  )
}
