'use client'

import { useState, useEffect } from 'react'
import { aiApi } from '@/lib/api'
import { ComplianceGrid, HBars } from '@/components/financial/FinancialCharts'
import type { PayStatus } from '@/components/financial/FinancialCharts'

interface Props { caseId: string | null }

interface MonthRow {
  month:   string  // e.g. "Jan 2024"
  ordered: number
  paid:    number
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function monthStatus(ordered: number, paid: number): PayStatus {
  if (paid >= ordered) return 'Paid'
  if (paid > 0)        return 'Partial'
  return 'Unpaid'
}

function buildDefaultRows(startMonth: string, orderAmount: number, count: number): MonthRow[] {
  if (!startMonth) return []
  const rows: MonthRow[] = []
  const d = new Date(startMonth + '-01')
  for (let i = 0; i < count; i++) {
    rows.push({ month: getMonthLabel(new Date(d)), ordered: orderAmount, paid: 0 })
    d.setMonth(d.getMonth() + 1)
  }
  return rows
}

function longestDefaultStreak(rows: MonthRow[]): number {
  let max = 0, cur = 0
  for (const r of rows) {
    if (r.paid === 0 && r.ordered > 0) { cur++; max = Math.max(max, cur) } else { cur = 0 }
  }
  return max
}

const STORAGE_KEY = (caseId: string) => `clausio_tracker_${caseId}`

export default function MaintenanceTracker({ caseId }: Props) {
  const [orderAmount,  setOrderAmount]  = useState(25000)
  const [startMonth,   setStartMonth]   = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 11)
    return d.toISOString().slice(0, 7)
  })
  const [rows,         setRows]         = useState<MonthRow[]>([])
  const [generating,   setGenerating]   = useState(false)
  const [draft,        setDraft]        = useState('')
  const [copied,       setCopied]       = useState(false)

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  // Load from localStorage
  useEffect(() => {
    if (!caseId) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY(caseId))
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.rows)        setRows(parsed.rows)
        if (parsed.orderAmount) setOrderAmount(parsed.orderAmount)
        if (parsed.startMonth)  setStartMonth(parsed.startMonth)
        return
      }
    } catch {}
    // Default: 12 months
    setRows(buildDefaultRows(startMonth, orderAmount, 12))
  }, [caseId])

  // Save to localStorage on change
  useEffect(() => {
    if (!caseId) return
    try {
      localStorage.setItem(STORAGE_KEY(caseId), JSON.stringify({ rows, orderAmount, startMonth }))
    } catch {}
  }, [rows, orderAmount, startMonth, caseId])

  function initRows() {
    if (!startMonth) { alert('Please set a start month'); return }
    const built = buildDefaultRows(startMonth, orderAmount, 12)
    if (built.length === 0) { alert('Could not build rows — check start month format'); return }
    setRows(built)
  }

  function updatePaid(i: number, val: number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, paid: val } : r))
  }

  function updateOrdered(i: number, val: number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ordered: val } : r))
  }

  // Stats
  const totalOrdered   = rows.reduce((s, r) => s + r.ordered, 0)
  const totalPaid      = rows.reduce((s, r) => s + r.paid, 0)
  const totalArrears   = Math.max(0, totalOrdered - totalPaid)
  const paidMonths     = rows.filter(r => monthStatus(r.ordered, r.paid) === 'Paid').length
  const unpaidMonths   = rows.filter(r => monthStatus(r.ordered, r.paid) === 'Unpaid' && r.ordered > 0).length
  const compliancePct  = rows.length > 0 ? Math.round((paidMonths / rows.filter(r => r.ordered > 0).length) * 100) : 0
  const defaultStreak  = longestDefaultStreak(rows)

  // Compliance grid data
  const gridMonths = rows.map(r => ({ label: r.month, status: monthStatus(r.ordered, r.paid) }))

  // Per-year HBars data
  const yearMap: Record<string, { ordered: number; paid: number }> = {}
  for (const r of rows) {
    const year = r.month.split(' ')[1] ?? 'Year'
    if (!yearMap[year]) yearMap[year] = { ordered: 0, paid: 0 }
    yearMap[year].ordered += r.ordered
    yearMap[year].paid    += r.paid
  }

  async function generateEnforcement() {
    if (!caseId) return
    setGenerating(true)
    try {
      const instructions = `Enforcement application for maintenance arrears. Order amount: ${fmt(orderAmount)}/month. Total ordered: ${fmt(totalOrdered)}. Total paid: ${fmt(totalPaid)}. Total arrears: ${fmt(totalArrears)}. Compliance: ${compliancePct}%. Months fully unpaid: ${unpaidMonths}. Longest default streak: ${defaultStreak} months. Month-wise details: ${rows.map(r => `${r.month}: ordered ${fmt(r.ordered)}, paid ${fmt(r.paid)}, status ${monthStatus(r.ordered, r.paid)}`).join('; ')}.`
      const res = await aiApi.getDraft(caseId, {
        draftType: 'Execution/Enforcement application for maintenance arrears',
        instructions,
      })
      setDraft(res.draft ?? res.result ?? '')
    } catch { } finally { setGenerating(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header inputs */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>
        <div>
          <label style={labelSt}>Order Amount (₹/month)</label>
          <input type="number" value={orderAmount} onChange={e => setOrderAmount(Number(e.target.value))} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Start Month</label>
          <input type="month" value={startMonth} onChange={e => setStartMonth(e.target.value)} style={inputSt} />
        </div>
        <button onClick={initRows} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          Build Tracker
        </button>
      </div>

      {rows.length > 0 && (
        <>
          {/* Month rows table */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>Month-wise Compliance</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Month', 'Ordered (₹)', 'Paid (₹)', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const st = monthStatus(row.ordered, row.paid)
                    const stColor = st === 'Paid' ? '#16a34a' : st === 'Partial' ? '#d97706' : '#dc2626'
                    const stBg   = st === 'Paid' ? '#f0fdf4' : st === 'Partial' ? '#fffbeb' : '#fef2f2'
                    return (
                      <tr key={i}>
                        <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{row.month}</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>
                          <input type="number" value={row.ordered} onChange={e => updateOrdered(i, Number(e.target.value))} style={{ width: 100, border: '1px solid #e2e8f0', borderRadius: 5, padding: '4px 7px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                        </td>
                        <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>
                          <input type="number" value={row.paid} onChange={e => updatePaid(i, Number(e.target.value))} style={{ width: 100, border: `1px solid ${st === 'Unpaid' ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 5, padding: '4px 7px', fontSize: 12, fontFamily: 'inherit', outline: 'none', background: st === 'Unpaid' ? '#fef2f2' : '#fff' }} />
                        </td>
                        <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>
                          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: stBg, color: stColor }}>{st}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evidence stats card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[
              { label: 'Compliance Rate',      value: `${compliancePct}%`,       color: compliancePct >= 70 ? '#16a34a' : compliancePct >= 40 ? '#d97706' : '#dc2626' },
              { label: 'Total Arrears',        value: fmt(totalArrears),          color: totalArrears > 0 ? '#dc2626' : '#16a34a' },
              { label: 'Longest Default',      value: `${defaultStreak} months`,  color: defaultStreak >= 3 ? '#dc2626' : '#d97706' },
              { label: 'Months Fully Unpaid',  value: String(unpaidMonths),       color: unpaidMonths > 0 ? '#dc2626' : '#16a34a' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '16px 8px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Compliance Grid */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>Compliance Grid</div>
            <ComplianceGrid months={gridMonths} />
          </div>

          {/* Per-year HBars */}
          {Object.keys(yearMap).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 14 }}>Year-wise Summary</div>
              {Object.entries(yearMap).map(([year, data]) => (
                <div key={year} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{year}</div>
                  <HBars title="" items={[
                    { label: 'Ordered', value: data.ordered, color: '#2563eb' },
                    { label: 'Paid',    value: data.paid,    color: '#16a34a' },
                  ]} />
                </div>
              ))}
            </div>
          )}

          {/* Generate enforcement application */}
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 14, marginBottom: 8 }}>Enforcement Application</div>
            <div style={{ fontSize: 13, color: '#334155', marginBottom: 14, lineHeight: 1.6 }}>
              Total arrears of <strong>{fmt(totalArrears)}</strong> with {unpaidMonths} months fully unpaid and a longest default streak of {defaultStreak} months. This tracker data is ready to generate an enforcement/execution application.
            </div>
            <button onClick={generateEnforcement} disabled={generating || !caseId} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 13, cursor: generating || !caseId ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: generating || !caseId ? 0.7 : 1 }}>
              {generating ? 'Generating...' : 'Generate Enforcement Application'}
            </button>
          </div>

          {draft && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>Generated Enforcement Application</div>
                <button onClick={() => { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{ height: 28, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: copied ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit' }}>
                  <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ marginRight: 4 }} />{copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.7, maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{draft}</div>
            </div>
          )}
        </>
      )}

      {rows.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          <i className="ti ti-calendar-check" style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No tracker data yet</div>
          <div style={{ fontSize: 13 }}>Set the order amount and start month, then click Build Tracker.</div>
        </div>
      )}
    </div>
  )
}

const labelSt: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inputSt: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fafc' }
