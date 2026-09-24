'use client'

export default function PrivacyData() {
  return (
    <div style={{ }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Privacy & Data</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>How Clausio handles your data and your clients' information.</p>

      {[
        { icon: 'ti-shield-lock', title: 'Your data stays in India', body: 'All case data, documents and client information are stored on AWS Mumbai (ap-south-1) servers. Your data never leaves India.' },
        { icon: 'ti-eye-off', title: 'Zero-PII AI Processing', body: 'Before any document is sent to the AI engine, all personally identifiable information (names, phone numbers, addresses) is tokenized and replaced with placeholders. The AI never sees real client data.' },
        { icon: 'ti-lock', title: 'Secure Storage', body: 'All connections use HTTPS. Your case files and documents are stored securely on AWS Mumbai servers. We are working towards full AES-256 encryption at rest.' },
        { icon: 'ti-user-shield', title: 'Attorney-Client Privilege Protected', body: 'Clausio is designed to respect attorney-client privilege. Your case strategy, communications and documents are private to your account only.' },
        { icon: 'ti-file-check', title: 'DPDP Act 2023 — In Progress', body: 'Clausio is being built in alignment with the Digital Personal Data Protection Act 2023. We follow principles of data minimization and purposeful processing. Full compliance certification is in progress.' },
        { icon: 'ti-trash', title: 'Data Deletion', body: 'You can request deletion of all your data at any time by emailing support@clausiotech.com. We will process your request within 30 days.' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 18, color: '#0369a1' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{item.body}</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20, padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
        For our full Privacy Policy visit <a href="https://clausiotech.com/privacy" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>clausiotech.com/privacy</a> · For data requests email <a href="mailto:privacy@clausiotech.com" style={{ color: '#2563eb', fontWeight: 600 }}>privacy@clausiotech.com</a>
      </div>
    </div>
  )
}
