'use client'

import { useState, useEffect } from 'react'
import { billingApi } from '@/lib/billingApi'

interface Props { cases: any[]; onRefresh: () => void }

export default function PaymentTracker({ cases, onRefresh }: Props) {
  const [payments,  setPayments]  = useState<any[]>([])
  const [invoices,  setInvoices]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [error,     setError]     = useState('')

  // Form
  const [invoiceId,  setInvoiceId]  = useState('')
  const [caseId,     setCaseId]     = useState('')
  const [amount,     setAmount]     = useState(0)
  const [mode,       setMode]       = useState('Cash')
  const [reference,  setReference]  = useState('')
  const [paidOn,     setPaidOn]     = useState(new Date().toISOString().split('T')[0])
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [p, inv] = await Promise.all([billingApi.getPayments(), billingApi.getInvoices()])
      setPayments(p); setInvoices(inv)
    } catch { setError('Failed to load payments') }
    finally { setLoading(false) }
  }

  function onInvoiceChange(id: string) {
    setInvoiceId(id)
    const inv = invoices.find(i => i.id === id)
    if (inv) { setCaseId(inv.caseId); setAmount(inv.amountPending > 0 ? inv.amountPending : inv.totalAmount) }
  }

  async function recordPayment() {
    if (!invoiceId || !amount) { setError('Invoice and amount required.'); return }
    setSaving(true); setError('')
    try {
      await billingApi.recordPayment({ invoiceId, caseId, amount, mode, reference, notes, paidOn: new Date(paidOn).toISOString() })
      setShowForm(false); await load(); onRefresh()
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function deletePayment(id: string) {
    if (!confirm('Delete this payment record?')) return
    try { await billingApi.deletePayment(id); await load(); onRefresh() }
    catch { setError('Failed to delete') }
  }

  const totalReceived = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
  const fmt = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`
  const modeColors: Record<string, string> = { Cash: '#16a34a', UPI: '#7c3aed', 'Bank Transfer': '#2563eb', Cheque: '#d97706' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 16px', fontSize: 13 }}>
          Total Received: <strong style={{ color: '#15803d', fontSize: 18, marginLeft: 6 }}>{fmt(totalReceived)}</strong>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '0 16px', height: 38, border: 'none', borderRadius: 10, background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-plus" /> Record Payment
        </button>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #86efac', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 18 }}>Record Payment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Invoice *</label>
              <select value={invoiceId} onChange={e => onInvoiceChange(e.target.value)} style={inp}>
                <option value="">— Select invoice —</option>
                {invoices.filter(i => i.status !== 'Paid').map(i => (
                  <option key={i.id} value={i.id}>{i.invoiceNumber} — {i.caseName} ({fmt(i.amountPending)} pending)</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Amount (₹) *</label>
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Payment Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value)} style={inp}>
                {['Cash','UPI','Bank Transfer','Cheque'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Reference / UTR Number</label>
              <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Optional" style={inp} />
            </div>
            <div>
              <label style={lbl}>Paid On</label>
              <input type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" style={inp} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={recordPayment} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#86efac' : '#16a34a', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Loading payments...</div>
      : payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <i className="ti ti-credit-card" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Payments Yet</div>
          <div style={{ fontSize: 13 }}>Record your first payment to track collections.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 80px', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <div>Invoice</div><div>Amount</div><div>Mode</div><div>Date</div><div></div>
          </div>
          {payments.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 80px', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#2563eb' }}>{p.invoiceNumber}</div>
              <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 16 }}>{fmt(p.amount)}</div>
              <div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: modeColors[p.mode] ?? '#64748b' }}>
                  {p.mode}
                </span>
                {p.reference && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{p.reference}</div>}
              </div>
              <div style={{ color: '#64748b' }}>{new Date(p.paidOn).toLocaleDateString('en-IN')}</div>
              <div>
                <button onClick={() => deletePayment(p.id)} style={{ width: 28, height: 28, border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-trash" style={{ fontSize: 13, color: '#dc2626' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
