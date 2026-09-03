'use client'

export default function AboutClausio() {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'Not configured'
  const releaseChannel = process.env.NEXT_PUBLIC_RELEASE_CHANNEL || 'Not configured'
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'Not configured'
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Not configured'
  const currentYear = new Date().getFullYear()

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>About Clausio</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Version information and support.</p>
      </div>

      {/* Logo card */}
      <div style={{ padding: 24, background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', borderRadius: 16, marginBottom: 24, color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', marginBottom: 6 }}>Clausio</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Every clause. Intelligently handled.</div>
        <div style={{ marginTop: 12, display: 'inline-block', padding: '4px 12px', background: 'rgba(59,130,246,0.3)', borderRadius: 20, fontSize: 11, color: '#93c5fd', border: '1px solid rgba(59,130,246,0.4)' }}>
          Version {appVersion} · {releaseChannel}
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Application',      value: 'Clausio Legal Intelligence' },
          { label: 'Version',          value: appVersion                   },
          { label: 'Release Channel',  value: releaseChannel               },
          { label: 'Company',          value: companyName                  },
          { label: 'Support',          value: supportEmail                 },
          { label: 'Copyright',        value: `© ${currentYear} ${companyName}` },
        ].map((item, i) => (
          <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Support */}
      <div style={{ padding: 20, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 10 }}>📧 Support</div>
        {supportEmail !== 'Not configured' ? (
          <a href={`mailto:${supportEmail}`} style={{ fontSize: 13, color: '#1e40af' }}>{supportEmail}</a>
        ) : (
          <div style={{ fontSize: 13, color: '#1e40af' }}>Support contact is not configured for this deployment.</div>
        )}
      </div>

      {/* Legal */}
      <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
        {companyName !== 'Not configured' && `© ${currentYear} ${companyName}. All rights reserved. `}
        Clausio is an AI-assisted legal tool and does not constitute legal advice. Advocates are responsible for verifying AI-generated content before use in court.
      </div>
    </div>
  )
}
