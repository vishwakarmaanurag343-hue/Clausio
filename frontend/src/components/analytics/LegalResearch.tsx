'use client'

import React, { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, parseAiJson } from '@/lib/api'
import type { Judgment } from '@/types/AIResponse'

const stats = [
  {
    title: 'Judgments',
    value: '2,84,000+',
    icon: 'ti-scale',
    color: '#3b82f6',
  },
  {
    title: 'Bare Acts',
    value: '356',
    icon: 'ti-book',
    color: '#16a34a',
  },
  {
    title: 'Research Saved',
    value: '184',
    icon: 'ti-bookmark',
    color: '#f59e0b',
  },
  {
    title: 'AI Confidence',
    value: '96%',
    icon: 'ti-brain',
    color: '#7c3aed',
  },
]

export default function LegalResearch() {
  const { selectedCaseId } = useCaseStore()
  const [query,     setQuery]     = useState('')
  const [judgments, setJudgments] = useState<Judgment[] | null>(null)
  const [rawText,   setRawText]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function runResearch() {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await aiApi.getLegalResearch(selectedCaseId)
      const parsed = parseAiJson<Judgment[]>(res.judgments ?? res.result ?? "")
      setJudgments(parsed)
      setRawText(parsed ? "" : res.judgments ?? res.result ?? "")
    } catch (err: any) {
      setError(err.message || 'Failed to run research')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>

      {/* ================= HEADER ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.3px', color: '#0f172a',
            }}
          >
            AI Legal Research
          </h2>

          <p
            style={{
              marginTop: 8,
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            Search judgments, statutes, precedents and legal principles using
            AI-powered semantic research.
          </p>
        </div>

        <button
          onClick={runResearch}
          disabled={loading}
          style={{
            border: 'none',
            background: loading ? '#93c5fd' : '#3b82f6',
            color: '#fff',
            borderRadius: 10,
            padding: '12px 20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          <i
            className="ti ti-sparkles"
            style={{
              marginRight: 8,
            }}
          />
          {loading ? 'Researching...' : 'AI Research'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* ================= AI SEARCH ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 28,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          AI Search
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr auto',
            gap: 16,
          }}
        >
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask anything... e.g. Interim maintenance judgments after Rajnesh v. Neha"
            style={inputStyle}
          />

          <select style={inputStyle}>
            <option>All Courts</option>
            <option>Supreme Court</option>
            <option>High Court</option>
            <option>Family Court</option>
            <option>District Court</option>
          </select>

          <select style={inputStyle}>
            <option>All Years</option>
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
            <option>2023</option>
          </select>

          <button
            onClick={runResearch}
            disabled={loading}
            style={{
              border: 'none',
              background: loading ? '#93c5fd' : '#3b82f6',
              color: '#fff',
              borderRadius: 10,
              padding: '0 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>
      </div>

      {/* ================= DASHBOARD ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 30,
        }}
      >
        {stats.map((item) => (
          <div
            key={item.title}
            style={{
              background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: '#64748b',
                }}
              >
                {item.title}
              </span>

              <i
                className={`ti ${item.icon}`}
                style={{
                  color: item.color,
                  fontSize: 22,
                }}
              />
            </div>

            <div
              style={{
                marginTop: 18,
                fontSize: 30,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ================= RESEARCH FILTERS ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 30,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 20,
          }}
        >
          Research Filters
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 18,
          }}
        >
          <FilterCard
            icon="ti-scale"
            title="Case Laws"
            subtitle="Judgments & precedents"
            color="#2563eb"
          />

          <FilterCard
            icon="ti-book"
            title="Bare Acts"
            subtitle="Acts & Sections"
            color="#16a34a"
          />

          <FilterCard
            icon="ti-file-text"
            title="Articles"
            subtitle="Legal research papers"
            color="#7c3aed"
          />

          <FilterCard
            icon="ti-bookmark"
            title="Saved Research"
            subtitle="Bookmarks & notes"
            color="#ea580c"
          />
        </div>
      </div>
            {/* ================= AI SEARCH RESULTS ================= */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              margin: 0,
            }}
          >
            AI Search Results
          </h3>

          <button
            style={{
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: 10,
              padding: '10px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Refine Search
          </button>
        </div>

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {loading && <div style={{ padding: 22, fontSize: 13, color: '#64748b' }}>Searching judgments...</div>}

          {!loading && !judgments && !rawText && (
            <div style={{ padding: 22, fontSize: 13, color: '#94a3b8' }}>Click AI Research to search relevant judgments for the selected case.</div>
          )}

          {!loading && !judgments && rawText && (
            <div style={{ padding: 22, fontSize: 13, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{rawText}</div>
          )}

          {!loading && judgments && judgments.map((j, i) => (
            <ResearchResult
              key={i}
              title={j.citation}
              court={`${j.court} · ${j.year}`}
              relevance={j.strength === 'High' ? '96%' : j.strength === 'Medium' ? '78%' : '60%'}
              summary={j.ratioDecidendi}
            />
          ))}
        </div>
      </div>

      {/* ================= RELEVANT JUDGMENTS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            Relevant Judgments
          </h3>

          {[
            'Rajnesh v. Neha',
            'Danial Latifi v. Union of India',
            'Shamima Farooqui Case',
            'Vimlaben Patel Case',
            'Bhuwan Mohan Singh Case',
            'Kalyan Dey Chowdhury',
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            Relevant Bare Acts
          </h3>

          {[
            'Hindu Marriage Act',
            'Domestic Violence Act',
            'Family Courts Act',
            'Indian Evidence Act',
            'CrPC Section 125',
            'Bharatiya Nyaya Sanhita',
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ================= SIMILAR CASES ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 22,
          marginBottom: 30,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 20,
          }}
        >
          Similar Cases Found
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          <CaseCard
            caseNo="FC/214/2025"
            subject="Maintenance"
            similarity="96%"
          />

          <CaseCard
            caseNo="FC/442/2024"
            subject="Child Custody"
            similarity="91%"
          />

          <CaseCard
            caseNo="FC/117/2023"
            subject="Domestic Violence"
            similarity="89%"
          />
        </div>
      </div>
            {/* ================= AI RESEARCH SUMMARY ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr .8fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        {/* AI Summary */}

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            AI Research Summary
          </h3>

          <p
            style={{
              lineHeight: 1.9,
              color: '#475569',
            }}
          >
            Based on the search query, the strongest legal authority is
            <strong> Rajnesh v. Neha</strong>, which establishes detailed
            principles regarding maintenance, financial disclosure and
            standardized affidavit formats.
          </p>

          <p
            style={{
              lineHeight: 1.9,
              color: '#475569',
            }}
          >
            AI also recommends relying upon
            <strong> Shamima Farooqui</strong> and
            <strong> Danial Latifi</strong> to strengthen arguments relating
            to adequate maintenance and financial capability.
          </p>

          <div
            style={{
              marginTop: 20,
              display: 'grid',
              gap: 14,
            }}
          >
            <SummaryCard
              title="Primary Judgment"
              value="Rajnesh v. Neha"
            />

            <SummaryCard
              title="Most Relevant Act"
              value="CrPC Section 125"
            />

            <SummaryCard
              title="Confidence"
              value="96%"
            />

            <SummaryCard
              title="Research Quality"
              value="Excellent"
            />
          </div>
        </div>

        {/* AI Recommendation */}

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            AI Recommendations
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 16,
            }}
          >
            <RecommendationCard
              title="Read Full Judgment"
              value="Rajnesh v. Neha"
            />

            <RecommendationCard
              title="Check Bombay HC Cases"
              value="2023-2026"
            />

            <RecommendationCard
              title="Research Priority"
              value="Maintenance"
            />

            <RecommendationCard
              title="Suggested Draft"
              value="Interim Maintenance"
            />
          </div>
        </div>
      </div>

      {/* ================= CITATION ANALYSIS ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 22,
          marginBottom: 30,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 18,
          }}
        >
          Citation Analysis
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 18,
          }}
        >
          <CitationCard
            title="Supreme Court"
            value="84"
            color="#2563eb"
          />

          <CitationCard
            title="High Court"
            value="137"
            color="#16a34a"
          />

          <CitationCard
            title="Family Court"
            value="58"
            color="#ea580c"
          />

          <CitationCard
            title="Total Citations"
            value="279"
            color="#7c3aed"
          />
        </div>
      </div>

      {/* ================= LANDMARK JUDGMENTS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            Landmark Judgments
          </h3>

          {[
            'Rajnesh v. Neha',
            'Danial Latifi',
            'Shamima Farooqui',
            'Vimlaben Patel',
            'Bhuwan Mohan Singh',
            'Kalyan Dey Chowdhury',
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Research Notes */}

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            Research Notes
          </h3>

          <textarea
            rows={12}
            placeholder="Write your legal research notes here..."
            style={{
              ...inputStyle,
              height: 'auto',
              resize: 'vertical',
              paddingTop: 12,
            }}
          />
        </div>
      </div>
            {/* ================= SAVED RESEARCH ================= */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              margin: 0,
            }}
          >
            Saved Research
          </h3>

          <button style={primaryButton}>
            View All
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          <SavedResearchCard
            title="Maintenance Research"
            updated="Today"
          />

          <SavedResearchCard
            title="Custody Judgments"
            updated="Yesterday"
          />

          <SavedResearchCard
            title="DV Act Notes"
            updated="3 Days Ago"
          />
        </div>
      </div>

      {/* ================= EXPORT ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Export Research
          </h3>

          <p
            style={{
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            Export AI research with judgments,
            citations and notes.
          </p>

          <div
            style={{
              display: 'grid',
              gap: 12,
              marginTop: 20,
            }}
          >
            <button style={primaryButton}>
              Export PDF
            </button>

            <button style={primaryButton}>
              Export Word
            </button>

            <button style={primaryButton}>
              Export Research Report
            </button>
          </div>
        </div>

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            AI Suggestions
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 14,
            }}
          >
            <RecommendationCard
              title="Read Next"
              value="Bombay HC Maintenance Cases"
            />

            <RecommendationCard
              title="Compare With"
              value="Delhi HC Judgments"
            />

            <RecommendationCard
              title="Missing Citation"
              value="Rajnesh v. Neha"
            />

            <RecommendationCard
              title="Suggested Draft"
              value="Interim Maintenance Petition"
            />
          </div>
        </div>
      </div>

    </div>
  )
}

/* ================= HELPER COMPONENTS ================= */

function FilterCard({
  icon,
  title,
  subtitle,
  color,
}:{
  icon:string
  title:string
  subtitle:string
  color:string
}) {
  return (
    <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius:16,
        padding:20,
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{
          fontSize:30,
          color,
        }}
      />

      <h3
        style={{
          marginTop:16,
          marginBottom:8,
        }}
      >
        {title}
      </h3>

      <div style={{color:'#64748b'}}>
        {subtitle}
      </div>
    </div>
  )
}

function ResearchResult({
  title,
  court,
  relevance,
  summary,
}:{
  title:string
  court:string
  relevance:string
  summary:string
}) {
  return (
    <div
      style={{
        padding:22,
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display:'flex',
          justifyContent:'space-between',
        }}
      >
        <strong>{title}</strong>

        <span
          style={{
            color: '#3b82f6',
            fontWeight:700,
          }}
        >
          {relevance}
        </span>
      </div>

      <div
        style={{
          marginTop:8,
          color:'#64748b',
        }}
      >
        {court}
      </div>

      <p
        style={{
          marginTop:12,
          color:'#475569',
          lineHeight:1.7,
        }}
      >
        {summary}
      </p>
    </div>
  )
}

function CaseCard({
  caseNo,
  subject,
  similarity,
}:{
  caseNo:string
  subject:string
  similarity:string
}) {
  return (
    <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius:14,
        padding:20,
      }}
    >
      <h4>{caseNo}</h4>

      <div>{subject}</div>

      <strong
        style={{
          color: '#3b82f6',
        }}
      >
        {similarity} Match
      </strong>
    </div>
  )
}

function SummaryCard({
  title,
  value,
}:{
  title:string
  value:string
}) {
  return (
    <div
      style={{
        display:'flex',
        justifyContent:'space-between',
      }}
    >
      <span>{title}</span>

      <strong>{value}</strong>
    </div>
  )
}

function RecommendationCard({
  title,
  value,
}:{
  title:string
  value:string
}) {
  return (
    <div
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        paddingBottom:12,
      }}
    >
      <div
        style={{
          color:'#64748b',
          fontSize:13,
        }}
      >
        {title}
      </div>

      <strong>{value}</strong>
    </div>
  )
}

function CitationCard({
  title,
  value,
  color,
}:{
  title:string
  value:string
  color:string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius:12,
        padding:18,
      }}
    >
      <div
        style={{
          color:'#64748b',
          fontSize:13,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop:10,
          fontSize:24,
          fontWeight:700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SavedResearchCard({
  title,
  updated,
}:{
  title:string
  updated:string
}) {
  return (
    <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius:14,
        padding:20,
      }}
    >
      <h4
        style={{
          marginTop:0,
        }}
      >
        {title}
      </h4>

      <div
        style={{
          color:'#64748b',
        }}
      >
        Updated {updated}
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const inputStyle:React.CSSProperties={
  width:'100%',
  height:44,
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius:10,
  padding:'0 14px',
  outline:'none',
  fontSize:14,
  boxSizing:'border-box',
}

const primaryButton:React.CSSProperties={
  border:'none',
  background: '#3b82f6',
  color:'#fff',
  borderRadius:10,
  padding:'10px 18px',
  cursor:'pointer',
  fontWeight:600,
}