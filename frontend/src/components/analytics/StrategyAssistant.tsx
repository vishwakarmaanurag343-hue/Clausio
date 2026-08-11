'use client'

import React, { useState } from 'react'
import { useCaseStore } from '@/lib/store'
import { aiApi, parseAiJson } from '@/lib/api'
import type { CaseSummaryResponse } from '@/types/AIResponse'

const stats = [
  {
    title: 'Strategy Score',
    value: '92%',
    icon: 'ti-target-arrow',
    color: '#3b82f6',
  },
  {
    title: 'Win Probability',
    value: '84%',
    icon: 'ti-trophy',
    color: '#16a34a',
  },
  {
    title: 'Risk Level',
    value: 'Medium',
    icon: 'ti-alert-triangle',
    color: '#ea580c',
  },
  {
    title: 'AI Confidence',
    value: '96%',
    icon: 'ti-brain',
    color: '#7c3aed',
  },
]

export default function StrategyAssistant() {
  const { selectedCaseId } = useCaseStore()
  const [summary,  setSummary]  = useState<CaseSummaryResponse | null>(null)
  const [rawText,  setRawText]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function generateStrategy() {
    if (!selectedCaseId) { setError('Select a case first.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await aiApi.getSummary(selectedCaseId)
      const parsed = parseAiJson<CaseSummaryResponse>(res.summary ?? res.result ?? "")
      setSummary(parsed)
      setRawText(parsed ? "" : res.summary ?? res.result ?? "")
    } catch (err: any) {
      setError(err.message || 'Failed to generate strategy')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>

      {/* HEADER */}

      <div
        style={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          marginBottom:24,
        }}
      >
        <div>
          <h2
            style={{
              margin:0,
              fontSize:28,
              fontWeight:700,
            }}
          >
            AI Strategy Assistant
          </h2>

          <p
            style={{
              marginTop:8,
              color:'#64748b',
            }}
          >
            AI-generated litigation strategy based on
            pleadings, evidence and previous judgments.
          </p>
        </div>

        <button onClick={generateStrategy} disabled={loading} style={{ ...primaryButton, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Generating...' : 'Generate Strategy'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* SEARCH */}

      <div style={card}>
        <h3 style={heading}>
          Case Details
        </h3>

        <textarea
          rows={6}
          placeholder="Describe your case..."
          style={{
            ...inputStyle,
            height:'auto',
            resize:'vertical',
            paddingTop:12,
          }}
        />

        <div
          style={{
            display:'grid',
            gridTemplateColumns:'1fr 1fr 1fr',
            gap:16,
            marginTop:18,
          }}
        >
          <select style={inputStyle}>
            <option>Family Court</option>
            <option>High Court</option>
          </select>

          <select style={inputStyle}>
            <option>Maintenance</option>
            <option>Custody</option>
            <option>Divorce</option>
          </select>

          <button onClick={generateStrategy} disabled={loading} style={{ ...primaryButton, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* DASHBOARD */}

      <div
        style={{
          display:'grid',
          gridTemplateColumns:'repeat(4,1fr)',
          gap:18,
          marginTop:24,
          marginBottom:30,
        }}
      >
        {stats.map((item)=>(
          <div
            key={item.title}
            style={{
              background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius:16,
              padding:20,
            }}
          >
            <div
              style={{
                display:'flex',
                justifyContent:'space-between',
              }}
            >
              <span
                style={{
                  color:'#64748b',
                  fontSize:13,
                }}
              >
                {item.title}
              </span>

              <i
                className={`ti ${item.icon}`}
                style={{
                  color:item.color,
                  fontSize:22,
                }}
              />
            </div>

            <div
              style={{
                marginTop:18,
                fontSize:30,
                fontWeight:700,
                color:item.color,
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* SWOT */}

      <div
        style={{
          display:'grid',
          gridTemplateColumns:'1fr 1fr',
          gap:24,
          marginBottom:30,
        }}
      >
        <div style={card}>
          <h3 style={heading}>
            Strengths
          </h3>

          {!summary && <div style={{ color: '#94a3b8', fontSize: 13 }}>Generate a strategy to see case strengths.</div>}
          {summary?.keyStrengths?.map((s, i) => <StrategyItem key={i} text={s} />)}
        </div>

        <div style={card}>
          <h3 style={heading}>
            Weaknesses
          </h3>

          {!summary && <div style={{ color: '#94a3b8', fontSize: 13 }}>Generate a strategy to see case weaknesses.</div>}
          {summary?.keyWeaknesses?.map((s, i) => <StrategyItem key={i} text={s} />)}
        </div>
      </div>

      {/* RISK */}

      <div
        style={{
          display:'grid',
          gridTemplateColumns:'1fr 1fr',
          gap:24,
          marginBottom:30,
        }}
      >
        <div style={card}>
          <h3 style={heading}>
            Risk Assessment
          </h3>

          <RiskCard
            title="Evidence Risk"
            value="Low"
            color="#16a34a"
          />

          <RiskCard
            title="Delay Risk"
            value="Medium"
            color="#ea580c"
          />

          <RiskCard
            title="Opponent Evidence"
            value="High"
            color="#dc2626"
          />

          <RiskCard
            title="Settlement Chance"
            value="Good"
            color="#2563eb"
          />
        </div>

        <div style={card}>
          <h3 style={heading}>
            AI Recommendations
          </h3>

          {!summary && !rawText && <div style={{ color: '#94a3b8', fontSize: 13, padding: '12px 0' }}>Click Generate Strategy to see AI recommendations.</div>}
          {!summary && rawText && <div style={{ color: '#334155', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{rawText}</div>}
          {summary?.nextSteps?.map((s, i) => <StrategyItem key={i} text={s} />)}
        </div>
      </div>
            {/* ================= OPPONENT STRATEGY ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        <div style={card}>
          <h3 style={heading}>
            Opponent Strategy Prediction
          </h3>

          <StrategyItem text="Likely to dispute actual income." />
          <StrategyItem text="May seek repeated adjournments." />
          <StrategyItem text="Possible challenge to documentary evidence." />
          <StrategyItem text="High probability of settlement negotiation." />
          <StrategyItem text="May rely on previous maintenance orders." />
        </div>

        <div style={card}>
          <h3 style={heading}>
            Hearing Preparation
          </h3>

          <StrategyItem text="Carry original evidence." />
          <StrategyItem text="Prepare concise opening submissions." />
          <StrategyItem text="Keep latest Supreme Court judgments ready." />
          <StrategyItem text="Prepare maintenance calculations." />
          <StrategyItem text="Organize witness sequence." />
        </div>
      </div>

      {/* ================= ACTION PLAN ================= */}

      <div style={card}>
        <h3 style={heading}>
          AI Action Plan
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 18,
          }}
        >
          <ActionCard
            step="1"
            title="Evidence"
            desc="Collect remaining documents."
          />

          <ActionCard
            step="2"
            title="Research"
            desc="Review latest judgments."
          />

          <ActionCard
            step="3"
            title="Draft"
            desc="Update petition."
          />

          <ActionCard
            step="4"
            title="Arguments"
            desc="Prepare oral submissions."
          />

          <ActionCard
            step="5"
            title="Hearing"
            desc="Final preparation."
          />
        </div>
      </div>

      {/* ================= SETTLEMENT ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginTop: 30,
          marginBottom: 30,
        }}
      >
        <div style={card}>
          <h3 style={heading}>
            Settlement Analysis
          </h3>

          <RiskCard
            title="Settlement Probability"
            value="78%"
            color="#16a34a"
          />

          <RiskCard
            title="Recommended Amount"
            value="₹38,000"
            color="#2563eb"
          />

          <RiskCard
            title="Negotiation Scope"
            value="Medium"
            color="#ea580c"
          />

          <RiskCard
            title="AI Confidence"
            value="95%"
            color="#7c3aed"
          />
        </div>

        <div style={card}>
          <h3 style={heading}>
            Final AI Advice
          </h3>

          <StrategyItem text="Lead with documentary evidence." />
          <StrategyItem text="Avoid unnecessary arguments." />
          <StrategyItem text="Focus on financial disclosures." />
          <StrategyItem text="Support every contention with precedent." />
          <StrategyItem text="Keep settlement option open." />
        </div>
      </div>

      {/* ================= FOOTER ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          paddingTop: 24,
        }}
      >
        <button style={secondaryButton}>
          Save Strategy
        </button>

        <div
          style={{
            display: 'flex',
            gap: 14,
          }}
        >
          <button style={secondaryButton}>
            Export PDF
          </button>

          <button onClick={generateStrategy} disabled={loading} style={{ ...primaryButton, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Generating...' : 'Generate Complete Strategy'}
          </button>
        </div>
      </div>

    </div>
  )
}

/* ================= COMPONENTS ================= */

function StrategyItem({
  text,
}:{
  text:string
}) {
  return (
    <div
      style={{
        padding:'12px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      ✓ {text}
    </div>
  )
}

function RiskCard({
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
        display:'flex',
        justifyContent:'space-between',
        padding:'14px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <span>{title}</span>

      <strong
        style={{
          color,
        }}
      >
        {value}
      </strong>
    </div>
  )
}

function ActionCard({
  step,
  title,
  desc,
}:{
  step:string
  title:string
  desc:string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius:14,
        padding:18,
        textAlign:'center',
      }}
    >
      <div
        style={{
          width:40,
          height:40,
          borderRadius:'50%',
          background: '#3b82f6',
          color:'#fff',
          display:'flex',
          justifyContent:'center',
          alignItems:'center',
          margin:'0 auto 14px',
          fontWeight:700,
        }}
      >
        {step}
      </div>

      <h4
        style={{
          margin:'0 0 10px',
        }}
      >
        {title}
      </h4>

      <div
        style={{
          fontSize:13,
          color:'#64748b',
          lineHeight:1.6,
        }}
      >
        {desc}
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const card:React.CSSProperties={
  background: 'rgba(255,255,255,0.4)',
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius:16,
  padding:24,
}

const heading:React.CSSProperties={
  marginTop:0,
  marginBottom:18,
}

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

const secondaryButton:React.CSSProperties={
  border: '1px solid rgba(0,0,0,0.05)',
  background: 'rgba(255,255,255,0.4)',
  color:'#334155',
  borderRadius:10,
  padding:'10px 18px',
  cursor:'pointer',
  fontWeight:600,
}