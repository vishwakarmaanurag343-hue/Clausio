'use client'
// ─────────────────────────────────────────────────
//  src/components/cases/CaseTable.tsx
//
//  The main case list table with:
//  • Checkbox column for bulk selection
//  • 9 data columns
//  • Hover-reveal Edit / Delete buttons
//  • Pagination row at bottom
//
//  USED IN: src/app/cases/page.tsx
// ─────────────────────────────────────────────────

// Sample cases — replace with real API data later
const CASES = [
  {
    id:      'c1',
    name:    'Priya v. Rohit Sharma',
    number:  'FC/2847/2023',
    client:  'Priya Sharma',
    court:   'Family Court',
    loc:     'Bandra',
    type:    'Family',
    typeBg:  '#eff6ff', typeClr: '#1e40af',
    stage:   'Evidence',
    status:  'Hearing today',
    sDot:    '#ef4444',
    hearing: '17 Jun 2024',
    hClr:    '#dc2626',
    priority: 'High',
    pBg:     '#fef2f2', pClr: '#dc2626',
  },
  {
    id:      'c2',
    name:    'Mehta v. Mehta',
    number:  'FC/1203/2024',
    client:  'Ravi Mehta',
    court:   'Family Court',
    loc:     'Vadodara',
    type:    'Family',
    typeBg:  '#eff6ff', typeClr: '#1e40af',
    stage:   'Written Statement',
    status:  'Active',
    sDot:    '#10b981',
    hearing: '3 Jul 2024',
    hClr:    '#374151',
    priority: 'Medium',
    pBg:     '#fef3c7', pClr: '#d97706',
  },
  {
    id:      'c3',
    name:    'State v. Ramesh Patel',
    number:  'CR/445/2024',
    client:  'Ramesh Patel',
    court:   'Sessions Court',
    loc:     'Ahmedabad',
    type:    'Criminal',
    typeBg:  '#fef2f2', typeClr: '#dc2626',
    stage:   'Bail Hearing',
    status:  'Pending filing',
    sDot:    '#f59e0b',
    hearing: '22 Jun 2024',
    hClr:    '#374151',
    priority: 'Urgent',
    pBg:     '#fef2f2', pClr: '#dc2626',
  },
  {
    id:      'c4',
    name:    'Gupta Property Dispute',
    number:  'CIV/2090/2023',
    client:  'Vijay Gupta',
    court:   'Civil Court',
    loc:     'Nagpur',
    type:    'Civil',
    typeBg:  '#fff7ed', typeClr: '#c2410c',
    stage:   'Evidence stage',
    status:  'Awaiting client',
    sDot:    '#3b82f6',
    hearing: '25 Jul 2024',
    hClr:    '#374151',
    priority: 'Medium',
    pBg:     '#fef3c7', pClr: '#d97706',
  },
  {
    id:      'c5',
    name:    'Khan Cheque Bounce',
    number:  'NI/338/2024',
    client:  'Arif Khan',
    court:   'Magistrate Court',
    loc:     'Mumbai',
    type:    'NI Act 138',
    typeBg:  '#f0fdf4', typeClr: '#15803d',
    stage:   'Filing',
    status:  'Active',
    sDot:    '#10b981',
    hearing: '10 Jul 2024',
    hClr:    '#374151',
    priority: 'Low',
    pBg:     '#f0fdf4', pClr: '#15803d',
  },
  {
    id:      'c6',
    name:    'Sharma GST Appeal',
    number:  'GST/112/2024',
    client:  'Dinesh Sharma',
    court:   'GST Tribunal',
    loc:     'Delhi',
    type:    'GST',
    typeBg:  '#f5f3ff', typeClr: '#7c3aed',
    stage:   'Arguments',
    status:  'Active',
    sDot:    '#10b981',
    hearing: '18 Jul 2024',
    hClr:    '#374151',
    priority: 'Medium',
    pBg:     '#fef3c7', pClr: '#d97706',
  },
]

interface Props {
  onEdit:   (caseId: string) => void
  onDelete: (caseId: string) => void
}

export default function CaseTable({ onEdit, onDelete }: Props) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                '',          // checkbox
                'Case', 'Client', 'Court', 'Type',
                'Stage', 'Status', 'Next hearing', 'Priority', 'Actions',
              ].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '8px 12px', textAlign: 'left', fontSize: 10,
                    fontWeight: 600, color: '#64748b', background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
                    position: 'sticky', top: 0,
                  }}
                >
                  {h === '' ? <input type="checkbox" style={{ accentColor: '#1e3a8a' }} /> : h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {CASES.map(c => (
              <tr
                key={c.id}
                onClick={() => onEdit(c.id)}
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
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{c.number}</div>
                </td>

                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, verticalAlign: 'middle' }}>{c.client}</td>

                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: 11 }}>{c.court}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{c.loc}</div>
                </td>

                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: c.typeBg, color: c.typeClr }}>
                    {c.type}
                  </span>
                </td>

                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, verticalAlign: 'middle' }}>{c.stage}</td>

                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.sDot, display: 'inline-block' }} />
                    {c.status}
                  </span>
                </td>

                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 11, color: c.hClr, fontWeight: c.hClr !== '#374151' ? 500 : 400, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  {c.hearing}
                </td>

                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: c.pBg, color: c.pClr }}>
                    {c.priority}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px', background: '#fff', borderTop: '1px solid #e2e8f0',
          fontSize: 11, color: '#64748b', flexShrink: 0,
        }}
      >
        <span>Showing 6 of 154 cases</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['← Prev', '1', '2', '3', 'Next →'].map((p, i) => (
            <button
              key={i}
              style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                border: '1px solid #e2e8f0', fontFamily: 'inherit',
                background: p === '1' ? '#eff6ff' : '#f8fafc',
                color:      p === '1' ? '#1e40af' : '#64748b',
                borderColor: p === '1' ? '#bfdbfe' : '#e2e8f0',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
