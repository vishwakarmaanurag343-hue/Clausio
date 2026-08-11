'use client'

interface RecordPaymentModalProps {
  onClose: () => void
}

export default function RecordPaymentModal({
  onClose,
}: RecordPaymentModalProps) {
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
          width: 720,
          maxWidth: '95%',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 30px 80px rgba(0,0,0,.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}

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
              Record Payment
            </h2>

            <p
              style={{
                marginTop: 6,
                color: '#64748b',
                fontSize: 14,
              }}
            >
              Record a payment received from a client.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 28,
              color: '#94a3b8',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}

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

          <Field label="Invoice">
            <select style={inputStyle}>
              <option>Select Invoice</option>
              <option>INV-2026-001</option>
              <option>INV-2026-002</option>
              <option>INV-2026-003</option>
            </select>
          </Field>

          <Field label="Amount Received">
            <input
              placeholder="₹0.00"
              style={inputStyle}
            />
          </Field>

          <Field label="Payment Date">
            <input
              type="date"
              style={inputStyle}
            />
          </Field>

          <Field label="Payment Method">
            <select style={inputStyle}>
              <option>UPI</option>
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>Cheque</option>
              <option>Credit Card</option>
            </select>
          </Field>

          <Field label="Reference Number">
            <input
              placeholder="Transaction / UTR No."
              style={inputStyle}
            />
          </Field>

          <Field label="Received By">
            <input
              placeholder="Advocate / Staff"
              style={inputStyle}
            />
          </Field>

          <Field label="Payment Status">
            <select style={inputStyle}>
              <option>Completed</option>
              <option>Pending</option>
              <option>Partial Payment</option>
              <option>Refunded</option>
            </select>
          </Field>

          <div style={{ gridColumn: '1 / span 2' }}>
            <Field label="Notes">
              <textarea
                rows={5}
                placeholder="Additional payment notes..."
                style={{
                  ...inputStyle,
                  height: 'auto',
                  paddingTop: 12,
                  resize: 'vertical',
                }}
              />
            </Field>
          </div>

          {/* Payment Summary */}

          <div
            style={{
              gridColumn: '1 / span 2',
            }}
          >
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <SummaryRow
                label="Invoice Amount"
                value="₹45,000"
              />

              <SummaryRow
                label="Already Paid"
                value="₹20,000"
              />

              <SummaryRow
                label="Current Payment"
                value="₹25,000"
              />

              <hr
                style={{
                  margin: '16px 0',
                  borderColor: '#e2e8f0',
                }}
              />

              <SummaryRow
                label="Balance After Payment"
                value="₹0"
                highlight
              />
            </div>
          </div>
        </div>

        {/* Footer */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            padding: 22,
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

          <button style={primaryButton}>
            <i
              className="ti ti-check"
              style={{ marginRight: 8 }}
            />
            Record Payment
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Components ---------------- */

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
          fontSize: 13,
          fontWeight: 600,
          color: '#334155',
        }}
      >
        {label}
      </label>

      {children}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        fontWeight: highlight ? 700 : 500,
        color: highlight ? '#16a34a' : '#0f172a',
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