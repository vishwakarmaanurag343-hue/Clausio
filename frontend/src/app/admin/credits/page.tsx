'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'

export default function AdminCreditsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminApi.getCreditStats()
      .then(setData)
      .catch((e: any) => setError(e.message || 'Failed'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{
      padding: 40,
      textAlign: 'center',
      color: '#64748b',
      fontSize: 16,
    }}>
      Loading...
    </div>
  )

  if (error) return (
    <div style={{
      padding: 40,
      color: '#dc2626'
    }}>
      Error: {error}
    </div>
  )

  const filtered = (data?.users ?? [])
    .filter((u: any) => {
      if (!search) return true
      const searchLower = search.toLowerCase()
      return (u.email?.toLowerCase().includes(searchLower) ||
        u.name?.toLowerCase().includes(searchLower))
    })
    .map((u: any) => ({
      ...u,
      wallet: u.wallet || { balance: 0, totalUsed: 0, lastUsed: null }
    }))

  return (
    <div style={{
      padding: '32px 24px',
      maxWidth: 1100,
      margin: '0 auto',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{
        fontSize: 22,
        fontWeight: 800,
        color: '#0f172a',
        marginBottom: 24,
      }}>
        Credit Usage — Admin
      </h1>

      {/* Summary strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}>
        {[
          {
            label: 'Total Users',
            value: data?.totalUsers ?? 0,
            color: '#2563eb',
          },
          {
            label: 'Credits Granted',
            value: data?.totalCreditsGranted ?? 0,
            color: '#16a34a',
          },
          {
            label: 'Credits Used',
            value: data?.totalCreditsUsed ?? 0,
            color: '#d97706',
          },
          {
            label: 'Out of Credits',
            value: data?.usersOutOfCredits ?? 0,
            color: '#dc2626',
          },
          {
            label: 'Low Credits (<10)',
            value: data?.usersLowCredits ?? 0,
            color: '#d97706',
          },
        ].map((c, i) => (
          <div key={i} style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 16px',
          }}>
            <div style={{
              fontSize: 26,
              fontWeight: 800,
              color: c.color,
            }}>
              {c.value}
            </div>
            <div style={{
              fontSize: 11,
              color: '#64748b',
              marginTop: 4,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search user..."
        value={search}
        onChange={e =>
          setSearch(e.target.value)}
        style={{
          width: '100%',
          maxWidth: 360,
          padding: '9px 14px',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          fontSize: 13,
          fontFamily: 'inherit',
          marginBottom: 14,
          outline: 'none',
          boxSizing: 'border-box' as const,
        }}
      />

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}>
          <thead>
            <tr style={{
              background: '#f8fafc',
            }}>
              {['Name', 'Email',
                'Credits Left',
                'Credits Used',
                'Last Used', 'Status']
              .map(h => (
                <th key={h} style={{
                  padding: '10px 12px',
                  textAlign: 'left' as const,
                  fontWeight: 700,
                  color: '#475569',
                  fontSize: 11,
                  textTransform:
                    'uppercase' as const,
                  borderBottom:
                    '2px solid #e2e8f0',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any,
              i: number) => {
              const bal = u.wallet?.balance ?? 0
              const used = Math.abs(u.wallet?.totalUsed ?? 0)
              const last = u.wallet?.lastUsed
              const status =
                bal === 0 ? 'Out'
                : bal < 10 ? 'Low'
                : 'Active'
              const sc =
                bal === 0 ? '#dc2626'
                : bal < 10 ? '#d97706'
                : '#16a34a'
              return (
                <tr key={u.id} style={{
                  background: i % 2 === 0
                    ? '#fff' : '#f8fafc',
                  borderBottom:
                    '1px solid #f1f5f9',
                }}>
                  <td style={{
                    padding: '10px 12px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}>
                    {u.name?.trim() || '—'}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    color: '#64748b',
                  }}>
                    {u.email || '—'}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    fontWeight: 800,
                    color: sc,
                    fontSize: 16,
                  }}>
                    {Number.isInteger(bal) ? bal : '0'}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    color: '#374151',
                    fontWeight: 600,
                  }}>
                    {Number.isInteger(used) ? used : '0'}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    color: '#64748b',
                    fontSize: 12,
                  }}>
                    {last && typeof last === 'string'
                      ? new Date(last).toLocaleDateString('en-IN')
                      : 'Never'}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                  }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: sc + '15',
                      color: sc,
                    }}>
                      {status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 32,
            color: '#94a3b8',
          }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  )
}
