'use client'

import { useRouter } from 'next/navigation'

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@clausiotech.com'
const COMPANY_NAME =
  process.env.NEXT_PUBLIC_COMPANY_NAME || 'Clausio Technologies Private Limited'

export default function PrivacyPolicy() {
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
          Privacy Policy
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
            title: '1. Information We Collect',
            content:
              'We collect information you provide when you create an account, use our services, or contact us. This includes your name, email address, information about your legal practice, and case information and documents you upload to our platform.'
          },
          {
            title: '2. How We Use Your Information',
            content:
              'We use your information to provide, maintain, and improve our services, send you technical notices and support messages, and respond to your questions. Case information is used solely to provide AI-powered legal assistance.'
          },
          {
            title: '3. Data Storage and Security',
            content:
              'All data is stored securely in AWS Mumbai (ap-south-1) region within India. We implement industry-standard encryption at rest and in transit. Access to your data is strictly controlled.'
          },
          {
            title: '4. Data Confidentiality',
            content:
              'All case data, client information, and documents uploaded to Clausio are treated as strictly confidential. We do not share, sell, or disclose your data to any third parties except as required by law.'
          },
          {
            title: '5. AI Processing',
            content:
              'Our AI systems process your case information to generate documents, research, and analysis. This processing is done securely and your data is not used to train our AI models.'
          },
          {
            title: '6. Your Rights',
            content:
              `You have the right to access, correct, or delete your personal information at any time. To exercise these rights, contact us at ${SUPPORT_EMAIL}.`
          },
          {
            title: '7. Cookies',
            content:
              'We use essential cookies to keep you logged in and remember your preferences. We do not use tracking or advertising cookies.'
          },
          {
            title: '8. Changes to This Policy',
            content:
              'We may update this Privacy Policy from time to time. We will notify you of significant changes by email. Continued use of Clausio after changes constitutes acceptance of the updated policy.'
          },
          {
            title: '9. Contact Us',
            content:
              `For questions about this Privacy Policy, contact us at ${SUPPORT_EMAIL} or write to ${COMPANY_NAME}, Mumbai, India.`
          },
        ].map((section, i) => (
          <div key={i} style={{
            marginBottom: 32,
            paddingBottom: 32,
            borderBottom: i < 8
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
