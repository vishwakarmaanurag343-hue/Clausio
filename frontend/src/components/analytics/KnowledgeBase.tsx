'use client'

const FEATURES = [
  {
    icon: 'ti-file-upload',
    title: 'Upload Firm Templates',
    desc: 'Upload your standard petition templates, prayer clauses and drafts. AI will draft in your firm\'s exact style and format.',
    color: '#2563eb', bg: '#eff6ff',
  },
  {
    icon: 'ti-scale',
    title: 'Store Important Judgments',
    desc: 'Save judgment summaries with your own analysis. AI will cite these when relevant — even new 2024/2025 judgments not in AI training data.',
    color: '#15803d', bg: '#f0fdf4',
  },
  {
    icon: 'ti-notes',
    title: 'Legal Notes & Observations',
    desc: 'Store your senior advocate\'s observations, local court practices and procedural notes. AI applies these to every case automatically.',
    color: '#7c3aed', bg: '#f5f3ff',
  },
  {
    icon: 'ti-search',
    title: 'Semantic Search Across All Cases',
    desc: 'Search across all your stored knowledge using natural language. "Show me all cases where maintenance was above Rs 50,000."',
    color: '#d97706', bg: '#fffbeb',
  },
  {
    icon: 'ti-users',
    title: 'Team Knowledge Sharing',
    desc: 'Junior advocates can access the firm\'s knowledge base. Senior notes and templates shared across the entire team instantly.',
    color: '#0891b2', bg: '#f0f9ff',
  },
  {
    icon: 'ti-lock',
    title: 'Completely Private',
    desc: 'Your firm\'s knowledge is private and encrypted. Never shared with other Clausio users or used to train AI models.',
    color: '#475569', bg: '#f8fafc',
  },
]

export default function KnowledgeBase() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Knowledge Base</h2>
        <p style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>Your firm's private AI knowledge library.</p>
      </div>

      {/* Coming soon banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', borderRadius: 20, padding: '32px 36px', marginBottom: 32, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 16 }}>
          <i className="ti ti-clock" style={{ fontSize: 12 }} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>COMING SOON — Expected Month 2</span>
        </div>

        <h3 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Your Firm's Private Legal Brain
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 520 }}>
          Once built, your firm uploads templates, judgments and notes. 
          AI learns your firm's style and cites your own stored knowledge — 
          making every output 10x more relevant and accurate.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>
            <i className="ti ti-calendar" style={{ marginRight: 6 }} />
            1 Week to Build
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>
            <i className="ti ti-currency-rupee" style={{ marginRight: 6 }} />
            Zero Extra Cost
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>
            <i className="ti ti-database" style={{ marginRight: 6 }} />
            pgvector Powered
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>What Knowledge Base Will Do</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${f.icon}`} style={{ fontSize: 18, color: f.color }} />
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{f.title}</div>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>How It Will Work</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: '01', title: 'Upload your documents', desc: 'Upload petition templates, judgment PDFs, legal notes — any format.', icon: 'ti-upload' },
            { step: '02', title: 'AI processes and indexes', desc: 'AI reads, summarizes and stores in your private vector database.', icon: 'ti-brain' },
            { step: '03', title: 'AI uses your knowledge automatically', desc: 'Every time you use any AI feature, it checks your knowledge base first.', icon: 'ti-sparkles' },
            { step: '04', title: 'Search and reference anytime', desc: 'Search your own knowledge base using natural language at any time.', icon: 'ti-search' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e3a8a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                {s.step}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notify */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
        <i className="ti ti-info-circle" style={{ color: '#2563eb', fontSize: 18, flexShrink: 0 }} />
        <span style={{ color: '#1e40af' }}>
          Knowledge Base is being built. Contact <strong>support@clausio.io</strong> to request early access.
        </span>
      </div>
    </div>
  )
}
