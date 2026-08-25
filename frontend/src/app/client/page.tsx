'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { casesApi, aiApi } from '@/lib/api'

import WhatsAppUpdate, { type UpdateChannel } from '@/components/client/WhatsAppUpdate'
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
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (!selectedCaseId) return
    casesApi.getById(selectedCaseId)
      .then(setCaseData)
      .catch(err => console.error(err))
  }, [selectedCaseId])

  const generate = useCallback(async (tone: string, language: string) => {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    setGenerating(true)
    setError('')
    try {
      // Channel rides along — backend persona is shared, only the format changes.
      const res = await aiApi.getWhatsApp(selectedCaseId, { tone, language, channel })
        setMessage(res.message ?? res.result ?? '')
    } catch (err: any) {
      setError(err.message || 'Failed to generate client update')
    } finally {
      setGenerating(false)
    }
  }, [selectedCaseId, channel])

  const clientName = caseData?.client
    ? `${caseData.client.firstName ?? ''} ${caseData.client.lastName ?? ''}`.trim()
    : 'No client'

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as UpdateChannel)}
                style={{
                  padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="whatsapp">🟢 WhatsApp</option>
                <option value="email">✉ Email</option>
              </select>
            </div>
          </div>

          {/* ================= CONTENT ================= */}
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16, flexShrink: 0 }}>
              {error}
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

              <WhatsAppPreview message={message} generating={generating} onRegenerate={generate} channel={channel} />
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
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as UpdateChannel)}
              style={{
                padding: '8px 10px',
                borderRadius: 20,
                border: 'none',
                background: '#e2e8f0',
                color: '#0f172a',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="whatsapp">🟢 WhatsApp</option>
              <option value="email">✉ Email</option>
            </select>
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
                { title: 'Status', value: 'Active', sub: 'Client' },
                { title: 'Updates', value: '4', sub: 'Sent' },
                { title: 'Pending', value: '1', sub: 'Draft' },
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
                  <WhatsAppPreview message={message} generating={generating} onRegenerate={generate} channel={channel} />
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
