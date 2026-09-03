'use client'
// ─────────────────────────────────────────────────
//  src/components/cases/EditCaseModal.tsx
//
//  Edit existing case — pre-filled form with audit info.
//  Same fields as Add Case but all filled with existing data.
//  Includes View History button and audit trail note.
// ─────────────────────────────────────────────────

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface Props { onClose: () => void; caseId: string | null }

export default function EditCaseModal({ onClose, caseId }: Props) {
  const [priority, setPriority] = useState('High')

  return (
    <Modal isOpen onClose={onClose} title="Edit case — Priya v. Rohit Sharma" size="lg">

      {/* Audit trail note */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, padding: '9px 11px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>
        <i className="ti ti-info-circle" style={{ color: '#3b82f6', flexShrink: 0 }} />
        Editing FC/2847/2023. All changes are saved to case history. Last edited: Today 10:30 AM by Parth Bindra.
      </div>

      {/* Case information */}
      <SLabel>Case information</SLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <F label="Case title" required value="Priya Sharma v. Rohit Vikram Sharma" />
        <F label="Case number" value="FC/2847/2023" />
        <SF label="Sub type" opts={['Divorce Petition','Mutual Consent Divorce','Maintenance (Sec 125)','Child Custody']} />
        <SF label="Grounds" opts={['Cruelty','Desertion','Adultery','Mutual Consent']} />
        <SF label="Status" opts={['Draft','Active','Pending Filing','Awaiting Client']} selected="Active" />
        <div>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>Priority</label>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['Low','#f0fdf4','#86efac','#15803d'],['Medium','#fef3c7','#fcd34d','#d97706'],['High','#fff7ed','#fdba74','#c2410c'],['Urgent','#fef2f2','#fca5a5','#dc2626']].map(([l, bg, bdr, clr]) => (
              <button key={l} onClick={() => setPriority(l)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: priority === l ? bg : '#f8fafc', border: `1px solid ${priority === l ? bdr : '#e2e8f0'}`, color: priority === l ? clr : '#64748b' }}>{l}</button>
            ))}
          </div>
        </div>
        <F label="Next hearing date" type="date" value="2024-06-17" />
        <SF label="Case stage" opts={['Filing','Written Statement','Evidence','Arguments','Judgment']} selected="Evidence" />
      </div>

      {/* Client */}
      <SLabel>Client details</SLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <F label="Client name"  required value="Priya Rajesh Sharma"          />
        <F label="Mobile"       required value="+91 98765 43210"              />
        <F label="Email"                  value="priya.sharma@gmail.com"       />
        <F label="Aadhar"                 value="XXXX XXXX 3456"              />
      </div>
      <F label="Address" value="Flat 4B, Seabreeze Apartments, Bandra West, Mumbai — 400050" />

      {/* Opposite party */}
      <SLabel>Opposite party</SLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <F label="Opposite party name" required value="Rohit Vikram Sharma"  />
        <F label="Their advocate"              value="Adv. Prashant Mehta"   />
        <F label="Mobile"                      value="+91 99887 65432"       />
        <F label="Address"                     value="12 Marine Drive, Mumbai — 400002" />
      </div>

      {/* Court */}
      <SLabel>Court details</SLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <SF label="Court" opts={['Family Court','District Court','Sessions Court']} />
        <F label="Location" value="Bandra, Mumbai" />
        <F label="Judge" value="Hon. Justice R. Sharma" />
        <F label="Court hall" value="Hall No. 7" />
      </div>

      {/* Notes */}
      <SLabel>Case notes</SLabel>
      <textarea defaultValue="Key facts: BMW purchase (Rs 45L), hospital records Aug 2020, WhatsApp admission June 2024. Next hearing — push for ex-parte maintenance order if respondent fails to file." style={{ width: '100%', padding: '6px 9px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'none', height: 80 }} />

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={btnStyle()}>Cancel</button>
        <button style={btnStyle()}><i className="ti ti-history" style={{ fontSize: 12 }} /> View history</button>
        <button onClick={onClose} style={btnStyle(true)}><i className="ti ti-device-floppy" style={{ fontSize: 12 }} /> Save changes</button>
      </div>
    </Modal>
  )
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 8px', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>{children}</p>
}

function F({ label, required, value, type = 'text' }: { label: string; required?: boolean; value?: string; type?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>
      <input type={type} defaultValue={value} style={{ padding: '6px 9px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#0f172a' }} />
    </div>
  )
}

function SF({ label, opts, selected }: { label: string; opts: string[]; selected?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{label}</label>
      <select style={{ padding: '6px 9px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#0f172a' }}>
        {opts.map(o => <option key={o} selected={o === selected}>{o}</option>)}
      </select>
    </div>
  )
}

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
