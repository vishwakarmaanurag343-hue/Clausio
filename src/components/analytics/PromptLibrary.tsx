'use client'

import React from 'react'

const stats = [
  {
    title: 'Total Prompts',
    value: '486',
    icon: 'ti-message-chatbot',
    color: '#3b82f6',
  },
  {
    title: 'My Prompts',
    value: '64',
    icon: 'ti-folder',
    color: '#16a34a',
  },
  {
    title: 'Shared',
    value: '92',
    icon: 'ti-users',
    color: '#f59e0b',
  },
  {
    title: 'AI Success',
    value: '97%',
    icon: 'ti-brain',
    color: '#7c3aed',
  },
]

const categories = [
  {
    title: 'Drafting',
    subtitle: 'Petitions & Applications',
    icon: 'ti-file-pencil',
    color: '#3b82f6',
  },
  {
    title: 'Legal Research',
    subtitle: 'Judgments & Acts',
    icon: 'ti-scale',
    color: '#16a34a',
  },
  {
    title: 'Cross Examination',
    subtitle: 'Question Generator',
    icon: 'ti-gavel',
    color: '#dc2626',
  },
  {
    title: 'Strategy',
    subtitle: 'Case Planning',
    icon: 'ti-target-arrow',
    color: '#7c3aed',
  },
  {
    title: 'Judge Insights',
    subtitle: 'Judge Behaviour',
    icon: 'ti-user-star',
    color: '#ea580c',
  },
  {
    title: 'Evidence Analysis',
    subtitle: 'Evidence AI',
    icon: 'ti-file-search',
    color: '#0891b2',
  },
]

export default function PromptLibrary() {
  return (
    <div>

      {/* ================= HEADER ================= */}

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
              letterSpacing: '-0.3px', color:'#0f172a',
            }}
          >
            AI Prompt Library
          </h2>

          <p
            style={{
              marginTop:8,
              color:'#64748b',
              lineHeight:1.7,
            }}
          >
            Create, organize and reuse powerful AI prompts for drafting,
            research, litigation and courtroom preparation.
          </p>
        </div>

        <button
          style={{
            border:'none',
            background: '#3b82f6',
            color:'#fff',
            borderRadius:10,
            padding:'12px 20px',
            cursor:'pointer',
            fontWeight:600,
          }}
        >
          <i
            className="ti ti-plus"
            style={{marginRight:8}}
          />
          New Prompt
        </button>
      </div>

      {/* ================= SEARCH ================= */}

      <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderRadius:16,
          padding:24,
          marginBottom:28,
        }}
      >
        <h3
          style={{
            marginTop:0,
            marginBottom:18,
          }}
        >
          Search Prompt Library
        </h3>

        <div
          style={{
            display:'grid',
            gridTemplateColumns:'2fr 1fr 1fr auto',
            gap:16,
          }}
        >
          <input
            placeholder="Search prompts..."
            style={inputStyle}
          />

          <select style={inputStyle}>
            <option>All Categories</option>
            <option>Drafting</option>
            <option>Research</option>
            <option>Cross Examination</option>
            <option>Strategy</option>
          </select>

          <select style={inputStyle}>
            <option>All Types</option>
            <option>Public</option>
            <option>Private</option>
            <option>Team</option>
          </select>

          <button
            style={{
              border:'none',
              background: '#3b82f6',
              color:'#fff',
              borderRadius:10,
              padding:'0 24px',
              cursor:'pointer',
              fontWeight:600,
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* ================= DASHBOARD ================= */}

      <div
        style={{
          display:'grid',
          gridTemplateColumns:'repeat(4,1fr)',
          gap:18,
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
                color:'#0f172a',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ================= CATEGORIES ================= */}

      <div
        style={{
          marginBottom:30,
        }}
      >
        <h3
          style={{
            marginBottom:20,
          }}
        >
          Prompt Categories
        </h3>

        <div
          style={{
            display:'grid',
            gridTemplateColumns:'repeat(3,1fr)',
            gap:18,
          }}
        >
          {categories.map((item)=>(
            <CategoryCard
              key={item.title}
              {...item}
            />
          ))}
        </div>
      </div>
            {/* ================= FEATURED PROMPTS ================= */}

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
            ⭐ Featured AI Prompts
          </h3>

          <button style={primaryButton}>
            View All
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: 20,
          }}
        >
          <PromptCard
            title="Interim Maintenance Petition"
            category="Drafting"
            uses="2.4K Uses"
            rating="4.9"
          />

          <PromptCard
            title="Cross Examination Generator"
            category="Courtroom"
            uses="1.8K Uses"
            rating="4.8"
          />

          <PromptCard
            title="Case Strategy Builder"
            category="Strategy"
            uses="1.5K Uses"
            rating="4.7"
          />

          <PromptCard
            title="Legal Research Assistant"
            category="Research"
            uses="3.1K Uses"
            rating="5.0"
          />
        </div>
      </div>

      {/* ================= MY PROMPTS ================= */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <h3
          style={{
            marginBottom: 18,
          }}
        >
          📚 My Prompt Collection
        </h3>

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
            [
              'Maintenance Calculator',
              'Drafting',
              'Yesterday',
            ],
            [
              'Judge Behaviour Analysis',
              'Judge Insights',
              '2 Days Ago',
            ],
            [
              'Cross Examination',
              'Litigation',
              'Last Week',
            ],
            [
              'Settlement Negotiation',
              'Strategy',
              'Last Week',
            ],
          ].map((row) => (
            <PromptRow
              key={row[0]}
              title={row[0]}
              category={row[1]}
              updated={row[2]}
            />
          ))}
        </div>
      </div>

      {/* ================= FAVORITES & MOST USED ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        {/* Favourite */}

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
            ❤️ Favourite Prompts
          </h3>

          {[
            'Maintenance Draft',
            'Custody Petition',
            'Evidence Summary',
            'Client Meeting Notes',
            'Income Analysis',
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              ⭐ {item}
            </div>
          ))}
        </div>

        {/* Most Used */}

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
            🔥 Most Used
          </h3>

          {[
            {
              title: 'Legal Research',
              count: '324 Uses',
            },
            {
              title: 'Draft Petition',
              count: '280 Uses',
            },
            {
              title: 'Cross Examination',
              count: '248 Uses',
            },
            {
              title: 'Case Summary',
              count: '216 Uses',
            },
            {
              title: 'Judge Analysis',
              count: '194 Uses',
            },
          ].map((item) => (
            <MostUsedCard
              key={item.title}
              title={item.title}
              count={item.count}
            />
          ))}
        </div>
      </div>
            {/* ================= AI PROMPT GENERATOR ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr .7fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        {/* Generator */}

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
            🤖 AI Prompt Generator
          </h3>

          <textarea
            rows={6}
            placeholder="Example: Create a prompt to draft an Interim Maintenance Petition considering income affidavit, Rajnesh v. Neha and financial disclosures..."
            style={{
              ...inputStyle,
              height: 'auto',
              resize: 'vertical',
              paddingTop: 14,
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 18,
            }}
          >
            <button style={primaryButton}>
              Generate Prompt
            </button>

            <button style={secondaryButton}>
              Improve Prompt
            </button>
          </div>

          <div
            style={{
              marginTop: 24,
              background: 'rgba(255,255,255,0.6)',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <strong>Generated Preview</strong>

            <p
              style={{
                marginTop: 12,
                color: '#475569',
                lineHeight: 1.8,
              }}
            >
              Generate a legally accurate Interim Maintenance Petition
              using the client's income affidavit, financial disclosures,
              supporting documents and latest Supreme Court precedents.
              Structure the petition according to Family Court practice
              and include persuasive legal reasoning.
            </p>
          </div>
        </div>

        {/* AI Stats */}

        <div
          style={{
            display: 'grid',
            gap: 18,
          }}
        >
          <GeneratorCard
            title="Generated Today"
            value="28"
            color="#2563eb"
          />

          <GeneratorCard
            title="Average Rating"
            value="4.9 ★"
            color="#16a34a"
          />

          <GeneratorCard
            title="AI Accuracy"
            value="97%"
            color="#7c3aed"
          />

          <GeneratorCard
            title="Templates"
            value="486"
            color="#ea580c"
          />
        </div>
      </div>

      {/* ================= TEAM LIBRARY ================= */}

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
            👥 Team Shared Prompts
          </h3>

          <button style={primaryButton}>
            Share Prompt
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          <TeamPromptCard
            title="Maintenance Master Prompt"
            author="Parth"
          />

          <TeamPromptCard
            title="Cross Examination AI"
            author="Rahul"
          />

          <TeamPromptCard
            title="Judge Insight Prompt"
            author="Admin"
          />
        </div>
      </div>

      {/* ================= VARIABLES ================= */}

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
            ⚙️ Prompt Variables
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 14,
            }}
          >
            <VariableCard variable="{{ClientName}}" />

            <VariableCard variable="{{CaseNumber}}" />

            <VariableCard variable="{{JudgeName}}" />

            <VariableCard variable="{{CourtName}}" />

            <VariableCard variable="{{Income}}" />

            <VariableCard variable="{{Opponent}}" />

            <VariableCard variable="{{Evidence}}" />
          </div>
        </div>

        {/* Recent */}

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
            🆕 Recently Added
          </h3>

          <RecentPromptCard
            title="AI Case Timeline"
            date="Today"
          />

          <RecentPromptCard
            title="Maintenance Calculator"
            date="Yesterday"
          />

          <RecentPromptCard
            title="Income Affidavit Review"
            date="2 Days Ago"
          />

          <RecentPromptCard
            title="Evidence Intelligence"
            date="Last Week"
          />

          <RecentPromptCard
            title="Client Meeting Summary"
            date="Last Week"
          />
        </div>
      </div>
            {/* ================= EXPORT & SHARE ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        {/* Export */}

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
            📤 Export Prompt Library
          </h3>

          <p
            style={{
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            Export your prompts, templates and AI prompt collections
            for backup or sharing with your team.
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
              Export JSON
            </button>
          </div>
        </div>

        {/* AI Suggestions */}

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
            🤖 AI Suggestions
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 14,
            }}
          >
            <RecommendationCard
              title="Suggested Prompt"
              value="Maintenance Draft Generator"
            />

            <RecommendationCard
              title="Trending"
              value="Cross Examination AI"
            />

            <RecommendationCard
              title="Improve Prompt"
              value="Judge Insight Prompt"
            />

            <RecommendationCard
              title="Recommended Category"
              value="Evidence Intelligence"
            />
          </div>
        </div>
      </div>

      {/* ================= AI SUMMARY ================= */}

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
          🧠 AI Prompt Summary
        </h3>

        <p
          style={{
            marginBottom: 0,
            lineHeight: 1.8,
            color: '#334155',
          }}
        >
          Your Prompt Library currently contains 486 prompts with an
          average AI success rate of 97%. The most frequently used
          prompts are related to drafting, legal research and
          cross-examination. AI recommends creating reusable prompt
          templates with dynamic variables to improve productivity.
        </p>
      </div>

    </div>
  )
}

/* ================= HELPER COMPONENTS ================= */

function CategoryCard({
  title,
  subtitle,
  icon,
  color,
}: {
  title: string
  subtitle: string
  icon: string
  color: string
}) {
  return (
    <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{
          fontSize: 30,
          color,
        }}
      />

      <h3
        style={{
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        {title}
      </h3>

      <div style={{ color: '#64748b' }}>
        {subtitle}
      </div>
    </div>
  )
}

function PromptCard({
  title,
  category,
  uses,
  rating,
}: {
  title: string
  category: string
  uses: string
  rating: string
}) {
  return (
    <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h3>{title}</h3>

      <div style={{ color: '#64748b' }}>
        {category}
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{uses}</span>
        <strong>{rating} ⭐</strong>
      </div>
    </div>
  )
}

function PromptRow({
  title,
  category,
  updated,
}: {
  title: string
  category: string
  updated: string
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr auto',
        padding: 18,
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <strong>{title}</strong>
      <span>{category}</span>
      <span>{updated}</span>

      <button
        style={{
          border: 'none',
          background: 'rgba(59, 130, 246, 0.05)',
          color: '#3b82f6',
          borderRadius: 8,
          padding: '6px 12px',
          cursor: 'pointer',
        }}
      >
        Open
      </button>
    </div>
  )
}

function MostUsedCard({
  title,
  count,
}: {
  title: string
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
      <span>{title}</span>
      <strong>{count}</strong>
    </div>
  )
}

function GeneratorCard({
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
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div
        style={{
          color: '#64748b',
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 12,
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

function TeamPromptCard({
  title,
  author,
}: {
  title: string
  author: string
}) {
  return (
    <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 14,
        padding: 20,
      }}
    >
      <h4>{title}</h4>
      <div style={{ color: '#64748b' }}>
        Shared by {author}
      </div>
    </div>
  )
}

function VariableCard({
  variable,
}: {
  variable: string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 10,
        padding: 14,
        fontFamily: 'monospace',
        fontWeight: 600,
      }}
    >
      {variable}
    </div>
  )
}

function RecentPromptCard({
  title,
  date,
}: {
  title: string
  date: string
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
      <span style={{ color: '#64748b' }}>
        {date}
      </span>
    </div>
  )
}

function RecommendationCard({
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

/* ================= STYLES ================= */

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: 10,
  padding: '0 14px',
  outline: 'none',
  fontSize: 14,
  boxSizing: 'border-box',
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

const secondaryButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.05)',
  background: 'rgba(255,255,255,0.4)',
  color: '#334155',
  borderRadius: 10,
  padding: '10px 18px',
  cursor: 'pointer',
  fontWeight: 600,
}