'use client'

interface GenerateInvoiceModalProps {
  onClose: () => void
}

export default function GenerateInvoiceModal({
  onClose,
}: GenerateInvoiceModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 850,
          maxWidth: '95%',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 30px 80px rgba(0,0,0,.25)',
          overflow: 'hidden',
        }}
      >
        {/* ================= HEADER ================= */}

        <div
          style={{
            padding: '22px 26px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              Generate Invoice
            </h2>

            <p
              style={{
                marginTop: 6,
                color: '#64748b',
                fontSize: 14,
              }}
            >
              Create a professional invoice for your client.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 28,
              cursor: 'pointer',
              color: '#94a3b8',
            }}
          >
            ×
          </button>
        </div>

        {/* ================= BODY ================= */}

        <div
          style={{
            padding: 24,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          <Field label="Client">
            <select style={inputStyle}>
              <option>Select Client</option>
              <option>Priya Sharma</option>
              <option>Nirmal Parikh</option>
              <option>Rahul Singh</option>
            </select>
          </Field>

          <Field label="Matter">
            <select style={inputStyle}>
              <option>Select Matter</option>
              <option>Divorce Petition</option>
              <option>Custody Matter</option>
              <option>Property Dispute</option>
            </select>
          </Field>

          <Field label="Invoice Number">
            <input
              defaultValue="INV-2026-005"
              style={inputStyle}
            />
          </Field>

          <Field label="Invoice Date">
            <input
              type="date"
              style={inputStyle}
            />
          </Field>

          <Field label="Due Date">
            <input
              type="date"
              style={inputStyle}
            />
          </Field>

          <Field label="GST (%)">
            <input
              defaultValue="18"
              style={inputStyle}
            />
          </Field>

          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Description">
              <textarea
                rows={4}
                placeholder="Legal services provided..."
                style={{
                  ...inputStyle,
                  height: 'auto',
                  paddingTop: 12,
                  resize: 'vertical',
                }}
              />
            </Field>
          </div>

          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Billable Items">

              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 100px 120px 120px',
                    background: '#f8fafc',
                    padding: '12px 16px',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <div>Description</div>
                  <div>Qty</div>
                  <div>Rate</div>
                  <div>Total</div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 100px 120px 120px',
                    padding: '16px',
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <input
                    placeholder="Legal Consultation"
                    style={smallInput}
                  />

                  <input
                    defaultValue="1"
                    style={smallInput}
                  />

                  <input
                    defaultValue="25000"
                    style={smallInput}
                  />

                  <strong
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    ₹25,000
                  </strong>
                </div>
              </div>

              <button
                style={{
                  marginTop: 12,
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  borderRadius: 10,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <i
                  className="ti ti-plus"
                  style={{ marginRight: 8 }}
                />
                Add Item
              </button>

            </Field>
          </div>

          <div style={{ gridColumn: '1 / span 2' }}>
            <div
              style={{
                marginTop: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <Row label="Subtotal" value="₹25,000" />
              <Row label="GST (18%)" value="₹4,500" />
              <Row label="Discount" value="₹0" />

              <hr
                style={{
                  margin: '16px 0',
                  borderColor: '#e2e8f0',
                }}
              />

              <Row
                label="Grand Total"
                value="₹29,500"
                bold
              />
            </div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}

        <div
          style={{
            padding: 22,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <button
            onClick={onClose}
            style={secondaryButton}
          >
            Cancel
          </button>

          <button style={secondaryButton}>
            Save Draft
          </button>

          <button style={primaryButton}>
            <i
              className="ti ti-send"
              style={{ marginRight: 8 }}
            />
            Generate Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- COMPONENTS ---------------- */

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          fontWeight: 600,
          fontSize: 13,
          color: '#334155',
        }}
      >
        {label}
      </label>

      {children}
    </div>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        fontWeight: bold ? 700 : 500,
        fontSize: bold ? 18 : 14,
        color: '#0f172a',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid #dbe3ef',
  borderRadius: 10,
  padding: '0 14px',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const smallInput: React.CSSProperties = {
  height: 38,
  border: '1px solid #dbe3ef',
  borderRadius: 8,
  padding: '0 10px',
  marginRight: 10,
}

const primaryButton: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 22px',
  cursor: 'pointer',
  fontWeight: 600,
}

const secondaryButton: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '12px 22px',
  cursor: 'pointer',
  fontWeight: 600,
}