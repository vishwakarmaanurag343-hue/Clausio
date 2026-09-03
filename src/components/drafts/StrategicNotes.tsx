'use client'

interface StrategicNotesProps {
  value: string
  onChange: (value: string) => void
}

export default function StrategicNotes({
  value,
  onChange,
}: StrategicNotesProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#334155',
        }}
      >
        Strategic Notes
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Example: Focus on financial contradictions, challenge the respondent's income disclosures, emphasize WhatsApp admissions, and strengthen the maintenance claim with banking evidence."
        className="glass-button"
        style={{
          width: '100%',
          minHeight: 180,
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid rgba(226,232,240,.9)',
          background: 'rgba(255,255,255,.75)',
          color: '#0f172a',
          fontSize: 14,
          lineHeight: 1.6,
          fontFamily: 'inherit',
          outline: 'none',
          resize: 'vertical',
        }}
      />

      <span
        style={{
          fontSize: 11,
          color: '#64748b',
          lineHeight: 1.5,
        }}
      >
        These instructions guide Clausio AI while generating the legal draft.
        Leave this blank to generate a draft solely from the case analysis.
      </span>
    </div>
  )
}