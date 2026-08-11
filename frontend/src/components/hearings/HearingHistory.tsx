'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { hearingsApi, aiApi } from '@/lib/api'

interface Props {
  refresh?: number
}

export default function HearingHistory({ refresh }: Props) {
  const { selectedCaseId } = useCaseStore()
  const [hearings,    setHearings]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [markingId,   setMarkingId]   = useState<string | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [editHearing, setEditHearing] = useState<any | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiResult,    setAiResult]    = useState('')
  const [aiHearingId, setAiHearingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!selectedCaseId) { setHearings([]); setLoading(false); return }
    setLoading(true)
    setError('')
    hearingsApi.getByCaseId(selectedCaseId)
      .then(data => setHearings(Array.isArray(data) ? data.sort((a: any, b: any) => new Date(b.hearingDate).getTime() - new Date(a.hearingDate).getTime()) : []))
      .catch(err => setError(err.message || 'Failed to load hearings'))
      .finally(() => setLoading(false))
  }, [selectedCaseId])

  useEffect(() => { load() }, [load, refresh])

  async function markOrderDone(hearingId: string, orderId: string) {
    if (!selectedCaseId) return
    setMarkingId(orderId)
    try { await hearingsApi.markOrderDone(selectedCaseId, hearingId, orderId); load() }
    catch (err) { console.error(err) }
    finally { setMarkingId(null) }
  }

  async function handleDelete(hearingId: string) {
    if (!selectedCaseId) return
    setDeletingId(hearingId)
    try { await hearingsApi.remove(selectedCaseId, hearingId); load(); setConfirmDeleteId(null) }
    catch { setError('Failed to delete hearing') }
    finally { setDeletingId(null) }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCaseId || !editHearing) return
    setEditLoading(true)
    try {
      await hearingsApi.update(selectedCaseId, editHearing.id, {
        hearingDate:      editHearing.hearingDate,
        stage:            editHearing.stage,
        whatHappened:     editHearing.whatHappened,
        judgeObservation: editHearing.judgeObservation,
        nextObjective:    editHearing.nextObjective,
      })
      setEditHearing(null)
      load()
    } catch { setError('Failed to update hearing') }
    finally { setEditLoading(false) }
  }

  async function getAiPrep(hearingId: string) {
    if (!selectedCaseId) return
    setAiHearingId(hearingId)
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await aiApi.getPrep(selectedCaseId)
      const raw = res.brief ?? res.result ?? ''
      try {
        const parsed = JSON.parse(raw)
        setAiResult(
          `Objective: ${parsed.todayObjective ?? ''}\n\n` +
          `Key Arguments:\n${(parsed.keyArguments ?? []).map((a: string) => `• ${a}`).join('\n')}\n\n` +
          `Documents Required:\n${(parsed.documentsRequired ?? []).map((d: string) => `• ${d}`).join('\n')}\n\n` +
          `Opening Statement:\n${parsed.openingStatement ?? ''}`
        )
      } catch { setAiResult(raw) }
    } catch { setAiResult('Failed to generate prep brief.') }
    finally { setAiLoading(false) }
  }

  const overdueCount = hearings.flatMap(h => h.orders ?? []).filter((o: any) => !o.done && o.deadline && new Date(o.deadline) < new Date()).length

  return (
    <>
      <div className="glass-card" style={{ padding: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Hearing History</h2>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
              {hearings.length} hearing{hearings.length !== 1 ? 's' : ''} recorded
              {overdueCount > 0 && <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: 8 }}>· {overdueCount} order{overdueCount > 1 ? 's' : ''} overdue</span>}
            </p>
          </div>
          <button onClick={load} style={{ fontSize: 11, padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit', color: '#64748b', fontWeight: 600 }}>
            ↻ Refresh
          </button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 13 }}>Loading hearings...</div>}
        {!loading && error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{error}</div>}
        {!loading && !error && hearings.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <i className="ti ti-notebook" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 13 }}>No hearings recorded yet</div>
          </div>
        )}

        {/* Timeline */}
        {!loading && hearings.length > 0 && (
          <div>
            {hearings.map((hearing, index) => {
              const isOverdue = (hearing.orders ?? []).some((o: any) => !o.done && o.deadline && new Date(o.deadline) < new Date())
              return (
                <div key={hearing.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>

                  {/* Timeline dot */}
                  <div style={{ width: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: index === 0 ? '#3b82f6' : '#cbd5e1', border: '3px solid #fff', boxShadow: index === 0 ? '0 0 0 2px #3b82f6' : '0 0 0 2px #e2e8f0', zIndex: 2 }} />
                    {index !== hearings.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 70, background: 'rgba(0,0,0,0.05)', marginTop: 4 }} />}
                  </div>

                  {/* Card */}
                  <div style={{ flex: 1, background: isOverdue ? 'rgba(254,242,242,0.8)' : 'rgba(255,255,255,0.5)', border: `1px solid ${isOverdue ? 'rgba(252,165,165,0.4)' : 'rgba(0,0,0,0.05)'}`, borderRadius: 10, padding: 14 }}>

                    {/* Card header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                          {new Date(hearing.hearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ marginTop: 2, color: '#2563eb', fontWeight: 600, fontSize: 12 }}>{hearing.stage}</div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {index === 0 && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#1d4ed8', padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>LATEST</span>}

                        {/* AI Prep button */}
                        <button
                          onClick={() => getAiPrep(hearing.id)}
                          style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.06)', color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <i className="ti ti-sparkles" style={{ fontSize: 11 }} /> AI Prep
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => setEditHearing({ ...hearing })}
                          style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <i className="ti ti-edit" style={{ fontSize: 11 }} /> Edit
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => setConfirmDeleteId(hearing.id)}
                          style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <i className="ti ti-trash" style={{ fontSize: 11 }} /> Delete
                        </button>
                      </div>
                    </div>

                    {/* What happened */}
                    <p style={{ margin: 0, lineHeight: 1.5, color: '#475569', fontSize: 13 }}>{hearing.whatHappened}</p>

                    {/* Next objective */}
                    {hearing.nextObjective && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>NEXT</span>
                        <span style={{ fontSize: 12, color: '#334155' }}>{hearing.nextObjective}</span>
                      </div>
                    )}

                    {/* Judge observation */}
                    {hearing.judgeObservation && (
                      <div style={{ marginTop: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '6px 10px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706' }}>⚖️ Judge: </span>
                        <span style={{ fontSize: 11, color: '#92400e' }}>{hearing.judgeObservation}</span>
                      </div>
                    )}

                    {/* Orders */}
                    {hearing.orders && hearing.orders.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Court Orders</div>
                        {hearing.orders.map((order: any) => {
                          const orderOverdue = !order.done && order.deadline && new Date(order.deadline) < new Date()
                          return (
                            <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: orderOverdue ? '#fef2f2' : '#f8fafc', border: `1px solid ${orderOverdue ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 6, marginTop: 4, fontSize: 12, gap: 8 }}>
                              <span style={{ color: '#334155' }}>{order.text}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {order.responsible && <span style={{ fontSize: 10, color: '#64748b' }}>{order.responsible}</span>}
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, background: order.done ? '#f0fdf4' : orderOverdue ? '#fef2f2' : '#fefce8', color: order.done ? '#15803d' : orderOverdue ? '#dc2626' : '#a16207', whiteSpace: 'nowrap' }}>
                                  {order.done ? '✓ Done' : orderOverdue ? `⚠ OVERDUE` : `Due ${new Date(order.deadline).toLocaleDateString('en-IN')}`}
                                </span>
                                {!order.done && (
                                  <button onClick={() => markOrderDone(hearing.id, order.id)} disabled={markingId === order.id} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: markingId === order.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                    {markingId === order.id ? '...' : '✓ Done'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* AI Prep Result */}
                    {aiHearingId === hearing.id && (
                      <div style={{ marginTop: 10, background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="ti ti-sparkles" /> AI Hearing Prep
                          <button onClick={() => { setAiHearingId(null); setAiResult('') }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: 14 }}>✕</button>
                        </div>
                        {aiLoading ? (
                          <div style={{ fontSize: 12, color: '#7c3aed' }}>Generating prep brief...</div>
                        ) : (
                          <pre style={{ fontSize: 12, color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{aiResult}</pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && hearings.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Hearings</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{hearings.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Pending Orders</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>
                {hearings.flatMap(h => h.orders ?? []).filter((o: any) => !o.done).length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Overdue</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{overdueCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {editHearing && (
        <div onClick={() => setEditHearing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Edit Hearing</h2>
              <button onClick={() => setEditHearing(null)} style={{ width: 32, height: 32, border: 'none', borderRadius: 8, background: '#f1f5f9', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Hearing Date *</label>
                  <input type="date" value={editHearing.hearingDate?.split('T')[0] ?? ''} onChange={e => setEditHearing({ ...editHearing, hearingDate: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Stage *</label>
                  <select value={editHearing.stage ?? ''} onChange={e => setEditHearing({ ...editHearing, stage: e.target.value })} style={inputStyle}>
                    {['Filing','Service','Interim Application','Evidence','Cross Examination','Arguments','Judgment Reserved','Final Order'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>What Happened *</label>
                <textarea rows={3} value={editHearing.whatHappened ?? ''} onChange={e => setEditHearing({ ...editHearing, whatHappened: e.target.value })} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} required />
              </div>
              <div>
                <label style={labelStyle}>Judge's Observation</label>
                <textarea rows={2} value={editHearing.judgeObservation ?? ''} onChange={e => setEditHearing({ ...editHearing, judgeObservation: e.target.value })} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Next Objective</label>
                <input type="text" value={editHearing.nextObjective ?? ''} onChange={e => setEditHearing({ ...editHearing, nextObjective: e.target.value })} style={inputStyle} placeholder="What to achieve in the next hearing" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setEditHearing(null)} style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={editLoading} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {confirmDeleteId && (
        <div onClick={() => setConfirmDeleteId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 380, background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-trash" style={{ fontSize: 24, color: '#dc2626' }} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>Delete Hearing?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 1.5 }}>
              This will permanently delete this hearing record and all its court orders. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: '11px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={!!deletingId} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>
                {deletingId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13, outline: 'none', background: '#f8fafc', color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box' }
