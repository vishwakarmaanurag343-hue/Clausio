'use client'

import { useState, useEffect } from 'react'
import { useUIStore } from '@/lib/store'

const STORAGE_KEY = 'clausio_ai_settings'

const DEFAULT = {
  language:          'en',
  draftStyle:        'Professional',
  autoSummary:       true,
  citationSuggest:   true,
  hearingPrep:       true,
  financialIntel:    true,
  clientComms:       true,
  creativity:        45,
}

export default function AISettings() {
  const { language, setLanguage } = useUIStore()
  const [settings, setSettings] = useState(DEFAULT)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setSettings({ ...DEFAULT, ...JSON.parse(stored) })
  }, [])

  function update(key: string, value: any) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setLanguage(settings.language)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const DRAFT_STYLES = ['Professional', 'Aggressive', 'Balanced', 'Concise', 'Detailed']
  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'mr', label: 'Marathi' },
    { code: 'gu', label: 'Gujarati' },
    { code: 'ta', label: 'Tamil' },
    { code: 'te', label: 'Telugu' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>AI Settings</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Configure Clausio AI language, style and features.</p>
      </div>

      {saved && <Banner message="AI settings saved." />}

      {/* Language */}
      <Section title="AI Response Language">
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, marginTop: -8 }}>
          AI will respond in this language for all features.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => update('language', l.code)}
              style={{ padding: '10px 14px', borderRadius: 10, border: `2px solid ${settings.language === l.code ? '#2563eb' : '#e2e8f0'}`, background: settings.language === l.code ? '#eff6ff' : '#fff', color: settings.language === l.code ? '#1e40af' : '#475569', fontWeight: settings.language === l.code ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Draft Style */}
      <Section title="Draft Style">
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, marginTop: -8 }}>
          Tone of AI-generated documents and petitions.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {DRAFT_STYLES.map(s => (
            <button
              key={s}
              onClick={() => update('draftStyle', s)}
              style={{ padding: '8px 16px', borderRadius: 20, border: `2px solid ${settings.draftStyle === s ? '#2563eb' : '#e2e8f0'}`, background: settings.draftStyle === s ? '#eff6ff' : '#fff', color: settings.draftStyle === s ? '#1e40af' : '#475569', fontWeight: settings.draftStyle === s ? 700 : 400, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {settings.draftStyle === s && '✓ '}{s}
            </button>
          ))}
        </div>
      </Section>

      {/* AI Features */}
      <Section title="AI Features">
        <Toggle title="Automatic Case Summary"    subtitle="Generate summaries after document upload."         value={settings.autoSummary}     onChange={v => update('autoSummary', v)} />
        <Toggle title="Legal Citation Suggestions" subtitle="Suggest relevant judgments while drafting."        value={settings.citationSuggest} onChange={v => update('citationSuggest', v)} />
        <Toggle title="AI Hearing Preparation"    subtitle="Generate hearing preparation notes."               value={settings.hearingPrep}     onChange={v => update('hearingPrep', v)} />
        <Toggle title="Financial Intelligence"    subtitle="Estimate maintenance and settlement ranges."        value={settings.financialIntel}  onChange={v => update('financialIntel', v)} />
        <Toggle title="Client Communication"      subtitle="Generate WhatsApp and email drafts for clients."   value={settings.clientComms}     onChange={v => update('clientComms', v)} />
      </Section>

      {/* Creativity */}
      <Section title="AI Creativity">
        <input
          type="range"
          value={settings.creativity}
          min={0} max={100}
          onChange={e => update('creativity', Number(e.target.value))}
          style={{ width: '100%', accentColor: '#2563eb' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginTop: 6 }}>
          <span>Precise ({settings.creativity}%)</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <button onClick={handleSave} style={saveBtn}>
          <i className="ti ti-device-floppy" /> Save AI Settings
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>{title}</div>
      {children}
    </div>
  )
}

function Toggle({ title, subtitle, value, onChange }: { title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div>
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{title}</div>
        <div style={{ marginTop: 3, color: '#64748b', fontSize: 12 }}>{subtitle}</div>
      </div>
      <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 999, background: value ? '#2563eb' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  )
}

function Banner({ message }: { message: string }) {
  return (
    <div style={{ marginBottom: 20, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d' }}>✓ {message}</div>
  )
}

const saveBtn: React.CSSProperties = {
  background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10,
  padding: '12px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
}
