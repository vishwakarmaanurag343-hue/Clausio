export interface ChronologyEvent {
  date: string
  event: string
  category: 'Neutral' | 'Strong' | 'Contradiction'
  source: string
}

export interface CaseSummary {
  profile: {
    parties: string
    court: string
    caseNumber: string
    nextHearing: string
    readiness: string
  }
  background: string
  allegations: string[]
  defense: string[]
  legalIssues: string[]
  nextSteps: string[]
}

export interface EvidenceItem {
  id: string
  source: string
  description: string
  admissibility: string
  strength: 'Strong' | 'Medium' | 'Weak' | 'Contradiction'
  aiInsight: string
  warning?: string
}

export interface AnalysisData {
  categoryName: string
  chronology: ChronologyEvent[]
  summary: CaseSummary
  evidence: EvidenceItem[]
}

export const MOCK_ANALYSIS_DATA: Record<string, AnalysisData> = {
  'Family & Matrimonial': {
    categoryName: 'Family and Matrimonial',
    chronology: [
      { date: 'Feb 2015', event: 'Marriage at Dadar Shiv Mandir, Mumbai', category: 'Neutral', source: 'Marriage certificate' },
      { date: 'Aug 2020', event: 'Physical assault — Lilavati Hospital admission, 2 days', category: 'Strong', source: 'Exhibit B — discharge summary' },
      { date: 'Mar 2021', event: 'Respondent slapped petitioner in front of child and mother', category: 'Strong', source: 'Witness — Mrs Sunita Patil' },
      { date: 'Jan–Aug 2022', event: 'WhatsApp messages to Kavya Nair — "I feel trapped in this marriage"', category: 'Strong', source: 'Exhibit D — screenshots' },
      { date: 'Jan–Aug 2022', event: 'Rs 3 lakh transferred to unknown HDFC account ending 7734', category: 'Contradiction', source: 'Exhibit E — bank statements' },
      { date: 'Sep 2022', event: 'Respondent deserted matrimonial home without notice', category: 'Strong', source: 'Petitioner testimony' },
      { date: 'Nov 2022', event: 'BMW 3 Series purchased for Rs 45 lakh on Rs 22L annual salary', category: 'Contradiction', source: 'Exhibit F — RC book' },
      { date: 'Jun 2024', event: 'WhatsApp admission — willing to pay Rs 30K for child only', category: 'Strong', source: 'Exhibit H — screenshot' }
    ],
    summary: {
      profile: {
        parties: 'Priya Sharma v. Rohit Sharma',
        court: 'Family Court Bandra, Mumbai',
        caseNumber: 'FC/2847/2023',
        nextHearing: '17 Jun 2024',
        readiness: '72%'
      },
      background: 'Matrimonial dispute under Section 13(1)(ia) of the Hindu Marriage Act, 1955 seeking divorce on grounds of mental and physical cruelty, along with maintenance under Section 125 CrPC and child custody rights. The petitioner alleges continuous physical abuse, severe emotional cruelty, desertion, and systematic hiding of actual income sources by the respondent.',
      allegations: [
        'Physical assaults resulting in hospitalizations, notably at Lilavati Hospital in August 2020.',
        'Continuous mental cruelty and domestic abuse in front of family members and child.',
        'Financial concealment - Respondent is hiding a major source of income while claiming inability to pay maintenance.',
        'Desertion of the petitioner and child since September 2022 without reasonable cause.'
      ],
      defense: [
        'Respondent denies all allegations of physical abuse and cruelty, claiming hospitalizations were for normal ailments.',
        'Claims the petitioner left the matrimonial home voluntarily without cause due to career preferences.',
        'Asserts limited financial capacity, claiming a salary of Rs 22 Lakhs per annum with heavy liabilities, making the requested maintenance unfeasible.'
      ],
      legalIssues: [
        'Whether the cumulative incidents of abuse and emotional distress constitute legal cruelty under Section 13(1)(ia) of HMA.',
        'Whether the respondent is liable to pay maintenance of Rs. 1 Lakh per month based on his actual financial status.',
        'Whether the respondent concealed income and assets, and the impact of the high-value purchases on maintenance quantum.'
      ],
      nextSteps: [
        'Conduct cross-examination of the Respondent regarding the undisclosed HDFC account ending 7734.',
        'Submit income affidavit verification request for the purchase of the BMW 3 Series.',
        'Prepare Section 65B Certificate for the WhatsApp messages and admissions.'
      ]
    },
    evidence: [
      {
        id: 'e1',
        source: 'Marriage Certificate',
        description: 'Certified copy of marriage registry from Dadar Shiv Mandir.',
        admissibility: 'Fully Admissible (Public Record under Special Marriage / HMA rules)',
        strength: 'Strong',
        aiInsight: 'Conclusively establishes the relationship and jurisdiction. No disputable elements.'
      },
      {
        id: 'e2',
        source: 'Exhibit B — Discharge Summary',
        description: 'Medical certificate from Lilavati Hospital listing injuries consistent with physical trauma.',
        admissibility: 'Admissible under Sec 45 (Expert/Medical Evidence)',
        strength: 'Strong',
        aiInsight: 'Directly supports the allegation of physical abuse in Aug 2020. Severe damage to respondent\'s denial defense.'
      },
      {
        id: 'e3',
        source: 'Witness Testimony (Mrs. Patil)',
        description: 'Oral statement of petitioner\'s mother who witnessed the assault in March 2021.',
        admissibility: 'Admissible under Sec 60 (Direct Oral Evidence)',
        strength: 'Medium',
        aiInsight: 'Strong corroborative value, but will face intense cross-examination due to family relation.'
      },
      {
        id: 'e4',
        source: 'Exhibit D — WhatsApp Screenshots',
        description: 'Printed screenshots of chats expressing extreme marital distress and entrapment.',
        admissibility: 'Admissible subject to Sec 65B Certificate of Indian Evidence Act',
        strength: 'Strong',
        aiInsight: 'Establishes persistent mental distress and communication breakdown. Sec 65B certificate must be signed by the device holder.'
      },
      {
        id: 'e5',
        source: 'Exhibit E — Bank Statements',
        description: 'Bank ledger showing a Rs 3 Lakh transfer to an undeclared HDFC account.',
        admissibility: 'Fully Admissible (Sec 34 Books of Accounts)',
        strength: 'Contradiction',
        aiInsight: 'Directly conflicts with respondent\'s disclosure form where he claimed to have only one bank account.'
      },
      {
        id: 'e6',
        source: 'Exhibit F — BMW 3 Series RC Book',
        description: 'Vehicle registration copy under respondent\'s name showing purchase price of Rs 45 Lakhs.',
        admissibility: 'Admissible (RTO Public Record)',
        strength: 'Contradiction',
        aiInsight: 'Critical asset evidence. Contradicts respondent\'s claim of financial distress and low net income. Highlights financial concealment.'
      },
      {
        id: 'e7',
        source: 'Exhibit H — WhatsApp Screenshot',
        description: 'Chat where respondent admits ability to pay Rs 30,000 per month for the child.',
        admissibility: 'Admissible subject to Sec 65B Certificate',
        strength: 'Strong',
        aiInsight: 'Constitutes an out-of-court admission. Sets a solid floor for the child maintenance award.'
      }
    ]
  },
  'Criminal Law': {
    categoryName: 'Criminal Law',
    chronology: [
      { date: 'Oct 2023', event: 'Accused and victim argue in public over property boundaries', category: 'Neutral', source: 'Police Station General Diary' },
      { date: 'Nov 2023', event: 'Physical altercation resulting in head injury to victim', category: 'Strong', source: 'Exhibit C — MLC medical record' },
      { date: 'Dec 2023', event: 'Threatening text messages sent by Accused to Victim', category: 'Strong', source: 'Exhibit D — Cyber Cell report' },
      { date: 'Jan 2024', event: 'Alleged assault incident occurred at night near victim\'s house', category: 'Strong', source: 'FIR No. 12/2024' },
      { date: 'Jan 2024', event: 'Accused claims alibi (present at family wedding in Pune)', category: 'Contradiction', source: 'Exhibit E — Hotel bill & GPS logs' },
      { date: 'Feb 2024', event: 'Eye-witness statement recorded identifying accused', category: 'Strong', source: 'Witness statement (Mr. Amit Sen)' },
      { date: 'Mar 2024', event: 'Recovery of weapon (iron rod) from accused\'s backyard', category: 'Strong', source: 'Exhibit F — Seizure Memo' },
      { date: 'May 2024', event: 'Forensic report shows no fingerprint match on weapon', category: 'Contradiction', source: 'Exhibit G — Forensic Lab (FSL) report' }
    ],
    summary: {
      profile: {
        parties: 'State of Maharashtra v. Sameer Patil',
        court: 'Sessions Court, Mumbai',
        caseNumber: 'CR/105/2024',
        nextHearing: '24 Jun 2024',
        readiness: '65%'
      },
      background: 'Prosecution under Section 307 (Attempt to murder) and Section 326 (Voluntarily causing grievous hurt by dangerous weapons) of the Bharatiya Nyaya Sanhita (BNS). The accused is alleged to have assaulted the victim with an iron rod following a prolonged boundary dispute. The defense relies on a plea of alibi and forensic mismatches.',
      allegations: [
        'Premeditated physical assault with a deadly weapon (iron rod) at 10 PM on 12th Jan 2024.',
        'Prior threats and verbal intimidation established through electronic records.',
        'Motive stems from an ongoing civil suit regarding ancestral property valuation.'
      ],
      defense: [
        'Plea of Alibi: Accused claims he was attending a family wedding in Pune (150 km away) during the incident time.',
        'Lack of physical evidence linking the accused: No fingerprints found on the weapon.',
        'Claim of false implication due to local political rivalry.'
      ],
      legalIssues: [
        'Whether the prosecution has established intent to kill to satisfy Section 307 BNS.',
        'Admissibility of the recovery of the iron rod from the backyard under Sec 27 of Evidence Act.',
        'Credibility of the alibi documents versus direct eye-witness identification.'
      ],
      nextSteps: [
        'Summon the wedding hall manager to cross-verify the attendance registry and CCTV footage.',
        'File an application to check cell-tower logs of the accused\'s phone number on the night of the incident.',
        'Cross-examine the Forensic officer on sample contamination and cleaning of the iron rod.'
      ]
    },
    evidence: [
      {
        id: 'e1',
        source: 'FIR No. 12/2024',
        description: 'First Information Report lodged within 2 hours of the assault.',
        admissibility: 'Admissible as corroborative evidence (Sec 157)',
        strength: 'Strong',
        aiInsight: 'Timely filing reduces chances of deliberation. Details match the primary injuries.'
      },
      {
        id: 'e2',
        source: 'Exhibit C — MLC medical record',
        description: 'Medico-Legal Certificate from Cooper Hospital showing 5cm laceration on temporal bone.',
        admissibility: 'Fully Admissible (Sec 32/Sec 45)',
        strength: 'Strong',
        aiInsight: 'Conclusively proves grievous hurt. Injury is consistent with blunt force impact (iron rod).'
      },
      {
        id: 'e3',
        source: 'Exhibit E — Hotel Bill & GPS Logs',
        description: 'Pune Hotel checkout receipt and taxi GPS logs showing accused\'s location.',
        admissibility: 'Admissible under Sec 11 (Plea of Alibi)',
        strength: 'Contradiction',
        aiInsight: 'Creates reasonable doubt. If verified, it makes it physically impossible for the accused to be at the crime scene at 10 PM.'
      },
      {
        id: 'e4',
        source: 'Witness Statement (Mr. Amit Sen)',
        description: 'Neighbor who claims to have seen the accused running from the street shortly after the screams.',
        admissibility: 'Admissible (Direct oral testimony)',
        strength: 'Medium',
        aiInsight: 'Provides direct identification, but lacks lighting visibility verification since the streetlights were reported broken.'
      },
      {
        id: 'e5',
        source: 'Exhibit G — Forensic (FSL) Report',
        description: 'Chemical and fingerprint analysis of the recovered iron rod.',
        admissibility: 'Fully Admissible under Sec 293 CrPC / BNSS',
        strength: 'Contradiction',
        aiInsight: 'Prosecution weakness. The absence of the accused\'s fingerprints or blood groups on the rod weakens the possession link.'
      }
    ]
  },
  'GST & Indirect Tax': {
    categoryName: 'GST and Indirect Tax',
    chronology: [
      { date: 'Apr 2023', event: 'Purchase invoices issued and payments made to supplier', category: 'Neutral', source: 'Purchase ledger & Bank vouchers' },
      { date: 'Jun 2023', event: 'Input Tax Credit (ITC) claimed in GSTR-3B filings', category: 'Neutral', source: 'GSTR-3B monthly return' },
      { date: 'Sep 2023', event: 'Discrepancy: Supplier fails to file GSTR-1, tax unpaid', category: 'Contradiction', source: 'GSTR-2B monthly summary' },
      { date: 'Oct 2023', event: 'GST Department issues show-cause notice for ITC reversal', category: 'Neutral', source: 'Form GST DRC-01' },
      { date: 'Dec 2023', event: 'Assessee files reply defending bona fide purchaser status', category: 'Neutral', source: 'Reply to DRC-01' },
      { date: 'Feb 2024', event: 'Order passed confirming ITC demand plus 18% interest', category: 'Strong', source: 'Assessment Order (DRC-07)' },
      { date: 'Mar 2024', event: 'Appeal filed before GST Appellate Authority', category: 'Neutral', source: 'Form GST APL-01' },
      { date: 'Jun 2024', event: '10% Mandatory Pre-deposit paid and verified', category: 'Strong', source: 'Exhibit C — Payment Challan' }
    ],
    summary: {
      profile: {
        parties: 'Acme Enterprises v. Commissioner of CGST',
        court: 'GST Appellate Authority, Delhi',
        caseNumber: 'GST/845/2024',
        nextHearing: '02 Jul 2024',
        readiness: '85%'
      },
      background: 'Appeal against the demand order confirming reversal of Input Tax Credit (ITC) of Rs. 14,50,000. The department alleges that the purchasing dealer is ineligible for ITC because the supplier defaulted on tax payments, invoking Section 16(2)(c) of the CGST Act. The appellant argues they are a bona fide buyer who complied with all conditions.',
      allegations: [
        'Availing ITC on transactions where tax was not paid to the government treasury by the vendor.',
        'Intentional collusion with a defaulting supplier to claim illegal tax relief.'
      ],
      defense: [
        'The appellant is a bona fide purchaser with proof of invoice, actual movement of goods, and bank payments.',
        'Payment of GST was fully made to the supplier; the buyer cannot control supplier\'s compliance.',
        'Relying on HC rulings (e.g., Bharti Airtel) stating ITC cannot be denied without investigating the seller first.'
      ],
      legalIssues: [
        'Whether Section 16(2)(c) can be applied to deny ITC to a genuine buyer who has paid the seller.',
        'Whether the department is obligated to initiate recovery action against the defaulting supplier before reversing buyer\'s ITC.'
      ],
      nextSteps: [
        'Submit proof of physical receipt of goods (Lorry Receipts, Weighbridge Slips).',
        'Request the Appellate Authority to summon the supplier\'s bank details and GST ledgers.',
        'Prepare comparative table of GSTR-2A vs GSTR-3B filings.'
      ]
    },
    evidence: [
      {
        id: 'e1',
        source: 'Purchase Invoices',
        description: '14 tax invoices showing item details, tax rate, and GSTIN of supplier.',
        admissibility: 'Fully Admissible under Sec 16(2)(a)',
        strength: 'Strong',
        aiInsight: 'Valid invoices containing all statutory details. Establishes the basic contract and tax charging.'
      },
      {
        id: 'e2',
        source: 'Bank Ledger Vouchers',
        description: 'RTGS transfer records showing payment of invoice value + tax to supplier bank account.',
        admissibility: 'Fully Admissible',
        strength: 'Strong',
        aiInsight: 'Proves transaction genuineness. Directly supports buyer\'s claim of completing payment including the tax component.'
      },
      {
        id: 'e3',
        source: 'GSTR-2B Summary Discrepancy',
        description: 'Official portal report showing supplier did not upload invoices in GSTR-1.',
        admissibility: 'Portal Record (Sec 140/Electronic Evidence)',
        strength: 'Contradiction',
        aiInsight: 'Department\'s main weapon. Confirms a technical mismatch, but does not prove fraud or lack of supply.'
      },
      {
        id: 'e4',
        source: 'Exhibit C — Pre-deposit Challan',
        description: 'Challan showing payment of Rs. 1.45 Lakhs (10% of disputed tax).',
        admissibility: 'Fully Admissible (Condition Precedent)',
        strength: 'Strong',
        aiInsight: 'Statutory compliance document. Confirms the appeal is legally maintainable and stayed from recovery.'
      }
    ]
  },
  'Income Tax': {
    categoryName: 'Income Tax',
    chronology: [
      { date: 'Nov 2022', event: 'Income Tax Return filed declaring income of Rs. 8.4 Lakhs', category: 'Neutral', source: 'ITR-V Acknowledgement' },
      { date: 'Jan 2023', event: 'High-value cash deposits (Rs 42L) flagged in savings account', category: 'Contradiction', source: 'Annual Information Statement (AIS)' },
      { date: 'May 2023', event: 'Reassessment Notice issued alleging escaped income', category: 'Neutral', source: 'Section 148 Notice' },
      { date: 'Jun 2023', event: 'Assessee files reply explaining cash is agricultural income', category: 'Neutral', source: 'Written representation' },
      { date: 'Sep 2023', event: 'Assessing Officer rejects source, treats 42L as unexplained cash', category: 'Strong', source: 'Assessment Order Sec 147' },
      { date: 'Oct 2023', event: 'Penalty proceedings initiated for misreporting of income', category: 'Strong', source: 'Section 271AAC Notice' },
      { date: 'Dec 2023', event: 'First Appeal filed before CIT (Appeals)', category: 'Neutral', source: 'Form 35 submission' },
      { date: 'Apr 2024', event: 'Assessee submits direct land holdings and market sale receipts', category: 'Strong', source: 'Exhibit F — Mandi Receipts & land records' }
    ],
    summary: {
      profile: {
        parties: 'Harish Mehta v. Assistant Commissioner of Income Tax',
        court: 'CIT (Appeals), Ahmedabad',
        caseNumber: 'IT/445/2024',
        nextHearing: '28 Jun 2024',
        readiness: '80%'
      },
      background: 'Income tax appeal challenging the additions of Rs. 42,00,000 as unexplained cash credits under Section 68 of the Income Tax Act, 1961. The Assessing Officer treated the cash deposits as undisclosed business income. The appellant claims the cash represents sale proceeds of agricultural crop (cotton & groundnut), which is tax-exempt.',
      allegations: [
        'Concealment of taxable income by parking business receipts as cash in personal bank accounts.',
        'Lack of creditworthiness and genuine source for Rs. 42 Lakhs cash deposits.'
      ],
      defense: [
        'The cash is agricultural income from 18 acres of ancestral irrigated land in Gujarat.',
        'Mandi sales are fully documented with official grain merchant receipts (Form J).',
        'AO passed order without verifying land yields or calling grain merchants for verification.'
      ],
      legalIssues: [
        'Whether the Assessing Officer was justified in treating agricultural sales as unexplained money under Sec 68.',
        'Whether the assessment is void-ab-initio for lack of "reason to believe" required under Section 147/148.'
      ],
      nextSteps: [
        'File an application for additional evidence under Rule 46A to submit bank certificates.',
        'Submit details of crop production certificates issued by local Panchayat.',
        'Prepare judicial precedents of Supreme Court stating crop yield estimate methods.'
      ]
    },
    evidence: [
      {
        id: 'e1',
        source: 'AIS Statement',
        description: 'Annual Information Statement showing cash deposits in SBI.',
        admissibility: 'Admissible (Official IT Portal Record)',
        strength: 'Contradiction',
        aiInsight: 'Creates the initial burden on the assessee. The cash is disproportionate to the returned taxable income.'
      },
      {
        id: 'e2',
        source: 'Exhibit F — Mandi Receipts',
        description: 'Form J receipts issued by APMC market committee showing crop weight, rate, and cash payment.',
        admissibility: 'Highly Admissible (Statutory APMC vouchers)',
        strength: 'Strong',
        aiInsight: 'Strong evidence of agricultural transaction. Proves sale of 350 quintals of cotton, matching cash deposit timings.'
      },
      {
        id: 'e3',
        source: '7/12 Land Records',
        description: 'Official revenue records showing ownership of 18 acres and crop details of cotton.',
        admissibility: 'Admissible (Public Land Registry)',
        strength: 'Strong',
        aiInsight: 'Establishes the capacity of the assessee to produce the claimed volume of crops.'
      }
    ]
  },
  'Civil & Commercial': {
    categoryName: 'Civil and Commercial',
    chronology: [
      { date: 'Jan 2022', event: 'Joint Development Agreement (JDA) signed for high-rise project', category: 'Neutral', source: 'Registered JDA deed' },
      { date: 'Jul 2022', event: 'Initial advance payment of Rs. 50 Lakhs bank transferred', category: 'Neutral', source: 'Bank transaction slip' },
      { date: 'Dec 2022', event: 'Developer fails to obtain foundation approval, misses first milestone', category: 'Strong', source: 'Architect milestone certificate' },
      { date: 'Feb 2023', event: 'Landowner serves formal notice of default to Developer', category: 'Neutral', source: 'Legal notice (registered)' },
      { date: 'May 2023', event: 'Developer signs commitment letter promising completion by Dec 2023', category: 'Strong', source: 'Exhibit D — Commitment letter' },
      { date: 'Dec 2023', event: 'Site abandoned, heavy machineries removed by developer', category: 'Strong', source: 'Exhibit E — Site photographs' },
      { date: 'Feb 2024', event: 'Landowner issues Section 21 notice to trigger arbitration', category: 'Neutral', source: 'Section 21 notice' },
      { date: 'Apr 2024', event: 'Developer claims force majeure due to heavy regional rainfall', category: 'Contradiction', source: 'Exhibit F — Meteorological logs' }
    ],
    summary: {
      profile: {
        parties: 'Sterling Estates v. Buildcon Infrastructure',
        court: 'Arbitration Tribunal, Mumbai',
        caseNumber: 'ARB/88/2024',
        nextHearing: '05 Jul 2024',
        readiness: '90%'
      },
      background: 'Commercial dispute referred to sole arbitrator. The Claimant (Landowner) seeks termination of JDA, recovery of Rs. 50 Lakhs advance, and liquidated damages of Rs. 80 Lakhs for project abandonment. The Respondent (Developer) claims wrongful termination and counter-damages, citing force majeure delays.',
      allegations: [
        'Material breach of contract: Abandonment of project construction without reasonable excuse.',
        'Diversion of funds allocated for structural materials to other project locations.',
        'Failure to obtain necessary municipal approvals within JDA timelines.'
      ],
      defense: [
        'Delays were caused by force majeure: Unprecedented heavy rainfall during July-Sept 2022 halting foundation work.',
        'Local authority delayed environmental clearances, which is an excluded event under Clause 14.',
        'Claimant wrongfully terminated the agreement without providing the mandatory 90-day cure period.'
      ],
      legalIssues: [
        'Whether the developer committed a material breach justifying JDA termination.',
        'Whether the rainfall data qualifies as a force majeure event under the contractual definitions.',
        'Whether claimant complied with notice and cure-period protocols under Clause 19.'
      ],
      nextSteps: [
        'Submit official rainfall report from Indian Meteorological Department (IMD).',
        'File deposition of structural engineer regarding foundation status.',
        'Prepare arguments on quantification of actual loss for liquidated damages claim.'
      ]
    },
    evidence: [
      {
        id: 'e1',
        source: 'Joint Development Agreement',
        description: 'Contract defining project milestones, termination clauses, and arbitration.',
        admissibility: 'Admissible (Primary Contract, registered & stamped)',
        strength: 'Strong',
        aiInsight: 'Clause 8 explicitly defines "timely performance as essence of contract". Supports quick termination.'
      },
      {
        id: 'e2',
        source: 'Exhibit D — Commitment Letter',
        description: 'Letter signed by Developer CEO admitting delay and promising completion.',
        admissibility: 'Admissible under Sec 18 (Admission by Party)',
        strength: 'Strong',
        aiInsight: 'Conclusive proof that developer acknowledged default and waived prior delay claims up to May 2023.'
      },
      {
        id: 'e3',
        source: 'Exhibit E — Site Photographs',
        description: '12 high-resolution photos of the stagnant pit and overgrown bushes at the site.',
        admissibility: 'Admissible (Real Evidence, supported by affidavit)',
        strength: 'Strong',
        aiInsight: 'Provides visual proof of abandonment. Directly refutes claims of active construction.'
      },
      {
        id: 'e4',
        source: 'Exhibit F — Meteorological Logs',
        description: 'IMD rainfall logs for the district showing average rainfall within normal 10-year patterns.',
        admissibility: 'Admissible under Sec 57 (Public Records)',
        strength: 'Contradiction',
        aiInsight: 'Severely damages the force majeure defense. Shows rainfall was standard monsoon, not an act of God or unexpected event.'
      }
    ]
  },
  'Labour & Employment': {
    categoryName: 'Labour and Employment',
    chronology: [
      { date: 'Jun 2018', event: 'Employee joins company as Senior Software Engineer', category: 'Neutral', source: 'Offer Letter & Employment Agreement' },
      { date: 'Mar 2023', event: 'Employee files internal whistleblower report on billing fraud', category: 'Strong', source: 'Exhibit A — Email chain to HR' },
      { date: 'Jun 2023', event: 'Employee placed on a 30-day Performance Improvement Plan (PIP)', category: 'Contradiction', source: 'PIP initiation letter' },
      { date: 'Jul 2023', event: 'Weekly PIP reviews show 100% target achievement', category: 'Strong', source: 'Exhibit D — Weekly review reports' },
      { date: 'Sep 2023', event: 'Employment terminated on grounds of failed performance', category: 'Strong', source: 'Termination letter' },
      { date: 'Nov 2023', event: 'Legal notice served alleging wrongful dismissal and retaliation', category: 'Neutral', source: 'Legal notice (registered)' },
      { date: 'Jan 2024', event: 'Conciliation proceedings fail before Labour Commissioner', category: 'Neutral', source: 'Failure Report (Sec 12)' },
      { date: 'Mar 2024', event: 'Wrongful dismissal suit filed in Labour Court', category: 'Neutral', source: 'Written Claim statement' }
    ],
    summary: {
      profile: {
        parties: 'Amit Sen v. Global Tech Solutions',
        court: 'Labour Court, Bangalore',
        caseNumber: 'LC/112/2024',
        nextHearing: '10 Jul 2024',
        readiness: '82%'
      },
      background: 'Industrial dispute regarding wrongful termination of employment. The claimant alleges his termination, disguised as "performance failure" under a PIP, was a retaliatory action for whistleblowing against billing fraud in a major client account. He seeks reinstatement, back wages, and compensation.',
      allegations: [
        'Wrongful termination without a formal domestic enquiry or notice.',
        'Retaliatory action in violation of internal whistleblower protection policy.',
        'Fabrication of poor performance records to justify termination.'
      ],
      defense: [
        'The termination was purely performance-based, following a structured PIP.',
        'Whistleblower complaint was investigated by an independent committee and found baseless.',
        'Termination was done under Clause 11 of employment contract (termination by pay in lieu of notice).'
      ],
      legalIssues: [
        'Whether the claimant is a "workman" under Section 2(s) of the Industrial Disputes Act, 1947.',
        'Whether the PIP and termination was a colorable exercise of power and retaliatory in nature.',
        'Whether the lack of domestic inquiry violates principles of natural justice.'
      ],
      nextSteps: [
        'Submit copies of code commits and pull requests approved during the PIP period.',
        'Call the HR director to produce internal audit logs of whistleblower emails.',
        'Prepare rebuttal to employer\'s claim that worker held administrative role.'
      ]
    },
    evidence: [
      {
        id: 'e1',
        source: 'Exhibit A — Whistleblower HR Email',
        description: 'Email sent to Chief Compliance Officer details billing inflation on client accounts.',
        admissibility: 'Admissible as primary email trail',
        strength: 'Strong',
        aiInsight: 'Establishes a clear timeline. The PIP was issued exactly 3 weeks after this email, supporting the retaliation theory.'
      },
      {
        id: 'e2',
        source: 'PIP Letter',
        description: 'Document outlining performance shortfalls and targets.',
        admissibility: 'Admissible (Corporate Record)',
        strength: 'Contradiction',
        aiInsight: 'Employer\'s defense, but lists vague metrics like "lack of synergy" rather than quantifiable coding failures.'
      },
      {
        id: 'e3',
        source: 'Exhibit D — Weekly PIP Reviews',
        description: 'Weekly scorecards signed by manager showing employee met all targets.',
        admissibility: 'Admissible (Manager signed emails)',
        strength: 'Strong',
        aiInsight: 'Highly critical contradiction. Directly negates the termination letter\'s claim that employee "failed to satisfy PIP targets".'
      }
    ]
  }
}
