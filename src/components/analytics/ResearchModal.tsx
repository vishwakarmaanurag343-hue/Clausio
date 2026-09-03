'use client'

import React from 'react'

interface ResearchModalProps {
  open: boolean
  onClose: () => void
}

export default function ResearchModal({
  open,
  onClose,
}: ResearchModalProps) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 30,
      }}
    >
      <div
        style={{
          width: '1100px',
          maxWidth: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.4)',
          borderRadius: 18,
          boxShadow: '0 25px 60px rgba(0,0,0,.18)',
        }}
      >
        {/* HEADER */}

        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              🔍 AI Legal Research
            </h2>

            <p
              style={{
                marginTop: 8,
                color: '#64748b',
              }}
            >
              Search judgments, statutes and legal principles using AI.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: '#f1f5f9',
              width: 42,
              height: 42,
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY */}

        <div
          style={{
            padding: 28,
          }}
        >
          {/* SEARCH */}

          <div
            style={card}
          >
            <h3 style={heading}>
              AI Search
            </h3>

            <textarea
              rows={5}
              placeholder="Example: Latest Supreme Court judgments on Interim Maintenance after Rajnesh v. Neha."
              style={{
                ...inputStyle,
                height: 'auto',
                resize: 'vertical',
                paddingTop: 12,
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16,
                marginTop: 18,
              }}
            >
              <select style={inputStyle}>
                <option>All Courts</option>
                <option>Supreme Court</option>
                <option>High Court</option>
                <option>Family Court</option>
              </select>

              <select style={inputStyle}>
                <option>All Years</option>
                <option>2026</option>
                <option>2025</option>
                <option>2024</option>
              </select>

              <select style={inputStyle}>
                <option>All Categories</option>
                <option>Maintenance</option>
                <option>Custody</option>
                <option>Divorce</option>
                <option>Domestic Violence</option>
              </select>
            </div>
          </div>

          {/* RESULTS */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr .8fr',
              gap: 24,
              marginTop: 24,
            }}
          >
            <div style={card}>
              <h3 style={heading}>
                Research Results
              </h3>

              {[
                'Rajnesh v. Neha (2021)',
                'Shamima Farooqui v. Shahid Khan',
                'Danial Latifi v. Union of India',
                'Kalyan Dey Chowdhury',
                'Bhuwan Mohan Singh',
              ].map((item) => (
                <div
                  key={item}
                  style={row}
                >
                  <div>
                    <strong>{item}</strong>

                    <div
                      style={{
                        color: '#64748b',
                        marginTop: 5,
                      }}
                    >
                      AI Relevance 96%
                    </div>
                  </div>

                  <button style={secondaryButton}>
                    View
                  </button>
                </div>
              ))}
            </div>

            <div style={card}>
              <h3 style={heading}>
                AI Summary
              </h3>

              <p
                style={{
                  color: '#475569',
                  lineHeight: 1.8,
                }}
              >
                AI recommends relying upon
                <strong> Rajnesh v. Neha</strong>,
                <strong> Shamima Farooqui</strong>
                and
                <strong> Danial Latifi</strong>
                while drafting the maintenance petition.
              </p>

              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  marginTop: 20,
                }}
              >
                <StatCard
                  title="Confidence"
                  value="96%"
                />

                <StatCard
                  title="Judgments"
                  value="84"
                />

                <StatCard
                  title="Acts"
                  value="12"
                />

                <StatCard
                  title="Research Time"
                  value="5 sec"
                />
              </div>
            </div>
          </div>

          {/* NOTES */}

          <div
            style={{
              ...card,
              marginTop: 24,
            }}
          >
            <h3 style={heading}>
              Research Notes
            </h3>

            <textarea
              rows={8}
              placeholder="Write notes..."
              style={{
                ...inputStyle,
                height: 'auto',
                resize: 'vertical',
                paddingTop: 12,
              }}
            />
          </div>

          {/* FOOTER */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 28,
              borderTop: '1px solid rgba(0,0,0,0.05)',
              paddingTop: 22,
            }}
          >
            <button
              onClick={onClose}
              style={secondaryButton}
            >
              Cancel
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

              <button style={primaryButton}>
                Start AI Research
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- COMPONENTS ---------- */

function StatCard({
  title,
  value,
}:{
  title:string
  value:string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius:12,
        padding:16,
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
          marginTop:8,
          fontSize:24,
          fontWeight:700,
          color: '#3b82f6',
        }}
      >
        {value}
      </div>
    </div>
  )
}

/* ---------- STYLES ---------- */

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

const row:React.CSSProperties={
  display:'flex',
  justifyContent:'space-between',
  alignItems:'center',
  padding:'16px 0',
  borderBottom: '1px solid rgba(0,0,0,0.05)',
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