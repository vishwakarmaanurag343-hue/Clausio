'use client'

import { useState, useEffect, useMemo } from 'react'
import { aiApi, parseAiJson } from '@/lib/api'
import FormattedMarkdown from '@/components/common/FormattedMarkdown'
import type { UpdateChannel } from './WhatsAppUpdate'

interface Props {
  message:    string
  generating: boolean
  onRegenerate: (tone: string, language: string) => void
  channel: UpdateChannel
}

type ParsedUpdate = { subject: string; body: string; actionRequired: string | null }

/** Accepts the new {subject,body,actionRequired} JSON or legacy plain-text drafts. */
function extractUpdate(raw: string): ParsedUpdate {
  const empty = { subject: '', body: '', actionRequired: null as string | null }
  if (!raw) return empty

  let text = raw.trim()
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')

  const parsed = parseAiJson<any>(text)
  if (parsed && typeof parsed === 'object' && (parsed.body ?? parsed.Body)) {
    return {
      subject: String(parsed.subject ?? parsed.Subject ?? ''),
      body: String(parsed.body ?? parsed.Body ?? ''),
      actionRequired: parsed.actionRequired ? String(parsed.actionRequired) : null,
    }
  }

  // Legacy / free-form fallback: reuse the old field-extraction heuristics.
  let body = text
  const jsonMatch = text.match(/"(?:DraftText|message|text|result)"\s*:\s*"([\s\S]*?)"\s*\}?\s*$/) ||
                    text.match(/"(?:DraftText|message|text|result)"\s*:\s*"([\s\S]*)"/)
  if (jsonMatch && jsonMatch[1]) body = jsonMatch[1]
  else if (parsed && typeof parsed === 'string') body = parsed
  else if (parsed?.DraftText) body = parsed.DraftText
  else if (parsed?.message) body = parsed.message
  else if (parsed?.text) body = parsed.text
  else if (parsed?.result) body = parsed.result

  body = body.replace(/^\{\s*"(?:DraftText|message|text|result)"\s*:\s*"/i, '')
    .replace(/"\s*\}\s*$/i, '')
    .replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')

  return { ...empty, body: body.trim() }
}

function renderFormattedText(text: string) {
  if (!text) return null
  const lines = text.split('\n')

  return lines.map((line, lineIdx) => {
    // Split by markdown bold markers (**text** or *text*)
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g)

    return (
      <div key={lineIdx} style={{ minHeight: line.trim() ? 'auto' : '1.2em' }}>
        {parts.map((part, partIdx) => {
          if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
            const clean = part.replace(/^(\*\*|\*)/, '').replace(/(\*\*|\*)$/, '')
            return <strong key={partIdx} style={{ fontWeight: 700, color: '#0f172a' }}>{clean}</strong>
          }
          return <span key={partIdx}>{part}</span>
        })}
      </div>
    )
  })
}

const GENERATING_STEPS = [
  { icon: 'ti-database-search', text: 'Gathering case memories & hearing records...' },
  { icon: 'ti-brain', text: 'Analyzing legal context & client intent...' },
  { icon: 'ti-message-code', text: 'Drafting client update...' },
  { icon: 'ti-sparkles', text: 'Polishing language, tone & formatting...' }
]

function GeneratingIndicator() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % GENERATING_STEPS.length)
    }, 1400)
    return () => clearInterval(timer)
  }, [])

  const current = GENERATING_STEPS[step]

  return (
    <div
      style={{
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        maxWidth: 360,
        textAlign: 'center',
      }}
    >
      <div style={{ position: 'relative', width: 44, height: 44, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          className="animate-spin"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid #e2e8f0',
            borderTopColor: '#2563eb'
          }}
        />
        <i className={`ti ${current.icon}`} style={{ fontSize: 20, color: '#2563eb' }} />
      </div>

      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
        AI Pipeline Active
      </div>

      <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, minHeight: 20, transition: 'all 0.3s ease' }}>
        {current.text}
      </div>
    </div>
  )
}

export default function WhatsAppPreview({ message, generating, onRegenerate, channel }: Props) {
  const [translating, setTranslating] = useState(false)
  const [copied,       setCopied]     = useState(false)
  const [translated,   setTranslated] = useState('')
  const [customText,   setCustomText] = useState<string | null>(null)
  const [isEditing,    setIsEditing]  = useState(false)

  useEffect(() => {
    setCustomText(null)
    setIsEditing(false)
    setTranslated('')
  }, [message])

  const isEmail = channel === 'email'

  // Parse the raw payload into subject / body / actionRequired
  const update = useMemo(() => extractUpdate(translated || message), [translated, message])
  const baseBody = update.body

  // Use custom live-edited text if user modified it, else base body
  const activeText = customText !== null ? customText : baseBody

  async function handleTranslate() {
    if (!activeText.trim()) return
    setTranslating(true)
    try {
      const res = await aiApi.translate({ text: activeText })
      const text = res.translatedText ?? res.result ?? ''
      setTranslated(text)
      setCustomText(null)
    } catch (err) {
      console.error(err)
    } finally {
      setTranslating(false)
    }
  }

  async function handleCopy() {
    if (!activeText.trim()) return
    const clip = isEmail
      ? `Subject: ${update.subject}\n\n${activeText.replace(/\*\*([^*]+)\*\*/g, '$1')}`
      : activeText.replace(/\*\*([^*]+)\*\*/g, '*$1*')
    await navigator.clipboard.writeText(clip)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSend() {
    if (!activeText.trim()) return
    if (isEmail) {
      const url = `mailto:?subject=${encodeURIComponent(update.subject || 'Case Update')}&body=${encodeURIComponent(activeText.replace(/\*\*([^*]+)\*\*/g, '$1'))}`
      window.location.href = url
    } else {
      const waText = activeText.replace(/\*\*([^*]+)\*\*/g, '*$1*')
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank')
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 2px 8px rgba(15,23,42,.04)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexShrink: 0,
          gap: 10,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Preview
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isEmail ? '#eff6ff' : '#dcfce7', color: isEmail ? '#2563eb' : '#15803d' }}>
              {isEmail ? '✉ Email' : '🟢 WhatsApp'}
            </span>
          </h2>

          <p
            style={{
              marginTop: 5,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            AI generated · Click text or edit button to customize
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {activeText && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: '1px solid #cbd5e1',
                background: isEditing ? '#eff6ff' : '#f8fafc',
                color: isEditing ? '#2563eb' : '#475569',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'inherit',
              }}
            >
              <i className={isEditing ? "ti ti-check" : "ti ti-edit"} />
              {isEditing ? 'Done Editing' : 'Edit Text'}
            </button>
          )}

          <span
            style={{
              background: activeText ? '#dcfce7' : '#f1f5f9',
              color: activeText ? '#15803d' : '#64748b',
              padding: '8px 14px',
              borderRadius: 20,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {activeText ? (customText !== null ? 'Edited' : 'Ready') : 'No message yet'}
          </span>
        </div>
      </div>

      {/* Canvas — chat bubble for WhatsApp, letter card for Email */}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: isEmail ? '#f8fafc' : '#ece5dd',
          borderRadius: 18,
          padding: 20,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {generating && (
          <GeneratingIndicator />
        )}
        {!generating && !activeText && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20, margin: 'auto' }}>
            Configure the update on the left and click Generate for {isEmail ? 'Email' : 'WhatsApp'}.
          </div>
        )}
        {!generating && activeText && (
          isEmail ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                width: isEditing ? '100%' : '92%',
                maxWidth: '100%',
                marginLeft: 'auto',
                marginRight: 'auto',
                flex: isEditing ? 1 : 'initial',
                display: 'flex',
                flexDirection: 'column',
                minHeight: isEditing ? 0 : 'initial',
                lineHeight: 1.65,
                fontSize: 14,
                color: '#111827',
                boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                overflow: 'hidden',
              }}
            >
              {/* Subject */}
              {update.subject && !isEditing && (
                <>
                  <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #eef2f7' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.8 }}>SUBJECT</span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>{update.subject}</div>
                  </div>
                </>
              )}

              <div style={{ padding: isEditing ? 16 : '16px 18px', ...(isEditing ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : {}) }}>
                {isEditing ? (
                  <textarea
                    value={activeText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Edit message here..."
                    style={{
                      width: '100%', height: '100%', flex: 1, minHeight: 0,
                      border: 'none', outline: 'none', background: 'transparent',
                      fontFamily: 'inherit', fontSize: 14, lineHeight: 1.65, color: '#111827', resize: 'none',
                    }}
                  />
                ) : (
                  <div onClick={() => setIsEditing(true)} title="Click to edit text directly" style={{ cursor: 'text' }}>
                    <FormattedMarkdown content={activeText} />
                  </div>
                )}
              </div>

              {update.actionRequired && !isEditing && (
                <div style={{ margin: '0 18px 16px', padding: '9px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 12.5, color: '#b45309', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0 }} />
                  <span><strong>Action required:</strong> {update.actionRequired}</span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                background: '#dcf8c6',
                padding: 18,
                borderRadius: 14,
                width: isEditing ? '100%' : 'auto',
                maxWidth: isEditing ? '100%' : '92%',
                marginLeft: isEditing ? '0' : 'auto',
                flex: isEditing ? 1 : 'initial',
                display: 'flex',
                flexDirection: 'column',
                minHeight: isEditing ? 0 : 'initial',
                lineHeight: 1.6,
                fontSize: 14,
                color: '#111827',
                boxShadow: '0 2px 6px rgba(0,0,0,.08)',
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {isEditing ? (
                <textarea
                  value={activeText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Edit message here..."
                  style={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
                    minHeight: 0,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#111827',
                    resize: 'none',
                  }}
                />
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  title="Click to edit text directly"
                  style={{ cursor: 'text' }}
                >
                  <FormattedMarkdown content={activeText} />
                </div>
              )}
              {update.actionRequired && !isEditing && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #bcd9a5', fontSize: 12.5, color: '#3f6212' }}>
                  ⚠ <strong>Action required:</strong> {update.actionRequired}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Footer */}

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 16,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onRegenerate('Reassuring', 'Hinglish (Hindi + English)')}
          disabled={generating}
          style={{ ...secondaryButton, cursor: generating ? 'not-allowed' : 'pointer' }}
        >
          <i className="ti ti-refresh" />
          Regenerate
        </button>

        <button
          onClick={handleTranslate}
          disabled={translating || !activeText}
          style={{ ...secondaryButton, cursor: (translating || !activeText) ? 'not-allowed' : 'pointer' }}
        >
          <i className="ti ti-language" />
          {translating ? 'Translating...' : 'Translate'}
        </button>

        <button
          onClick={handleCopy}
          disabled={!activeText}
          style={{ ...primaryButton, opacity: activeText ? 1 : 0.6, cursor: activeText ? 'pointer' : 'not-allowed' }}
        >
          <i className="ti ti-copy" />
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          onClick={handleSend}
          disabled={!activeText}
          style={{
            ...primaryButton,
            background: isEmail ? '#2563eb' : '#16a34a',
            boxShadow: isEmail ? '0 10px 25px rgba(37,99,235,.25)' : '0 10px 25px rgba(22,163,74,.25)',
            opacity: activeText ? 1 : 0.6,
            cursor: activeText ? 'pointer' : 'not-allowed',
          }}
        >
          <i className={isEmail ? 'ti ti-mail-forward' : 'ti ti-send'} />
          Send via {isEmail ? 'Email' : 'WhatsApp'}
        </button>
      </div>
    </div>
  )
}

const primaryButton: React.CSSProperties = {
  flex: 1,
  background: '#22c55e',
  color: '#ffffff',
  border: 'none',
  borderRadius: 12,
  padding: '14px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
}

const secondaryButton: React.CSSProperties = {
  background: '#f8fafc',
  color: '#334155',
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '14px 18px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
}
