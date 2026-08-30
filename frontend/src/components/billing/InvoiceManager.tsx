'use client'

import { useState, useEffect } from 'react'
import { billingApi } from '@/lib/billingApi'

interface Props { cases: any[]; clients: any[]; onRefresh: () => void }

const STATUS_COLORS: Record<string,{bg:string;color:string}> = {
  Paid:      { bg: '#f0fdf4', color: '#15803d' },
  Unpaid:    { bg: '#fef2f2', color: '#dc2626' },
  Partial:   { bg: '#fff7ed', color: '#d97706' },
  Cancelled: { bg: '#f8fafc', color: '#64748b' },
}

export default function InvoiceManager({ cases, clients, onRefresh }: Props) {
  const [invoices,    setInvoices]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [error,       setError]       = useState('')
  const [filter,      setFilter]      = useState('All')
  const [expandedId,  setExpandedId]  = useState<string|null>(null)

  // Form
  const [caseId,      setCaseId]      = useState('')
  const [clientId,    setClientId]    = useState('')
  const [clientName,  setClientName]  = useState('')
  const [caseName,    setCaseName]    = useState('')
  const [description, setDescription] = useState('Professional legal services')
  const [feeAgreed,   setFeeAgreed]   = useState(0)
  const [amountDue,   setAmountDue]   = useState(0)
  const [taxPct,      setTaxPct]      = useState(18)
  const [dueDate,     setDueDate]     = useState('')
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setInvoices(await billingApi.getInvoices()) }
    catch (e: any) { setError(e.message || 'Failed to load invoices') }
    finally { setLoading(false) }
  }

  const taxAmount   = Math.round(amountDue * (taxPct / 100))
  const totalAmount = amountDue + taxAmount
  const fmt = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

  function onCaseChange(id: string) {
    setCaseId(id)
    const c = cases.find(c => c.id === id)
    if (c) { setCaseName(c.name); setClientId(c.clientId ?? ''); setClientName(c.client ? `${c.client.firstName ?? ''} ${c.client.lastName ?? ''}`.trim() : '') }
  }

  async function createInvoice() {
    if (!caseId || !amountDue) { setError('Case and amount are required.'); return }
    setSaving(true); setError('')
    try {
      await billingApi.createInvoice({ caseId, clientId, clientName, caseName, description, feeAgreed, amountDue, taxAmount, dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 30*86400000).toISOString(), notes })
      setShowForm(false); setCaseId(''); setAmountDue(0); setFeeAgreed(0); setNotes('')
      await load(); onRefresh()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    try { await billingApi.updateStatus(id, status); await load(); onRefresh() }
    catch { setError('Failed to update') }
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    try { await billingApi.deleteInvoice(id); await load(); onRefresh() }
    catch { setError('Failed to delete') }
  }

  const filtered = filter === 'All' ? invoices : invoices.filter(i => i.status === filter)
  const totalBilled  = filtered.reduce((s, i) => s + (i.totalAmount ?? 0), 0)
  const totalPending = filtered.reduce((s, i) => s + (i.amountPending ?? 0), 0)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {['All','Unpaid','Partial','Paid','Cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', border: `1px solid ${filter===f?'#2563eb':'#e2e8f0'}`, borderRadius: 20, background: filter===f?'#2563eb':'#fff', color: filter===f?'#fff':'#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '0 16px', height: 38, border: 'none', borderRadius: 10, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-plus" /> New Invoice
        </button>
      </div>

      {/* Summary chips */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ padding: '8px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 13 }}>
            Total: <strong style={{ color: '#2563eb' }}>{fmt(totalBilled)}</strong>
          </div>
          {totalPending > 0 && (
            <div style={{ padding: '8px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13 }}>
              Pending: <strong style={{ color: '#dc2626' }}>{fmt(totalPending)}</strong>
            </div>
          )}
        </div>
      )}

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {/* Create form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #bfdbfe', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 18 }}>New Invoice</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Case *">
              <select value={caseId} onChange={e => onCaseChange(e.target.value)} style={inp}>
                <option value="">— Select case —</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Client Name">
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Auto-filled from case" style={inp} />
            </Field>
            <Field label="Description">
              <input value={description} onChange={e => setDescription(e.target.value)} style={inp} />
            </Field>
            <Field label="Fee Agreed (₹)">
              <input type="number" value={feeAgreed} onChange={e => setFeeAgreed(Number(e.target.value))} style={inp} />
            </Field>
            <Field label="Amount Due (₹) *">
              <input type="number" value={amountDue} onChange={e => setAmountDue(Number(e.target.value))} style={inp} />
            </Field>
            <Field label={`GST (${taxPct}%) = ${fmt(taxAmount)} → Total ${fmt(totalAmount)}`}>
              <select value={taxPct} onChange={e => setTaxPct(Number(e.target.value))} style={inp}>
                <option value={0}>0% (No GST)</option>
                <option value={18}>18% GST</option>
              </select>
            </Field>
            <Field label="Due Date">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} />
            </Field>
            <Field label="Notes">
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" style={inp} />
            </Field>
          </div>
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
            Invoice Total: {fmt(totalAmount)} ({fmt(amountDue)} + {fmt(taxAmount)} GST)
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={secBtn}>Cancel</button>
            <button onClick={createInvoice} disabled={saving} style={{ ...priBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* Invoice list */}
      {loading
        ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Loading invoices...</div>
        : filtered.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <i className="ti ti-receipt-2" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Invoices</div>
            <div style={{ fontSize: 13 }}>Create your first invoice to start tracking payments.</div>
          </div>
        )
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((inv, i) => {
              const sc = STATUS_COLORS[inv.status] ?? STATUS_COLORS.Unpaid
              const expanded = expandedId === inv.id
              return (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}
                    onClick={() => setExpandedId(expanded ? null : inv.id)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{inv.invoiceNumber}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{inv.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{inv.caseName} · {inv.clientName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{fmt(inv.totalAmount)}</div>
                      {inv.amountPending > 0 && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{fmt(inv.amountPending)} pending</div>}
                    </div>
                    <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 16, color: '#94a3b8' }} />
                  </div>
                  {expanded && (
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 16px', background: '#f8fafc' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
                        {[
                          { label: 'Issued',   value: inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString('en-IN') : '—' },
                          { label: 'Due',      value: inv.dueDate    ? new Date(inv.dueDate).toLocaleDateString('en-IN')    : '—' },
                          { label: 'Fee',      value: fmt(inv.feeAgreed) },
                          { label: 'Amount',   value: fmt(inv.amountDue) },
                          { label: 'GST',      value: fmt(inv.taxAmount) },
                          { label: 'Total',    value: fmt(inv.totalAmount) },
                        ].map((r, j) => (
                          <div key={j} style={{ fontSize: 12 }}>
                            <div style={{ color: '#94a3b8', fontWeight: 600 }}>{r.label}</div>
                            <div style={{ color: '#0f172a', fontWeight: 700, marginTop: 2 }}>{r.value}</div>
                          </div>
                        ))}
                      </div>
                      {inv.description && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{inv.description}</div>}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['Paid','Partial','Unpaid','Cancelled'].filter(s => s !== inv.status).map(s => (
                          <button key={s} onClick={() => updateStatus(inv.id, s)}
                            style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#475569', fontFamily: 'inherit' }}>
                            Mark {s}
                          </button>
                        ))}
                        <button onClick={() => deleteInvoice(inv.id)}
                          style={{ padding: '6px 12px', border: '1px solid #fca5a5', borderRadius: 7, background: '#fef2f2', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#dc2626', fontFamily: 'inherit' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
const secBtn: React.CSSProperties = { flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }
const priBtn: React.CSSProperties = { flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }
