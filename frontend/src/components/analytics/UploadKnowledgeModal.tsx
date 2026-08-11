'use client'

import React from 'react'

interface UploadKnowledgeModalProps {
  open: boolean
  onClose: () => void
}

export default function UploadKnowledgeModal({
  open,
  onClose,
}: UploadKnowledgeModalProps) {
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
              📚 Upload Knowledge
            </h2>

            <p
              style={{
                marginTop: 8,
                color: '#64748b',
              }}
            >
              Upload documents for AI indexing and legal knowledge extraction.
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
          {/* DRAG & DROP */}

          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: 18,
              padding: 50,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.6)',
              marginBottom: 30,
            }}
          >
            <i
              className="ti ti-cloud-upload"
              style={{
                fontSize: 60,
                color: '#3b82f6',
              }}
            />

            <h2
              style={{
                marginTop: 20,
              }}
            >
              Drag & Drop Files
            </h2>

            <p
              style={{
                color: '#64748b',
                lineHeight: 1.7,
              }}
            >
              Upload PDF, DOCX, Images, Excel,
              Audio or ZIP files.
            </p>

            <button style={primaryButton}>
              Browse Files
            </button>
          </div>

          {/* DOCUMENT DETAILS */}

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
                Document Details
              </h3>

              <Field label="Document Name">
                <input
                  placeholder="Maintenance Judgment"
                  style={inputStyle}
                />
              </Field>

              <Field label="Category">
                <select style={inputStyle}>
                  <option>Judgment</option>
                  <option>Bare Act</option>
                  <option>Evidence</option>
                  <option>Pleading</option>
                  <option>Contract</option>
                </select>
              </Field>

              <Field label="Court">
                <select style={inputStyle}>
                  <option>Supreme Court</option>
                  <option>High Court</option>
                  <option>Family Court</option>
                  <option>District Court</option>
                </select>
              </Field>

              <Field label="Year">
                <input
                  type="number"
                  placeholder="2026"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div style={card}>
              <h3 style={heading}>
                AI Processing
              </h3>

              <ToggleRow
                title="OCR Extraction"
                description="Extract text from scanned files."
              />

              <ToggleRow
                title="Citation Detection"
                description="Find Acts & Judgments."
              />

              <ToggleRow
                title="Generate Summary"
                description="AI summary after upload."
              />

              <ToggleRow
                title="Semantic Indexing"
                description="Store in vector database."
              />

              <ToggleRow
                title="Entity Recognition"
                description="Identify names, courts and judges."
              />
            </div>
          </div>

          {/* TAGS */}

          <div style={card}>
            <h3 style={heading}>
              Tags
            </h3>

            <textarea
              rows={4}
              placeholder="maintenance, custody, affidavit, family court..."
              style={{
                ...inputStyle,
                height: 'auto',
                resize: 'vertical',
                paddingTop: 12,
              }}
            />
          </div>
                    {/* ================= UPLOAD PROGRESS ================= */}

          <div
            style={{
              ...card,
              marginTop: 30,
              marginBottom: 30,
            }}
          >
            <h3 style={heading}>
              Upload Progress
            </h3>

            <ProgressCard
              file="Maintenance_Judgment.pdf"
              progress="100%"
              status="Completed"
              color="#16a34a"
            />

            <ProgressCard
              file="Income_Affidavit.pdf"
              progress="82%"
              status="Uploading"
              color="#2563eb"
            />

            <ProgressCard
              file="Bank_Statement.pdf"
              progress="45%"
              status="Processing"
              color="#ea580c"
            />
          </div>

          {/* ================= AI PREVIEW ================= */}

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
                AI Knowledge Preview
              </h3>

              <p
                style={{
                  lineHeight:1.8,
                  color:'#475569',
                }}
              >
                AI detected this document as a
                Supreme Court Maintenance Judgment.
                Important citations, legal provisions,
                parties and judges have been identified.
              </p>

              <SummaryCard
                title="Detected Type"
                value="Judgment"
              />

              <SummaryCard
                title="Pages"
                value="48"
              />

              <SummaryCard
                title="Acts Found"
                value="6"
              />

              <SummaryCard
                title="Judgments Found"
                value="12"
              />
            </div>

            <div style={card}>
              <h3 style={heading}>
                Visibility
              </h3>

              <ToggleRow
                title="Private"
                description="Visible only to you."
              />

              <ToggleRow
                title="Team Access"
                description="Visible to your organization."
              />

              <ToggleRow
                title="Knowledge Base"
                description="Add into AI Knowledge Base."
              />

              <ToggleRow
                title="AI Training"
                description="Allow AI to use this document."
              />
            </div>
          </div>

          {/* ================= FOOTER ================= */}

          <div
            style={{
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center',
              borderTop: '1px solid rgba(0,0,0,0.05)',
              paddingTop:24,
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
                display:'flex',
                gap:14,
              }}
            >
              <button style={secondaryButton}>
                Save Draft
              </button>

              <button style={primaryButton}>
                Upload & Index
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ================= COMPONENTS ================= */

function Field({
  label,
  children,
}:{
  label:string
  children:React.ReactNode
}) {
  return (
    <div style={{marginBottom:18}}>
      <label
        style={{
          display:'block',
          marginBottom:8,
          fontWeight:600,
        }}
      >
        {label}
      </label>

      {children}
    </div>
  )
}

function ToggleRow({
  title,
  description,
}:{
  title:string
  description:string
}) {
  return (
    <div
      style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        padding:'14px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <div>
        <div style={{fontWeight:600}}>
          {title}
        </div>

        <div
          style={{
            fontSize:13,
            color:'#64748b',
          }}
        >
          {description}
        </div>
      </div>

      <input type="checkbox" />
    </div>
  )
}

function ProgressCard({
  file,
  progress,
  status,
  color,
}:{
  file:string
  progress:string
  status:string
  color:string
}) {
  return (
    <div
      style={{
        marginBottom:20,
      }}
    >
      <div
        style={{
          display:'flex',
          justifyContent:'space-between',
          marginBottom:8,
        }}
      >
        <strong>{file}</strong>

        <span
          style={{
            color,
            fontWeight:700,
          }}
        >
          {status}
        </span>
      </div>

      <div
        style={{
          height:8,
          background:'#e2e8f0',
          borderRadius:999,
        }}
      >
        <div
          style={{
            width:progress,
            height:'100%',
            background:color,
            borderRadius:999,
          }}
        />
      </div>
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
        padding:'12px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <span>{title}</span>

      <strong>{value}</strong>
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
  padding:'10px 20px',
  cursor:'pointer',
  fontWeight:600,
}

const secondaryButton:React.CSSProperties={
  border: '1px solid rgba(0,0,0,0.05)',
  background: 'rgba(255,255,255,0.4)',
  color:'#334155',
  borderRadius:10,
  padding:'10px 20px',
  cursor:'pointer',
  fontWeight:600,
}