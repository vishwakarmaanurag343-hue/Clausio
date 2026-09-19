'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Question {
  id: string
  question: string
  whyNeeded: string
  category: string
}

interface Props {
  caseType: string
  questions: Question[]
  onSubmit: (answers: Record<string, string>) => void
  onSkip: () => void
}

export default function ClarifyingQuestionsModal({ caseType, questions, onSubmit, onSkip }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  function handleSubmit() {
    onSubmit(answers)
  }

  const categoryColors: Record<string, { bg: string; color: string; border: string }> = {
    'Procedural Status': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    'Evidence Gap':      { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    'Party Position':    { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
    'Limitation':        { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    'Bail Status':       { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    'Custody':           { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32,
        maxWidth: 560, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              🤔
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Quick Questions
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                {caseType} case · {questions.length} gap{questions.length > 1 ? 's' : ''} detected
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            Answering these questions will significantly improve the accuracy of your AI analysis. You can also skip and generate with available context.
          </p>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {questions.map((q, i) => {
            const cat = categoryColors[q.category] ?? { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' }
            return (
              <div key={q.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1 }}>{q.question}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, flexShrink: 0 }}>
                      {q.category}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#64748b', paddingLeft: 30 }}>
                    💡 {q.whyNeeded}
                  </p>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Type your answer here (1-2 sentences)..."
                    rows={2}
                    style={{
                      width: '100%', border: '1px solid #e2e8f0', borderRadius: 8,
                      padding: '8px 12px', fontSize: 13, fontFamily: 'inherit',
                      outline: 'none', resize: 'none', boxSizing: 'border-box',
                      background: '#fff', color: '#0f172a', lineHeight: 1.6,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSkip} style={{
            flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: 10,
            background: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Skip — Generate Anyway
          </button>
          <button onClick={handleSubmit} style={{
            flex: 2, padding: '12px', border: 'none', borderRadius: 10,
            background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}>
            ✨ Generate with My Answers
          </button>
        </div>
      </div>
    </div>
  , document.body)
}
