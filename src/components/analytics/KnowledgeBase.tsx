'use client'

import React from 'react'

const stats = [
  {
    title: 'Documents',
    value: '8,426',
    icon: 'ti-files',
    color: '#3b82f6',
  },
  {
    title: 'Case Laws',
    value: '2,184',
    icon: 'ti-scale',
    color: '#16a34a',
  },
  {
    title: 'Bare Acts',
    value: '356',
    icon: 'ti-book',
    color: '#f59e0b',
  },
  {
    title: 'AI Indexed',
    value: '99%',
    icon: 'ti-brain',
    color: '#7c3aed',
  },
]

const categories = [
  {
    icon: 'ti-scale',
    title: 'Family Law',
    docs: '1,246 Documents',
    color: '#3b82f6',
  },
  {
    icon: 'ti-building-bank',
    title: 'Civil Law',
    docs: '982 Documents',
    color: '#16a34a',
  },
  {
    icon: 'ti-gavel',
    title: 'Criminal Law',
    docs: '764 Documents',
    color: '#dc2626',
  },
  {
    icon: 'ti-file-certificate',
    title: 'Corporate Law',
    docs: '521 Documents',
    color: '#7c3aed',
  },
  {
    icon: 'ti-home',
    title: 'Property Law',
    docs: '438 Documents',
    color: '#ea580c',
  },
  {
    icon: 'ti-heart-handshake',
    title: 'Labour Law',
    docs: '392 Documents',
    color: '#0891b2',
  },
]

export default function KnowledgeBase() {
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
            AI Knowledge Base
          </h2>

          <p
            style={{
              marginTop: 8,
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            Search judgments, bare acts, legal templates, research papers
            and your firm's documents using AI.
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
            className="ti ti-upload"
            style={{ marginRight: 8 }}
          />
          Upload Document
        </button>
      </div>

      {/* ================= SEARCH ================= */}

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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr auto',
            gap: 16,
          }}
        >
          <input
            placeholder="Search judgments, sections, acts, templates..."
            style={inputStyle}
          />

          <select style={inputStyle}>
            <option>All Categories</option>
            <option>Case Laws</option>
            <option>Bare Acts</option>
            <option>Templates</option>
            <option>My Documents</option>
          </select>

          <select style={inputStyle}>
            <option>All Courts</option>
            <option>Supreme Court</option>
            <option>High Court</option>
            <option>Family Court</option>
            <option>District Court</option>
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

      {/* ================= STATS ================= */}

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

      {/* ================= CATEGORIES ================= */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <h3
          style={{
            marginBottom: 20,
          }}
        >
          Legal Categories
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              {...category}
            />
          ))}
        </div>
      </div>
            {/* ================= LEGAL LIBRARY ================= */}

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
            Legal Library
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
            View Library
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
              title: 'Family Court Judgments 2025',
              category: 'Judgment',
              size: '12.4 MB',
            },
            {
              title: 'Supreme Court Landmark Cases',
              category: 'Case Law',
              size: '18.7 MB',
            },
            {
              title: 'Maintenance Calculation Guide',
              category: 'Reference',
              size: '2.6 MB',
            },
            {
              title: 'Divorce Petition Draft',
              category: 'Template',
              size: '850 KB',
            },
          ].map((doc) => (
            <LibraryRow
              key={doc.title}
              {...doc}
            />
          ))}
        </div>
      </div>

      {/* ================= BARE ACTS ================= */}

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
            Frequently Used Bare Acts
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
            Popular Case Laws
          </h3>

          {[
            'Rajnesh v. Neha',
            'Shamima Farooqui v. Shahid Khan',
            'Danial Latifi v. Union of India',
            'Vimlaben Ajitbhai Patel Case',
            'Kalyan Dey Chowdhury Case',
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

      {/* ================= BOOKMARKS ================= */}

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
            Bookmarked Resources
          </h3>

          <button
            style={{
              border: '1px solid rgba(0,0,0,0.05)',
              background: 'rgba(255,255,255,0.4)',
              borderRadius: 10,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            Manage
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 18,
          }}
        >
          <BookmarkCard
            title="Maintenance Formula"
            type="Guide"
          />

          <BookmarkCard
            title="Family Court Rules"
            type="Bare Act"
          />

          <BookmarkCard
            title="Custody Judgment"
            type="Case Law"
          />
        </div>
      </div>
            {/* ================= MY DOCUMENTS ================= */}

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
            My Documents
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
          <RecentDocumentCard
            title="Maintenance Petition Draft"
            category="Draft"
            updated="2 Hours Ago"
          />

          <RecentDocumentCard
            title="Income Affidavit"
            category="Evidence"
            updated="Yesterday"
          />

          <RecentDocumentCard
            title="Client WhatsApp Export"
            category="Communication"
            updated="3 Days Ago"
          />
        </div>
      </div>

      {/* ================= RECENT UPLOADS ================= */}

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
          Recent Uploads
        </h3>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr>
              <th style={tableHeader}>Document</th>
              <th style={tableHeader}>Category</th>
              <th style={tableHeader}>Uploaded By</th>
              <th style={tableHeader}>Date</th>
              <th style={tableHeader}>Status</th>
            </tr>
          </thead>

          <tbody>
            {[
              [
                'Affidavit.pdf',
                'Evidence',
                'Parth',
                'Today',
                'Indexed',
              ],
              [
                'Maintenance.xlsx',
                'Finance',
                'Parth',
                'Yesterday',
                'Indexed',
              ],
              [
                'Chats.zip',
                'Communication',
                'Parth',
                '2 Days Ago',
                'Processing',
              ],
              [
                'Judgment.pdf',
                'Case Law',
                'Parth',
                '4 Days Ago',
                'Indexed',
              ],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td
                    key={cell}
                    style={tableCell}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= AI INSIGHTS ================= */}

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
            AI Insights
          </h3>

          <AIInsightCard
            title="Most Referenced Law"
            value="Hindu Marriage Act"
          />

          <AIInsightCard
            title="Most Used Template"
            value="Interim Maintenance"
          />

          <AIInsightCard
            title="Frequently Accessed Case"
            value="Rajnesh v. Neha"
          />

          <AIInsightCard
            title="Suggested Reading"
            value="Latest Bombay HC Judgment"
          />
        </div>

        {/* ================= UPLOAD ================= */}

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
            Upload Knowledge
          </h3>

          <UploadCard />

          <div
            style={{
              marginTop: 20,
              display: 'grid',
              gap: 12,
            }}
          >
            <button style={secondaryButton}>
              Upload PDF
            </button>

            <button style={secondaryButton}>
              Upload Judgment
            </button>

            <button style={secondaryButton}>
              Upload Bare Act
            </button>

            <button style={secondaryButton}>
              Upload Draft Template
            </button>
          </div>
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
            Export Knowledge Base
          </h3>

          <p
            style={{
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            Export documents, AI insights and legal research into
            professionally formatted reports.
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
              Export Excel
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
              marginBottom: 18,
            }}
          >
            Share Knowledge
          </h3>

          <p
            style={{
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            Share folders, research and templates securely with
            your team.
          </p>

          <div
            style={{
              display: 'grid',
              gap: 12,
              marginTop: 20,
            }}
          >
            <button style={primaryButton}>
              Share Folder
            </button>

            <button style={primaryButton}>
              Generate Link
            </button>

            <button style={primaryButton}>
              Manage Access
            </button>
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
          AI Knowledge Summary
        </h3>

        <p
          style={{
            marginBottom: 0,
            lineHeight: 1.8,
            color: '#334155',
          }}
        >
          Your knowledge base currently contains more than 8,000
          indexed legal resources. AI recommends reviewing recent
          Supreme Court judgments on maintenance, custody and
          domestic violence, as these align closely with your
          current active matters.
        </p>
      </div>

    </div>
  )
}

/* ================= HELPER COMPONENTS ================= */

function CategoryCard({
  icon,
  title,
  docs,
  color,
}: {
  icon: string
  title: string
  docs: string
  color: string
}) {
  return (
    <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 16,
        padding: 22,
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
        {docs}
      </div>
    </div>
  )
}

function LibraryRow({
  title,
  category,
  size,
}: {
  title: string
  category: string
  size: string
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr .8fr auto',
        padding: 18,
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        alignItems: 'center',
      }}
    >
      <strong>{title}</strong>
      <span>{category}</span>
      <span>{size}</span>

      <button
        style={{
          border: 'none',
          background: 'rgba(59, 130, 246, 0.05)',
          color: '#3b82f6',
          padding: '6px 12px',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Open
      </button>
    </div>
  )
}

function BookmarkCard({
  title,
  type,
}: {
  title: string
  type: string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 14,
        padding: 20,
      }}
    >
      <h4 style={{ marginTop: 0 }}>
        {title}
      </h4>

      <div style={{ color: '#64748b' }}>
        {type}
      </div>
    </div>
  )
}

function RecentDocumentCard({
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
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 14,
        padding: 20,
      }}
    >
      <h4 style={{ marginTop: 0 }}>
        {title}
      </h4>

      <div style={{ color: '#64748b' }}>
        {category}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 13,
          color: '#94a3b8',
        }}
      >
        {updated}
      </div>
    </div>
  )
}

function AIInsightCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        padding: '12px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
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

function UploadCard() {
  return (
    <div
      style={{
        border: '2px dashed #cbd5e1',
        borderRadius: 12,
        padding: 36,
        textAlign: 'center',
        background: 'rgba(255,255,255,0.6)',
      }}
    >
      <i
        className="ti ti-cloud-upload"
        style={{
          fontSize: 42,
          color: '#3b82f6',
        }}
      />

      <div
        style={{
          marginTop: 12,
          fontWeight: 600,
        }}
      >
        Drag & Drop Documents
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
  outline: 'none',
  fontSize: 14,
  boxSizing: 'border-box',
}

const tableHeader: React.CSSProperties = {
  textAlign: 'left',
  padding: 14,
  background: 'rgba(255,255,255,0.6)',
  borderBottom: '1px solid rgba(0,0,0,0.05)',
  color: '#475569',
}

const tableCell: React.CSSProperties = {
  padding: 14,
  borderBottom: '1px solid rgba(0,0,0,0.05)',
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
  borderRadius: 10,
  padding: '10px 18px',
  cursor: 'pointer',
  fontWeight: 600,
}