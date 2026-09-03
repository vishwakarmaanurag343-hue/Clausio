'use client'

interface AddExpenseModalProps {
  onClose: () => void
}

export default function AddExpenseModal({
  onClose,
}: AddExpenseModalProps) {
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
                fontSize: 22,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              Add Expense
            </h2>

            <p
              style={{
                marginTop: 6,
                color: '#64748b',
                fontSize: 14,
              }}
            >
              Record a new office or case-related expense.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 26,
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
          <Field label="Expense Category">
            <select style={inputStyle}>
              <option>Office Rent</option>
              <option>Court Fees</option>
              <option>Travel</option>
              <option>Salary</option>
              <option>Marketing</option>
              <option>AI Services</option>
              <option>Software</option>
              <option>Miscellaneous</option>
            </select>
          </Field>

          <Field label="Amount">
            <input
              placeholder="₹ 0.00"
              style={inputStyle}
            />
          </Field>

          <Field label="Description">
            <input
              placeholder="Expense description"
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

          <Field label="Expense Date">
            <input
              type="date"
              style={inputStyle}
            />
          </Field>

          <Field label="Vendor / Payee">
            <input
              placeholder="Vendor name"
              style={inputStyle}
            />
          </Field>

          <Field label="Related Client">
            <select style={inputStyle}>
              <option>Select Client</option>
              <option>Priya Sharma</option>
              <option>Nirmal Parikh</option>
              <option>Rahul Singh</option>
            </select>
          </Field>

          <Field label="Related Matter">
            <select style={inputStyle}>
              <option>Select Matter</option>
              <option>Divorce Petition</option>
              <option>Custody Matter</option>
              <option>Property Dispute</option>
            </select>
          </Field>

          <Field label="Receipt">
            <input
              type="file"
              style={inputStyle}
            />
          </Field>

          <Field label="Billable To Client">
            <select style={inputStyle}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </Field>

          <div
            style={{
              gridColumn: '1 / span 2',
            }}
          >
            <Field label="Notes">
              <textarea
                rows={5}
                placeholder="Additional notes..."
                style={{
                  ...inputStyle,
                  height: 'auto',
                  paddingTop: 12,
                  resize: 'vertical',
                }}
              />
            </Field>
          </div>
        </div>

        {/* ================= FOOTER ================= */}

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
            style={{
              padding: '11px 20px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancel
          </button>

          <button
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <i
              className="ti ti-device-floppy"
              style={{ marginRight: 8 }}
            />
            Save Expense
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