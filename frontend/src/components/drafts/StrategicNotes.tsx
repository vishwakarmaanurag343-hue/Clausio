import React from 'react'
import { MotionButton } from '@/components/ui/Motion'

export default function StrategicNotes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>Strategic notes</label>
      <textarea
        placeholder="Focus on financial contradictions. Push maintenance above Rs 50,000..."
        style={{
          width: '100%', minHeight: 140, padding: '14px 16px',
          border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12,
          fontSize: 13, background: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', outline: 'none',
          resize: 'vertical', color: '#0f172a', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', fontWeight: 500
        }}
      />
      <MotionButton className="ai-magic-button" style={{
        marginTop: 12, width: '100%', padding: '16px',
        fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8
      }}>
        <i className="ti ti-sparkles" style={{ fontSize: 18 }} /> Generate legal draft
      </MotionButton>
    </div>
  )
}