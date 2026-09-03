'use client'

import { useState } from 'react'

const stages = [
  'First Appearance',
  'Interim Application',
  'Written Statement',
  'Evidence',
  'Cross Examination',
  'Arguments',
  'Judgment',
]

export default function HearingForm() {
  const [hearingDate, setHearingDate] = useState('2024-06-17')
  const [stage, setStage] = useState('Interim Application')
  const [whatHappened, setWhatHappened] = useState('Judge expressed strong displeasure regarding repeated delays by the respondent. Respondent sought one final opportunity to file a reply.')
  const [judgeObservation, setJudgeObservation] = useState('Last opportunity granted. Reply must be filed before next hearing.')

  return (
    <div className="glass-card" style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            Record Hearing
          </h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
            Record today's proceedings
          </p>
        </div>
      </div>

      {/* Date + Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Field label="Hearing Date" required>
          <input type="date" value={hearingDate} onChange={(e) => setHearingDate(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Stage" required>
          <select value={stage} onChange={(e) => setStage(e.target.value)} style={inputStyle}>
            {stages.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* What happened */}
      <Field label="What happened today?" required>
        <textarea rows={4} value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)} placeholder="Describe the hearing..." style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
      </Field>

      {/* Judge */}
      <Field label="Judge's Observation">
        <textarea rows={3} value={judgeObservation} onChange={(e) => setJudgeObservation(e.target.value)} placeholder="Judge's remarks..." style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} />
      </Field>
      
      {/* Next Hearing Date */}
      <Field label="Next Hearing Date">
        <input type="date" style={inputStyle} />
      </Field>

      {/* Save Button */}
      <button className="glass-button" onClick={() => alert('Hearing saved successfully!')} style={{ width: '100%', marginTop: 12, background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
        Save Hearing Record
      </button>
    </div>
  )
}

function Field({ label, required, children }: { label: string, required?: boolean, children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'rgba(255,255,255,0.6)',
  fontSize: 13,
  color: '#0f172a',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}