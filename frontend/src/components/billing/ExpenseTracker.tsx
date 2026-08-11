'use client'

import { useState, useEffect } from 'react'
import { billingApi } from '@/lib/billingApi'

interface Props { cases: any[]; onRefresh: () => void }

const CATEGORIES = ['Filing Fee','Court Fees','Travel','Printing','Courier','Stamp Duty','Advocate Fee','Misc']
const CAT_COLORS: Record<string,string> = { 'Filing Fee':'#2563eb','Court Fees':'#7c3aed','Travel':'#16a34a','Printing':'#d97706','Courier':'#0891b2','Stamp Duty':'#dc2626','Advocate Fee':'#8b5cf6','Misc':'#64748b' }

export default function ExpenseTracker({ cases, onRefresh }: Props) {
  const [expenses,  setExpenses]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [error,     setError]     = useState('')
  const [filterCase, setFilterCase] = useState('')

  // Form
  const [caseId,   setCaseId]   = useState('')
  const [title,    setTitle]    = useState('')
  const [category, setCategory] = useState('Filing Fee')
  const [amount,   setAmount]   = useState(0)
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0])
  const [billable, setBillable] = useState(true)
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setExpenses(await billingApi.getExpenses()) }
    catch { setError('Failed to load expenses') }
    finally { setLoading(false) }
  }

  async function createExpense() {
    if (!caseId || !title || !amount) { setError('Case, title and amount required.'); return }
    setSaving(true); setError('')
    try {
      await billingApi.createExpense({ caseId, title, category, amount, date: new Date(date).toISOString(), billable, notes })
      setShowForm(false); setTitle(''); setAmount(0); await load(); onRefresh()
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function deleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return
    try { await billingApi.deleteExpense(id); await load(); onRefresh() }
    catch { setError('Failed to delete') }
  }

  const filtered = filterCase ? expenses.filter(e => e.caseId === filterCase) : expenses
  const totalExp = filtered.reduce((s, e) => s + (e.amount ?? 0), 0)
  const billableTotal = filtered.filter(e => e.billable).reduce((s, e) => s + (e.amount ?? 0), 0)
  const fmt = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

  // Group by category
  const byCat: Record<string,number> = {}
  filtered.forEach(e => { byCat[e.category] = (byCat[e.category] ?? 0) + e.amount })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ background: '#fff7ed', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
            Total Expenses: <strong style={{ color: '#d97706', marginLeft: 6 }}>{fmt(totalExp)}</strong>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
            Billable: <strong style={{ color: '#2563eb', marginLeft: 6 }}>{fmt(billableTotal)}</strong>
          </div>
          <select value={filterCase} onChange={e => setFilterCase(e.target.value)}
            style={{ height: 36, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 12, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
            <option value="">All Cases</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '0 16px', height: 38, border: 'none', borderRadius: 10, background: '#d97706', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-plus" /> Add Expense
        </button>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>}

      {/* Category summary */}
      {Object.keys(byCat).length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(byCat).map(([cat, total]) => (
            <div key={cat} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              <span style={{ color: CAT_COLORS[cat] ?? '#64748b' }}>{cat}:</span>
              <span style={{ color: '#0f172a', marginLeft: 4 }}>{fmt(total)}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 18 }}>Add Expense</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Case *</label>
              <select value={caseId} onChange={e => setCaseId(e.target.value)} style={inp}>
                <option value="">— Select case —</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. High Court filing fee" style={inp} />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={inp}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Amount (₹) *</label>
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155', padding: '10px 12px', background: billable ? '#eff6ff' : '#f8fafc', border: `1px solid ${billable ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 8 }}>
                <input type="checkbox" checked={billable} onChange={() => setBillable(!billable)} />
                Billable to client
              </label>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={lbl}>Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={createExpense} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#fde68a' : '#d97706', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Loading expenses...</div>
      : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <i className="ti ti-cash" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Expenses Yet</div>
          <div style={{ fontSize: 13 }}>Track filing fees, travel, printing and other case costs.</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <div>Expense</div><div>Category</div><div>Amount</div><div>Date</div><div></div>
          </div>
          {filtered.map((e, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.title}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{cases.find(c => c.id === e.caseId)?.name ?? '—'} {e.billable ? '· Billable' : ''}</div>
              </div>
              <div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f8fafc', color: CAT_COLORS[e.category] ?? '#64748b' }}>{e.category}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#d97706' }}>{fmt(e.amount)}</div>
              <div style={{ color: '#64748b' }}>{new Date(e.date).toLocaleDateString('en-IN')}</div>
              <div>
                <button onClick={() => deleteExpense(e.id)} style={{ width: 28, height: 28, border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
