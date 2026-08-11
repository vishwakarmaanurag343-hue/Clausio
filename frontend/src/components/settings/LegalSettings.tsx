'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'clausio_legal_settings'

const COURTS = [
  'Supreme Court of India',
  'High Court',
  'District Court',
  'Family Court',
  'Sessions Court',
  'Commercial Court',
  'Consumer Forum',
  'Labour Court',
  'NCLT',
  'Income Tax Tribunal (ITAT)',
]

const PRACTICE_AREAS = [
  'Family Law', 'Criminal Law', 'Civil Litigation', 'Corporate Law',
  'GST / Indirect Tax', 'Income Tax', 'NI Act 138', 'Arbitration',
  'Consumer Protection', 'RERA', 'Labour Law', 'Constitutional Law',
]

const DEFAULT = {
  primaryCourt:        'High Court',
  preferredCourts:     [] as string[],
  autoAssignCaseType:  true,
  autoGenerateSummary: true,
  autoTimeline:        true,
  limitationAlerts:    true,
  hearingReminders:    true,
  reminderDaysBefore:  '3',
  defaultPriority:     'Medium',
  defaultStage:        'Filing',
}

export default function LegalSettings() {
  const [s,     setS]     = useState(DEFAULT)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setS({ ...DEFAULT, ...JSON.parse(stored) })
  }, [])

  function update(key: string, value: any) {
    setS(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleCourt(court: string) {
    setS(prev => ({
      ...prev,
      preferredCourts: prev.preferredCourts.includes(court)
        ? prev.preferredCourts.filter(c => c !== court)
        : [...prev.preferredCourts, court]
    }))
    setSaved(false)
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Legal Preferences</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Configure court preferences and case defaults.</p>
      </div>

      {saved && <Banner message="Legal settings saved." />}

      {/* Court Preferences */}
      <Section title="Preferred Courts">
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, marginTop: -8 }}>Select courts you practise in. AI will prioritise relevant procedures.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COURTS.map(court => {
            const selected = s.preferredCourts.includes(court)
            return (
              <button key={court} onClick={() => toggleCourt(court)}
                style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${selected ? '#2563eb' : '#e2e8f0'}`, background: selected ? '#eff6ff' : '#f8fafc', color: selected ? '#1e40af' : '#475569', fontSize: 12, fontWeight: selected ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                {selected && '✓ '}{court}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Case Defaults */}
      <Section title="Case Defaults">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Default Priority</label>
            <select value={s.defaultPriority} onChange={e => update('defaultPriority', e.target.value)} style={inputStyle}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Default Stage</label>
            <select value={s.defaultStage} onChange={e => update('defaultStage', e.target.value)} style={inputStyle}>
              <option>Filing</option>
              <option>Service / Notice</option>
              <option>Written Statement</option>
              <option>Evidence</option>
              <option>Arguments</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Hearing Reminder (days before)</label>
            <select value={s.reminderDaysBefore} onChange={e => update('reminderDaysBefore', e.target.value)} style={inputStyle}>
              <option value="1">1 day before</option>
              <option value="2">2 days before</option>
              <option value="3">3 days before</option>
              <option value="7">1 week before</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Automation */}
      <Section title="Automation">
        <Toggle title="Auto-detect Case Type"     subtitle="AI automatically classifies case type on creation."    value={s.autoAssignCaseType}  onChange={v => update('autoAssignCaseType', v)} />
        <Toggle title="Auto-generate Summary"     subtitle="Generate AI summary when a new case is created."       value={s.autoGenerateSummary} onChange={v => update('autoGenerateSummary', v)} />
        <Toggle title="Auto-build Timeline"       subtitle="Automatically extract events into case timeline."       value={s.autoTimeline}        onChange={v => update('autoTimeline', v)} />
        <Toggle title="Limitation Period Alerts"  subtitle="Alert when limitation period is approaching."           value={s.limitationAlerts}    onChange={v => update('limitationAlerts', v)} />
        <Toggle title="Hearing Reminders"         subtitle="Remind before each scheduled hearing."                 value={s.hearingReminders}    onChange={v => update('hearingReminders', v)} />
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <button onClick={handleSave} style={saveBtn}>
          <i className="ti ti-device-floppy" /> Save Legal Settings
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid #f8fafc' }}>
      <div>
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{title}</div>
        <div style={{ marginTop: 3, color: '#64748b', fontSize: 12 }}>{subtitle}</div>
      </div>
      <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 999, background: value ? '#2563eb' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, marginLeft: 16 }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  )
}

function Banner({ message }: { message: string }) {
  return <div style={{ marginBottom: 20, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d' }}>✓ {message}</div>
}

const saveBtn: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }
