'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BASE } from '@/lib/api'
import AIConsoleDashboard from '@/components/console/AIConsoleDashboard'
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard'

// Match the rest of the app: the live token lives in localStorage (the sliding-session
// refresh only updates localStorage, so the cookie goes stale). Fall back to the cookie.
function getToken() {
    if (typeof window === 'undefined') return ''
    return (
        localStorage.getItem('clausio_token') ||
        document.cookie.split(';').find(c => c.trim().startsWith('clausio_token='))?.split('=')[1] ||
        ''
    )
}

function describeStatus(status: number): string {
    if (status === 401) return 'Session expired or not signed in. Please sign in again.'
    if (status === 403) return 'This account is not a SuperAdmin.'
    if (status === 404) return 'Endpoint not found.'
    if (status >= 500) return `Server error (${status}).`
    return `Request failed (${status}).`
}

async function adminFetch(path: string) {
    const res = await fetch(`${BASE}/admin${path}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    })
    const newToken = res.headers.get('x-new-token')
    if (newToken && typeof window !== 'undefined') localStorage.setItem('clausio_token', newToken)
    if (!res.ok) throw new Error(describeStatus(res.status))
    return res.json()
}

async function adminAction(path: string, method: string, body?: any) {
    const res = await fetch(`${BASE}/admin${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    })
    const newToken = res.headers.get('x-new-token')
    if (newToken && typeof window !== 'undefined') localStorage.setItem('clausio_token', newToken)
    if (!res.ok) throw new Error(describeStatus(res.status))
    return res.json()
}

export default function AdminPage() {
    const router = useRouter()
    const [tab, setTab] = useState<'overview' | 'credits' | 'users' | 'audit' | 'ai' | 'console' | 'metrics'>('overview')
    const [stats, setStats] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [aiLogs, setAiLogs] = useState<any[]>([])
    const [creditsData, setCreditsData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [statsLoading, setStatsLoading] = useState(true)
    const [creditsLoading, setCreditsLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [error, setError] = useState('')
    const [authorized, setAuthorized] = useState<boolean | null>(null)

    // Check user role from localStorage (authApi.getUser())
    useEffect(() => {
        const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('clausio_user') || '{}') : null
        if (!user || user.role !== 'SuperAdmin') {
            router.push('/dashboard')
        } else {
            setAuthorized(true)
        }
    }, [router])

    const loadStats = useCallback(async () => {
        setStatsLoading(true); setError('')
        try { setStats(await adminFetch('/stats')) }
        catch (e: any) { setError(e.message || 'Failed to load stats.') }
        finally { setStatsLoading(false) }
    }, [])

    const loadUsers = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (roleFilter) params.set('role', roleFilter)
            const data = await adminFetch(`/users?${params}`)
            setUsers(data.data ?? [])
        } catch (e: any) { setError(e.message); setUsers([]) }
        finally { setLoading(false) }
    }, [search, roleFilter])

    const loadAudit = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const data = await adminFetch('/audit-logs?pageSize=50')
            setAuditLogs(data.data ?? [])
        } catch (e: any) { setError(e.message); setAuditLogs([]) }
        finally { setLoading(false) }
    }, [])

    const loadAiLogs = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const data = await adminFetch('/ai-logs?pageSize=50')
            setAiLogs(data.data ?? [])
        } catch (e: any) { setError(e.message); setAiLogs([]) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { if (authorized) loadStats() }, [authorized, loadStats])
    useEffect(() => { if (authorized && tab === 'users') loadUsers() }, [authorized, tab, loadUsers])
    useEffect(() => { if (authorized && tab === 'audit') loadAudit() }, [authorized, tab, loadAudit])
    useEffect(() => { if (authorized && tab === 'ai') loadAiLogs() }, [authorized, tab, loadAiLogs])
    useEffect(() => { setError('') }, [tab])

    async function handleRoleChange(userId: string, role: string) {
        try {
            await adminAction(`/users/${userId}/role`, 'PUT', { role })
            loadUsers()
        } catch { alert('Failed to update role') }
    }

    async function handleDeleteUser(userId: string, email: string) {
        if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
        try {
            await adminAction(`/users/${userId}`, 'DELETE')
            loadUsers()
        } catch { alert('Failed to delete user') }
    }

    const TABS = [
        { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
        { key: 'credits', label: 'Credits Tracker', icon: 'ti-coin' },
        { key: 'users', label: 'Users', icon: 'ti-users' },
        { key: 'audit', label: 'Audit Trail', icon: 'ti-list-check' },
        { key: 'ai', label: 'AI Logs', icon: 'ti-brain' },
        { key: 'console', label: 'AI Console', icon: 'ti-terminal-2' },
        { key: 'metrics', label: 'Observability & Metrics', icon: 'ti-chart-bar' },
    ]

    if (authorized === null) {
        return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Checking authorization...</div>
    }

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
                        Admin Panel
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                        Manage users, monitor AI usage and audit logs.
                    </p>
                </div>
                <div style={{ padding: '6px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#dc2626' }}>
                    SuperAdmin Only
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key as any)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', borderBottom: `2px solid ${tab === t.key ? '#2563eb' : 'transparent'}`, marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.key ? 600 : 500, background: 'transparent', color: tab === t.key ? '#1e40af' : '#64748b' }}>
                        <i className={`ti ${t.icon}`} style={{ fontSize: 14 }} />{t.label}
                    </button>
                ))}
            </div>

            {/* Global error banner */}
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
                    <span><i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />{error}</span>
                    <button
                        onClick={() => { setError(''); if (tab === 'overview') loadStats(); else if (tab === 'users') loadUsers(); else if (tab === 'audit') loadAudit(); else if (tab === 'ai') loadAiLogs() }}
                        style={{ padding: '4px 12px', border: '1px solid #fca5a5', borderRadius: 7, background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        Retry
                    </button>
                </div>
            )}

            {/* ── CREDITS TRACKER TAB ── */}
            {tab === 'credits' && (
                <iframe src="/admin/credits" style={{ width: '100%', height: 'calc(100vh - 200px)', border: 'none', borderRadius: 8 }} />
            )}

            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && statsLoading && !stats && (
                <div style={{ textAlign: 'center', padding: 48, color: '#64748b', fontSize: 13 }}>Loading stats…</div>
            )}
            {tab === 'overview' && !statsLoading && !stats && !error && (
                <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>No stats available.</div>
            )}
            {tab === 'overview' && stats && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                        {[
                            { label: 'Total Users', value: stats.totalUsers, icon: 'ti-users', color: '#2563eb' },
                            { label: 'Total Cases', value: stats.totalCases, icon: 'ti-folder', color: '#7c3aed' },
                            { label: 'Total Documents', value: stats.totalDocuments, icon: 'ti-files', color: '#0891b2' },
                            { label: 'Active Today', value: stats.activeUsersToday, icon: 'ti-activity', color: '#16a34a' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{s.label}</span>
                                    <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.color }} />
                                </div>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', letterSpacing: '-1px' }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                        {[
                            { label: 'AI Calls Today', value: stats.aiCallsToday, icon: 'ti-brain', color: '#7c3aed' },
                            { label: 'AI Success Rate', value: `${stats.aiSuccessRate}%`, icon: 'ti-check', color: '#16a34a' },
                            { label: 'Avg AI Latency', value: `${stats.avgAiLatencyMs}ms`, icon: 'ti-clock', color: '#d97706' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{s.label}</span>
                                    <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.color }} />
                                </div>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', letterSpacing: '-1px' }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── USERS TAB ── */}
            {tab === 'users' && (
                <div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            style={{ flex: 1, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                            style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                            <option value="">All Roles</option>
                            <option value="SuperAdmin">SuperAdmin</option>
                            <option value="SeniorAdvocate">SeniorAdvocate</option>
                            <option value="JuniorAdvocate">JuniorAdvocate</option>
                        </select>
                        <button onClick={loadUsers}
                            style={{ padding: '9px 18px', border: 'none', borderRadius: 10, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                            Search
                        </button>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['Name', 'Email', 'Phone', 'Role', 'Joined', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
                                )}
                                {!loading && users.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>No users found.</td></tr>
                                )}
                                {users.map((u, i) => (
                                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{u.firstName} {u.lastName}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.email}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.phone ?? '—'}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <select value={u.role ?? ''} onChange={e => handleRoleChange(u.id, e.target.value)}
                                                style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', background: '#f8fafc', cursor: 'pointer' }}>
                                                <option value="SuperAdmin">SuperAdmin</option>
                                                <option value="SeniorAdvocate">SeniorAdvocate</option>
                                                <option value="JuniorAdvocate">JuniorAdvocate</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                                            {new Date(u.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button onClick={() => handleDeleteUser(u.id, u.email)}
                                                style={{ padding: '4px 10px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── AUDIT TRAIL TAB ── */}
            {tab === 'audit' && (
                <div>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['Time', 'User', 'Action', 'Path', 'Status', 'Duration'].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>}
                                {auditLogs.map((log, i) => (
                                    <tr key={log.id} style={{ borderBottom: i < auditLogs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.userEmail ?? 'Anonymous'}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: log.action.includes('LOGIN') ? '#eff6ff' : log.action.includes('AI') ? '#f5f3ff' : '#f0fdf4', color: log.action.includes('LOGIN') ? '#1d4ed8' : log.action.includes('AI') ? '#7c3aed' : '#15803d' }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>{log.path}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: log.statusCode === 200 ? '#f0fdf4' : log.statusCode >= 400 ? '#fef2f2' : '#fff7ed', color: log.statusCode === 200 ? '#15803d' : log.statusCode >= 400 ? '#dc2626' : '#d97706' }}>
                                                {log.statusCode}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{log.duration}ms</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── AI LOGS TAB ── */}
            {tab === 'ai' && (
                <div>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['Time', 'Intent', 'Model', 'Latency', 'Tokens', 'Citation Score', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>}
                                {aiLogs.map((log, i) => (
                                    <tr key={log.id} style={{ borderBottom: i < aiLogs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 500 }}>{log.intent}</td>
                                        <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>{log.model}</td>
                                        <td style={{ padding: '10px 14px', color: log.latencyMs > 10000 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{log.latencyMs}ms</td>
                                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{log.tokensIn + log.tokensOut}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 60, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${log.citationConfidenceScore}%`, background: log.citationConfidenceScore > 70 ? '#16a34a' : '#d97706', borderRadius: 99 }} />
                                                </div>
                                                <span style={{ fontSize: 11, color: '#64748b' }}>{log.citationConfidenceScore}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: log.isSuccess ? '#f0fdf4' : '#fef2f2', color: log.isSuccess ? '#15803d' : '#dc2626' }}>
                                                {log.isSuccess ? 'Success' : 'Failed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── AI CONSOLE TAB (moved here from /console — SuperAdmin only) ── */}
            {tab === 'console' && (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>AI Developer Console &amp; Telemetry</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                            Real-time tracking of AI models, token consumption (In/Out), prompt latency, and endpoint fallback logs.
                        </p>
                    </div>
                    <AIConsoleDashboard />
                </div>
            )}

            {/* ── OBSERVABILITY & METRICS TAB (moved here from AI Analytics page) ── */}
            {tab === 'metrics' && (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Observability &amp; Metrics</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                            AI usage overview, model quality scores and interaction telemetry.
                        </p>
                    </div>
                    <AnalyticsDashboard />
                </div>
            )}
        </div>
    )
}
