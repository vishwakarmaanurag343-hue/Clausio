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
  clientName?: string
  onSent?: (channel: 'whatsapp' | 'email', preview: string) => void
  onSendEmail?: () => Promise<void>
  sending?: boolean
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

export default function WhatsAppPreview({ message, generating, onRegenerate, channel, clientName, onSent, onSendEmail, sending }: Props) {
  const [translating, setTranslating] = useState(false)
  const [copied,       setCopied]     = useState(false)
  const [translated,   setTranslated] = useState('')
  const [customText,   setCustomText] = useState<string | null>(null)
  const [isEditing,    setIsEditing]  = useState(false)

  const clientDisplayName = clientName || 'Client'
  const clientInitial = clientDisplayName.charAt(0).toUpperCase()

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

  async function handleSend() {
    if (!activeText.trim()) return
    if (isEmail) {
      if (onSendEmail) {
        // Real send via the backend (Resend). Parent adds to send history on success.
        await onSendEmail()
        return
      }
      const url = `mailto:?subject=${encodeURIComponent(update.subject || 'Case Update')}&body=${encodeURIComponent(activeText.replace(/\*\*([^*]+)\*\*/g, '$1'))}`
      window.location.href = url
      onSent?.('email', activeText)
    } else {
      const waText = activeText.replace(/\*\*([^*]+)\*\*/g, '*$1*')
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank')
      onSent?.('whatsapp', activeText)
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

      {/* Canvas — WhatsApp phone mockup for WhatsApp, email compose frame for Email */}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: isEmail ? '#f8fafc' : '#ece5dd',
          borderRadius: 18,
          padding: isEmail ? 20 : 12,
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

        {/* Edit mode — plain textarea for either channel */}
        {!generating && activeText && isEditing && (
          <textarea
            value={activeText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Edit message here..."
            style={{
              width: '100%', flex: 1, minHeight: 240,
              border: '1px solid #cbd5e1', borderRadius: 12, padding: 14,
              fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6, color: '#0f172a',
              outline: 'none', background: '#fff', resize: 'none',
            }}
          />
        )}

        {/* WhatsApp phone mockup */}
        {!generating && activeText && !isEditing && channel === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            <div style={{ width: 280, background: '#1a1a1a', borderRadius: 36, padding: 8, boxShadow: '0 24px 60px rgba(0,0,0,0.25), inset 0 0 0 2px #333' }}>
              <div style={{ background: '#ECE5DD', borderRadius: 30, overflow: 'hidden', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                {/* WA Header */}
                <div style={{ background: '#075E54', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {clientInitial}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{clientDisplayName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>online</div>
                  </div>
                </div>

                {/* Chat body */}
                <div style={{ flex: 1, padding: '14px 10px', background: '#ECE5DD', minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}>
                  <div
                    onClick={() => setIsEditing(true)}
                    title="Click to edit text directly"
                    style={{ background: '#DCF8C6', borderRadius: '12px 12px 2px 12px', padding: '8px 10px', maxWidth: '88%', alignSelf: 'flex-end', boxShadow: '0 1px 2px rgba(0,0,0,0.13)', cursor: 'text' }}
                  >
                    <div style={{ fontSize: 12, color: '#111', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {activeText.replace(/\*\*([^*]+)\*\*/g, '$1').length > 300
                        ? activeText.replace(/\*\*([^*]+)\*\*/g, '$1').slice(0, 300) + '...'
                        : activeText.replace(/\*\*([^*]+)\*\*/g, '$1')}
                    </div>
                    <div style={{ fontSize: 10, color: '#8696a0', textAlign: 'right', marginTop: 4 }}>
                      {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {' ✓✓'}
                    </div>
                  </div>
                </div>

                {/* WA input bar */}
                <div style={{ background: '#F0F0F0', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '8px 14px', fontSize: 12, color: '#aaa' }}>Type a message</div>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, textAlign: 'center' }}>Preview only — click Send to open WhatsApp</p>
          </div>
        )}

        {/* Email compose frame */}
        {!generating && activeText && !isEditing && channel === 'email' && (
          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>New Message</span>
            </div>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#64748b', flexShrink: 0 }}>
              <strong>To: </strong>{clientDisplayName}
            </div>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#0f172a', flexShrink: 0 }}>
              <strong style={{ color: '#64748b' }}>Subject: </strong>{update.subject || 'Case Update'}
            </div>
            <div
              onClick={() => setIsEditing(true)}
              title="Click to edit text directly"
              style={{ flex: 1, padding: 16, fontSize: 13, color: '#374151', lineHeight: 1.7, overflowY: 'auto', cursor: 'text' }}
            >
              {activeText
                ? <FormattedMarkdown content={activeText} />
                : <span style={{ color: '#94a3b8' }}>Generated email will appear here...</span>}
            </div>
            {update.actionRequired && (
              <div style={{ margin: 16, marginTop: 0, padding: '12px 16px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 13, color: '#b45309', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: '#d97706' }} />
                <div><strong>Action Required:</strong> {update.actionRequired}</div>
              </div>
            )}
          </div>
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
          disabled={!activeText || (isEmail && !!sending)}
          style={{
            ...primaryButton,
            background: isEmail ? '#2563eb' : '#16a34a',
            boxShadow: isEmail ? '0 10px 25px rgba(37,99,235,.25)' : '0 10px 25px rgba(22,163,74,.25)',
            opacity: (!activeText || (isEmail && sending)) ? 0.6 : 1,
            cursor: (!activeText || (isEmail && sending)) ? 'not-allowed' : 'pointer',
          }}
        >
          <i className={isEmail ? 'ti ti-mail-forward' : 'ti ti-send'} />
          {isEmail ? (sending ? 'Sending...' : 'Send Email') : 'Send via WhatsApp'}
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
