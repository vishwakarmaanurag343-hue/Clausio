'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'clausio_notification_settings'

const DEFAULT = {
  emailNotif:        true,
  desktopNotif:      true,
  whatsappNotif:     false,
  smsNotif:          false,
  upcomingHearings:  true,
  deadlineReminders: true,
  newCaseAssignment: true,
  documentUpload:    false,
  draftCompleted:    true,
  strategyGenerated: true,
  financialAnalysis: false,
  readinessReport:   true,
  clientMessage:     true,
  whatsappDelivery:  false,
  clientPortal:      true,
  invoiceGenerated:  true,
  paymentReceived:   true,
  subscriptionRenew: true,
  digestFrequency:   'Daily',
  reminderTime:      '09:00',
}

export default function NotificationSettings() {
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

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Notifications</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Control how Clausio keeps you informed.</p>
      </div>

      {saved && <Banner message="Notification settings saved." />}

      <Section title="Delivery Channels">
        <Toggle title="Email Notifications"   subtitle="Receive updates via email."                    value={s.emailNotif}    onChange={v => update('emailNotif', v)} />
        <Toggle title="Desktop Notifications" subtitle="Show notifications inside Clausio."            value={s.desktopNotif}  onChange={v => update('desktopNotif', v)} />
        <Toggle title="WhatsApp Alerts"       subtitle="Receive important alerts on WhatsApp."         value={s.whatsappNotif} onChange={v => update('whatsappNotif', v)} />
        <Toggle title="SMS Notifications"     subtitle="Receive urgent alerts by SMS."                 value={s.smsNotif}      onChange={v => update('smsNotif', v)} />
      </Section>

      <Section title="Case Events">
        <Toggle title="Upcoming Hearings"    subtitle="Notify before every scheduled hearing."         value={s.upcomingHearings}  onChange={v => update('upcomingHearings', v)} />
        <Toggle title="Deadline Reminders"   subtitle="Receive reminders for filing deadlines."        value={s.deadlineReminders} onChange={v => update('deadlineReminders', v)} />
        <Toggle title="New Case Assignment"  subtitle="Notify when a new case is assigned."            value={s.newCaseAssignment} onChange={v => update('newCaseAssignment', v)} />
        <Toggle title="Document Upload"      subtitle="Notify when documents are added to a case."    value={s.documentUpload}    onChange={v => update('documentUpload', v)} />
      </Section>

      <Section title="AI Notifications">
        <Toggle title="Draft Completed"      subtitle="Notify when AI drafting finishes."              value={s.draftCompleted}    onChange={v => update('draftCompleted', v)} />
        <Toggle title="Strategy Generated"   subtitle="Notify after AI litigation strategy is ready." value={s.strategyGenerated} onChange={v => update('strategyGenerated', v)} />
        <Toggle title="Financial Analysis"   subtitle="Notify after maintenance analysis completes."   value={s.financialAnalysis} onChange={v => update('financialAnalysis', v)} />
        <Toggle title="Readiness Report"     subtitle="Notify when readiness report is generated."     value={s.readinessReport}   onChange={v => update('readinessReport', v)} />
      </Section>

      <Section title="Client Communication">
        <Toggle title="Client Message"        subtitle="Notify when clients send messages."             value={s.clientMessage}    onChange={v => update('clientMessage', v)} />
        <Toggle title="WhatsApp Delivery"     subtitle="Notify when WhatsApp updates are delivered."   value={s.whatsappDelivery} onChange={v => update('whatsappDelivery', v)} />
        <Toggle title="Client Portal Activity" subtitle="Notify when clients upload documents."         value={s.clientPortal}     onChange={v => update('clientPortal', v)} />
      </Section>

      <Section title="Billing">
        <Toggle title="Invoice Generated"    subtitle="Notify when invoices are created."              value={s.invoiceGenerated}  onChange={v => update('invoiceGenerated', v)} />
        <Toggle title="Payment Received"     subtitle="Notify after receiving client payments."        value={s.paymentReceived}   onChange={v => update('paymentReceived', v)} />
        <Toggle title="Subscription Renewal" subtitle="Reminder before subscription renewal date."     value={s.subscriptionRenew} onChange={v => update('subscriptionRenew', v)} />
      </Section>

      <Section title="Daily Summary">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Digest Frequency</label>
            <select value={s.digestFrequency} onChange={e => update('digestFrequency', e.target.value)} style={inputStyle}>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Disabled</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Reminder Time</label>
            <input type="time" value={s.reminderTime} onChange={e => update('reminderTime', e.target.value)} style={inputStyle} />
          </div>
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <button onClick={handleSave} style={saveBtn}>
          <i className="ti ti-device-floppy" /> Save Notification Settings
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
