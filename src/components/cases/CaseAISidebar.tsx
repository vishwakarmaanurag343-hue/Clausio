// ─────────────────────────────────────────────
//  src/components/cases/CaseAISidebar.tsx
//  Right panel — AI suggestions + missing docs
// ─────────────────────────────────────────────

const SUGGESTIONS = [
  { dot: '#ef4444', text: 'Priya v. Rohit — 2 overdue deadlines. Respondent reply missing.'      },
  { dot: '#f59e0b', text: 'State v. Ramesh — Bail hearing in 5 days. Prepare surety docs.'       },
  { dot: '#10b981', text: 'Khan Cheque — Similar SC judgment found. Add to research.'             },
  { dot: '#7c3aed', text: 'Sharma GST — ITC refund precedent found before arguments.'            },
  { dot: '#3b82f6', text: 'Gupta Property — Survey number verification pending from client.'     },
]

const MISSING = [
  { dot: '#ef4444', text: 'Priya v. Rohit — Income tax returns not uploaded'   },
  { dot: '#ef4444', text: 'Gupta Property — Sale deed original missing'         },
  { dot: '#f59e0b', text: 'State v. Ramesh — FIR certified copy needed'        },
]

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, background: '#fff' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 12, color: '#7c3aed' }} />
      {label}
    </div>
  )
}

function Item({ dot, text }: { dot: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '7px 10px', borderBottom: '1px solid #f8fafc', fontSize: 10, color: '#374151', lineHeight: 1.5, alignItems: 'flex-start' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 3 }} />
      <div>{text}</div>
    </div>
  )
}

export default function CaseAISidebar() {
  return (
    <div style={{ width: 196, borderLeft: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
      <SectionHeader icon="ti-brain" label="AI suggestions" />
      {SUGGESTIONS.map((s, i) => <Item key={i} {...s} />)}

      <SectionHeader icon="ti-file-alert" label="Missing docs" />
      {MISSING.map((m, i) => <Item key={i} {...m} />)}
    </div>
  )
}