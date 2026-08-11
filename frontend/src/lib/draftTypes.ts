'use client'

// ============================================================
// DRAFT TYPES PER CASE TYPE
// Each case type gets its own set of relevant documents
// ============================================================

export interface DraftType {
  label:       string
  description: string
  sections:    string[]  // applicable sections
}

const DRAFT_TYPES_BY_CASE: Record<string, DraftType[]> = {

  // ── FAMILY LAW ──────────────────────────────────────────────
  family: [
    { label: 'Divorce Petition',              description: 'Petition under Section 13 HMA for dissolution of marriage',      sections: ['Section 13 HMA', 'Section 13B HMA'] },
    { label: 'Interim Maintenance Application', description: 'Application for maintenance pendente lite under Section 24 HMA', sections: ['Section 24 HMA', 'Section 125 CrPC'] },
    { label: 'Permanent Alimony Application', description: 'Application for permanent alimony under Section 25 HMA',          sections: ['Section 25 HMA'] },
    { label: 'Child Custody Petition',        description: 'Petition for custody of minor children',                          sections: ['Section 26 HMA', 'Guardians and Wards Act'] },
    { label: 'Restitution of Conjugal Rights', description: 'Petition under Section 9 HMA for restitution',                  sections: ['Section 9 HMA'] },
    { label: 'DV Complaint',                  description: 'Complaint under Protection of Women from DV Act 2005',            sections: ['Section 12 DV Act', 'Section 18 DV Act'] },
    { label: 'Domestic Violence Application', description: 'Application for protection order, residence order',               sections: ['Section 18, 19, 20 DV Act'] },
    { label: 'Vakalatnama',                   description: 'Power of attorney authorising advocate to appear',                sections: ['Order III Rule 4 CPC'] },
    { label: 'Affidavit',                     description: 'Sworn affidavit in support of petition',                          sections: ['Order XIX CPC'] },
    { label: 'Legal Notice',                  description: 'Pre-litigation notice to opposing party',                         sections: ['Section 80 CPC'] },
    { label: 'Written Statement',             description: 'Reply to petition filed by opposing party',                       sections: ['Order VIII CPC'] },
    { label: 'Discovery Application',         description: 'Application for discovery of documents and income',               sections: ['Order XI Rule 12 CPC'] },
  ],

  // ── CRIMINAL LAW ────────────────────────────────────────────
  criminal: [
    { label: 'Bail Application',              description: 'Application for regular bail under Section 437/439 CrPC',        sections: ['Section 437 CrPC', 'Section 439 CrPC'] },
    { label: 'Anticipatory Bail Application', description: 'Application for anticipatory bail under Section 438 CrPC',       sections: ['Section 438 CrPC'] },
    { label: 'Discharge Application',         description: 'Application for discharge before framing of charges',            sections: ['Section 227 CrPC', 'Section 239 CrPC'] },
    { label: 'Quashing Petition',             description: 'Petition to quash FIR or proceedings under Article 226',        sections: ['Article 226 Constitution', 'Section 482 CrPC'] },
    { label: 'Criminal Appeal',               description: 'Appeal against conviction or acquittal',                         sections: ['Section 374 CrPC', 'Section 378 CrPC'] },
    { label: 'Revision Petition',             description: 'Revision against interlocutory orders',                          sections: ['Section 397 CrPC', 'Section 401 CrPC'] },
    { label: 'Protest Petition',              description: 'Protest petition against closure report filed by police',         sections: ['Section 190 CrPC'] },
    { label: 'Compensation Application',      description: 'Application for compensation under Section 357 CrPC',            sections: ['Section 357 CrPC', 'Section 357A CrPC'] },
    { label: 'Vakalatnama',                   description: 'Power of attorney authorising advocate',                         sections: ['Order III Rule 4 CPC'] },
    { label: 'Affidavit in Support',          description: 'Sworn affidavit supporting bail or other application',           sections: ['Section 297 CrPC'] },
  ],

  // ── CIVIL LITIGATION ────────────────────────────────────────
  civil: [
    { label: 'Plaint / Civil Suit',           description: 'Institution of civil suit under Order VII CPC',                  sections: ['Order VII CPC', 'Section 26 CPC'] },
    { label: 'Written Statement',             description: 'Reply to plaint with defence and counter-claims',                 sections: ['Order VIII CPC'] },
    { label: 'Temporary Injunction',          description: 'Application for temporary injunction under Order XXXIX',         sections: ['Order XXXIX Rules 1-2 CPC', 'Section 151 CPC'] },
    { label: 'Specific Performance Suit',     description: 'Suit for specific performance of contract',                      sections: ['Section 10 Specific Relief Act'] },
    { label: 'Summary Suit',                  description: 'Summary suit for recovery of money under Order XXXVII',          sections: ['Order XXXVII CPC'] },
    { label: 'Execution Petition',            description: 'Petition to execute decree passed by court',                     sections: ['Order XXI CPC', 'Section 36 CPC'] },
    { label: 'Attachment Before Judgment',    description: 'Application for attachment before judgment under Order XXXVIII', sections: ['Order XXXVIII CPC'] },
    { label: 'Appeal Memorandum',             description: 'Memorandum of appeal against trial court decree',                sections: ['Order XLI CPC', 'Section 96 CPC'] },
    { label: 'Legal Notice',                  description: 'Pre-litigation demand notice',                                    sections: ['Section 80 CPC'] },
    { label: 'Affidavit',                     description: 'Sworn affidavit in support of application',                      sections: ['Order XIX CPC'] },
  ],

  // ── GST ─────────────────────────────────────────────────────
  gst: [
    { label: 'Reply to Show Cause Notice',    description: 'Detailed reply to SCN issued under Section 73/74 CGST Act',     sections: ['Section 73 CGST', 'Section 74 CGST'] },
    { label: 'Appeal to Appellate Authority', description: 'First appeal against adjudication order under Section 107',     sections: ['Section 107 CGST Act'] },
    { label: 'Stay Application',              description: 'Application for stay of recovery during appeal',                 sections: ['Section 107(7) CGST Act'] },
    { label: 'Writ Petition (HC)',            description: 'Writ petition to High Court against unreasonable GST demand',   sections: ['Article 226 Constitution'] },
    { label: 'ITC Reversal Reply',            description: 'Reply to notice for ITC reversal under Rule 36/37',             sections: ['Section 16 CGST', 'Rule 36 CGST Rules'] },
    { label: 'Refund Application',            description: 'Application for refund of excess GST paid',                     sections: ['Section 54 CGST Act'] },
    { label: 'Rectification Application',     description: 'Application for rectification of apparent error in order',      sections: ['Section 161 CGST Act'] },
    { label: 'Compounding Application',       description: 'Application for compounding of offence',                        sections: ['Section 138 CGST Act'] },
  ],

  // ── INCOME TAX ──────────────────────────────────────────────
  'income tax': [
    { label: 'Reply to Assessment Notice',    description: 'Reply to notice under Section 143(2) or 148 IT Act',            sections: ['Section 143(2) IT Act', 'Section 148 IT Act'] },
    { label: 'Appeal to CIT(A)',              description: 'First appeal against assessment order under Section 246A',       sections: ['Section 246A IT Act'] },
    { label: 'ITAT Appeal Memo',              description: 'Appeal to Income Tax Appellate Tribunal',                        sections: ['Section 253 IT Act'] },
    { label: 'High Court Appeal',             description: 'Appeal to High Court on substantial question of law',            sections: ['Section 260A IT Act'] },
    { label: 'Stay of Demand Application',    description: 'Application for stay of tax demand during appeal',               sections: ['Section 220(6) IT Act'] },
    { label: 'Rectification Application',     description: 'Application under Section 154 for rectification of mistake',    sections: ['Section 154 IT Act'] },
    { label: 'Revision Application',          description: 'Application for revision under Section 264',                    sections: ['Section 264 IT Act'] },
    { label: 'Penalty Reply',                 description: 'Reply to penalty notice under Section 270A',                    sections: ['Section 270A IT Act', 'Section 271(1)(c) IT Act'] },
  ],

  // ── NI ACT 138 ──────────────────────────────────────────────
  'ni act': [
    { label: 'Complaint under Section 138',   description: 'Complaint for dishonour of cheque under NI Act',                sections: ['Section 138 NI Act', 'Section 142 NI Act'] },
    { label: 'Demand Notice (RPAD)',           description: 'Legal demand notice to be sent by Registered Post',             sections: ['Section 138 proviso (b) NI Act'] },
    { label: 'Reply to Complaint',            description: 'Reply/written statement filed by accused',                       sections: ['Section 138 NI Act', 'Section 313 CrPC'] },
    { label: 'Compounding Application',       description: 'Application for compounding of offence under Section 147',      sections: ['Section 147 NI Act'] },
    { label: 'Application for Interim Compensation', description: 'Application for interim compensation under Section 143A', sections: ['Section 143A NI Act'] },
    { label: 'Application under Section 148', description: 'Application directing deposit of 20% in appeal',                sections: ['Section 148 NI Act'] },
    { label: 'Bail Application',              description: 'Bail application in cheque bounce case',                         sections: ['Section 437 CrPC'] },
  ],

  // ── CORPORATE / IBC ─────────────────────────────────────────
  corporate: [
    { label: 'Section 7 Petition (IBC)',      description: 'CIRP petition by financial creditor under IBC 2016',            sections: ['Section 7 IBC 2016'] },
    { label: 'Section 9 Petition (IBC)',      description: 'CIRP petition by operational creditor under IBC 2016',          sections: ['Section 9 IBC 2016'] },
    { label: 'Oppression & Mismanagement',    description: 'Petition under Section 241-242 Companies Act 2013',             sections: ['Section 241 Companies Act', 'Section 242 Companies Act'] },
    { label: 'Winding Up Petition',           description: 'Petition for winding up of company under Section 271',          sections: ['Section 271 Companies Act 2013'] },
    { label: 'SARFAESI Application',          description: 'Application under SARFAESI Act for secured asset possession',   sections: ['Section 13(4) SARFAESI Act'] },
    { label: 'DRT Application',               description: 'Application to Debt Recovery Tribunal for recovery',            sections: ['Section 19 RDDBFI Act'] },
    { label: 'Reply to Liquidator',           description: 'Reply/objection to liquidators action in IBC proceedings',    sections: ['Section 35 IBC', 'Section 42 IBC'] },
  ],

  // ── ARBITRATION ─────────────────────────────────────────────
  arbitration: [
    { label: 'Statement of Claim',            description: 'Statement of claim filed before arbitral tribunal',              sections: ['Section 23 A&C Act'] },
    { label: 'Statement of Defence',          description: 'Reply/defence to statement of claim',                            sections: ['Section 23 A&C Act'] },
    { label: 'Section 9 Application',         description: 'Application for interim relief before court under Section 9',   sections: ['Section 9 A&C Act 1996'] },
    { label: 'Section 34 Petition',           description: 'Petition to set aside arbitral award under Section 34',         sections: ['Section 34 A&C Act 1996'] },
    { label: 'Section 11 Application',        description: 'Application for appointment of arbitrator under Section 11',    sections: ['Section 11 A&C Act 1996'] },
    { label: 'Enforcement Application',       description: 'Application to enforce domestic arbitral award',                 sections: ['Section 36 A&C Act 1996'] },
  ],

  // ── CONSUMER ────────────────────────────────────────────────
  consumer: [
    { label: 'Consumer Complaint',            description: 'Complaint before District/State/National Consumer Commission',   sections: ['Section 35 CP Act 2019'] },
    { label: 'Reply to Consumer Complaint',   description: 'Written reply/version filed by opposite party',                  sections: ['Section 38 CP Act 2019'] },
    { label: 'Appeal to State Commission',    description: 'Appeal against District Commission order',                       sections: ['Section 41 CP Act 2019'] },
    { label: 'Appeal to National Commission', description: 'Appeal against State Commission order',                          sections: ['Section 51 CP Act 2019'] },
    { label: 'Execution Application',         description: 'Application for execution of consumer forum order',              sections: ['Section 71 CP Act 2019'] },
  ],

  // ── RERA ────────────────────────────────────────────────────
  rera: [
    { label: 'RERA Complaint',                description: 'Complaint against builder/developer before RERA Authority',     sections: ['Section 31 RERA 2016'] },
    { label: 'Appeal to RERA Tribunal',       description: 'Appeal against RERA Authority order',                           sections: ['Section 44 RERA 2016'] },
    { label: 'Refund Application',            description: 'Application for refund with interest under Section 18',         sections: ['Section 18 RERA 2016'] },
    { label: 'Legal Notice to Builder',       description: 'Pre-litigation notice to builder for delay/defect',              sections: ['Section 14 RERA 2016'] },
  ],

  // ── LABOUR ──────────────────────────────────────────────────
  labour: [
    { label: 'Industrial Dispute Reference',  description: 'Reference of dispute to Labour Court / Industrial Tribunal',    sections: ['Section 10 ID Act 1947'] },
    { label: 'Writ for Reinstatement',        description: 'Writ petition for reinstatement of wrongfully terminated worker', sections: ['Article 226 Constitution'] },
    { label: 'Gratuity Claim Application',    description: 'Application for payment of gratuity before Controlling Authority', sections: ['Section 7 Payment of Gratuity Act'] },
    { label: 'PF Dispute Application',        description: 'Application regarding provident fund dispute before EPF Tribunal', sections: ['Section 7A EPF Act 1952'] },
    { label: 'Statement of Claim',            description: 'Statement of claim before Labour Court',                         sections: ['ID Act 1947'] },
  ],
}

// ── DEFAULT (if case type not found) ────────────────────────
const DEFAULT_DRAFT_TYPES: DraftType[] = [
  { label: 'Petition',           description: 'General petition to court',    sections: [] },
  { label: 'Written Statement',  description: 'Reply to opposing party',      sections: [] },
  { label: 'Affidavit',          description: 'Sworn affidavit',              sections: [] },
  { label: 'Legal Notice',       description: 'Pre-litigation notice',        sections: [] },
  { label: 'Injunction',         description: 'Application for injunction',   sections: [] },
  { label: 'Vakalatnama',        description: 'Power of attorney',            sections: [] },
]

// ── HELPER FUNCTION ──────────────────────────────────────────
export function getDraftTypesForCase(caseType: string): DraftType[] {
  if (!caseType) return DEFAULT_DRAFT_TYPES
  const lower = caseType.toLowerCase()

  // Try exact match
  if (DRAFT_TYPES_BY_CASE[lower]) return DRAFT_TYPES_BY_CASE[lower]

  // Try partial match
  for (const [key, types] of Object.entries(DRAFT_TYPES_BY_CASE)) {
    if (lower.includes(key) || key.includes(lower)) return types
  }

  return DEFAULT_DRAFT_TYPES
}

// ── JUST THE LABELS (for backward compat) ───────────────────
export function getDraftTypeLabels(caseType: string): string[] {
  return getDraftTypesForCase(caseType).map(t => t.label)
}
