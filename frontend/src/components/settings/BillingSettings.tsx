'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { settingsBillingApi, walletApi } from '@/lib/api'
import { subscriptionApi } from '@/lib/billingApi'

function statusColor(status?: string) {
  switch (status) {
    case 'Active':    return '#16a34a'
    case 'Trial':     return '#d97706'
    case 'Expired':   return '#dc2626'
    case 'Cancelled': return '#64748b'
    default:          return '#64748b'
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
}

function limitText(n: number | undefined, noun: string) {
  if (n === undefined || n === null) return `— ${noun}`
  return n >= 999999 ? `Unlimited ${noun}` : `Up to ${n.toLocaleString('en-IN')} ${noun}`
}

export default function BillingSettings() {
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [wallet, setWallet] = useState<Awaited<ReturnType<typeof walletApi.getSummary>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [actionMsg,  setActionMsg]  = useState('')

  useEffect(() => { load() }, [])

  async function handleCancel() {
    if (!window.confirm('Cancel your subscription? Access continues until the current period ends and your data is kept for 90 days.')) return
    setCancelling(true)
    setActionMsg('')
    try {
      await subscriptionApi.cancel('Cancelled from Settings → Billing')
      await load()
      setActionMsg('Subscription cancelled. Access continues until the period ends.')
    } catch (err: any) {
      setActionMsg(err.message || 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [data, walletData] = await Promise.all([
        settingsBillingApi.getSummary(),
        walletApi.getSummary(),
      ])
      setSummary(data)
      setWallet(walletData)
    } catch (err: any) {
      setError(err.message || 'Failed to load billing summary')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <i className="ti ti-loader animate-spin" style={{ fontSize: 30, color: '#2563eb' }} />
        <p style={{ marginTop: 12, fontSize: 13 }}>Loading billing…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, color: '#dc2626', textAlign: 'center' }}>
        {error}
        <button onClick={load} style={{ display: 'block', margin: '12px auto 0', padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Retry</button>
      </div>
    )
  }

  const sc = statusColor(summary?.status)

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Billing &amp; Subscription</h2>
        <p style={{ marginTop: 6, color: '#64748b', fontSize: 13 }}>Your current plan at a glance. Full management is on the Billing page.</p>
      </div>

      {/* CREDIT USAGE */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>AI Credit Usage</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 16 }}>
          <IncludeCard icon="ti-coin" text={`${wallet?.balance ?? 0} credits remaining`} />
          <IncludeCard icon="ti-chart-line" text={`${wallet?.totalSpent ?? 0} credits used`} />
          <IncludeCard icon="ti-gift" text={`${wallet?.totalEarned ?? 0} credits received`} />
        </div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700, color: '#475569' }}>
            Recent credit activity
          </div>
          {!wallet?.recent?.length ? (
            <div style={{ padding: '18px 16px', color: '#64748b', fontSize: 12 }}>No credit activity yet.</div>
          ) : (
            wallet.recent.map((transaction, index) => (
              <div key={`${transaction.createdAt}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 16px', borderBottom: index < wallet.recent.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{transaction.description || transaction.type}</div>
                  <div style={{ marginTop: 3, fontSize: 11, color: '#64748b' }}>{new Date(transaction.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: transaction.amount < 0 ? '#dc2626' : '#16a34a' }}>
                  {transaction.amount < 0 ? '' : '+'}{transaction.amount} credits
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 1 — CURRENT PLAN CARD */}
      <div style={{ border: `1px solid ${sc}33`, background: `${sc}0d`, borderRadius: 16, padding: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{summary?.planName ?? '—'}</h3>
              <span style={{ padding: '3px 10px', background: sc + '22', color: sc, borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                {(summary?.status ?? '').toUpperCase()}
              </span>
            </div>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13 }}>
              {summary?.daysRemaining ?? 0} days remaining · Next billing date {formatDate(summary?.endDate)}
              {summary?.totalAmount ? ` · Rs. ${Number(summary.totalAmount).toLocaleString('en-IN')}/- ${summary?.isAnnual ? 'per year' : 'per month'}` : ''}
            </p>
          </div>
          <button disabled style={{ ...primaryButton, background: '#e2e8f0', color: '#94a3b8', cursor: 'default' }}>
            Subscription management coming soon
          </button>
        </div>
      </div>

      {/* 2 — WHAT THIS PLAN INCLUDES */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Your Plan Includes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <IncludeCard icon="ti-folders" text={limitText(summary?.maxCases, 'cases')} />
          <IncludeCard icon="ti-file-text" text={limitText(summary?.maxDraftsPerMonth, 'drafts / month')} />
          <IncludeCard icon="ti-users" text={limitText(summary?.maxTeamMembers, 'team members')} />
        </div>
      </div>

      {/* 3 + 4 — QUICK LINKS */}
      <div>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Quick Links</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button onClick={() => router.push('/billing?tab=Invoices')} style={linkButton}><i className="ti ti-download" /> Download Invoices</button>
          <button disabled style={{ ...linkButton, color: '#94a3b8', cursor: 'default' }}><i className="ti ti-clock" /> Upgrade plan coming soon</button>
          <button
            onClick={handleCancel}
            disabled={cancelling || summary?.status === 'Cancelled' || summary?.status === 'Expired'}
            style={{ ...linkButton, color: '#dc2626', borderColor: '#fca5a5', opacity: (cancelling || summary?.status === 'Cancelled' || summary?.status === 'Expired') ? 0.5 : 1, cursor: cancelling ? 'default' : 'pointer' }}>
            <i className="ti ti-x-circle" /> {cancelling ? 'Cancelling…' : summary?.status === 'Cancelled' ? 'Subscription Cancelled' : 'Cancel Subscription'}
          </button>
        </div>
        {actionMsg && (
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: actionMsg.startsWith('Subscription cancelled') ? '#16a34a' : '#dc2626' }}>
            {actionMsg}
          </div>
        )}
      </div>
    </div>
  )
}

function IncludeCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 20, color: '#2563eb', flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{text}</span>
    </div>
  )
}

const primaryButton: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', flexShrink: 0 }
const linkButton: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', color: '#475569' }
