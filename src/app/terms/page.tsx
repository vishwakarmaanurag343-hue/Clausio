'use client'

import { useRouter } from 'next/navigation'

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@clausiotech.com'
const COMPANY_NAME =
  process.env.NEXT_PUBLIC_COMPANY_NAME || 'Clausio Technologies Private Limited'

export default function TermsOfService() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F6FC',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        background: '#0f172a',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        >
          ← Back to Clausio
        </button>
        <span style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: 16,
          fontFamily: 'monospace',
          letterSpacing: '0.2em',
        }}>
          CLAUSIO
        </span>
      </div>

      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '48px 32px',
      }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 8,
        }}>
          Terms of Service
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: 14,
          marginBottom: 40,
        }}>
          Last updated: September 2026 · {COMPANY_NAME}
        </p>

        {[
          {
            title: '1. Acceptance of Terms',
            content:
              'By accessing or using Clausio, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services. These terms apply to all users including advocates, law firms, and legal professionals.'
          },
          {
            title: '2. Description of Service',
            content:
              'Clausio is an AI-powered litigation intelligence platform for Indian advocates. Services include AI document drafting, legal research, case management, hearing preparation, evidence analysis, and client communication tools.'
          },
          {
            title: '3. Professional Responsibility',
            content:
              'Clausio is a tool to assist legal professionals. All AI-generated content must be reviewed and verified by a qualified advocate before use. Clausio does not provide legal advice and is not a substitute for professional legal judgment. The advocate remains fully responsible for all work product.'
          },
          {
            title: '4. Account Registration',
            content:
              `You must provide accurate and complete information when creating your account. You are responsible for maintaining the security of your account credentials. Notify us immediately of any unauthorized access at ${SUPPORT_EMAIL}.`
          },
          {
            title: '5. Free Credits',
            content:
              'New users receive 50 free AI credits upon registration. Credits are consumed with each AI operation. Additional credits may be purchased once paid plans are available. Clausio reserves the right to modify the free credits policy at any time.'
          },
          {
            title: '6. Acceptable Use',
            content:
              'You agree to use Clausio only for lawful purposes and in accordance with applicable Bar Council rules and professional conduct standards. You may not use Clausio to generate fraudulent documents or engage in any activity that violates applicable law or professional ethics.'
          },
          {
            title: '7. Intellectual Property',
            content:
              `The Clausio platform including all software, design, and content is owned by ${COMPANY_NAME}. Documents generated using Clausio based on your case information belong to you.`
          },
          {
            title: '8. Limitation of Liability',
            content:
              'Clausio is provided as a productivity tool. We are not liable for any errors in AI-generated content, adverse legal outcomes, or decisions made based on our platform. Our maximum liability is limited to the fees paid by you in the 3 months preceding any claim.'
          },
          {
            title: '9. Governing Law',
            content:
              'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.'
          },
          {
            title: '10. Contact',
            content:
              `For questions regarding these Terms, contact us at ${SUPPORT_EMAIL} or write to ${COMPANY_NAME}, Mumbai, India.`
          },
        ].map((section, i) => (
          <div key={i} style={{
            marginBottom: 32,
            paddingBottom: 32,
            borderBottom: i < 9
              ? '1px solid #e2e8f0'
              : 'none',
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: 12,
            }}>
              {section.title}
            </h2>
            <p style={{
              fontSize: 15,
              color: '#374151',
              lineHeight: 1.8,
              margin: 0,
            }}>
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
