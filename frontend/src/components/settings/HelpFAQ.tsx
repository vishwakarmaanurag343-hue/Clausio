'use client'
import { useState } from 'react'

const FAQS = [
  { q: 'How do AI credits work?', a: 'Each AI action uses credits. You get 30 free credits on signup. Drafting uses 2 credits, Legal Research uses 1 credit, Hearing Prep uses 2 credits, Risk Assessment uses 2 credits, Chronology uses 2 credits, and Client Update uses 1 credit.' },
  { q: 'How do I add a new case?', a: 'Go to Cases from the sidebar and click "+ Add New Case". Fill in the case details across the steps — practice area, case type, client details, court details and description. Click Save to create the case.' },
  { q: 'How does AI Drafting work?', a: 'Go to Drafting from the sidebar. Select your case, choose the document type (bail application, legal notice, petition etc.), fill in the required fields and click Generate. The AI drafts the document using your case context.' },
  { q: 'How do I upload documents for AI analysis?', a: 'Go to the Documents tab inside any case. Click Upload and select your PDF or image files. Once uploaded, go to Analysis page and click Run Analysis to get AI insights from your documents.' },
  { q: 'What is Hearing Prep?', a: 'Hearing Prep generates a complete brief for your next hearing — key arguments, anticipated opposition, documents to carry, procedural checklist and an opening statement. Go to Hearings, select a hearing and click View Prep.' },
  { q: 'How do I add a witness?', a: 'Go to Hearings from the sidebar and scroll to the Witnesses section. Click Add Witness, fill in the name, type, role and statement, then click Save. Run AI Intelligence to get cross-examination strategy.' },
  { q: 'What is Risk Assessment?', a: 'Risk Assessment analyses your case documents and hearing history to identify key risks — evidentiary, procedural and factual — with specific steps to mitigate each risk before the next hearing.' },
  { q: 'How do I send a client update?', a: 'Go to Client from the sidebar. Select your case and the AI will draft a WhatsApp-ready update summarising the last hearing and next steps. You can copy and send it directly to your client.' },
  { q: 'Can I edit a case after creating it?', a: 'Yes. Go to Cases, find your case and click the Edit button. You can update the stage, next hearing date, description, opposing advocate and priority.' },
  { q: 'How do I contact support?', a: 'Email us at support@clausiotech.com. We typically respond within 24 hours on working days.' },
]

export default function HelpFAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div style={{ }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Help & FAQ</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b' }}>Answers to common questions about Clausio.</p>
      {FAQS.map((faq, i) => (
        <div key={i} style={{ borderBottom: '1px solid #f1f5f9', marginBottom: 2 }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', textAlign: 'left', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{faq.q}</span>
            <i className={`ti ${open === i ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 14, color: '#94a3b8', flexShrink: 0 }} />
          </button>
          {open === i && (
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, paddingBottom: 14 }}>{faq.a}</div>
          )}
        </div>
      ))}
      <div style={{ marginTop: 24, padding: '14px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, fontSize: 13, color: '#0369a1' }}>
        Still have questions? Email us at <a href="mailto:support@clausiotech.com" style={{ fontWeight: 600, color: '#0369a1' }}>support@clausiotech.com</a>
      </div>
    </div>
  )
}
