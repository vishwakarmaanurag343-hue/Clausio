import React from 'react'
import { MotionCard } from '@/components/ui/Motion'

export default function DraftPreview() {
  return (
    <MotionCard style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', background: 'rgba(255,255,255,0.4)', borderRadius: 24, border: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.3)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <i className="ti ti-file-text" style={{ fontSize: 18, color: '#3b82f6' }} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Generated — Divorce Petition</span>
      </div>

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '32px 40px', minHeight: 600, fontFamily: 'serif', color: '#1e293b', fontSize: 14, lineHeight: 1.8, boxShadow: '0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ marginBottom: 24, textAlign: 'center', fontWeight: 600, letterSpacing: '0.5px' }}>
            IN THE FAMILY COURT AT BANDRA, MUMBAI<br />
            FC/2847/2023
          </div>
          
          <div style={{ marginBottom: 20 }}>
            BETWEEN:<br />
            PRIYA RAJESH SHARMA &nbsp;&nbsp;&nbsp;&nbsp;...PETITIONER<br />
            AND<br />
            ROHIT VIKRAM SHARMA &nbsp;&nbsp;&nbsp;&nbsp;...RESPONDENT
          </div>
          
          <div style={{ marginBottom: 20 }}>
            PETITION UNDER SECTION 13 OF THE<br />
            HINDU MARRIAGE ACT 1955
          </div>

          <div style={{ marginBottom: 20 }}>
            FACTS OF THE CASE:
          </div>

          <p style={{ marginBottom: 20 }}>
            1. The Petitioner and Respondent were married on 14th February 2015 at Shiv Mandir, Dadar, Mumbai as per Hindu rites and ceremonies...
          </p>
          <p style={{ marginBottom: 20 }}>
            2. On 12th August 2020, the Respondent in a drunken state assaulted the Petitioner causing injuries to her left arm and face, necessitating a 2-day hospitalisation at Lilavati Hospital, Bandra (Exhibit B)...
          </p>
        </div>
      </div>
    </MotionCard>
  )
}