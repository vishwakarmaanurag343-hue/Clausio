'use client'

export default function AboutClausio() {
  const currentYear = new Date().getFullYear()

  return (
    <div style={{ fontFamily: 'inherit' }}>

      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>About Clausio</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>Platform information and legal notice.</p>

      {/* Branding */}
      <div style={{ padding: '20px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>⚖️</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Clausio</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Every clause. Intelligently handled.</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ padding: '4px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 20, fontSize: 11, fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            Production
          </span>
        </div>
      </div>

      {/* Info rows */}
      {[
        { label: 'Company', value: 'Clausio Technologies Private Limited' },
        { label: 'Website', value: 'clausiotech.com', href: 'https://clausiotech.com' },
        { label: 'Platform', value: 'app.clausiotech.com', href: 'https://app.clausiotech.com' },
        { label: 'Support', value: 'support@clausiotech.com', href: 'mailto:support@clausiotech.com' },
        { label: 'Incorporated', value: 'Mumbai, Maharashtra, India · Est. 2026' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{item.label}</span>
          {item.href ? (
            <a href={item.href} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>{item.value}</a>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.value}</span>
          )}
        </div>
      ))}

      {/* Features */}
      <div style={{ padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, margin: '20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>What Clausio does</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            'AI Legal Drafting',
            'Case Strategy & Risk Assessment',
            'Hearing Preparation',
            'Witness Intelligence',
            'Document Analysis & OCR',
            'Client Updates & Communication',
            'Chronology & Timeline',
            'Contradiction Detection',
          ].map((feat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155' }}>
              <i className="ti ti-circle-check-filled" style={{ color: '#22c55e', fontSize: 14, flexShrink: 0 }} />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, marginBottom: 20, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
        <strong>Legal Notice:</strong> Clausio is an AI-powered assistant for legal professionals. It does not constitute formal legal advice. Always verify AI-generated content before relying on it in court proceedings.
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
        © {currentYear} Clausio Technologies Private Limited. All rights reserved.
      </div>
    </div>
  )
}
