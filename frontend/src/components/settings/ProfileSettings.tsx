'use client'

import { useState, useEffect } from 'react'
import { authApi } from '@/lib/api'

const ROLES = ['SeniorAdvocate', 'JuniorAdvocate', 'Clerk']
const ROLE_LABELS: Record<string, string> = {
  SeniorAdvocate: 'Senior Advocate',
  JuniorAdvocate: 'Junior Advocate',
  Clerk:          'Clerk / Paralegal',
}
const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Chandigarh','Puducherry',
]
const PRACTICE_AREAS = [
  'Family Law','Criminal Law','Civil Litigation','Corporate Law',
  'GST / Indirect Tax','Income Tax','NI Act 138','Arbitration',
  'Consumer Protection','RERA','Labour Law','Constitutional Law','IPR',
]

export default function ProfileSettings() {
  const [firstName,      setFirstName]      = useState('')
  const [lastName,       setLastName]       = useState('')
  const [email,          setEmail]          = useState('')
  const [phone,          setPhone]          = useState('')
  const [role,           setRole]           = useState('SeniorAdvocate')
  const [barCouncil,     setBarCouncil]     = useState('')
  const [firmName,       setFirmName]       = useState('')
  const [city,           setCity]           = useState('')
  const [state,          setState]          = useState('')
  const [experience,     setExperience]     = useState('')
  const [practiceAreas,  setPracticeAreas]  = useState<string[]>([])
  const [bio,            setBio]            = useState('')
  const [saved,          setSaved]          = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')

  useEffect(() => {
    const user = authApi.getUser()
    if (user) {
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
      setEmail(user.email ?? '')
      setRole(user.role ?? 'SeniorAdvocate')
    }
    const extra = localStorage.getItem('clausio_profile_extra')
    if (extra) {
      const e = JSON.parse(extra)
      setPhone(e.phone ?? '')
      setBarCouncil(e.barCouncilNumber ?? '')
      setFirmName(e.lawFirm ?? '')
      setCity(e.city ?? '')
      setState(e.state ?? '')
      setExperience(e.experience ?? '')
      setPracticeAreas(e.practiceAreas ?? [])
      setBio(e.bio ?? '')
    }
  }, [])

  function togglePractice(area: string) {
    setPracticeAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      // Save to localStorage
      const user = authApi.getUser()
      if (user) {
        localStorage.setItem('clausio_user', JSON.stringify({ ...user, firstName, lastName, email, role }))
      }
      localStorage.setItem('clausio_profile_extra', JSON.stringify({
        phone, barCouncilNumber: barCouncil, lawFirm: firmName,
        city, state, experience, practiceAreas, bio,
      }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '—'
  const fullName = `${firstName} ${lastName}`.trim() || 'Your Name'

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Profile</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Your professional details visible across Clausio.</p>
      </div>

      {saved && <Banner type="success" message="Profile saved successfully." />}
      {error && <Banner type="error" message={error} />}

      {/* Avatar card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, background: 'linear-gradient(135deg,#eff6ff,#f0f9ff)', border: '1px solid #bfdbfe', borderRadius: 14, marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24, boxShadow: '0 4px 12px rgba(59,130,246,0.3)', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{fullName}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {ROLE_LABELS[role] ?? role}
            {firmName ? ` · ${firmName}` : ''}
            {city ? ` · ${city}` : ''}
          </div>
          {practiceAreas.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
              {practiceAreas.slice(0, 3).map(a => (
                <span key={a} style={{ fontSize: 10, padding: '2px 7px', background: '#dbeafe', color: '#1e40af', borderRadius: 10, fontWeight: 600 }}>{a}</span>
              ))}
              {practiceAreas.length > 3 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{practiceAreas.length - 3} more</span>}
            </div>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <Section title="Personal Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="First Name *">
            <input value={firstName} onChange={e => { setFirstName(e.target.value); setSaved(false) }} style={inputStyle} placeholder="Rajesh" />
          </Field>
          <Field label="Last Name *">
            <input value={lastName} onChange={e => { setLastName(e.target.value); setSaved(false) }} style={inputStyle} placeholder="Sharma" />
          </Field>
          <Field label="Email Address *">
            <input value={email} onChange={e => { setEmail(e.target.value); setSaved(false) }} style={{ ...inputStyle, background: '#f8fafc' }} readOnly />
          </Field>
          <Field label="Mobile Number">
            <input value={phone} onChange={e => { setPhone(e.target.value); setSaved(false) }} style={inputStyle} placeholder="+91 98765 43210" />
          </Field>
        </div>
      </Section>

      {/* Professional Details */}
      <Section title="Professional Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Role">
            <select value={role} onChange={e => { setRole(e.target.value); setSaved(false) }} style={inputStyle}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
          <Field label="Bar Council Enrollment No.">
            <input value={barCouncil} onChange={e => { setBarCouncil(e.target.value); setSaved(false) }} style={inputStyle} placeholder="MH/1234/2015" />
          </Field>
          <Field label="Law Firm / Chamber">
            <input value={firmName} onChange={e => { setFirmName(e.target.value); setSaved(false) }} style={inputStyle} placeholder="Sharma & Associates" />
          </Field>
          <Field label="Years of Experience">
            <input value={experience} onChange={e => { setExperience(e.target.value); setSaved(false) }} style={inputStyle} placeholder="8 years" />
          </Field>
          <Field label="City">
            <input value={city} onChange={e => { setCity(e.target.value); setSaved(false) }} style={inputStyle} placeholder="Mumbai" />
          </Field>
          <Field label="State">
            <select value={state} onChange={e => { setState(e.target.value); setSaved(false) }} style={inputStyle}>
              <option value="">Select State</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Practice Areas */}
      <Section title="Practice Areas">
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, marginTop: -4 }}>Select all areas you practise in — AI will prioritise relevant laws and judgments.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PRACTICE_AREAS.map(area => {
            const selected = practiceAreas.includes(area)
            return (
              <button
                key={area}
                onClick={() => togglePractice(area)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${selected ? '#3b82f6' : '#e2e8f0'}`, background: selected ? '#eff6ff' : '#f8fafc', color: selected ? '#1e40af' : '#475569', fontSize: 12, fontWeight: selected ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              >
                {selected && '✓ '}{area}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Bio */}
      <Section title="Professional Bio">
        <textarea
          value={bio}
          onChange={e => { setBio(e.target.value); setSaved(false) }}
          placeholder="Brief professional bio — appears on your profile and in AI context..."
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', height: 'auto', padding: '10px 12px' }}
        />
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{bio.length}/500 characters</p>
      </Section>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: saving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <i className="ti ti-device-floppy" />
          {saving ? 'Saving...' : 'Save Profile'}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

function Banner({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div style={{ marginBottom: 20, padding: '10px 14px', background: type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${type === 'success' ? '#86efac' : '#fca5a5'}`, borderRadius: 8, fontSize: 13, color: type === 'success' ? '#15803d' : '#dc2626' }}>
      {type === 'success' ? '✓ ' : '⚠ '}{message}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8,
  padding: '0 12px', fontSize: 13, outline: 'none', background: '#fff',
  boxSizing: 'border-box', color: '#0f172a', fontFamily: 'inherit',
}
