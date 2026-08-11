// src/components/ui/LoadingSpinner.tsx
// Usage: <LoadingSpinner /> or <LoadingSpinner size={24} color="#3b82f6" />

interface Props {
  size?:  number
  color?: string
  label?: string
}

export default function LoadingSpinner({ size = 20, color = '#1e3a8a', label }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className="animate-spin"
        style={{ width: size, height: size, border: `2px solid ${color}20`, borderTop: `2px solid ${color}`, borderRadius: '50%' }}
      />
      {label && <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>}
    </div>
  )
}

// Skeleton loader for cards
export function SkeletonCard({ height = 80 }: { height?: number }) {
  return <div className="skeleton" style={{ height, width: '100%', borderRadius: 8 }} />
}

// Skeleton for table rows
export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 14px', alignItems: 'center' }}>
      <div className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="skeleton" style={{ height: 12, width: '60%' }} />
        <div className="skeleton" style={{ height: 10, width: '35%' }} />
      </div>
      <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 20 }} />
    </div>
  )
}

// Full page loading state
export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <LoadingSpinner size={32} label={label} />
    </div>
  )
}