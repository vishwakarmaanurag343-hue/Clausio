'use client'

import { useState } from 'react'

import DraftEditor from './DraftEditor'
import DraftPreview from './DraftPreview'

export default function DraftsTab() {
  const [draftType, setDraftType] = useState('Divorce Petition')
  const [strategicNotes, setStrategicNotes] = useState('')
  const [generatedDraft, setGeneratedDraft] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  function handleGenerate() {
    setIsGenerating(true)

    // TODO:
    // Replace this with backend / LLM response later.
    // For now we only simulate generation.

    setTimeout(() => {
      setGeneratedDraft({
        generatedAt: new Date(),
      })

      setIsGenerating(false)
    }, 1000)
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* ================= HEADER ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '-0.5px',
            }}
          >
            Drafting
          </h1>

          <p
            style={{
              marginTop: 4,
              color: '#64748b',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Generate structured legal drafts using Clausio AI.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            alignSelf: 'flex-start',
          }}
        >
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(59,130,246,.10)',
              color: '#2563eb',
              fontWeight: 600,
              fontSize: 11,
              border: '1px solid rgba(59,130,246,.20)',
            }}
          >
            Family & Matrimonial
          </div>

          <button
            className="glass-button"
            style={{
              height: 38,
              padding: '0 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(59,130,246,.30)',
            }}
            onClick={handleGenerate}
          >
            <i className="ti ti-file-ai" />

            {isGenerating
              ? 'Generating...'
              : 'Generate Draft'}
          </button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px minmax(0, 1fr)',
          gap: 20,
          flex: 1,
          minHeight: 0,
        }}
      >
        <DraftEditor
          draftType={draftType}
          notes={strategicNotes}
          onDraftTypeChange={setDraftType}
          onNotesChange={setStrategicNotes}
          onGenerate={handleGenerate}
          loading={isGenerating}
        />

        <DraftPreview
          draft={generatedDraft}
          draftType={draftType}
          loading={isGenerating}
        />
      </div>
    </div>
  )
}