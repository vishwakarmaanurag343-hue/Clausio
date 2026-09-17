'use client'

import { useRouter } from 'next/navigation'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using the Clausiotech website, platform, software, applications and related services (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not access or use the Platform.\n\nThese Terms apply to all users of the Platform, including advocates, law firms, legal professionals and authorised representatives of law firms ("Users").`,
  },
  {
    title: '2. The Platform',
    content: `Clausio Technologies Private Limited ("Clausiotech", "we", "us" or "our") provides an AI-assisted legal technology platform designed for use by legal professionals in India. The Platform includes features such as: case management and organisation; AI-assisted document drafting; legal research assistance; hearing preparation tools; evidence analysis and review; chronology generation; risk assessment; client communication drafts; and other features as may be made available from time to time.\n\nThe Platform is a technology tool and productivity aid. It is not a law firm and does not provide legal services.`,
  },
  {
    title: '3. Eligibility',
    content: `The Platform is intended for use by legal professionals, including enrolled advocates, law firms, legal researchers and corporate counsel. By registering on the Platform, you represent that you are a legal professional or are otherwise authorised to use the Platform on behalf of a law firm or legal practice.\n\nClausiotech reserves the right to verify professional credentials and to suspend or terminate accounts where eligibility requirements are not met.`,
  },
  {
    title: '4. Account Registration',
    content: `You must provide accurate, current and complete information when creating your account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.\n\nYou must notify us immediately of any unauthorised access to your account or any other security breach at parthbindra@clausiotech.com.\n\nClausiotech reserves the right to suspend or terminate accounts where inaccurate information has been provided or where the account is being used in violation of these Terms.`,
  },
  {
    title: '5. Professional Responsibility',
    content: `The Platform is a tool to assist legal professionals. All AI-generated content, outputs, drafts, research results and analysis produced through the Platform must be independently reviewed, verified and assessed by a qualified advocate before use in any legal proceeding, filing, submission or communication.\n\nClausiotech does not provide legal advice, legal opinions or legal representation. The advocate remains solely and fully responsible for:\n\n- all professional decisions relating to a client matter;\n- the accuracy, completeness and appropriateness of any work product;\n- compliance with applicable professional conduct rules and Bar Council obligations;\n- verifying AI-generated case citations, section references, dates and factual assertions before reliance; and\n- ensuring that all filings, submissions and advice meet the required professional standard.`,
  },
  {
    title: '6. AI-Generated Content',
    content: `The Platform uses artificial intelligence and machine-learning technologies to generate outputs. You acknowledge and agree that:\n\n- AI-generated outputs may contain errors, omissions, inaccuracies or hallucinations;\n- AI-generated case citations must be independently verified on SCC Online, eCourts or other authoritative sources before use in any proceeding;\n- AI-generated content is provided as decision-support and research assistance only and does not constitute legal advice;\n- Clausiotech does not warrant that AI-generated outputs are complete, accurate, current or suitable for any particular legal matter; and\n- the advocate exercises independent professional judgement in relation to all AI-generated content.`,
  },
  {
    title: '7. Acceptable Use',
    content: `You agree to use the Platform only for lawful purposes and in accordance with applicable Bar Council rules and professional conduct standards. You must not:\n\n- use the Platform to generate fraudulent, misleading or improper documents;\n- upload information without authorisation from the relevant client or data principal;\n- use the Platform in any manner that violates applicable law, professional ethics or third-party rights;\n- attempt to reverse-engineer, copy or reproduce the Platform or its underlying technology;\n- share your account credentials with unauthorised persons;\n- use the Platform to harass, harm or deceive any person; or\n- attempt to interfere with or disrupt the Platform or its servers.`,
  },
  {
    title: '8. Client Information and Confidentiality',
    content: `Where you upload or submit information belonging to your clients or other individuals, you are responsible for ensuring that you have the appropriate authority, consent and legal basis to do so.\n\nYou are responsible for ensuring that your use of the Platform is consistent with your professional obligations of confidentiality and privilege.\n\nClausiotech will treat information submitted through the Platform in accordance with its Privacy Policy. Clausiotech will not use client case information for any purpose unrelated to providing the requested Platform functionality.`,
  },
  {
    title: '9. Intellectual Property',
    content: `The Platform, including all software, design, content, trademarks, logos and technology, is owned by Clausio Technologies Private Limited and is protected by applicable intellectual property laws.\n\nDocuments, drafts and outputs generated through the Platform using information you submit belong to you. Clausiotech does not claim ownership over such outputs.\n\nYou may not copy, reproduce, distribute, modify or create derivative works of the Platform without prior written consent from Clausiotech.`,
  },
  {
    title: '10. Credits and Subscription',
    content: `New users may receive free AI credits upon registration as part of a launch offer. Credits are consumed with each AI operation on the Platform.\n\nPaid subscription plans will be made available. Details of applicable plans, pricing and credit allocations will be published on the Platform.\n\nClausiotech reserves the right to modify the credit and subscription structure at any time with reasonable notice to existing users.`,
  },
  {
    title: '11. Disclaimers',
    content: `The Platform is provided on an "as is" and "as available" basis. To the fullest extent permitted by applicable law, Clausiotech disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose and non-infringement.\n\nClausiotech does not warrant that:\n\n- the Platform will be uninterrupted, error-free or secure at all times;\n- AI-generated outputs will be accurate, complete or fit for any particular purpose;\n- the Platform will meet all your professional or operational requirements; or\n- any errors or defects in the Platform will be corrected within any particular time.`,
  },
  {
    title: '12. Limitation of Liability',
    content: `To the fullest extent permitted by applicable law, Clausiotech shall not be liable for:\n\n- any errors or inaccuracies in AI-generated content;\n- any adverse legal outcome, court decision or professional consequence arising from reliance on Platform outputs;\n- any loss of data, revenue, profits or business arising from use of or inability to use the Platform;\n- any indirect, incidental, special or consequential loss or damage; or\n- any decision made by an advocate or law firm based on Platform outputs.\n\nWhere liability cannot be excluded under applicable law, Clausiotech's maximum aggregate liability shall be limited to the fees paid by the relevant user in the three months preceding the event giving rise to the claim.`,
  },
  {
    title: '13. Indemnity',
    content: `You agree to indemnify and hold harmless Clausiotech, its directors, officers and employees from and against any claims, losses, liabilities, costs and expenses (including legal costs) arising from: your use of the Platform; your breach of these Terms; your breach of any applicable professional conduct obligation; any claim by a client or third party arising from your use of Platform outputs; or any unauthorised use of your account.`,
  },
  {
    title: '14. Suspension and Termination',
    content: `Clausiotech reserves the right to suspend or terminate your access to the Platform at any time where:\n\n- you breach these Terms;\n- you use the Platform for unlawful or improper purposes;\n- your account poses a security risk;\n- required by applicable law or regulation; or\n- Clausiotech determines in its reasonable discretion that suspension or termination is necessary.\n\nYou may terminate your account at any time by contacting us at parthbindra@clausiotech.com.`,
  },
  {
    title: '15. Modifications to the Platform and Terms',
    content: `Clausiotech reserves the right to modify, update, suspend or discontinue the Platform or any feature at any time.\n\nWe may update these Terms from time to time. Any updated version will be published on this page with a revised date. Continued use of the Platform after such changes constitutes acceptance of the updated Terms.\n\nWhere changes are material, we will endeavour to provide reasonable prior notice to registered users.`,
  },
  {
    title: '16. Governing Law and Jurisdiction',
    content: `These Terms are governed by and construed in accordance with the laws of India. Any dispute arising from or in connection with these Terms or the Platform shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra, India.`,
  },
  {
    title: '17. Contact',
    content: `For questions regarding these Terms, contact us at:\nEmail: parthbindra@clausiotech.com\nClausio Technologies Private Limited\nMumbai, Maharashtra, India`,
  },
]

export default function TermsOfService() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#F0F6FC', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#0f172a', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
          Back to Clausio
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'monospace', letterSpacing: '0.2em' }}>
          CLAUSIO
        </span>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 32px 80px' }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Terms of Service</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Effective Date: [To be confirmed upon launch] · Last Updated: [To be confirmed]</p>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 32 }}>Clausio Technologies Private Limited · Mumbai, Maharashtra, India</p>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', marginBottom: 40, fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
          These Terms of Service govern your access to and use of the Clausio platform. Please read them carefully before using the Platform. By using the Platform, you agree to be bound by these Terms. The Platform is designed exclusively for legal professionals and law firms in India.
        </div>

        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: i < sections.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
