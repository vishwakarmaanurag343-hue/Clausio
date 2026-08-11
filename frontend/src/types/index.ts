// src/types/index.ts
// All shared TypeScript interfaces for Clausio
// Import these in every component instead of using inline types

// ── CASE ─────────────────────────────────────────
export type CaseType =
  | 'Family'
  | 'Criminal'
  | 'Civil'
  | 'GST'
  | 'Income Tax'
  | 'NI Act 138'
  | 'Labour'
  | 'Consumer'

export type CaseStatus =
  | 'Active'
  | 'Hearing today'
  | 'Pending filing'
  | 'Awaiting client'
  | 'Arguments'
  | 'Evidence'
  | 'Closed'

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'

export interface Case {
  id:          string
  name:        string        // "Priya v. Rohit Sharma"
  number:      string        // "FC/2847/2023"
  client:      string        // client full name
  clientId:    string
  type:        CaseType
  subType:     string        // "Divorce Petition"
  court:       string        // "Family Court"
  courtLoc:    string        // "Bandra, Mumbai"
  status:      CaseStatus
  stage:       string        // "Evidence", "Written Statement"
  priority:    Priority
  nextHearing: string        // ISO date string
  filedOn:     string        // ISO date string
  readiness:   number        // 0–100
  opposingAdv: string
}

// ── CLIENT ───────────────────────────────────────
export type ClientType = 'Individual' | 'Business' | 'HUF' | 'Trust'

export interface Client {
  id:           string
  firstName:    string
  lastName:     string
  phone:        string
  altPhone?:    string
  email:        string
  whatsapp?:    string
  address:      string
  type:         ClientType
  aadhar?:      string
  pan?:         string
  occupation?:  string
  monthlyIncome?: number
  bankName?:    string
  isVip:        boolean
  since:        string       // ISO date
  notes?:       string
}

// ── HEARING ──────────────────────────────────────
export interface HearingOrder {
  id:          string
  text:        string
  responsible: 'Respondent' | 'Petitioner' | 'Lawyer' | 'Court'
  deadline:    string        // ISO date
  done:        boolean
}

export interface Hearing {
  id:               string
  caseId:           string
  date:             string   // ISO date
  stage:            string
  judge?:           string
  courtHall?:       string
  whatHappened:     string
  judgeObservation? : string
  opposingAdmission?: string
  nextObjective?:   string
  orders:           HearingOrder[]
  createdBy:        string
  createdAt:        string
}

// ── DOCUMENT ─────────────────────────────────────
export type DocStatus = 'Uploaded' | 'Missing' | 'Pending'

export interface CaseDocument {
  id:         string
  caseId:     string
  name:       string
  type:       string          // "Marriage Certificate", "ITR", etc.
  status:     DocStatus
  uploadedAt? : string
  url?:       string
}

// ── INVOICE / BILLING ────────────────────────────
export type InvoiceStatus = 'Paid' | 'Overdue' | 'Due'

export interface Invoice {
  id:        string
  clientId:  string
  caseId?:   string
  label:     string
  amount:    number
  dueDate:   string
  status:    InvoiceStatus
  paidDate?: string
}

// ── USER / AUTH ───────────────────────────────────
export interface User {
  id:       string
  name:     string
  role:     'Senior Advocate' | 'Junior Advocate' | 'Clerk' | 'Admin'
  initials: string
  email:    string
  phone?:   string
}

// ── AI INSIGHT ───────────────────────────────────
export type InsightSeverity = 'urgent' | 'recommended' | 'strategy'

export interface AIInsight {
  id:       string
  caseId:   string
  text:     string
  severity: InsightSeverity
  action?:  string
  actionLabel?: string
}