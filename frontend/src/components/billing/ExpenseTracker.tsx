'use client'

import { useState, useEffect } from 'react'
import { billingApi } from '@/lib/billingApi'

interface Props { cases: any[]; onRefresh: () => void }

const CATEGORIES = ['Filing Fee','Court Fees','Travel','Printing','Courier','Stamp Duty','Advocate Fee','Misc']
const CAT_COLORS: Record<string,string> = { 'Filing Fee':'#2563eb','Court Fees':'#7c3aed','Travel':'#16a34a','Printing':'#d97706','Courier':'#0891b2','Stamp Duty':'#dc2626','Advocate Fee':'#8b5cf6','Misc':'#64748b' }

export default function ExpenseTracker({ cases, onRefresh }: Props) {
  const [expenses,    setExpenses]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [error,       setError]       = useState('')
  const [filterCase,  setFilterCase]  = useState('')

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
    catch (e: any) { setError(e.message || 'Failed to load expenses') }
    finally { setLoading(false) }
  }

  async function createExpense() {
    if (!caseId || !title || !amount) { setError('Case, title and amount required.'); return }
    setSaving(true); setError('')
    try {
      await billingApi.createExpense({ caseId, title, category, amount, date: new Date(date).toISOString(), billable, notes })
      setShowForm(false); setTitle(''); setAmount(0); setNotes('')
      await load(); onRefresh()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function deleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return
    try { await billingApi.deleteExpense(id); await load(); onRefresh() }
    catch { setError('Failed to delete') }
  }

  const filtered      = filterCase ? expenses.filter(e => e.caseId === filterCase) : expenses
  const totalExp      = filtered.reduce((s, e) => s + (e.amount ?? 0), 0)
  const billableTotal = filtered.filter(e => e.billable).reduce((s, e) => s + (e.amount ?? 0), 0)
  const fmt = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

  const byCat: Record<string,number> = {}
  filtered.forEach(e => { byCat[e.category ?? 'Misc'] = (byCat[e.category ?? 'Misc'] ?? 0) + (e.amount ?? 0) })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff7ed', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
            Total: <strong style={{ color: '#d97706' }}>{fmt(totalExp)}</strong>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
            Billable: <strong style={{ color: '#2563eb' }}>{fmt(billableTotal)}</strong>
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

      {/* Category summary chips */}
      {Object.keys(byCat).length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(byCat).sort((a,b) => b[1]-a[1]).map(([cat, total]) => (
            <div key={cat} style={{ padding: '5px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              <span style={{ color: CAT_COLORS[cat] ?? '#64748b' }}>{cat}:</span>
              <span style={{ color: '#0f172a', marginLeft: 4 }}>{fmt(total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #fde68a', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, marginBottom: 18 }}>Add Expense</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lbl}>Case *</label>
              <select value={caseId} onChange={e => setCaseId(e.target.value)} style={inp}>
                <option value="">— Select case —</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Court filing fee" style={inp} />
            </div>
            <div><label style={lbl}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={inp}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Amount (₹) *</label>
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} style={inp} />
            </div>
            <div><label style={lbl}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
            </div>
            <div><label style={lbl}>Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" style={inp} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#334155' }}>
              <input type="checkbox" checked={billable} onChange={e => setBillable(e.target.checked)} />
              Billable to client
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={secBtn}>Cancel</button>
            <button onClick={createExpense} disabled={saving} style={{ ...priBtn, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </div>
      )}

      {/* Expense list */}
      {loading
        ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Loading expenses...</div>
        : filtered.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <i className="ti ti-cash" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No Expenses Yet</div>
            <div style={{ fontSize: 13 }}>Add court fees, travel and other case expenses here.</div>
          </div>
        )
        : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 60px', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <div>Expense</div><div>Amount</div><div>Category</div><div>Date</div><div>Billable</div><div></div>
            </div>
            {filtered.map((e, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 60px', padding: '12px 16px', borderBottom: i < filtered.length-1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{cases.find(c => c.id === e.caseId)?.name ?? '—'}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#d97706', fontSize: 15 }}>{fmt(e.amount)}</div>
                <div>
                  <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff7ed', color: CAT_COLORS[e.category] ?? '#64748b' }}>
                    {e.category ?? 'Misc'}
                  </span>
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{e.date ? new Date(e.date).toLocaleDateString('en-IN') : '—'}</div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: e.billable ? '#16a34a' : '#94a3b8' }}>
                    {e.billable ? '✓ Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <button onClick={() => deleteExpense(e.id)} style={{ width: 28, height: 28, border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-trash" style={{ fontSize: 13, color: '#dc2626' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
const secBtn: React.CSSProperties = { flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }
const priBtn: React.CSSProperties = { flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#d97706', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }
