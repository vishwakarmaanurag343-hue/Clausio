'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi } from '@/lib/api'

const SUGGESTIONS = [
  'Urgent Custody',
  'Stay Order',
  'Interim Maintenance',
  'Passport Issue',
  'Domestic Violence',
  'Evidence Objection',
]

export default function EmergencyResponse() {
  const { selectedCaseId } = useCaseStore()
  const [query,      setQuery]      = useState('')
  const [response,   setResponse]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState('')

  async function handleGenerate() {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    if (!query.trim()) { setError('Describe the emergency situation first.'); return }
    setGenerating(true)
    setError('')
    setResponse('')
    try {
      const res = await aiApi.getEmergency(selectedCaseId, { query })
      setResponse(res.response ?? res.result ?? '')
    } catch (err: any) {
      setError(err.message || 'Failed to generate emergency response')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div
      className="glass-card"
      style={{
        border: '1px solid rgba(239, 68, 68, 0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.05)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.1)',
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-alert-triangle" />
        </div>

        <div>
          <div style={{ fontWeight: 600, color: '#991b1b', fontSize: 14 }}>Emergency Response</div>
          <div style={{ color: '#7f1d1d', fontSize: 12, marginTop: 2 }}>Generate an immediate legal response for urgent situations.</div>
        </div>
      </div>

      {/* Body */}

      <div style={{ padding: 16 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the emergency situation..."
          rows={3}
          style={{
            width: '100%',
            resize: 'vertical',
            padding: 12,
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.6)',
            outline: 'none',
            fontSize: 13,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            color: '#0f172a'
          }}
        />

        {/* Quick Suggestions */}

        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(0,0,0,0.05)',
                  background: 'rgba(255,255,255,0.6)',
                  color: '#334155',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, color: '#dc2626', fontSize: 12 }}>
            {error}
          </div>
        )}

        {response && (
          <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, color: '#14532d', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {response}
          </div>
        )}

        {!response && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: 10,
              color: '#1e40af',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <strong>AI Notice:</strong> Clausio will prepare an emergency
            response, identify relevant provisions, suggest supporting
            judgments and generate a ready-to-file draft within seconds.
          </div>
        )}

        {/* Buttons */}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button
            className="glass-button"
            onClick={() => { setQuery(''); setResponse(''); setError('') }}
            style={{
              padding: '0 16px',
              height: 36,
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
              color: '#0f172a'
            }}
          >
            Clear
          </button>

          <button
            className="glass-button"
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: '0 16px',
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: generating ? '#f87171' : '#dc2626',
              color: '#fff',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            <i className="ti ti-bolt" style={{ marginRight: 6 }} />
            {generating ? 'Generating...' : 'Generate Response'}
          </button>
        </div>
      </div>
    </div>
  )
}
