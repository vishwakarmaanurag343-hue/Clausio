'use client'

const DRAFT_TYPES = [
  'Divorce Petition',
  'Maintenance Petition',
  'Bail Application',
  'Written Statement',
  'Affidavit',
  'Legal Notice',
]

interface DraftTypeSelectorProps {
  value: string
  onChange: (value: string) => void
}

export default function DraftTypeSelector({
  value,
  onChange,
}: DraftTypeSelectorProps) {
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
        Type of Draft
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-button"
        style={{
          width: '100%',
          height: 44,
          padding: '0 14px',
          borderRadius: 12,
          border: '1px solid rgba(226,232,240,.9)',
          background: 'rgba(255,255,255,.75)',
          color: '#0f172a',
          fontSize: 14,
          fontWeight: 500,
          outline: 'none',
          cursor: 'pointer',
          appearance: 'auto',
        }}
      >
        {DRAFT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  )
}