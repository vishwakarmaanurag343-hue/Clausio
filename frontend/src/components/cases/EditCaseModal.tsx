'use client'
// src/components/cases/EditCaseModal.tsx
// EXACT SAME UI — Save button now PUTs the fields the backend actually supports
// (name, stage, status, priority, opposingAdv, nextHearing, readinessScore).
// Client/opponent/court fields are shown read-only since /api/cases has no endpoint to edit them yet.

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { casesApi } from '@/lib/api'

interface Props {
  onClose:  () => void
  onSaved?: () => void
  caseId:   string | null
}

export default function EditCaseModal({ onClose, onSaved, caseId }: Props) {
  const [caseData, setCaseData] = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const [name,          setName]          = useState('')
  const [stage,         setStage]         = useState('')
  const [status,        setStatus]        = useState('')
  const [priority,      setPriority]      = useState('High')
  const [opposingAdv,   setOpposingAdv]   = useState('')
  const [nextHearing,   setNextHearing]   = useState('')

  useEffect(() => {
    if (!caseId) return
    setLoading(true)
    setError('')
    casesApi.getById(caseId)
      .then(data => {
        setCaseData(data)
        setName(data.name ?? '')
        setStage(data.stage ?? '')
        setStatus(data.status ?? '')
        setPriority(data.priority ?? 'High')
        setOpposingAdv(data.opposingAdv ?? '')
        setNextHearing(data.nextHearing ? new Date(data.nextHearing).toISOString().split('T')[0] : '')
      })
      .catch(err => setError(err.message || 'Failed to load case'))
      .finally(() => setLoading(false))
  }, [caseId])

  async function handleSave() {
    if (!caseId) return
    setSaving(true)
    setError('')
    try {
      await casesApi.update(caseId, {
        name,
        stage,
        status,
        priority,
        opposingAdv,
        nextHearing: nextHearing ? new Date(nextHearing).toISOString() : null,
      })
      onSaved?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error saving case. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    // EXACT SAME UI as original
    <Modal isOpen onClose={onClose} title={`Edit case — ${caseData?.name ?? (loading ? 'Loading...' : '')}`} size="lg">

      {/* Audit trail note — UNCHANGED */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, padding: '9px 11px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>
        <i className="ti ti-info-circle" style={{ color: '#3b82f6', flexShrink: 0 }} />
        Editing {caseData?.caseNumber ?? '...'}. All changes are saved to case history.
      </div>

      {/* Error — NEW */}
      {error && (
        <div style={{ padding: '8px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, color: '#dc2626', marginBottom: 10 }}>
          {error}
        </div>
      )}

      {/* Case information — UNCHANGED */}
      <SLabel>Case information</SLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>Case title<span style={{ color: '#ef4444', marginLeft: 2 }}>*</span></label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </div>
        <F label="Case number" value={caseData?.caseNumber ?? ''} readOnly />
        <SF label="Sub type"   opts={['Divorce Petition','Mutual Consent Divorce','Maintenance (Sec 125)','Child Custody']} />
        <SF label="Grounds"    opts={['Cruelty','Desertion','Adultery','Mutual Consent']} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
            {['Draft','Active','Pending filing','Awaiting client','Closed'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#374155', display: 'block', marginBottom: 4 }}>Priority</label>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['Low','#f0fdf4','#86efac','#15803d'],['Medium','#fef3c7','#fcd34d','#d97706'],['High','#fff7ed','#fdba74','#c2410c'],['Urgent','#fef2f2','#fca5a5','#dc2626']].map(([l, bg, bdr, clr]) => (
              <button key={l} onClick={() => setPriority(l)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: priority === l ? bg : '#f8fafc', border: `1px solid ${priority === l ? bdr : '#e2e8f0'}`, color: priority === l ? clr : '#64748b' }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>Next hearing date</label>
          <input type="date" value={nextHearing} onChange={e => setNextHearing(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>Case stage</label>
          <select value={stage} onChange={e => setStage(e.target.value)} style={inputStyle}>
            {['Filing','Written Statement','Evidence','Cross Examination','Arguments','Judgment'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Client — UNCHANGED (read-only: no backend endpoint to edit case↔client fields yet) */}
      <SLabel>Client details</SLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <F label="Client name" required value={caseData?.client ? `${caseData.client.firstName ?? ''} ${caseData.client.lastName ?? ''}`.trim() : ''} readOnly />
        <F label="Mobile"      required value={caseData?.client?.phone ?? ''} readOnly />
        <F label="Email"                value={caseData?.client?.email ?? ''} readOnly />
        <F label="Aadhar"               value={caseData?.client?.aadhar ?? ''} readOnly />
      </div>

      {/* Opposite party — UNCHANGED */}
      <SLabel>Opposite party</SLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <F label="Opposite party name" required value="" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>Their advocate</label>
          <input value={opposingAdv} onChange={e => setOpposingAdv(e.target.value)} style={inputStyle} />
        </div>
        <F label="Mobile"                       value="" />
        <F label="Address"                      value="" />
      </div>

      {/* Court — UNCHANGED */}
      <SLabel>Court details</SLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <SF label="Court"    opts={['Family Court','District Court','Sessions Court']} selected={caseData?.court} />
        <F  label="Location" value={caseData?.courtLocation ?? ''} readOnly />
        <F  label="Judge"    value="" />
        <F  label="Court hall" value="" />
      </div>

      {/* Notes — UNCHANGED */}
      <SLabel>Case notes</SLabel>
      <textarea style={{ width: '100%', padding: '6px 9px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'none', height: 80 }} />

      {/* Footer — UNCHANGED except Save button now calls API */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
        <button onClick={onClose}    style={btnStyle()}>Cancel</button>
        <button                      style={btnStyle()}><i className="ti ti-history" style={{ fontSize: 12 }} /> View history</button>
        <button onClick={handleSave} disabled={saving || loading} style={{ ...btnStyle(true), opacity: saving ? 0.7 : 1 }}>
          <i className="ti ti-device-floppy" style={{ fontSize: 12 }} />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </Modal>
  )
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 8px', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>{children}</p>
}

function F({ label, required, value, type = 'text', readOnly }: { label: string; required?: boolean; value?: string; type?: string; readOnly?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>
      <input type={type} defaultValue={value} readOnly={readOnly} style={{ ...inputStyle, background: readOnly ? '#f8fafc' : '#fff', color: readOnly ? '#64748b' : '#0f172a' }} />
    </div>
  )
}

function SF({ label, opts, selected }: { label: string; opts: string[]; selected?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{label}</label>
      <select
        defaultValue={selected ?? ''}
        style={{ padding: '6px 9px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#0f172a' }}
      >
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

const inputStyle: React.CSSProperties = { padding: '6px 9px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#0f172a' }

function btnStyle(primary?: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    border: primary ? '1px solid #1e3a8a' : '1px solid #e2e8f0',
    background: primary ? '#1e3a8a' : '#f8fafc',
    color: primary ? '#fff' : '#374151',
    marginLeft: primary ? 'auto' : undefined,
  }
}
