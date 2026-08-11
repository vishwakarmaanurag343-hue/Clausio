'use client'

import { useState, useEffect } from 'react'
import { billingApi } from '@/lib/billingApi'

interface Props { cases: any[]; clients: any[]; onRefresh: () => void }

export default function InvoiceManager({ cases, clients, onRefresh }: Props) {
  const [invoices,   setInvoices]   = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [error,      setError]      = useState('')
  const [filter,     setFilter]     = useState('All')

  // Form state
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
    catch { setError('Failed to load invoices') }
    finally { setLoading(false) }
  }

  const taxAmount   = Math.round(amountDue * (taxPct / 100))
  const totalAmount = amountDue + taxAmount
  const fmt = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

  function onCaseChange(id: string) {
    setCaseId(id)
    const c = cases.find(c => c.id === id)
    if (c) { setCaseName(c.name); setClientId(c.clientId ?? ''); setClientName(c.client ?? '') }
  }

  async function createInvoice() {
    if (!caseId || !amountDue) { setError('Case and amount are required.'); return }
    setSaving(true); setError('')
    try {
      await billingApi.createInvoice({
        caseId, clientId, clientName, caseName, description,
        feeAgreed, amountDue, taxAmount,
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        notes,
      })
      setShowForm(false); await load(); onRefresh()
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    try { await billingApi.updateStatus(id, status); await load(); onRefresh() }
    catch { setError('Failed to update status') }
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    try { await billingApi.deleteInvoice(id); await load(); onRefresh() }
    catch { setError('Failed to delete invoice') }
  }

  const filtered = filter === 'All' ? invoices : invoices.filter(i => i.status === filter)

  const statusColor = (s: string) => ({
    Paid:      { bg: '#f0fdf4', color: '#15803d' },
    Unpaid:    { bg: '#fef2f2', color: '#dc2626' },
    Partial:   { bg: '#fff7ed', color: '#d97706' },
    Cancelled: { bg: '#f8fafc', color: '#64748b' },
  }[s] ?? { bg: '#f8fafc', color: '#64748b' })

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All','Unpaid','Partial','Paid'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', border: `1px solid ${filter === f ? '#2563eb' : '#e2e8f0'}`, borderRadius: 20, background: filter === f ? '#2563eb' : '#fff', color: filter === f ? '#fff' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '0 16px', height: 38, border: 'none', borderRadius: 10, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-plus" /> New Invoice
        </button>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {/* Create Invoice Form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 18 }}>New Invoice</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Select Case *</label>
              <select value={caseId} onChange={e => onCaseChange(e.target.value)} style={inp}>
                <option value="">— Select case —</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Client Name</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Auto-filled from case" style={inp} />
            </div>
            <div>
              <label style={lbl}>Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Fee Agreed (₹)</label>
              <input type="number" value={feeAgreed} onChange={e => setFeeAgreed(Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Amount Due (₹) *</label>
              <input type="number" value={amountDue} onChange={e => setAmountDue(Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={lbl}>GST % (0 / 18)</label>
              <select value={taxPct} onChange={e => setTaxPct(Number(e.target.value))} style={inp}>
                <option value={0}>0% — No GST</option>
                <option value={18}>18% — GST applicable</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" style={inp} />
            </div>
          </div>

          {amountDue > 0 && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#eff6ff', borderRadius: 10, display: 'flex', gap: 24, fontSize: 13 }}>
              <span>Amount: <strong>{fmt(amountDue)}</strong></span>
              <span>GST ({taxPct}%): <strong>{fmt(taxAmount)}</strong></span>
              <span style={{ color: '#2563eb', fontWeight: 800 }}>Total: <strong>{fmt(totalAmount)}</strong></span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={createInvoice} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#93c5fd' : '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* Invoice list */}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Loading invoices...</div>
      : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <i className="ti ti-receipt-2" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Invoices Yet</div>
          <div style={{ fontSize: 13 }}>Create your first invoice to get started.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 120px', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <div>Invoice #</div><div>Case / Client</div><div>Total</div><div>Paid</div><div>Status</div><div>Actions</div>
          </div>
          {filtered.map((inv, i) => {
            const sc = statusColor(inv.status)
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 120px', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#2563eb' }}>{inv.invoiceNumber}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(inv.issuedDate).toLocaleDateString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{inv.caseName}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{inv.clientName}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmt(inv.totalAmount)}</div>
                <div style={{ color: '#16a34a', fontWeight: 600 }}>{fmt(inv.amountPaid)}</div>
                <div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{inv.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {inv.status !== 'Paid' && (
                    <button onClick={() => updateStatus(inv.id, 'Paid')} title="Mark Paid"
                      style={{ width: 28, height: 28, border: '1px solid #86efac', borderRadius: 6, background: '#f0fdf4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="ti ti-check" style={{ fontSize: 13, color: '#15803d' }} />
                    </button>
                  )}
                  <button onClick={() => window.print()} title="Print"
                    style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-printer" style={{ fontSize: 13, color: '#64748b' }} />
                  </button>
                  <button onClick={() => deleteInvoice(inv.id)} title="Delete"
                    style={{ width: 28, height: 28, border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-trash" style={{ fontSize: 13, color: '#dc2626' }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
