// src/components/ui/EmptyState.tsx
// Shows when a list has no items — much better than showing nothing.
// Usage:
//   <EmptyState icon="ti-folder" title="No cases yet" desc="Add your first case to get started" action="New case" onAction={() => setModal(true)} />

interface Props {
  icon:     string
  title:    string
  desc:     string
  action?:  string
  onAction?: () => void
}

export default function EmptyState({ icon, title, desc, action, onAction }: Props) {
  return (
    <div className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', gap: 8 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 24, color: '#94a3b8' }} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{title}</p>
      <p style={{ fontSize: 12, color: '#64748b', maxWidth: 240, lineHeight: 1.5 }}>{desc}</p>
      {action && onAction && (
        <button onClick={onAction}
          style={{ marginTop: 8, padding: '7px 16px', borderRadius: 7, background: '#1e3a8a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-plus" style={{ fontSize: 12 }} />{action}
        </button>
      )}
    </div>
  )
}