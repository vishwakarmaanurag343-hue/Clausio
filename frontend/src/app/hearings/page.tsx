import AIResponseFormatter from '@/components/common/AIResponseFormatter'
'use client'

import { useState, useEffect } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, witnessesApi, integrationsApi } from '@/lib/api'

import HearingForm     from '@/components/hearings/HearingForm'
import HearingHistory  from '@/components/hearings/HearingHistory'
import AddHearingModal from '@/components/hearings/AddHearingModal'
import HearingTabs     from '@/components/hearings/HearingTabs'
import DeadlineBanner  from '@/components/hearings/DeadlineBanner'
import CaseTypeBadge   from '@/components/ui/CaseTypeBadge'
import WitnessCard, { parseWitnessBrief, type WitnessBrief } from '@/components/hearings/WitnessCard'
import CaseHeader from '@/components/layout/CaseHeader'

export default function HearingsPage() {
  const { selectedCaseId } = useCaseStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab,    setActiveTab]    = useState('Hearing Diary')
  const [refreshCount, setRefreshCount] = useState(0)

  function handleSaved() { setRefreshCount(c => c + 1) }

  // ── Witness Intelligence: stored witnesses + per-witness AI briefs ──
  const [witnesses,     setWitnesses]     = useState<any[]>([])
  const [witnessBriefs, setWitnessBriefs] = useState<Record<string, WitnessBrief | null>>({})
  const [witnessErrors, setWitnessErrors] = useState<Record<string, string>>({})
  const [analysingId,   setAnalysingId]   = useState<string | null>(null)
  const [wListError,    setWListError]    = useState('')
  const [showWForm,     setShowWForm]     = useState(false)
  const [wSaving,       setWSaving]       = useState(false)
  const [wForm,         setWForm]         = useState({ name: '', type: 'Independent', side: 'Ours', statement: '' })

  function loadWitnesses() {
    if (!selectedCaseId) { setWitnesses([]); return }
    setWListError('')
    witnessesApi.getByCaseId(selectedCaseId)
      .then(d => setWitnesses(Array.isArray(d) ? d : []))
      .catch(err => setWListError(err.message || 'Failed to load witnesses'))
  }

  useEffect(() => { setWitnesses([]); setWitnessBriefs({}); setWitnessErrors({}); setWListError(''); setShowWForm(false) }, [selectedCaseId])

  useEffect(() => {
    if (activeTab === 'Witness Intelligence') loadWitnesses()
  }, [activeTab, selectedCaseId])

  async function addWitness() {
    if (!selectedCaseId || !wForm.name.trim()) return
    setWSaving(true)
    try {
      await witnessesApi.create(selectedCaseId, {
        name: wForm.name.trim(), type: wForm.type, side: wForm.side, statement: wForm.statement.trim(),
      })
      setWForm({ name: '', type: 'Independent', side: 'Ours', statement: '' })
      setShowWForm(false)
      loadWitnesses()
    } catch (err: any) { alert(err.message || 'Failed to add witness') }
    finally { setWSaving(false) }
  }

  async function deleteWitness(id: string) {
    if (!selectedCaseId) return
    try { await witnessesApi.remove(selectedCaseId, id); loadWitnesses() } catch {}
  }

  async function analyseWitness(w: any) {
    if (!selectedCaseId) return
    setAnalysingId(w.id)
    setWitnessErrors(prev => ({ ...prev, [w.id]: '' }))
    try {
      const res = await aiApi.getWitness(selectedCaseId, {
        witnessId: w.id, name: w.name, type: w.type, side: w.side, statement: w.statement,
      })
      const brief = parseWitnessBrief(res.intelligence ?? res.result)   // null ⇒ error card, never raw dump
      setWitnessBriefs(prev => ({ ...prev, [w.id]: brief }))
      if (!brief) {
        setWitnessErrors(prev => ({ ...prev, [w.id]: 'AI did not return the expected structured format.' }))
        console.error('[Witness AI] Unparseable payload:', res.intelligence ?? res.result)
      }
    } catch (err: any) {
      setWitnessErrors(prev => ({ ...prev, [w.id]: err.message || 'Could not reach the AI service.' }))
      console.error('[Witness AI] Request failed:', err)
    } finally { setAnalysingId(null) }
  }

  return (
    <>
      <div className="glass-panel mobile-hearings-container" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24, display: 'flex', flexDirection: 'column' }}>

        {!selectedCaseId && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '60px 20px', textAlign: 'center' }}>
            <i className="ti ti-calendar-off" style={{ fontSize: 56, color: '#cbd5e1', display: 'block', marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 8 }}>No Case Selected</h2>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 320, lineHeight: 1.6 }}>
              Select a case from the sidebar or dashboard to view and manage hearing records for that case.
            </p>
          </div>
        )}

        {selectedCaseId && (
        <>
        {/* ── DESKTOP HEARINGS VIEW ── */}
        <div className="desktop-hearings-view" style={{ display: 'flex', flexDirection: 'column' }}>
          <CaseHeader />
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Hearings</h1>
              <p style={{ marginTop: 4, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                Hearing diary, preparation and witness intelligence
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CaseTypeBadge />
              <CalendarStatusPill />
              {activeTab === 'Hearing Diary' && (
                <button className="glass-button" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, border: 'none', borderRadius: 10, cursor: 'pointer', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                  <i className="ti ti-plus" /> Add Hearing
                </button>
              )}
            </div>
          </div>

          <HearingTabs activeTab={activeTab} onChange={setActiveTab} />

          <div style={{ marginTop: 16 }}>
            <DeadlineBanner />
          </div>

          <div style={{ marginTop: 16 }}>

            {/* ── HEARING DIARY TAB ── */}
            {activeTab === 'Hearing Diary' && (
              <div style={{ display: 'grid', gridTemplateColumns: '42% 58%', gap: 24 }}>
                <HearingForm onSaved={handleSaved} />
                <HearingHistory refresh={refreshCount} />
              </div>
            )}

            {/* ── WITNESS INTELLIGENCE TAB ── */}
            {activeTab === 'Witness Intelligence' && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>Witnesses</h2>
                    <p style={{ color: '#64748b', marginTop: 4, fontSize: 13 }}>Add each witness, then run AI intelligence on them individually.</p>
                  </div>
                  {selectedCaseId && (
                    <button
                      onClick={() => setShowWForm(!showWForm)}
                      className="glass-button"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, border: 'none', borderRadius: 10, cursor: 'pointer', background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 13 }}
                    >
                      <i className="ti ti-plus" /> Add Witness
                    </button>
                  )}
                </div>
                {!selectedCaseId && <EmptyBox icon="ti-folder-open" message="Select a case to manage witnesses." />}

                {selectedCaseId && wListError && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 12 }}>
                    {wListError}
                  </div>
                )}

                {/* Add-witness form */}
                {selectedCaseId && showWForm && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <input value={wForm.name} onChange={(e) => setWForm({ ...wForm, name: e.target.value })} placeholder="Witness name *" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                      <select value={wForm.type} onChange={(e) => setWForm({ ...wForm, type: e.target.value })} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                        {['Petitioner', 'Respondent', 'Independent', 'Expert'].map(t => <option key={t}>{t}</option>)}
                      </select>
                      <select value={wForm.side} onChange={(e) => setWForm({ ...wForm, side: e.target.value })} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                        <option>Ours</option>
                        <option>Opposing</option>
                      </select>
                    </div>
                    <textarea
                      rows={3}
                      value={wForm.statement}
                      onChange={(e) => setWForm({ ...wForm, statement: e.target.value })}
                      placeholder="Their statement / summary of what they will say..."
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => setShowWForm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Cancel</button>
                      <button onClick={addWitness} disabled={wSaving || !wForm.name.trim()} className="glass-button" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: wSaving || !wForm.name.trim() ? '#93c5fd' : '#2563eb', color: '#fff', cursor: wSaving || !wForm.name.trim() ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12 }}>
                        {wSaving ? 'Saving...' : 'Save Witness'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Witness list */}
                {selectedCaseId && witnesses.length === 0 && !showWForm && (
                  <EmptyBox icon="ti-users" message="No witnesses added yet. Click + Add Witness to add your first witness." />
                )}
                {selectedCaseId && witnesses.map((w: any) => {
                  const ours = w.side === 'Ours'
                  return (
                    <div key={w.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14, background: '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{w.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: ours ? '#f0fdf4' : '#fef2f2', color: ours ? '#15803d' : '#dc2626' }}>{w.side}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', color: '#64748b' }}>{w.type}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => analyseWitness(w)}
                            disabled={analysingId === w.id}
                            className="glass-button"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 12px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', cursor: analysingId === w.id ? 'wait' : 'pointer', fontWeight: 600 }}
                          >
                            <i className="ti ti-sparkles" style={{ fontSize: 12 }} />
                            {analysingId === w.id ? 'Analysing...' : witnessBriefs[w.id] ? 'Re-analyse' : 'AI Analyse'}
                          </button>
                          <button
                            onClick={() => deleteWitness(w.id)}
                            title="Delete witness"
                            style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      {w.statement && (
                        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#475569', lineHeight: 1.5, fontStyle: 'italic' }}>
                          &ldquo;{w.statement.length > 220 ? w.statement.slice(0, 220) + '…' : w.statement}&rdquo;
                        </p>
                      )}

                      {analysingId === w.id && (
                        <LoadingBox message={'AI is analysing ' + w.name + '...'} />
                      )}
                      {!analysingId && witnessErrors[w.id] && (
                        <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 10 }}>
                          {witnessErrors[w.id]} Tap <strong>AI Analyse</strong> again to retry.
                        </div>
                      )}
                      {!analysingId && !!witnessBriefs[w.id] && <WitnessCard brief={witnessBriefs[w.id]!} />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE HEARINGS VIEW (Matching Mobile Prototype) ── */}
        <div className="mobile-hearings-view" style={{ display: 'none', flexDirection: 'column', gap: 16 }}>
          
          {/* Floating Pill Tabs Bar: Hearing Diary, Witness Intelligence */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: 30,
              padding: '6px 8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              gap: 6,
              justifyContent: 'space-between',
            }}
          >
            {['Hearing Diary', 'Witness Intelligence'].map((tab) => {
              const isSelected = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 20,
                    background: isSelected ? '#cbd5e1' : 'transparent',
                    color: '#0f172a',
                    border: 'none',
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Main Solid Grey Section with Rounded Top & Bottom extending full width */}
          <div
            style={{
              background: '#cbd5e1',
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: '24px 16px 40px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              margin: '8px -16px 0 -16px',
              flex: 1,
            }}
          >
            {/* ── TAB 1: HEARING DIARY ── */}
            {activeTab === 'Hearing Diary' && (
              <>
                {/* Section Header: Record Hearing */}
                <div>
                  <h2 style={{ margin: '0 0 2px 6px', fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
                    Record Hearing
                  </h2>
                  <p style={{ margin: '0 0 14px 6px', fontSize: 11, fontWeight: 600, color: '#475569' }}>
                    Record Todays Proceeding
                  </p>

                  {/* 3 Top Summary/Metrics Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    {[
                      { title: 'Upcoming', value: '1', sub: 'Hearings' },
                      { title: 'Stage', value: 'Arg.', sub: 'Current' },
                      { title: 'Status', value: 'Ready', sub: 'Case' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#e2e8f0',
                          borderRadius: 22,
                          padding: '16px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          minHeight: 110,
                        }}
                      >
                        <span style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{item.value}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 4 }}>{item.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* Full-width Card: Hearing Record Form / Quick Action */}
                  <div
                    style={{
                      background: '#e2e8f0',
                      borderRadius: 24,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Quick Proceeding Note</span>
                      <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#0f172a',
                          background: '#f8fafc',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: 12,
                          cursor: 'pointer',
                        }}
                      >
                        + Detailed Entry
                      </button>
                    </div>
                    <HearingForm onSaved={handleSaved} />
                  </div>
                </div>

                {/* Section 2: Hearing History & Orders */}
                <div>
                  <h2 style={{ margin: '0 0 12px 6px', fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
                    Proceedings Timeline
                  </h2>

                  {/* 3 Secondary Timeline / Stage Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    {[
                      { title: 'Orders', count: '3' },
                      { title: 'Passed', count: '2' },
                      { title: 'Pending', count: '1' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#e2e8f0',
                          borderRadius: 22,
                          padding: '16px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          minHeight: 110,
                        }}
                      >
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{item.count}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 4, whiteSpace: 'nowrap' }}>{item.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* Full-width Hearing History Card */}
                  <div
                    style={{
                      background: '#e2e8f0',
                      borderRadius: 24,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Recent Proceedings</span>
                    <HearingHistory refresh={refreshCount} />
                  </div>
                </div>
              </>
            )}

            {/* ── WITNESS INTELLIGENCE (MOBILE) ── */}
            {activeTab === 'Witness Intelligence' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Witnesses</h2>
                    <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: '#475569' }}>Per-witness AI preparation</p>
                  </div>
                  {selectedCaseId && (
                    <button
                      onClick={() => setShowWForm(!showWForm)}
                      style={{ padding: '8px 14px', borderRadius: 20, background: '#0f172a', color: '#ffffff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      + Add
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {!selectedCaseId && <EmptyBox icon="ti-folder-open" message="Select a case to manage witnesses." />}

                  {selectedCaseId && wListError && (
                    <div style={{ padding: '8px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 11, color: '#dc2626' }}>
                      {wListError}
                    </div>
                  )}

                  {selectedCaseId && showWForm && (
                    <div style={{ background: '#ffffff', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input value={wForm.name} onChange={(e) => setWForm({ ...wForm, name: e.target.value })} placeholder="Witness name *" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <select value={wForm.type} onChange={(e) => setWForm({ ...wForm, type: e.target.value })} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                          {['Petitioner', 'Respondent', 'Independent', 'Expert'].map(t => <option key={t}>{t}</option>)}
                        </select>
                        <select value={wForm.side} onChange={(e) => setWForm({ ...wForm, side: e.target.value })} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                          <option>Ours</option>
                          <option>Opposing</option>
                        </select>
                      </div>
                      <textarea
                        rows={3}
                        value={wForm.statement}
                        onChange={(e) => setWForm({ ...wForm, statement: e.target.value })}
                        placeholder="Their statement..."
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button onClick={addWitness} disabled={wSaving || !wForm.name.trim()} style={{ padding: '10px', borderRadius: 20, border: 'none', background: wSaving || !wForm.name.trim() ? '#93c5fd' : '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, cursor: wSaving || !wForm.name.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                        {wSaving ? 'Saving...' : 'Save Witness'}
                      </button>
                    </div>
                  )}

                  {selectedCaseId && witnesses.length === 0 && !showWForm && (
                    <EmptyBox icon="ti-users" message="No witnesses yet. Tap + Add to add your first witness." />
                  )}

                  {witnesses.map((w: any) => {
                    const ours = w.side === 'Ours'
                    return (
                      <div key={w.id} style={{ background: '#ffffff', borderRadius: 16, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{w.name}</span>
                            <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 8, background: ours ? '#f0fdf4' : '#fef2f2', color: ours ? '#15803d' : '#dc2626' }}>{w.side}</span>
                              <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 8, background: '#f1f5f9', color: '#64748b' }}>{w.type}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => analyseWitness(w)}
                            disabled={analysingId === w.id}
                            style={{ padding: '6px 12px', borderRadius: 16, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 700, cursor: analysingId === w.id ? 'wait' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                          >
                            {analysingId === w.id ? '...' : witnessBriefs[w.id] ? 'Re-run' : 'AI'}
                          </button>
                        </div>

                        {w.statement && (
                          <p style={{ fontSize: 11, color: '#475569', margin: '0 0 8px', lineHeight: 1.4, fontStyle: 'italic' }}>
                            &ldquo;{w.statement.length > 140 ? w.statement.slice(0, 140) + '…' : w.statement}&rdquo;
                          </p>
                        )}

                        {analysingId === w.id && <LoadingBox message={'Analysing ' + w.name + '...'} />}

                        {!analysingId && witnessErrors[w.id] && (
                          <div style={{ padding: '8px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 11, color: '#dc2626' }}>
                            {witnessErrors[w.id]}
                          </div>
                        )}
                        {!analysingId && !!witnessBriefs[w.id] && <WitnessCard brief={witnessBriefs[w.id]!} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
        </>
        )}
      </div>

      {showAddModal && (
        <AddHearingModal onClose={() => setShowAddModal(false)} onSaved={handleSaved} />
      )}
    </>
  )
}

// ── Shared UI components ─────────────────────────────────────

function AICard({ title, icon, color, bg, border, children }: { title: string; icon: string; color: string; bg: string; border: string; children: React.ReactNode }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <i className={`ti ${icon}`} style={{ color, fontSize: 15 }} />
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ── Google Calendar sync-status pill (click → Settings → Integrations) ──
function CalendarStatusPill() {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    integrationsApi.getStatus()
      .then((s: any) => setStatus(s))
      .catch(() => setStatus(null))
  }, [])

  const connected = !!status?.connected
  const errored = connected && !!status?.lastSyncError

  function tip() {
    if (!status) return 'Google Calendar — check your connection'
    if (!connected) return 'Google Calendar not connected — click to connect'
    if (errored) return `Google Calendar sync error: ${status.lastSyncError}`
    return status.lastSyncedAt
      ? `Google Calendar synced ${new Date(status.lastSyncedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
      : 'Google Calendar connected'
  }

  return (
    <button
      onClick={() => window.location.assign('/settings?section=Integrations')}
      title={tip()}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px',
        borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
        border: `1px solid ${connected ? (errored ? '#fca5a5' : '#a7f3d0') : '#e2e8f0'}`,
        background: connected ? (errored ? '#fef2f2' : '#f0fdf4') : '#f8fafc',
      }}
    >
      <i className="ti ti-brand-google" style={{ fontSize: 14, color: connected ? (errored ? '#dc2626' : '#059669') : '#94a3b8' }} />
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? (errored ? '#ef4444' : '#10b981') : '#cbd5e1' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: connected ? (errored ? '#b91c1c' : '#047857') : '#64748b' }}>Cal</span>
    </button>
  )
}

function EmptyBox({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: 0.5 }} />
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  )
}

function LoadingBox({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#7c3aed' }}>
      <i className="ti ti-loader-2" style={{ fontSize: 32, display: 'block', marginBottom: 10, animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 13, fontWeight: 500 }}>{message}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>This may take 15-20 seconds</div>
    </div>
  )
}
