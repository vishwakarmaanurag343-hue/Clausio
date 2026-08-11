'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi } from '@/lib/api'

import HearingForm     from '@/components/hearings/HearingForm'
import HearingHistory  from '@/components/hearings/HearingHistory'
import AddHearingModal from '@/components/hearings/AddHearingModal'
import HearingTabs     from '@/components/hearings/HearingTabs'
import DeadlineBanner  from '@/components/hearings/DeadlineBanner'
import CaseTypeBadge   from '@/components/ui/CaseTypeBadge'

export default function HearingsPage() {
  const { selectedCaseId } = useCaseStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab,    setActiveTab]    = useState('Hearing Diary')
  const [refreshCount, setRefreshCount] = useState(0)

  // Prep Brief state
  const [prepData,    setPrepData]    = useState<any>(null)
  const [prepLoading, setPrepLoading] = useState(false)
  const [prepError,   setPrepError]   = useState('')

  // Witness Intelligence state
  const [witnessData,    setWitnessData]    = useState<any>(null)
  const [witnessLoading, setWitnessLoading] = useState(false)
  const [witnessError,   setWitnessError]   = useState('')

  function handleSaved() { setRefreshCount(c => c + 1) }

  // Load prep brief when tab opens
  const loadPrep = useCallback(async () => {
    if (!selectedCaseId) return
    setPrepLoading(true)
    setPrepError('')
    setPrepData(null)
    try {
      const res = await aiApi.getPrep(selectedCaseId)
      const raw = res.brief ?? res.result ?? ''
      try { setPrepData(JSON.parse(raw)) }
      catch { setPrepData({ openingStatement: raw }) }
    } catch (err: any) {
      setPrepError(err.message || 'Failed to generate prep brief.')
    } finally { setPrepLoading(false) }
  }, [selectedCaseId])

  // Load witness intelligence when tab opens
  const loadWitness = useCallback(async () => {
    if (!selectedCaseId) return
    setWitnessLoading(true)
    setWitnessError('')
    setWitnessData(null)
    try {
      const res = await aiApi.getWitness(selectedCaseId)
      const raw = res.intelligence ?? res.result ?? ''
      try { setWitnessData(JSON.parse(raw)) }
      catch { setWitnessData({ raw }) }
    } catch (err: any) {
      setWitnessError(err.message || 'Failed to generate witness intelligence.')
    } finally { setWitnessLoading(false) }
  }, [selectedCaseId])

  useEffect(() => {
    if (activeTab === 'Prep Brief'          && !prepData    && !prepLoading)    loadPrep()
    if (activeTab === 'Witness Intelligence' && !witnessData && !witnessLoading) loadWitness()
  }, [activeTab, selectedCaseId])

  // Reset when case changes
  useEffect(() => {
    setPrepData(null)
    setWitnessData(null)
  }, [selectedCaseId])

  return (
    <>
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>

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
            <button className="glass-button" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, border: 'none', borderRadius: 10, cursor: 'pointer', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
              <i className="ti ti-plus" /> Add Hearing
            </button>
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

          {/* ── PREP BRIEF TAB — NOW REAL AI ── */}
          {activeTab === 'Prep Brief' && (
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>Hearing Preparation Brief</h2>
                  <p style={{ color: '#64748b', marginTop: 4, fontSize: 13 }}>AI-generated preparation notes for the next hearing.</p>
                </div>
                <button
                  onClick={loadPrep}
                  disabled={prepLoading}
                  className="glass-button"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, border: 'none', borderRadius: 10, cursor: prepLoading ? 'not-allowed' : 'pointer', background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 13, opacity: prepLoading ? 0.7 : 1 }}
                >
                  <i className="ti ti-sparkles" />
                  {prepLoading ? 'Generating...' : prepData ? 'Regenerate' : 'Generate Brief'}
                </button>
              </div>

              {!selectedCaseId && (
                <EmptyBox icon="ti-folder-open" message="Select a case to generate prep brief." />
              )}

              {selectedCaseId && prepLoading && (
                <LoadingBox message="AI is preparing your hearing brief..." />
              )}

              {selectedCaseId && prepError && !prepLoading && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
                  {prepError}
                  <button onClick={loadPrep} style={{ marginLeft: 12, fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
                </div>
              )}

              {selectedCaseId && !prepLoading && !prepData && !prepError && (
                <EmptyBox icon="ti-sparkles" message="Click Generate Brief to get AI-powered hearing preparation notes." />
              )}

              {prepData && !prepLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  {/* Today's Objective */}
                  {prepData.todayObjective && (
                    <AICard color="#1d4ed8" bg="rgba(59,130,246,0.05)" border="rgba(59,130,246,0.15)" title="Today's Objective" icon="ti-target">
                      <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.6 }}>{prepData.todayObjective}</p>
                    </AICard>
                  )}

                  {/* Judge Notes */}
                  {prepData.judgeNotes && (
                    <AICard color="#a16207" bg="rgba(234,179,8,0.05)" border="rgba(234,179,8,0.15)" title="Judge Notes" icon="ti-gavel">
                      <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.6 }}>{prepData.judgeNotes}</p>
                    </AICard>
                  )}

                  {/* Key Arguments */}
                  {prepData.keyArguments?.length > 0 && (
                    <AICard color="#15803d" bg="rgba(34,197,94,0.05)" border="rgba(34,197,94,0.15)" title="Key Arguments" icon="ti-scale">
                      <ul style={{ fontSize: 13, color: '#334155', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                        {prepData.keyArguments.map((a: string, i: number) => <li key={i}>{a}</li>)}
                      </ul>
                    </AICard>
                  )}

                  {/* Documents Required */}
                  {prepData.documentsRequired?.length > 0 && (
                    <AICard color="#b91c1c" bg="rgba(239,68,68,0.05)" border="rgba(239,68,68,0.15)" title="Documents Required" icon="ti-files">
                      <ul style={{ fontSize: 13, color: '#334155', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                        {prepData.documentsRequired.map((d: string, i: number) => <li key={i}>{d}</li>)}
                      </ul>
                    </AICard>
                  )}

                  {/* Anticipated Defence */}
                  {prepData.anticipatedDefence?.length > 0 && (
                    <AICard color="#6d28d9" bg="rgba(124,58,237,0.05)" border="rgba(124,58,237,0.15)" title="Anticipated Defence" icon="ti-shield">
                      <ul style={{ fontSize: 13, color: '#334155', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                        {prepData.anticipatedDefence.map((d: string, i: number) => <li key={i}>{d}</li>)}
                      </ul>
                    </AICard>
                  )}

                  {/* Opening Statement */}
                  {prepData.openingStatement && (
                    <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg,rgba(30,58,138,0.06),rgba(59,130,246,0.04))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-message-2" /> Suggested Opening Statement
                      </div>
                      <p style={{ fontSize: 13, color: '#1e3a8a', fontStyle: 'italic', margin: 0, lineHeight: 1.8, fontWeight: 500 }}>
                        "{prepData.openingStatement}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── WITNESS INTELLIGENCE TAB — NOW REAL AI ── */}
          {activeTab === 'Witness Intelligence' && (
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>Witness Intelligence</h2>
                  <p style={{ color: '#64748b', marginTop: 4, fontSize: 13 }}>AI analysis of witness credibility and cross-examination strategy.</p>
                </div>
                <button
                  onClick={loadWitness}
                  disabled={witnessLoading}
                  className="glass-button"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, border: 'none', borderRadius: 10, cursor: witnessLoading ? 'not-allowed' : 'pointer', background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: 13, opacity: witnessLoading ? 0.7 : 1 }}
                >
                  <i className="ti ti-sparkles" />
                  {witnessLoading ? 'Analysing...' : witnessData ? 'Re-analyse' : 'Analyse Witnesses'}
                </button>
              </div>

              {!selectedCaseId && <EmptyBox icon="ti-folder-open" message="Select a case to analyse witnesses." />}
              {selectedCaseId && witnessLoading && <LoadingBox message="AI is analysing witnesses..." />}
              {selectedCaseId && witnessError && !witnessLoading && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
                  {witnessError}
                  <button onClick={loadWitness} style={{ marginLeft: 12, fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
                </div>
              )}
              {selectedCaseId && !witnessLoading && !witnessData && !witnessError && (
                <EmptyBox icon="ti-users" message="Click Analyse Witnesses to get AI-powered witness strategy." />
              )}

              {witnessData && !witnessLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Witness cards */}
                  {witnessData.witnesses?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Our Witnesses</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {witnessData.witnesses.map((w: any, i: number) => (
                          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{w.name}</div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{w.role}</div>
                              </div>
                              {w.credibilityScore && (
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: 18, fontWeight: 800, color: w.credibilityScore >= 70 ? '#15803d' : '#d97706' }}>{w.credibilityScore}%</div>
                                  <div style={{ fontSize: 10, color: '#64748b' }}>Credibility</div>
                                </div>
                              )}
                            </div>
                            {w.keyTestimony && <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>{w.keyTestimony}</p>}
                            {w.crossExamRisks?.length > 0 && (
                              <div style={{ background: '#fef2f2', borderRadius: 6, padding: '6px 10px' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Cross-exam risks</div>
                                {w.crossExamRisks.map((r: string, j: number) => (
                                  <div key={j} style={{ fontSize: 11, color: '#7f1d1d' }}>• {r}</div>
                                ))}
                              </div>
                            )}
                            {w.preparation && (
                              <div style={{ marginTop: 8, fontSize: 11, color: '#15803d', background: '#f0fdf4', borderRadius: 6, padding: '6px 10px', fontWeight: 500 }}>
                                💡 {w.preparation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cross examination questions */}
                  {witnessData.crossExaminationQuestions?.length > 0 && (
                    <AICard color="#1d4ed8" bg="rgba(59,130,246,0.04)" border="rgba(59,130,246,0.15)" title="Cross-Examination Questions for Opposing Witnesses" icon="ti-question-mark">
                      <ol style={{ fontSize: 13, color: '#334155', margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                        {witnessData.crossExaminationQuestions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                      </ol>
                    </AICard>
                  )}

                  {/* Raw fallback */}
                  {witnessData.raw && (
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                      <pre style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {witnessData.raw}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
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
