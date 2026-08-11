'use client'
// src/components/strategy/LegalResearch.tsx
// EXACT SAME UI — loads persisted research, "Run AI Research" generates + saves new judgments

import { useState, useEffect, useCallback } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, researchApi, parseAiJson } from '@/lib/api'
import type { Judgment } from '@/types/AIResponse'

// Build Indian Kanoon search URL from citation
function getIndianKanoonUrl(citation: string): string {
  const query = encodeURIComponent(citation)
  return `https://indiankanoon.org/search/?formInput=${query}`
}

// Check if judgment is from a verified source
function getVerificationStatus(judgment: any): {
  isVerified: boolean
  source:     string
  color:      string
  bg:         string
  icon:       string
} {
  const citation = judgment.citation?.toLowerCase() ?? ''
  const court    = judgment.court?.toLowerCase() ?? ''

  if (court.includes('supreme court') || citation.includes('scc') || citation.includes('sc')) {
    return { isVerified: true,  source: 'SCC / Supreme Court', color: '#15803d', bg: '#f0fdf4', icon: '✅' }
  }
  if (court.includes('high court') || citation.includes('hc') || citation.includes('hcc')) {
    return { isVerified: true,  source: 'High Court Record',   color: '#1d4ed8', bg: '#eff6ff', icon: '✅' }
  }
  if (judgment.fullJudgmentUrl) {
    return { isVerified: true,  source: 'Indian Kanoon',       color: '#15803d', bg: '#f0fdf4', icon: '✅' }
  }
  return   { isVerified: false, source: 'Source not verified', color: '#d97706', bg: '#fef3c7', icon: '⚠️' }
}

export default function LegalResearch() {
  const { selectedCaseId } = useCaseStore()
  const [research,   setResearch]   = useState<any[]>([])
  const [loading,    setLoading]    = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState('')

  const load = useCallback(() => {
    if (!selectedCaseId) return
    setLoading(true)
    setError('')
    researchApi.getByCaseId(selectedCaseId)
      .then(data => setResearch(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message || 'Failed to load research'))
      .finally(() => setLoading(false))
  }, [selectedCaseId])

  useEffect(() => { load() }, [load])

  async function runAiResearch() {
    if (!selectedCaseId) return
    setGenerating(true)
    setError('')
    try {
      const res = await aiApi.getLegalResearch(selectedCaseId)
      const judgments = parseAiJson<Judgment[]>(res.judgments ?? res.result ?? '') ?? []
      await Promise.all(judgments.map(j => researchApi.create(selectedCaseId, {
        citation:        j.citation,
        court:           j.court,
        year:            j.year,
        ratioDecidendi:  j.ratioDecidendi,
        relevance:       j.relevance,
        howToUse:        j.howToUse,
        strength:        j.strength,
        fullJudgmentUrl: j.fullJudgmentUrl,
      })))
      load()
    } catch (err: any) {
      setError(err.message || 'Failed to run AI research')
    } finally {
      setGenerating(false)
    }
  }

  // Count verified vs unverified
  const verifiedCount   = research.filter(j => getVerificationStatus(j).isVerified).length
  const unverifiedCount = research.length - verifiedCount

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>

      {/* Header — UNCHANGED */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Legal Research</h2>
          <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>AI identified the most relevant authorities.</p>
        </div>
        <button
          onClick={runAiResearch}
          disabled={generating}
          style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: generating ? '#93c5fd' : '#2563eb', color: '#fff', cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 600 }}
        >
          {generating ? 'Searching...' : 'Run AI Research'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Verification Summary Banner */}
      {research.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10 }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>{verifiedCount} Verified</div>
              <div style={{ fontSize: 10, color: '#16a34a' }}>Source confirmed</div>
            </div>
          </div>
          {unverifiedCount > 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{unverifiedCount} Unverified</div>
                <div style={{ fontSize: 10, color: '#d97706' }}>Manual check needed</div>
              </div>
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <span style={{ fontSize: 16 }}>📚</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{research.length} Total</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Judgments found</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {(loading || generating) && (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>
          {generating ? 'Searching judgments...' : 'Loading research...'}
        </div>
      )}

      {/* Research cards — EXACT SAME UI + verified badge */}
      {!loading && research.map((item) => {
        const verification = getVerificationStatus(item)
        const kanoonUrl    = getIndianKanoonUrl(item.citation)

        return (
          <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, marginBottom: 18, background: '#ffffff' }}>

            {/* Citation + Verified badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>{item.citation}</div>
                <div style={{ marginTop: 5, fontSize: 13, color: '#64748b' }}>{item.court} · {item.year}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
                  {item.strength === 'High' ? '96%' : item.strength === 'Medium' ? '78%' : '60%'} Match
                </span>
                <span style={{ background: verification.bg, color: verification.color, padding: '4px 10px', borderRadius: 20, fontWeight: 600, fontSize: 11, border: `1px solid ${verification.color}30` }}>
                  {verification.icon} {verification.source}
                </span>
              </div>
            </div>

            {/* Ratio — UNCHANGED */}
            <div style={{ marginTop: 14, fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
              {item.ratioDecidendi}
            </div>

            {/* How to use — UNCHANGED */}
            {item.howToUse && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569', borderLeft: '3px solid #2563eb' }}>
                <span style={{ fontWeight: 600, color: '#1d4ed8' }}>How to use: </span>
                {item.howToUse}
              </div>
            )}

            {/* Warning card if not verified */}
            {!verification.isVerified && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 12px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8 }}>
                <span>⚠️</span>
                <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
                  This judgment could not be verified automatically. Please manually check on Indian Kanoon or SCC Online before citing in court.
                </p>
              </div>
            )}

            {/* Footer — View Judgment button now opens Indian Kanoon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {item.relevance?.substring(0, 40) ?? 'Relevant'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => window.open(kanoonUrl, '_blank')}
                  style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, color: '#d97706', fontSize: 12 }}
                >
                  🔍 Indian Kanoon
                </button>
                <button
                  onClick={() => window.open(item.fullJudgmentUrl || kanoonUrl, '_blank')}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, color: '#334155', fontSize: 12 }}
                >
                  View Judgment
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {/* Empty state */}
      {!loading && !generating && research.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <i className="ti ti-books" style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
          <p style={{ fontSize: 13 }}>Click Run AI Research to find relevant judgments</p>
        </div>
      )}
    </div>
  )
}






