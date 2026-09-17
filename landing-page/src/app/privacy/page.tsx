'use client'

import { useRouter } from 'next/navigation'

const COMPANY_NAME = 'Clausio Technologies Private Limited'
const PRIVACY_EMAIL = 'parthbindra@clausiotech.com'
const COMPANY_ADDRESS = 'Mumbai, Maharashtra, India'

const sections = [
  {
    title: '1. Information We Collect',
    subsections: [
      {
        heading: '1.1 Account and Professional Information',
        content: `When you register on the Platform, we may collect: name; email address; telephone number; organisation or law firm; professional designation; Bar Council or professional registration details, where voluntarily provided; login credentials and authentication information; and billing and subscription information.`,
      },
      {
        heading: '1.2 Information Submitted by Platform Users',
        content: `A lawyer, law firm or authorised user may submit information to the Platform for the purpose of using its features. Such information may include: client names and contact information; case facts; pleadings; legal documents; correspondence; evidence and supporting documents; statements; contracts; financial information; personal or sensitive information contained within case materials; information relating to opposing parties, witnesses or other individuals; and other information that the authorised user chooses to submit.\n\nThe Platform may process such information to provide AI-assisted analysis, summarisation, organisation, research assistance, issue identification and other features made available through the Platform.`,
      },
      {
        heading: '1.3 Technical Information',
        content: `We may automatically collect: IP address; browser and device information; operating system; login information; usage logs; access times; diagnostic information; cookies and similar technologies; and security and audit logs.`,
      },
    ],
  },
  {
    title: '2. Purposes of Processing',
    content: `We may process information for purposes including: providing and operating the Platform; creating and managing user accounts; providing AI-assisted legal information analysis and related functionality; processing information submitted by authorised users; maintaining and improving Platform security; detecting misuse, fraud or unauthorised access; troubleshooting and technical support; maintaining audit and security logs; processing payments; communicating with users regarding the Platform; complying with applicable law and legal obligations; and improving the performance, reliability and functionality of the Platform.\n\nWe will not use client case information for a purpose unrelated to providing the requested service unless such processing is separately permitted by applicable law and appropriately disclosed.`,
  },
  {
    title: '3. Lawyers and Law Firms as Platform Users',
    content: `The Platform is intended primarily for legal professionals and law firms. Where a lawyer or law firm uploads, submits or otherwise provides personal data belonging to its clients or other individuals, the lawyer or law firm is responsible for ensuring that it has the appropriate legal basis, authority, notice and/or consent required to provide such information to Clausiotech for processing through the Platform.\n\nThe lawyer or law firm is responsible for ensuring that its use of the Platform is consistent with: its professional obligations; applicable privacy and data protection laws; contractual obligations owed to its clients; confidentiality obligations; applicable legal privilege requirements; and any other laws or professional rules applicable to the relevant matter.`,
  },
  {
    title: '4. Client Consent and Authorisation',
    content: `Where a Platform user submits information relating to a client or another individual, the Platform user is responsible for obtaining any consent, authorisation or other lawful basis required for such processing.\n\nClausiotech does not independently determine whether a lawyer has obtained all necessary permissions from the relevant client. The relationship between the lawyer and the client, including professional confidentiality, client consent and authorisation to process information, remains between those parties.`,
  },
  {
    title: '5. AI Processing',
    content: `Certain Platform features use artificial intelligence or machine-learning technologies. Information submitted by authorised users may be processed by AI systems to generate outputs such as: summaries; issue identification; legal research leads; arguments or counterarguments; factual analysis; document analysis; potential weaknesses or strengths in a matter; and other analytical or informational outputs.\n\nAI-generated outputs are provided as decision-support and research assistance only. Clausiotech does not represent that AI-generated outputs are complete, accurate, current, legally correct or suitable for reliance in any particular legal proceeding. Users must independently verify AI-generated information and exercise their own professional judgement.`,
  },
  {
    title: '6. No Legal Advice',
    content: `Clausiotech is a technology platform and is not a law firm. Clausiotech does not provide legal representation, legal advice, legal opinions or legal services to clients of Platform users. The lawyer remains solely responsible for reviewing information, determining legal strategy and making professional decisions relating to a client matter.`,
  },
  {
    title: '7. Use of Data for AI Training',
    content: `Clausiotech does not use confidential client case information submitted through the Platform to train or develop general-purpose AI models. Case information submitted by advocates is used solely to provide the requested Platform functionality to the submitting user.`,
  },
  {
    title: '8. Disclosure to Service Providers',
    content: `We may engage third-party service providers to provide infrastructure and operational services, including: cloud hosting; database services; authentication; cybersecurity; analytics; customer support; payment processing; and AI/model infrastructure.\n\nSuch providers may process information on our behalf where necessary to provide the Platform. Where applicable, such providers will be subject to contractual obligations relating to confidentiality, security and appropriate processing of information.`,
  },
  {
    title: '9. Third-Party AI Providers',
    content: `Where Clausiotech uses third-party AI or technology providers, information submitted through the Platform may be processed by those providers to the extent necessary to provide the relevant functionality. Clausiotech will maintain appropriate contractual and technical safeguards for such processing as required by applicable law and contractual arrangements.`,
  },
  {
    title: '10. Data Security',
    content: `We implement reasonable technical and organisational measures designed to protect information against: unauthorised access; unauthorised disclosure; alteration; loss; destruction; misuse; and other unlawful or unauthorised processing.\n\nAll data is stored in AWS Mumbai (ap-south-1) region within India. Security measures include access controls, authentication controls, encryption in transit and at rest, logging, monitoring, backups and other safeguards appropriate to the nature of the information processed. However, no electronic system or method of transmission can be guaranteed to be completely secure.`,
  },
  {
    title: '11. Data Breaches',
    content: `In the event of a personal data breach affecting information processed through the Platform, Clausiotech will take steps required under applicable law and its contractual obligations, including investigation, containment, remediation and notification where required. Where information has been submitted by a lawyer or law firm on behalf of its client, Clausiotech may communicate with the relevant Platform user regarding the incident and the information affected.`,
  },
  {
    title: '12. Data Retention',
    content: `We retain personal data only for as long as reasonably necessary for the purposes for which it was collected or processed, including to: provide the Platform; maintain security; comply with contractual obligations; comply with applicable law; resolve disputes; and enforce agreements.\n\nWhere a user terminates their account, information may be deleted, anonymised or retained where required or permitted by applicable law.`,
  },
  {
    title: '13. User Responsibility for Information Submitted',
    content: `Platform users must not upload information unless they are authorised to do so. Users should take reasonable precautions when submitting highly confidential information and should ensure that: only authorised personnel have access to the account; login credentials are kept confidential; information is submitted only for legitimate purposes; client permissions and contractual requirements are addressed; and information is not unnecessarily uploaded or retained.`,
  },
  {
    title: '14. Confidentiality',
    content: `Clausiotech recognises that information submitted by legal professionals may be confidential. Clausiotech will use such information only as reasonably necessary to provide the Platform and for other purposes permitted by applicable law and contractual arrangements.`,
  },
  {
    title: '15. Data Principal Rights',
    content: `Subject to applicable law, individuals may have rights relating to their personal data, including rights concerning: access to information; correction; updating; withdrawal of consent where consent is the applicable legal basis; erasure; and grievance redressal.\n\nRequests may be submitted to:\nEmail: parthbindra@clausiotech.com\nClausio Technologies Private Limited, Mumbai, Maharashtra, India`,
  },
  {
    title: "16. Children's Data",
    content: `The Platform is intended for use by legal professionals and is not directed towards children. Users must not knowingly submit personal data of children unless they are legally authorised to do so and such processing is permitted under applicable law.`,
  },
  {
    title: '17. International Data Transfers',
    content: `Depending on the infrastructure and service providers used by Clausiotech, information may be processed or stored outside India. Where applicable, such transfers and processing will be carried out in accordance with applicable Indian law and contractual safeguards.`,
  },
  {
    title: '18. Cookies',
    content: `The Platform may use cookies and similar technologies for authentication, security, analytics and functionality. We use only essential cookies required for the Platform to operate. We do not use advertising or cross-site tracking cookies. Users may control certain cookie settings through their browser settings, subject to the functionality required for the Platform to operate.`,
  },
  {
    title: '19. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. Any updated version will be published on this page with a revised Last Updated date. Continued use of the Platform after such changes constitutes acceptance of the updated Policy.`,
  },
  {
    title: '20. Contact Us',
    content: `For questions about this Privacy Policy or to exercise your rights, contact us at:\nEmail: parthbindra@clausiotech.com\nClausio Technologies Private Limited\nMumbai, Maharashtra, India`,
  },
]

export default function PrivacyPolicy() {
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
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Privacy Policy</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Effective Date: [To be confirmed upon launch] · Last Updated: [To be confirmed]</p>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 32 }}>Clausio Technologies Private Limited · Mumbai, Maharashtra, India</p>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', marginBottom: 40, fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
          This Privacy Policy explains how Clausio Technologies Private Limited collects, uses, stores, processes and protects personal data when you access or use the Clausiotech website, platform, software, applications and related services (collectively, the Platform). Clausiotech provides technology and AI-assisted tools intended for use by legal professionals and law firms. By accessing or using the Platform, you acknowledge that you have read and understood this Privacy Policy.
        </div>

        {sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: i < sections.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{section.title}</h2>
            {section.subsections ? (
              section.subsections.map((sub, j) => (
                <div key={j} style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 8 }}>{sub.heading}</h3>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-line' }}>{sub.content}</p>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-line' }}>{section.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
