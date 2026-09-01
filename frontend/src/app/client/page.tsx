'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { casesApi, aiApi, emailApi, parseAiJson } from '@/lib/api'

import WhatsAppUpdate, { type UpdateChannel, type UpdateOptions } from '@/components/client/WhatsAppUpdate'
import WhatsAppPreview from '@/components/client/WhatsAppPreview'
import GenerateUpdateModal from '@/components/client/GenerateUpdateModal'

export default function ClientPage() {
  const { selectedCaseId } = useCaseStore()
  const [activeTab, setActiveTab] = useState<'update'>('update')
  const [channel, setChannel]     = useState<UpdateChannel>('whatsapp')
  const [showModal, setShowModal] = useState(false)

  const [caseData,  setCaseData]  = useState<any>(null)
  const [message,   setMessage]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending,    setSending]    = useState(false)
  const [clientEmail, setClientEmail] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [error,      setError]      = useState('')

  const [sendHistory, setSendHistory] = useState<Array<{
    id: string
    channel: 'whatsapp' | 'email'
    preview: string
    sentAt: Date
  }>>([])

  useEffect(() => {
    if (!selectedCaseId) return
    casesApi.getById(selectedCaseId)
      .then(data => {
        setCaseData(data)
        // Client follows the selected case — pull their email for direct send.
        setClientEmail(data?.client?.email || '')
      })
      .catch(err => console.error(err))
  }, [selectedCaseId])

  const generate = useCallback(async (tone: string, language: string, options?: UpdateOptions) => {
    if (!selectedCaseId) {
      setError('Select a case first.')
      return
    }
    setGenerating(true)
    setError('')
    try {
      const res = await aiApi.getWhatsApp(selectedCaseId, {
        tone,
        language,
        channel,
        includeHearing:    options?.includeHearing    ?? true,
        includeNextDate:   options?.includeNextDate   ?? true,
        includeActionItem: options?.includeActionItem ?? false,
        includeFeeReminder: options?.includeFeeReminder ?? false,
      })
      setMessage(res.message ?? res.result ?? '')
    } catch (err: any) {
      setError(err.message || 'Failed to generate client update')
    } finally {
      setGenerating(false)
    }
  }, [selectedCaseId, channel])

  const handleSent = useCallback((ch: 'whatsapp' | 'email', preview: string) => {
    setSendHistory(prev => [
      {
        id: Date.now().toString(),
        channel: ch,
        preview: preview.slice(0, 80),
        sentAt: new Date(),
      },
      ...prev.slice(0, 4),
    ])
  }, [])

  const clientName = caseData?.client
    ? `${caseData.client.firstName ?? ''} ${caseData.client.lastName ?? ''}`.trim()
    : 'No client'

  const handleSendEmail = useCallback(async () => {
    if (!selectedCaseId) {
      alert('Select a case first.')
      return
    }
    if (!manualEmail && !clientEmail) {
      alert('Please enter client email address.')
      return
    }
    if (!message) {
      alert('Generate a message first.')
      return
    }

    const toEmail = manualEmail || clientEmail

    setSending(true)
    try {
      // Try to parse subject/body from the AI output; fall back to plain text.
      let subject = 'Case Update from Your Advocate'
      let body = message
      const parsed = parseAiJson<any>(message)
      if (parsed?.subject) subject = String(parsed.subject)
      if (parsed?.body) body = String(parsed.body)

      await emailApi.sendClientEmail(selectedCaseId, {
        toEmail,
        toName: clientName && clientName !== 'No client' ? clientName : '',
        subject,
        body,
      })

      handleSent('email', body)
      alert(`✅ Email sent to ${toEmail}`)
    } catch (err: any) {
      alert(err.message || 'Failed to send. Try again.')
    } finally {
      setSending(false)
    }
  }, [selectedCaseId, clientEmail, manualEmail, message, clientName, handleSent])

  return (
    <>
      <div className="glass-panel mobile-client-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 32px)', overflow: 'hidden', margin: '16px', padding: 20, borderRadius: 24 }}>
        
        {/* ── DESKTOP CLIENT VIEW ── */}
        <div className="desktop-client-view" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* ================= HEADER ================= */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Client
              </h1>
              <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                Generate client updates instantly using AI.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Client Badge */}
              <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 600, fontSize: 11, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                {clientName}
              </div>

              {/* Generate Button */}
              <button
                className="glass-button"
                onClick={() => setShowModal(true)}
                style={{ padding: '0 16px', height: 38, borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
              >
                <i className="ti ti-sparkles" />
                Generate Update
              </button>
            </div>
          </div>

          {/* ================= TABS ================= */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 12,
              marginBottom: 16,
              flexShrink: 0,
            }}
          >
            <TabButton
              active={activeTab === 'update'}
              onClick={() => setActiveTab('update')}
            >
              Client Update
            </TabButton>

            {/* Channel picker — same persona, different format */}
            <div style={{ marginLeft: 4 }}>
              <ChannelSwitcher channel={channel} setChannel={setChannel} />
            </div>
          </div>

          {/* ================= CONTENT ================= */}
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16, flexShrink: 0 }}>
              {error}
            </div>
          )}

          {channel === 'email' && (
            <div style={{ marginBottom: 16, flexShrink: 0 }}>
              <label style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: 6,
              }}>
                Send To (Email Address)
              </label>
              <input
                type="email"
                placeholder={clientEmail || 'client@email.com'}
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Type the client email address here. Email will be sent directly to this address.
                {clientEmail && !manualEmail && ` (Defaulting to ${clientEmail})`}
              </div>
            </div>
          )}

          {activeTab === 'update' && (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'grid',
                gridTemplateColumns: '36% 64%',
                gap: 24,
              }}
            >
              <WhatsAppUpdate onGenerate={generate} generating={generating} channel={channel} />

              <WhatsAppPreview
                message={message}
                generating={generating}
                onRegenerate={generate}
                channel={channel}
                clientName={clientName}
                onSent={handleSent}
                onSendEmail={handleSendEmail}
                sending={sending}
              />
            </div>
          )}

          {sendHistory.length > 0 && (
            <div style={{ marginTop: 16, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Sent this session
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sendHistory.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: item.channel === 'whatsapp' ? '#dcfce7' : '#dbeafe',
                      color: item.channel === 'whatsapp' ? '#16a34a' : '#2563eb',
                      flexShrink: 0,
                    }}>
                      {item.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.preview}...
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                      {item.sentAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── MOBILE CLIENT VIEW (Matching Prototype) ── */}
        <div className="mobile-client-view" style={{ display: 'none', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* Top Pill Tabs Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: 30,
              padding: '6px 8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              gap: 6,
              justifyContent: 'space-between',
            }}
          >
            <button
              onClick={() => setActiveTab('update')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 20,
                background: '#cbd5e1',
                color: '#0f172a',
                border: 'none',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'inherit',
              }}
            >
              Client Update
            </button>
            <ChannelSwitcher channel={channel} setChannel={setChannel} />
          </div>

          {/* Main Solid Grey Section */}
          <div
            style={{
              background: '#cbd5e1',
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: '24px 16px 40px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              margin: '8px -16px 0 -16px',
              flex: 1,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 2px 6px', fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  Client Updates
                </h2>
                <p style={{ margin: '0 0 14px 6px', fontSize: 11, fontWeight: 600, color: '#475569' }}>
                  {clientName} · Automated AI Drafts
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                Generate
              </button>
            </div>

            {/* 3 Top Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 12,
              }}
            >
              {[
                {
                  title: 'Client',
                  value: clientName && clientName !== 'No client' ? clientName.split(' ')[0] : '—',
                  sub: 'Selected',
                },
                {
                  title: 'Channel',
                  value: channel === 'whatsapp' ? '💬' : '✉️',
                  sub: channel === 'whatsapp' ? 'WhatsApp' : 'Email',
                },
                {
                  title: 'Sent',
                  value: String(sendHistory.length),
                  sub: 'This session',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#e2e8f0',
                    borderRadius: 22,
                    padding: '16px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: 110,
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{item.value}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 4 }}>{item.title}</span>
                </div>
              ))}
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeTab === 'update' && (
                <>
                  <WhatsAppUpdate onGenerate={generate} generating={generating} channel={channel} />
                  <WhatsAppPreview
                    message={message}
                    generating={generating}
                    onRegenerate={generate}
                    channel={channel}
                    clientName={clientName}
                    onSent={handleSent}
                    onSendEmail={handleSendEmail}
                    sending={sending}
                  />
                </>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ================= MODAL ================= */}

      {showModal && (
        <GenerateUpdateModal
          onClose={() => setShowModal(false)}
          onGenerate={async (tone, language) => {
            await generate(tone, language)
            setShowModal(false)
          }}
        />
      )}
    </>
  )
}

/* ================= CHANNEL SWITCHER ================= */

function ChannelSwitcher({
  channel,
  setChannel,
}: {
  channel: UpdateChannel
  setChannel: (c: UpdateChannel) => void
}) {
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(0,0,0,0.04)',
      borderRadius: 12,
      padding: 4,
      gap: 4,
    }}>
      {[
        {
          value: 'whatsapp' as const,
          label: 'WhatsApp',
          activeColor: '#25D366',
          icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          ),
        },
        {
          value: 'email' as const,
          label: 'Email',
          activeColor: '#2563eb',
          icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          ),
        },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => setChannel(opt.value)}
          style={{
            padding: '8px 16px',
            borderRadius: 9,
            border: 'none',
            background: channel === opt.value ? opt.activeColor : 'transparent',
            color: channel === opt.value ? '#fff' : '#64748b',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
          }}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ================= TAB ================= */

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 18px',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 14,
        fontFamily: 'inherit',

        background: active
          ? '#2563eb'
          : '#f8fafc',

        color: active
          ? '#ffffff'
          : '#64748b',

        boxShadow: active
          ? '0 6px 16px rgba(37,99,235,.25)'
          : 'none',
      }}
    >
      {children}
    </button>
  )
}
