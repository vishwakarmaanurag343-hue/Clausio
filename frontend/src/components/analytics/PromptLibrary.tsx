'use client'

import { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi } from '@/lib/api'

const PROMPTS = [
  {
    category: 'Case Analysis',
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    items: [
      { id: 'summary',        icon: 'ti-file-text',    title: 'Full Case Summary',         desc: 'Complete brief for Senior Counsel including parties, strengths, weaknesses and strategy.' },
      { id: 'contradictions', icon: 'ti-alert-triangle', title: 'Find Contradictions',      desc: 'Forensic analysis of inconsistencies between claims, statements and documents.' },
      { id: 'chronology',     icon: 'ti-timeline',     title: 'Build Timeline',             desc: 'Court-ready chronological timeline with dates, events and legal significance.' },
    ]
  },
  {
    category: 'Legal Research',
    color: '#15803d', bg: '#f0fdf4', border: '#86efac',
    items: [
      { id: 'research',  icon: 'ti-scale',     title: 'Find Binding Judgments',  desc: 'Supreme Court and High Court judgments with ratio decidendi and how to use them.' },
      { id: 'financial', icon: 'ti-currency-rupee', title: 'Financial Analysis', desc: 'Maintenance calculation using Rajnesh v. Neha standard with settlement range.' },
    ]
  },
  {
    category: 'Hearing Preparation',
    color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd',
    items: [
      { id: 'prep',      icon: 'ti-gavel',        title: 'Hearing Prep Brief',    desc: 'Complete day-of hearing brief with opening submission, arguments and documents.' },
      { id: 'readiness', icon: 'ti-shield-check', title: 'Readiness Check',       desc: 'Audit of case readiness with score, gaps and what to fix before the hearing.' },
      { id: 'witness',   icon: 'ti-users',        title: 'Witness Intelligence',  desc: 'Credibility scores, preparation tips and cross-examination questions per witness.' },
    ]
  },
  {
    category: 'Action & Planning',
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    items: [
      { id: 'actionplan', icon: 'ti-list-check', title: '30-Day Action Plan',  desc: 'Prioritised task list with deadlines, assignments and legal basis for each action.' },
    ]
  },
]

interface Result {
  promptId: string
  output: string
  time: string
}

export default function PromptLibrary() {
  const { selectedCaseId } = useCaseStore()
  const [loading,   setLoading]   = useState<string | null>(null)
  const [result,    setResult]    = useState<Result | null>(null)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [copied,    setCopied]    = useState(false)

  async function runPrompt(promptId: string) {
    if (!selectedCaseId) { setError('Please select a case from the dashboard first.'); return }
    setLoading(promptId)
    setError('')
    setResult(null)
    try {
      let res: any
      switch (promptId) {
        case 'summary':        res = await aiApi.getSummary(selectedCaseId);        break
        case 'contradictions': res = await aiApi.getContradictions(selectedCaseId); break
        case 'chronology':     res = await aiApi.getChronology(selectedCaseId);     break
        case 'research':       res = await aiApi.getLegalResearch(selectedCaseId);  break
        case 'financial':      res = await aiApi.getFinancial(selectedCaseId);      break
        case 'prep':           res = await aiApi.getPrep(selectedCaseId);           break
        case 'readiness':      res = await aiApi.getReadiness(selectedCaseId);      break
        case 'witness':        res = await aiApi.getWitness(selectedCaseId);        break
        case 'actionplan':     res = await aiApi.getActionPlan(selectedCaseId);     break
        default: return
      }
      const raw = res.summary ?? res.contradictions ?? res.chronology ?? res.judgments ??
                  res.analysis ?? res.brief ?? res.readiness ?? res.intelligence ??
                  res.actionPlan ?? res.result ?? ''
      let output = raw
      try {
        const parsed = JSON.parse(raw)
        output = JSON.stringify(parsed, null, 2)
      } catch { }
      setResult({ promptId, output, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) })
      // Save to history
      const stored = JSON.parse(localStorage.getItem('clausio_ai_history') || '[]')
      stored.unshift({ query: `Prompt: ${promptId}`, response: output, time: new Date().toISOString(), caseId: selectedCaseId })
      localStorage.setItem('clausio_ai_history', JSON.stringify(stored.slice(0, 100)))
    } catch (err: any) {
      setError(err.message || 'Failed to run prompt. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  function copyResult() {
    if (!result) return
    navigator.clipboard.writeText(result.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const allItems = PROMPTS.flatMap(cat => cat.items.map(item => ({ ...item, category: cat.category, color: cat.color, bg: cat.bg, border: cat.border })))
  const filtered = search ? allItems.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase())) : null

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Prompt Library</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Ready-made AI prompts — click any prompt to run instantly on your selected case.</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts..."
          style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, paddingLeft: 38, paddingRight: 14, fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      {!selectedCaseId && (
        <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e', marginBottom: 20 }}>
          <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
          Select a case from the dashboard to run these prompts on your actual case data.
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#dc2626', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Search results */}
      {filtered && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{filtered.length} prompts found</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {filtered.map(item => (
              <PromptCard key={item.id} item={item} loading={loading} onRun={runPrompt} />
            ))}
          </div>
        </div>
      )}

      {/* Category groups */}
      {!filtered && PROMPTS.map(cat => (
        <div key={cat.category} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            {cat.category}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {cat.items.map(item => (
              <PromptCard key={item.id} item={{ ...item, color: cat.color, bg: cat.bg, border: cat.border, category: cat.category }} loading={loading} onRun={runPrompt} />
            ))}
          </div>
        </div>
      ))}

      {/* Result panel */}
      {(loading || result) && (
        <div style={{ marginTop: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-sparkles" style={{ color: '#7c3aed' }} />
              {loading ? 'Generating...' : `Result · ${result?.time}`}
            </div>
            {result && (
              <button onClick={copyResult} style={{ height: 32, padding: '0 12px', background: copied ? '#f0fdf4' : '#f8fafc', border: `1px solid ${copied ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: copied ? '#15803d' : '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div style={{ padding: 20, maxHeight: 400, overflowY: 'auto' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: 30, color: '#7c3aed', fontSize: 13 }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />
                AI is generating... This may take 15-20 seconds.
              </div>
            )}
            {result && (
              <pre style={{ fontSize: 12, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                {result.output}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PromptCard({ item, loading, onRun }: { item: any; loading: string | null; onRun: (id: string) => void }) {
  const isLoading = loading === item.id
  return (
    <div style={{ background: isLoading ? item.bg : '#fff', border: `1px solid ${isLoading ? item.border : '#e2e8f0'}`, borderRadius: 12, padding: 16, transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = item.border; e.currentTarget.style.background = item.bg }}
      onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <i className={`ti ${item.icon}`} style={{ fontSize: 20, color: item.color }} />
        <button onClick={() => onRun(item.id)} disabled={!!loading}
          style={{ height: 28, padding: '0 10px', background: isLoading ? item.bg : item.color, color: isLoading ? item.color : '#fff', border: `1px solid ${item.color}`, borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, opacity: loading && !isLoading ? 0.5 : 1 }}>
          {isLoading ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} /> Running</> : <><i className="ti ti-play" /> Run</>}
        </button>
      </div>
      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 4 }}>{item.title}</div>
      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
    </div>
  )
}
