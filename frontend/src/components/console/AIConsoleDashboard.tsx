'use client'

import { useState, useEffect, useCallback } from 'react'
import { aiAnalyticsApi } from '@/lib/api'

interface TelemetryLog {
  id: string
  taskIntent?: string
  prompt?: string
  model?: string
  latencyMs?: number
  totalTokens?: number
  citationConfidenceScore?: number
  isSuccess?: boolean
  createdAt?: string
}

interface ModelStat { model: string; count: number; averageLatency: number }

export default function AIConsoleDashboard() {
  const [overview, setOverview] = useState<any>(null)
  const [quality, setQuality] = useState<any>(null)
  const [models, setModels] = useState<ModelStat[]>([])
  const [logs, setLogs] = useState<TelemetryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterModel, setFilterModel] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [o, q, m, l] = await Promise.all([
        aiAnalyticsApi.getOverview().catch(() => null),
        aiAnalyticsApi.getQuality().catch(() => null),
        aiAnalyticsApi.getModels().catch(() => []),
        aiAnalyticsApi.getLogs(50).catch(() => []),
      ])
      setOverview(o)
      setQuality(q)
      setModels(Array.isArray(m) ? m : [])
      setLogs(Array.isArray(l) ? l : [])
      if (!o && !q && (!Array.isArray(l) || l.length === 0)) {
        setError('Could not load AI telemetry. The API may be unreachable or the DB is down.')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load AI telemetry.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const modelNames = Array.from(new Set(logs.map(l => l.model).filter(Boolean))) as string[]

  const filteredLogs = logs.filter(log => {
    const matchesModel = filterModel === 'all' || (log.model ?? '').toLowerCase().includes(filterModel.toLowerCase())
    const q = searchQuery.trim().toLowerCase()
    const matchesQuery = q === '' ||
      (log.taskIntent ?? '').toLowerCase().includes(q) ||
      (log.prompt ?? '').toLowerCase().includes(q) ||
      (log.model ?? '').toLowerCase().includes(q)
    return matchesModel && matchesQuery
  })

  const fmtNum = (n: number | undefined | null) => (n ?? 0).toLocaleString('en-IN')
  const fmtTime = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return isNaN(+d) ? '—' : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const kpis = [
    { icon: 'ti-activity', color: '#2563eb', label: 'Requests (30 days)', value: fmtNum(overview?.totalRequests) },
    { icon: 'ti-coins', color: '#7c3aed', label: 'Total Tokens (30 days)', value: fmtNum(overview?.totalTokens30Days) },
    { icon: 'ti-dashboard', color: '#d97706', label: 'Avg Latency', value: overview ? `${Math.round(overview.averageLatencyMs).toLocaleString('en-IN')} ms` : '—' },
    { icon: 'ti-circle-check', color: '#16a34a', label: 'Success Rate', value: overview ? `${Math.round(overview.successRate)}%` : '—' },
    { icon: 'ti-quote', color: '#0891b2', label: 'Avg Citation Confidence', value: quality ? `${Math.round(quality.averageCitationConfidence)}/10` : '—' },
    { icon: 'ti-alert-hexagon', color: '#dc2626', label: 'Avg Hallucination Risk', value: quality ? `${Math.round(quality.averageHallucinationRisk)}/10` : '—' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>

      {/* Banner */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
            <i className="ti ti-terminal-2" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0f172a' }}>Clausio AI Telemetry Console</h3>
              <span style={{ fontSize: 10, background: error ? '#fee2e2' : '#dcfce7', color: error ? '#b91c1c' : '#15803d', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                {error ? 'DEGRADED' : 'LIVE'}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Token consumption, latency, quality scores and model routing — from AiTelemetryLogs.</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#475569', cursor: loading ? 'wait' : 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
          <i className={`ti ${loading ? 'ti-loader animate-spin' : 'ti-refresh'}`} style={{ fontSize: 13 }} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
          <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />{error}
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className={`ti ${k.icon}`} style={{ color: k.color, fontSize: 15 }} /> {k.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{loading && !overview ? '…' : k.value}</div>
          </div>
        ))}
      </div>

      {/* Model routing breakdown */}
      {models.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Model Routing (30 days)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {models.map((m, i) => {
              const total = models.reduce((s, x) => s + x.count, 0) || 1
              const pct = Math.round((m.count / total) * 100)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#7c3aed', width: 220, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.model || 'unknown'}</span>
                  <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#2563eb', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b', width: 130, textAlign: 'right', flexShrink: 0 }}>
                    {m.count} · {Math.round(m.averageLatency).toLocaleString('en-IN')}ms
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Logs table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>AI Interaction Logs</h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Latest {logs.length} calls · showing {filteredLogs.length}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="text" placeholder="Search intent / template / model…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#0f172a', outline: 'none', fontFamily: 'inherit', minWidth: 200 }} />
            <select value={filterModel} onChange={e => setFilterModel(e.target.value)}
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#0f172a', outline: 'none', fontFamily: 'inherit' }}>
              <option value="all">All Models</option>
              {modelNames.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }}>
                {['TIME', 'INTENT', 'TEMPLATE', 'MODEL', 'LATENCY', 'TOKENS', 'CITATION', 'STATUS'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading telemetry…</td></tr>
              )}
              {!loading && filteredLogs.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>No interaction logs.</td></tr>
              )}
              {filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtTime(log.createdAt)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {log.taskIntent || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 500 }}>{log.prompt || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#7c3aed', fontWeight: 600, fontFamily: 'monospace' }}>{log.model || '—'}</td>
                  <td style={{ padding: '10px 12px', color: (log.latencyMs ?? 0) > 30000 ? '#dc2626' : '#0f172a', fontWeight: 700 }}>
                    {fmtNum(log.latencyMs)} ms
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>{fmtNum(log.totalTokens)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 44, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(log.citationConfidenceScore ?? 0) * 10}%`, background: (log.citationConfidenceScore ?? 0) >= 7 ? '#16a34a' : '#d97706', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{log.citationConfidenceScore ?? 0}/10</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: log.isSuccess ? '#dcfce7' : '#fef2f2', color: log.isSuccess ? '#15803d' : '#dc2626', border: `1px solid ${log.isSuccess ? '#bbf7d0' : '#fca5a5'}`, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                      {log.isSuccess ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
