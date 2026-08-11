'use client'

import React from 'react'

const stats = [
  {
    title: 'Cases Analysed',
    value: '1,248',
    icon: 'ti-scale',
    color: '#3b82f6',
  },
  {
    title: 'Success Rate',
    value: '72%',
    icon: 'ti-chart-line',
    color: '#16a34a',
  },
  {
    title: 'Avg Disposal',
    value: '8 Months',
    icon: 'ti-clock',
    color: '#f59e0b',
  },
  {
    title: 'AI Confidence',
    value: '91%',
    icon: 'ti-brain',
    color: '#7c3aed',
  },
]

export default function JudgeInsights() {
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
            AI Judge Insights
          </h2>

          <p
            style={{
              marginTop: 8,
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            Analyse judicial trends, previous decisions and AI-generated
            courtroom strategies before every hearing.
          </p>
        </div>

        <button
          style={{
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            borderRadius: 10,
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <i
            className="ti ti-sparkles"
            style={{ marginRight: 8 }}
          />
          Analyze Judge
        </button>
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
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                {item.title}
              </span>

              <i
                className={`ti ${item.icon}`}
                style={{
                  fontSize: 22,
                  color: item.color,
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

      {/* ================= SEARCH ================= */}

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
            marginBottom: 18,
          }}
        >
          Search Judge
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr auto',
            gap: 16,
          }}
        >
          <input
            placeholder="Enter Judge Name..."
            style={inputStyle}
          />

          <select style={inputStyle}>
            <option>Family Court</option>
            <option>High Court</option>
            <option>District Court</option>
            <option>Supreme Court</option>
          </select>

          <select style={inputStyle}>
            <option>Mumbai</option>
            <option>Delhi</option>
            <option>Pune</option>
            <option>Bangalore</option>
          </select>

          <button
            style={{
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: 10,
              padding: '0 24px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* ================= JUDGE PROFILE ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
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
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.05)',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <i
              className="ti ti-scale"
              style={{
                fontSize: 48,
                color: '#3b82f6',
              }}
            />
          </div>

          <h2
            style={{
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            Justice A. Sharma
          </h2>

          <div
            style={{
              color: '#64748b',
              marginBottom: 20,
            }}
          >
            Principal Judge • Family Court
          </div>

          <div
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            <ProfileItem
              title="Experience"
              value="18 Years"
            />

            <ProfileItem
              title="Court"
              value="Mumbai Family Court"
            />

            <ProfileItem
              title="Specialization"
              value="Family Matters"
            />

            <ProfileItem
              title="Disposal Rate"
              value="High"
            />
          </div>
        </div>

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
              marginBottom: 20,
            }}
          >
            Judge Overview
          </h3>

          <p
            style={{
              lineHeight: 1.9,
              color: '#475569',
            }}
          >
            AI analysis indicates that this judge prefers
            documentary evidence over oral submissions,
            appreciates concise arguments and frequently
            encourages mediation before proceeding with
            lengthy evidence. Orders generally rely on
            Supreme Court precedents and financial
            disclosures.
          </p>

          <div
            style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 16,
            }}
          >
            <OverviewCard
              title="Interim Orders"
              value="64%"
            />

            <OverviewCard
              title="Settlement Encouraged"
              value="82%"
            />

            <OverviewCard
              title="Detailed Judgments"
              value="91%"
            />
          </div>
        </div>
      </div>
            {/* ================= DECISION TRENDS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr .8fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        {/* Decision Trends */}

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <h3
              style={{
                margin: 0,
              }}
            >
              Decision Trends
            </h3>
          </div>

          {[
            {
              title: 'Interim Maintenance',
              percentage: '68%',
              color: '#3b82f6',
            },
            {
              title: 'Child Custody',
              percentage: '74%',
              color: '#16a34a',
            },
            {
              title: 'Domestic Violence',
              percentage: '59%',
              color: '#f59e0b',
            },
            {
              title: 'Restitution of Conjugal Rights',
              percentage: '42%',
              color: '#dc2626',
            },
          ].map((item) => (
            <TrendCard
              key={item.title}
              title={item.title}
              percentage={item.percentage}
              color={item.color}
            />
          ))}
        </div>

        {/* AI Score */}

        <div
          style={{
            display: 'grid',
            gap: 20,
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
              AI Behaviour Score
            </h3>

            <div
              style={{
                width: 170,
                height: 170,
                borderRadius: '50%',
                border: '12px solid #2563eb',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                }}
              >
                91%
              </div>

              <div
                style={{
                  color: '#64748b',
                }}
              >
                AI Confidence
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                display: 'grid',
                gap: 12,
              }}
            >
              <ScoreRow
                title="Evidence Preference"
                value="95%"
              />

              <ScoreRow
                title="Settlement Friendly"
                value="82%"
              />

              <ScoreRow
                title="Strict Procedure"
                value="77%"
              />

              <ScoreRow
                title="Detailed Orders"
                value="89%"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= COURT PREFERENCES ================= */}

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
            Court Preferences
          </h3>

          <PreferenceItem
            title="Documentary Evidence"
            value="Highly Preferred"
          />

          <PreferenceItem
            title="Length of Arguments"
            value="Short & Precise"
          />

          <PreferenceItem
            title="Mediation"
            value="Strongly Encouraged"
          />

          <PreferenceItem
            title="Case Law Citation"
            value="Frequently Expected"
          />

          <PreferenceItem
            title="Affidavit Quality"
            value="Very Important"
          />

          <PreferenceItem
            title="Financial Disclosure"
            value="Mandatory"
          />
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
            AI Behaviour Analysis
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 16,
            }}
          >
            <BehaviourCard
              title="Decision Style"
              value="Evidence Driven"
            />

            <BehaviourCard
              title="Courtroom Approach"
              value="Balanced"
            />

            <BehaviourCard
              title="Questioning Style"
              value="Direct"
            />

            <BehaviourCard
              title="Settlement Chance"
              value="High"
            />

            <BehaviourCard
              title="Risk Level"
              value="Medium"
            />

            <BehaviourCard
              title="AI Advice"
              value="Focus on documents before oral submissions."
            />
          </div>
        </div>
      </div>
            {/* ================= SIMILAR CASES ================= */}

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
            Similar Cases Decided
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
            View All Cases
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
          {[
            {
              caseNo: 'FC/214/2024',
              subject: 'Interim Maintenance',
              outcome: 'Allowed',
              similarity: '94%',
            },
            {
              caseNo: 'FC/771/2023',
              subject: 'Child Custody',
              outcome: 'Partly Allowed',
              similarity: '90%',
            },
            {
              caseNo: 'FC/120/2022',
              subject: 'Domestic Violence',
              outcome: 'Dismissed',
              similarity: '87%',
            },
            {
              caseNo: 'FC/551/2021',
              subject: 'Restitution of Conjugal Rights',
              outcome: 'Allowed',
              similarity: '82%',
            },
          ].map((item) => (
            <CaseRow
              key={item.caseNo}
              {...item}
            />
          ))}
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
            Landmark Judgments Referenced
          </h3>

          {[
            'Rajnesh v. Neha',
            'Shamima Farooqui v. Shahid Khan',
            'Kalyan Dey Chowdhury v. Rita Dey',
            'Vimlaben Ajitbhai Patel v. Vatslaben',
            'Danial Latifi v. Union of India',
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
            Frequently Cited Acts
          </h3>

          {[
            {
              act: 'Hindu Marriage Act',
              count: '41',
            },
            {
              act: 'CrPC Section 125',
              count: '36',
            },
            {
              act: 'Domestic Violence Act',
              count: '29',
            },
            {
              act: 'Evidence Act',
              count: '24',
            },
            {
              act: 'Family Courts Act',
              count: '18',
            },
          ].map((item) => (
            <ActRow
              key={item.act}
              act={item.act}
              count={item.count}
            />
          ))}
        </div>
      </div>

      {/* ================= HEARING ANALYTICS ================= */}

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
          Hearing Analytics
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 18,
          }}
        >
          <AnalyticsCard
            title="Average Hearing"
            value="18 min"
            color="#2563eb"
          />

          <AnalyticsCard
            title="Adjournment Rate"
            value="22%"
            color="#f59e0b"
          />

          <AnalyticsCard
            title="Settlement Cases"
            value="46%"
            color="#16a34a"
          />

          <AnalyticsCard
            title="Reserved Orders"
            value="11%"
            color="#7c3aed"
          />
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 18,
            borderRadius: 12,
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
          }}
        >
          <strong
            style={{
              color: '#1d4ed8',
            }}
          >
            AI Observation
          </strong>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              lineHeight: 1.8,
              color: '#334155',
            }}
          >
            This judge generally concludes procedural hearings quickly and
            reserves detailed discussion for evidence and final arguments.
            Well-organized documents and concise submissions tend to be more
            effective in this courtroom.
          </p>
        </div>
      </div>
            {/* ================= AI STRATEGY ================= */}

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
            AI Court Strategy
          </h3>

          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              lineHeight: 2,
              color: '#334155',
            }}
          >
            <li>Lead with documentary evidence.</li>
            <li>Keep oral arguments concise.</li>
            <li>Cite recent Supreme Court precedents.</li>
            <li>Present financial disclosures clearly.</li>
            <li>Offer settlement where appropriate.</li>
            <li>Avoid repetitive submissions.</li>
          </ul>
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
            AI Recommendations
          </h3>

          {[
            'Carry original documentary evidence.',
            'Prepare a one-page chronology.',
            'Keep judgments bookmarked.',
            'Be ready with maintenance calculations.',
            'Expect questions on financial disclosure.',
            'Prepare settlement alternatives.',
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

      {/* ================= SUMMARY ================= */}

      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          borderRadius: 16,
          padding: 22,
          marginBottom: 30,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: '#1d4ed8',
          }}
        >
          AI Summary
        </h3>

        <p
          style={{
            marginBottom: 0,
            lineHeight: 1.8,
            color: '#334155',
          }}
        >
          Based on previous decisions, this judge generally gives greater
          weight to documentary evidence than oral submissions. Concise
          arguments supported by precedents and complete financial disclosure
          are more likely to receive favourable consideration.
        </p>
      </div>

      {/* ================= ACTIONS ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius: 16,
          padding: 22,
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>
            Export Judge Report
          </h3>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
            }}
          >
            Save this AI analysis for future hearings.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <button style={primaryButton}>
            Export PDF
          </button>

          <button style={primaryButton}>
            Export Word
          </button>

          <button style={primaryButton}>
            Save Report
          </button>

          <button style={primaryButton}>
            Hearing Brief
          </button>
        </div>
      </div>

    </div>
  )
}

/* ================= HELPER COMPONENTS ================= */

function ProfileItem({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

function OverviewCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 12,
        padding: 18,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 13,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 18,
          fontWeight: 700,
          color: '#3b82f6',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function TrendCard({
  title,
  percentage,
  color,
}: {
  title: string
  percentage: string
  color: string
}) {
  return (
    <div
      style={{
        padding: 20,
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <strong>{title}</strong>

        <span
          style={{
            color,
            fontWeight: 700,
          }}
        >
          {percentage}
        </span>
      </div>

      <div
        style={{
          height: 8,
          background: '#e2e8f0',
          borderRadius: 999,
        }}
      >
        <div
          style={{
            width: percentage,
            height: '100%',
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  )
}

function ScoreRow({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PreferenceItem({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

function BehaviourCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        paddingBottom: 12,
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 13,
        }}
      >
        {title}
      </div>

      <strong>{value}</strong>
    </div>
  )
}

function CaseRow({
  caseNo,
  subject,
  outcome,
  similarity,
}: {
  caseNo: string
  subject: string
  outcome: string
  similarity: string
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.5fr 1fr .8fr',
        padding: 18,
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <strong>{caseNo}</strong>
      <span>{subject}</span>
      <span>{outcome}</span>
      <strong>{similarity}</strong>
    </div>
  )
}

function ActRow({
  act,
  count,
}: {
  act: string
  count: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <span>{act}</span>
      <strong>{count}</strong>
    </div>
  )
}

function AnalyticsCard({
  title,
  value,
  color,
}: {
  title: string
  value: string
  color: string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 12,
        padding: 18,
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 13,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 18,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: 10,
  padding: '0 14px',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const primaryButton: React.CSSProperties = {
  border: 'none',
  background: '#3b82f6',
  color: '#fff',
  borderRadius: 10,
  padding: '10px 18px',
  cursor: 'pointer',
  fontWeight: 600,
}