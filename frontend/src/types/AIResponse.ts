// src/types/AIResponse.ts
// TypeScript types for all AI responses from Clausio backend

export interface CaseSummaryResponse {
  coreFacts:      string
  currentStage:   string
  keyStrengths:   string[]
  keyWeaknesses:  string[]
  nextSteps:      string[]
  fullSummary:    string
}

export interface Judgment {
  citation:        string   // "Rajnesh v. Neha (2020) 14 SCC 1"
  court:           string   // "Supreme Court of India"
  year:            number   // 2020
  ratioDecidendi:  string   // Key legal principle
  relevance:       string   // Why relevant to this case
  howToUse:        string   // How to use in court argument
  strength:        'High' | 'Medium' | 'Low'
  fullJudgmentUrl: string | null  // Indian Kanoon URL
  isVerified:      boolean  // Whether source is verified
  verifiedSource:  string   // "Indian Kanoon" | "SCC Online" | "Manupatra"
}

export interface ActionPlanItem {
  title:       string
  description: string
  priority:    'High' | 'Medium' | 'Low'
  dueBy:       string
  assignedTo:  'Lawyer' | 'Client' | 'Clerk'
}

export interface Contradiction {
  claim:         string
  claimSource:   string
  evidence:      string
  evidenceSource: string
  courtArgument: string
  strength:      'Very High' | 'High' | 'Medium' | 'Low'
}

export interface TimelineEvent {
  eventDate:          string
  event:              string
  source:             string
  legalSignificance:  string
  category:           'Marriage' | 'Violence' | 'Financial' | 'Court' | 'Other'
}

export interface ReadinessReport {
  score:     number        // 0-100
  strengths: string[]
  gaps:      ReadinessGap[]
  nextSteps: string[]
}

export interface ReadinessGap {
  title:       string
  description: string
  severity:    'Critical' | 'High' | 'Medium' | 'Low'
  resolved:    boolean
}

export interface TranslateResponse {
  translatedText:   string
  detectedLanguage: string
  originalText:     string
}
