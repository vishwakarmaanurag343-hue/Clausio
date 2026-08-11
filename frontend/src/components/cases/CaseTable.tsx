'use client'

interface Props {
  cases:    any[]
  loading:  boolean
  error:    string
  onEdit:   (caseId: string) => void
  onDelete: (caseId: string) => void
}

export default function CaseTable({ cases, loading, error, onEdit, onDelete }: Props) {

  function getTypeBadge(caseType: string) {
    const map: Record<string, { bg: string; clr: string }> = {
      'Family':     { bg: '#eff6ff', clr: '#1e40af' },
      'Criminal':   { bg: '#fef2f2', clr: '#dc2626' },
      'Civil':      { bg: '#fff7ed', clr: '#c2410c' },
      'GST':        { bg: '#f5f3ff', clr: '#7c3aed' },
      'Tax':        { bg: '#f5f3ff', clr: '#7c3aed' },
      'NI Act 138': { bg: '#f0fdf4', clr: '#15803d' },
    }
    return map[caseType] ?? { bg: '#f8fafc', clr: '#64748b' }
  }

  function getPriorityBadge(priority: string) {
    const map: Record<string, { bg: string; clr: string }> = {
      'Low':    { bg: '#f0fdf4', clr: '#15803d' },
      'Medium': { bg: '#fef3c7', clr: '#d97706' },
      'High':   { bg: '#fff7ed', clr: '#c2410c' },
      'Urgent': { bg: '#fef2f2', clr: '#dc2626' },
    }
    return map[priority] ?? { bg: '#f8fafc', clr: '#64748b' }
  }

  function getStatusDot(status: string) {
    if (status === 'Active')  return '#10b981'
    if (status === 'Closed')  return '#94a3b8'
    if (status === 'Pending') return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

      {/* Loading */}
      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          Loading cases...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: 20, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && cases.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          No cases found.
        </div>
      )}

      {/* Table */}
      {!loading && !error && cases.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['', 'Case', 'Client', 'Court', 'Type', 'Stage', 'Status', 'Next Hearing', 'Priority', 'Actions'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', position: 'sticky', top: 0 }}>
                    {h === '' ? <input type="checkbox" style={{ accentColor: '#1e3a8a' }} /> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map(c => {
                const clientName    = c.client ? `${c.client.firstName ?? ''} ${c.client.lastName ?? ''}`.trim() : '—'
                const typeBadge     = getTypeBadge(c.caseType)
                const priorityBadge = getPriorityBadge(c.priority)
                const dot           = getStatusDot(c.status)

                return (
                  <tr
                    key={c.id}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => {
                      const tds = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                      tds.forEach(td => (td.style.background = '#f8fafc'))
                      const acts = e.currentTarget.querySelector<HTMLElement>('.case-acts')
                      if (acts) acts.style.opacity = '1'
                    }}
                    onMouseLeave={e => {
                      const tds = (e.currentTarget as HTMLTableRowElement).querySelectorAll('td')
                      tds.forEach(td => (td.style.background = ''))
                      const acts = e.currentTarget.querySelector<HTMLElement>('.case-acts')
                      if (acts) acts.style.opacity = '0'
                    }}
                  >
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <input type="checkbox" style={{ accentColor: '#1e3a8a' }} onClick={e => e.stopPropagation()} />
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{c.caseNumber}</div>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, verticalAlign: 'middle' }}>
                      {clientName}
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 11 }}>{c.court}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{c.courtLocation}</div>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: typeBadge.bg, color: typeBadge.clr }}>
                        {c.caseType || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, verticalAlign: 'middle' }}>
                      {c.stage || '—'}
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block' }} />
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {c.nextHearing
                        ? new Date(c.nextHearing).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: priorityBadge.bg, color: priorityBadge.clr }}>
                        {c.priority || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                      <div className="case-acts" style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.12s' }}>
                        <button
                          onClick={e => { e.stopPropagation(); onEdit(c.id) }}
                          style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', border: 'none', background: '#eff6ff', color: '#1e40af', fontFamily: 'inherit', fontWeight: 500 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(c.id) }}
                          style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', border: 'none', background: '#fef2f2', color: '#dc2626', fontFamily: 'inherit', fontWeight: 500 }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && cases.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: '#fff', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', flexShrink: 0 }}>
          <span>Showing {cases.length} cases</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['← Prev', '1', 'Next →'].map((p, i) => (
              <button key={i} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '1px solid #e2e8f0', fontFamily: 'inherit', background: p === '1' ? '#eff6ff' : '#f8fafc', color: p === '1' ? '#1e40af' : '#64748b' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
