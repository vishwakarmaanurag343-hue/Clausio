'use client'

import { useState, useEffect } from 'react'

interface HistoryItem {
  query:    string
  response: string
  time:     string
  caseId:   string | null
}

export default function AIHistory() {
  const [history,  setHistory]  = useState<HistoryItem[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [search,   setSearch]   = useState('')
  const [copied,   setCopied]   = useState<number | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('clausio_ai_history')
    if (stored) setHistory(JSON.parse(stored))
  }, [])

  function clearHistory() {
    if (!confirm('Clear all AI history? This cannot be undone.')) return
    localStorage.removeItem('clausio_ai_history')
    setHistory([])
  }

  function copyItem(idx: number, item: HistoryItem) {
    navigator.clipboard.writeText(`Query: ${item.query}\n\nResponse:\n${item.response}`)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  function deleteItem(idx: number) {
    const updated = history.filter((_, i) => i !== idx)
    setHistory(updated)
    localStorage.setItem('clausio_ai_history', JSON.stringify(updated))
  }

  function exportHistory() {
    const text = history.map((h, i) =>
      `--- Entry ${i + 1} | ${new Date(h.time).toLocaleString('en-IN')} ---\nQuery: ${h.query}\nResponse:\n${h.response}\n`
    ).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'clausio-ai-history.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) {
      return `Today ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const filtered = search
    ? history.filter(h => h.query.toLowerCase().includes(search.toLowerCase()) || h.response.toLowerCase().includes(search.toLowerCase()))
    : history

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>AI History</h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
            All your AI queries and responses — {history.length} total.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {history.length > 0 && (
            <>
              <button onClick={exportHistory} style={{ height: 36, padding: '0 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-download" /> Export
              </button>
              <button onClick={clearHistory} style={{ height: 36, padding: '0 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#dc2626', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-trash" /> Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {history.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Queries', value: history.length, icon: 'ti-message', color: '#2563eb' },
            { label: 'Today',         value: history.filter(h => new Date(h.time).toDateString() === new Date().toDateString()).length, icon: 'ti-calendar', color: '#15803d' },
            { label: 'This Week',     value: history.filter(h => (Date.now() - new Date(h.time).getTime()) < 7 * 24 * 60 * 60 * 1000).length, icon: 'ti-clock', color: '#7c3aed' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
              </div>
              <i className={`ti ${s.icon}`} style={{ fontSize: 24, color: s.color, opacity: 0.3 }} />
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {history.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 16 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search history..."
            style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 10, paddingLeft: 38, paddingRight: 14, fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <i className="ti ti-history" style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No history yet</div>
          <div style={{ fontSize: 13 }}>Your AI Chat and Prompt Library queries will appear here automatically.</div>
        </div>
      )}

      {/* History list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((item, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            {/* Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === i ? null : i)}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ti ti-robot" style={{ fontSize: 16, color: '#2563eb' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.query}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{formatTime(item.time)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={e => { e.stopPropagation(); copyItem(i, item) }}
                  style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${copied === i ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: 13, color: copied === i ? '#22c55e' : '#64748b' }} />
                </button>
                <button onClick={e => { e.stopPropagation(); deleteItem(i) }}
                  style={{ width: 28, height: 28, border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-trash" style={{ fontSize: 13, color: '#dc2626' }} />
                </button>
                <i className={`ti ${expanded === i ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 16, color: '#94a3b8', padding: 4 }} />
              </div>
            </div>

            {/* Expanded response */}
            {expanded === i && (
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 16px', background: '#f8fafc' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Response</div>
                <pre style={{ fontSize: 12, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, maxHeight: 300, overflowY: 'auto' }}>
                  {item.response}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && search && (
        <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
          No results for "{search}"
        </div>
      )}
    </div>
  )
}
