'use client'

import DraftTypeSelector from './DraftTypeSelector'
import StrategicNotes from './StrategicNotes'

interface DraftEditorProps {
  draftType: string
  notes: string
  loading: boolean
  onDraftTypeChange: (value: string) => void
  onNotesChange: (value: string) => void
  onGenerate: () => void
}

export default function DraftEditor({
  draftType,
  notes,
  loading,
  onDraftTypeChange,
  onNotesChange,
  onGenerate,
}: DraftEditorProps) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Draft Configuration
        </h3>

        <p
          style={{
            marginTop: 8,
            marginBottom: 8,
            color: '#64748b',
            fontSize: 13,
          }}
        >
          Configure the draft before generating.
        </p>
      </div>

      <DraftTypeSelector
        value={draftType}
        onChange={onDraftTypeChange}
      />

      <StrategicNotes
        value={notes}
        onChange={onNotesChange}
      />

      <button
        className="glass-button"
        onClick={onGenerate}
        disabled={loading}
        style={{
          marginTop: 'auto',
          minHeight: 48,
          height: 42,
          border: 'none',
          borderRadius: 12,
          background: '#2563eb',
          color: '#fff',
          fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Generating Draft...' : 'Generate Draft'}
      </button>
    </div>
  )
}