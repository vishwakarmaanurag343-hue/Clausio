'use client'

export default function AIDisclaimer({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      background: '#fffbeb',
      border: '1px solid #fde68a',
      borderRadius: 8,
      fontSize: 11,
      color: '#92400e',
      fontWeight: 500,
      ...style
    }}>
      <i className="ti ti-robot" style={{ fontSize: 13, flexShrink: 0 }} />
      <span>
        <strong>AI-generated content.</strong> Verify independently before use in court. 
        Clausio is an AI research assistant, not a legal advisor. 
        Always exercise independent professional judgment.
      </span>
    </div>
  )
}
