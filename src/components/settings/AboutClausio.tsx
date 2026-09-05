'use client'

import { useState } from 'react'

export default function AboutClausio() {
  const [copied, setCopied] = useState(false)
  const currentYear = new Date().getFullYear()

  const copyDiagnostics = () => {
    const info = `Clausio Legal Intelligence v2.4.0 (Production)
Company: Clausio Technologies Pvt. Ltd.
Engine: Clausio AI OS Core 4.2
Environment: Web Client (Next.js / React)
Support: support@clausio.ai`
    navigator.clipboard.writeText(info)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            About Clausio
          </h2>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, margin: 0 }}>
            System specifications, organization details, and legal compliance.
          </p>
        </div>

        <button
          onClick={copyDiagnostics}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            background: copied ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${copied ? '#86efac' : '#e2e8f0'}`,
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            color: copied ? '#166534' : '#475569',
            cursor: 'pointer',
            transition: 'transform 100ms ease-out, all 0.15s ease',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: 14 }} />
          {copied ? 'Copied System Info' : 'Copy System Info'}
        </button>
      </div>

      {/* Hero Branding Card */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '28px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e40af 100%)',
          borderRadius: 20,
          marginBottom: 24,
          color: '#ffffff',
          boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #3b82f6 #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              ⚖️
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Clausio</div>
              <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2, fontWeight: 500 }}>
                Every clause. Intelligently handled.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span
              style={{
                padding: '5px 12px',
                background: 'rgba(59, 130, 246, 0.25)',
                backdropFilter: 'blur(10px)',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                color: '#93c5fd',
                border: '1px solid rgba(147, 197, 253, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }}></span>
              Version 2.4.0 (Production)
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' }}>Release Channel: Stable</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Application Name', value: 'Clausio Legal Intelligence', icon: 'ti-subtask' },
          { label: 'Company', value: 'Clausio Technologies Pvt. Ltd.', icon: 'ti-building-skyscraper' },
          { label: 'Platform Engine', value: 'Clausio AI Legal OS', icon: 'ti-cpu' },
          { label: 'Support Email', value: 'support@clausio.ai', icon: 'ti-mail', isLink: true, href: 'mailto:support@clausio.ai' },
          { label: 'Official Website', value: 'www.clausio.ai', icon: 'ti-world', isLink: true, href: 'https://clausio.ai' },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              padding: '14px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 14, color: '#3b82f6' }} />
              {item.label}
            </div>
            {item.isLink ? (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {item.value} <i className="ti ti-external-link" style={{ fontSize: 12 }} />
              </a>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
            )}
          </div>
        ))}
      </div>

      {/* Key Capabilities */}
      <div style={{ padding: 20, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-sparkles" style={{ color: '#8b5cf6' }} /> Core Intelligence Suite
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            'AI Legal Drafting & Pleading',
            'Supreme Court & High Court Case Research',
            'Litigation Strategy & Precedent Analysis',
            'Client Communication & Updates',
            'Hearing Schedules & Cause List Sync',
            'Document Intelligence & OCR Analysis'
          ].map((feat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', padding: '6px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
              <i className="ti ti-circle-check-filled" style={{ color: '#22c55e', fontSize: 15 }} />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Support & Legal Disclaimer */}
      <div style={{ padding: 18, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <i className="ti ti-shield-check" style={{ fontSize: 24, color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 2 }}>
            Legal Technology Notice & Responsibility
          </div>
          <div style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.5 }}>
            Clausio is an AI-powered legal intelligence system designed for advocates and legal professionals. It functions as an analytical assistant and does not constitute formal legal counsel.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
        © {currentYear} Clausio Technologies Pvt. Ltd. All rights reserved.
      </div>
    </div>
  )
}