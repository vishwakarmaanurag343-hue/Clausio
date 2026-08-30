'use client'

import { useCallback, useEffect, useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi } from '@/lib/api'
import AIResponseFormatter from '@/components/common/AIResponseFormatter'

interface SimilarJudgment {
  caseName: string
  citation: string
  year: number | null
  court: string
  caseType: string
  ratioDecidendi: string
  howToUse: string
  similarityLevel: string
  chunkText: string
  relevanceScore: number
}

type SubTab = 'similar' | 'compare' | 'applicability'

interface Props {
  /** Optional — defaults to the globally selected case. */
  caseId?: string
}

const SUB_TABS: { id: SubTab; label: string; icon: string }[] = [
  { id: 'similar',        label: 'Similar Cases',        icon: 'ti-search' },
  { id: 'compare',        label: 'Compare Judgments',    icon: 'ti-git-compare' },
  { id: 'applicability',  label: 'Applicability Report', icon: 'ti-file-text' },
]

export default function JudgmentAnalysis({ caseId }: Props) {
  const { selectedCaseId, selectedCaseName } = useCaseStore()
  const activeCaseId = caseId || selectedCaseId

  const [subTab, setSubTab] = useState<SubTab>('similar')

  const [judgments, setJudgments] = useState<SimilarJudgment[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [compareIdx, setCompareIdx] = useState<number[]>([])

  const [comparison, setComparison] = useState('')
  const [comparing,  setComparing]  = useState(false)
  const [compareErr, setCompareErr] = useState('')

  const [applyIdx,   setApplyIdx]   = useState<number | ''>('')
  const [report,     setReport]     = useState('')
  const [reporting,  setReporting]  = useState(false)
  const [reportErr,  setReportErr]  = useState('')
  const [copied,     setCopied]     = useState(false)

  const loadSimilar = useCallback(async () => {
    if (!activeCaseId) { setError('Please select a case from the dashboard first.'); return }
    setLoading(true); setError(''); setJudgments([])
    try {
      const res = await aiApi.getSimilarJudgments(activeCaseId, 5)
      setJudgments(Array.isArray(res?.judgments) ? res.judgments : [])
    } catch (err: any) {
      setError(err?.message || 'Failed to get similar judgments.')
    } finally {
      setLoading(false)
    }
  }, [activeCaseId])

  useEffect(() => { loadSimilar() }, [loadSimilar])

  function toggle(key: string) {
    setExpanded(p => ({ ...p, [key]: !p[key] }))
  }

  function toggleCompare(idx: number) {
    setCompareIdx(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx)
      if (prev.length >= 2)   return prev
      return [...prev, idx]
    })
  }

  function clearCompare() {
    setCompareIdx([]); setComparison(''); setCompareErr('')
  }

  async function runComparison() {
    if (compareIdx.length !== 2 || !activeCaseId) return
    const [a, b] = compareIdx.map(i => judgments[i])
    setComparing(true); setCompareErr(''); setComparison('')
    try {
      const res = await aiApi.compareJudgments(activeCaseId, {
        judgment1Text: a.chunkText, judgment1Name: a.caseName,
        judgment2Text: b.chunkText, judgment2Name: b.caseName,
      })
      setComparison(res?.comparison ?? res?.result ?? '')
    } catch (err: any) {
      setCompareErr(err?.message || 'Failed to compare judgments.')
    } finally {
      setComparing(false)
    }
  }

  async function generateReport() {
    if (applyIdx === '' || !activeCaseId) return
    const j = judgments[applyIdx]
    setReporting(true); setReportErr(''); setReport('')
    try {
      const res = await aiApi.getApplicabilityReport(activeCaseId, {
        judgmentText: j.chunkText,
        judgmentName: j.caseName,
        caseName: selectedCaseName || 'the current case',
      })
      setReport(res?.report ?? res?.result ?? '')
    } catch (err: any) {
      setReportErr(err?.message || 'Failed to get applicability report.')
    } finally {
      setReporting(false)
    }
  }

  function copyReport() {
    if (!report) return
    navigator.clipboard.writeText(report)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Judgment Analysis</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
          Find the most relevant past SC/HC judgments for this case, compare them, and work out exactly how to use each one in court.
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
        {SUB_TABS.map(t => {
          const isActive = subTab === t.id
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                border: 'none', borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                background: 'transparent', whiteSpace: 'nowrap',
                color: isActive ? '#1e40af' : '#64748b',
              }}>
              <i className={`ti ${t.icon}`} style={{ fontSize: 15 }} />
              {t.label}
              {t.id === 'compare' && compareIdx.length > 0 && (
                <span style={{ fontSize: 10, padding: '1px 6px', background: '#eff6ff', color: '#2563eb', borderRadius: 10, fontWeight: 700 }}>
                  {compareIdx.length}/2
                </span>
              )}
            </button>
          )
        })}
      </div>

      {!activeCaseId && (
        <div style={cardSt}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Select a case from the dashboard to run judgment analysis.</p>
        </div>
      )}

      {/* ── TAB 1: SIMILAR CASES ─────────────────────────────── */}
      {activeCaseId && subTab === 'similar' && (
        <div>
          {loading && <LoadingBlock label="Searching 136,000 SC judgment chunks for the closest matches…" />}

          {error && !loading && (
            <div style={errSt}>
              {error}
              <button onClick={loadSimilar} style={{ ...ghostBtn, marginLeft: 12 }}>Retry</button>
            </div>
          )}

          {!loading && !error && judgments.length === 0 && (
            <div style={cardSt}>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                No similar judgments found in the corpus for this case yet.
              </p>
            </div>
          )}

          {!loading && judgments.length > 0 && (
            <>
              {compareIdx.length === 2 && (
                <div style={{ ...noticeSt, marginBottom: 14 }}>
                  <span>2 judgments selected for comparison.</span>
                  <button onClick={() => setSubTab('compare')} style={primaryBtnSm}>Compare These 2</button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {judgments.map((j, i) => {
                  const picked = compareIdx.includes(i)
                  return (
                    <div key={i} style={{ ...cardSt, borderColor: picked ? '#93c5fd' : '#e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>{j.caseName}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                            {[j.year, j.court, j.caseType].filter(Boolean).join(' · ')}
                            {j.citation && j.citation !== j.caseName && (
                              <span style={{ marginLeft: 8, color: '#64748b' }}>{j.citation}</span>
                            )}
                          </div>
                        </div>
                        <SimilarityBadge level={j.similarityLevel} />
                      </div>

                      <Collapsible
                        open={!!expanded[`${i}-ratio`]}
                        onToggle={() => toggle(`${i}-ratio`)}
                        title="Ratio decidendi"
                        body={j.ratioDecidendi || 'Not available for this extract.'}
                      />
                      <Collapsible
                        open={!!expanded[`${i}-howto`]}
                        onToggle={() => toggle(`${i}-howto`)}
                        title="How to use in court"
                        body={j.howToUse || 'Not available for this extract.'}
                        accent
                      />

                      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button
                          onClick={() => toggleCompare(i)}
                          disabled={!picked && compareIdx.length >= 2}
                          style={{
                            ...ghostBtn,
                            background: picked ? '#eff6ff' : '#f8fafc',
                            borderColor: picked ? '#2563eb' : '#e2e8f0',
                            color: picked ? '#1d4ed8' : '#475569',
                            cursor: !picked && compareIdx.length >= 2 ? 'not-allowed' : 'pointer',
                            opacity: !picked && compareIdx.length >= 2 ? 0.5 : 1,
                          }}>
                          <i className={`ti ${picked ? 'ti-check' : 'ti-git-compare'}`} />
                          {picked ? 'Selected' : 'Compare'}
                        </button>
                        <button
                          onClick={() => { setApplyIdx(i); setSubTab('applicability') }}
                          style={ghostBtn}>
                          <i className="ti ti-file-text" />
                          Get Applicability Report
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 2: COMPARE JUDGMENTS ─────────────────────────── */}
      {activeCaseId && subTab === 'compare' && (
        <div>
          {compareIdx.length < 2 ? (
            <div style={cardSt}>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Pick 2 judgments in the <strong>Similar Cases</strong> tab using the “Compare” button, then come back here.
                {compareIdx.length === 1 && ' (1 selected so far.)'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                {compareIdx.map(idx => {
                  const j = judgments[idx]
                  return (
                    <div key={idx} style={cardSt}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#2563eb' }}>{j.caseName}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                        {[j.year, j.court].filter(Boolean).join(' · ')}
                      </div>
                      <SimilarityBadge level={j.similarityLevel} style={{ marginTop: 10 }} />
                      {j.ratioDecidendi && (
                        <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>
                          {j.ratioDecidendi}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={runComparison} disabled={comparing} style={{ ...primaryBtn, opacity: comparing ? 0.7 : 1 }}>
                  <i className={`ti ${comparing ? 'ti-loader animate-spin' : 'ti-sparkles'}`} />
                  {comparing ? 'Running Comparison…' : 'Run Comparison'}
                </button>
                <button onClick={clearCompare} style={ghostBtn}>
                  <i className="ti ti-x" /> Clear selection
                </button>
              </div>

              {compareErr && <div style={errSt}>{compareErr}</div>}
              {comparing && <LoadingBlock label="Comparing the two judgments for this case…" />}
              {comparison && !comparing && (
                <div style={{ ...cardSt, padding: 16 }}>
                  <AIResponseFormatter content={comparison} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB 3: APPLICABILITY REPORT ──────────────────────── */}
      {activeCaseId && subTab === 'applicability' && (
        <div>
          <div style={{ ...cardSt, marginBottom: 16 }}>
            <label style={labelSt}>Judgment</label>
            <select
              value={applyIdx}
              onChange={e => setApplyIdx(e.target.value === '' ? '' : Number(e.target.value))}
              style={inputSt}>
              <option value="">
                {judgments.length ? 'Select a judgment from the Similar Cases results…' : 'Run Similar Cases first…'}
              </option>
              {judgments.map((j, i) => (
                <option key={i} value={i}>
                  {j.caseName}{j.year ? ` (${j.year})` : ''} — {j.similarityLevel} relevance
                </option>
              ))}
            </select>

            <button
              onClick={generateReport}
              disabled={applyIdx === '' || reporting}
              style={{ ...primaryBtn, marginTop: 14, opacity: applyIdx === '' || reporting ? 0.6 : 1,
                       cursor: applyIdx === '' || reporting ? 'not-allowed' : 'pointer' }}>
              <i className={`ti ${reporting ? 'ti-loader animate-spin' : 'ti-sparkles'}`} />
              {reporting ? 'Generating Report…' : 'Generate Report'}
            </button>
          </div>

          {reportErr && <div style={errSt}>{reportErr}</div>}
          {reporting && <LoadingBlock label="Working up the judgment for court use…" />}

          {report && !reporting && (
            <div style={{ ...cardSt, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <button onClick={copyReport} style={ghostBtn}>
                  <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} /> {copied ? 'Copied!' : 'Copy Report'}
                </button>
              </div>
              <AIResponseFormatter content={report} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── sub-components ─────────────────────────────────────────── */

function SimilarityBadge({ level, style }: { level: string; style?: React.CSSProperties }) {
  const l = (level || '').toLowerCase()
  const c = l === 'high'
    ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' }
    : l === 'medium'
    ? { bg: '#fffbeb', color: '#d97706', border: '#fcd34d' }
    : { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
  return (
    <span style={{
      flexShrink: 0, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.4,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`, ...style,
    }}>
      {level || 'Low'}
    </span>
  )
}

function Collapsible({ open, onToggle, title, body, accent }: {
  open: boolean; onToggle: () => void; title: string; body: string; accent?: boolean
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
        background: accent ? '#f0fdf4' : '#f8fafc',
        border: `1px solid ${accent ? '#bbf7d0' : '#e2e8f0'}`,
        color: accent ? '#16a34a' : '#475569',
      }}>
        {title}
        <i className={`ti ${open ? 'ti-chevron-up' : 'ti-chevron-down'}`} />
      </button>
      {open && (
        <div style={{ padding: '10px 12px', fontSize: 13, color: '#334155', lineHeight: 1.7 }}>
          {body}
        </div>
      )}
    </div>
  )
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div style={{ ...cardSt, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className="ti ti-loader animate-spin" style={{ fontSize: 18, color: '#2563eb' }} />
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
    </div>
  )
}

/* ── styles ────────────────────────────────────────────────── */

const cardSt: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 24px',
}
const labelSt: React.CSSProperties = {
  display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#374151',
}
const inputSt: React.CSSProperties = {
  width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px',
  fontSize: 13, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', fontFamily: 'inherit',
}
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10,
  border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit',
}
const primaryBtnSm: React.CSSProperties = {
  ...primaryBtn, padding: '8px 14px', fontSize: 12,
}
const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer',
  fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'inherit',
}
const errSt: React.CSSProperties = {
  marginBottom: 14, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fca5a5',
  borderRadius: 8, fontSize: 13, color: '#dc2626',
}
const noticeSt: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
  fontSize: 13, color: '#1e40af', fontWeight: 500,
}
