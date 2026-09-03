'use client'

export default function ProfileSettings() {
  return (
    <div>

      {/* Header */}

      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Profile
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Manage your personal information and professional profile.
        </p>
      </div>

      {/* Profile Card */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: 24,
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          background: '#f8fafc',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 82,
            height: 82,
            borderRadius: '50%',
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 26,
          }}
        >
          PB
        </div>

        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              color: '#0f172a',
              fontSize: 22,
            }}
          >
            Parth Bindra
          </h3>

          <p
            style={{
              marginTop: 6,
              color: '#64748b',
            }}
          >
            Founder • Clausio Technologies
          </p>

          <button
            style={{
              marginTop: 12,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 14px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <i
              className="ti ti-camera"
              style={{ marginRight: 6 }}
            />
            Change Photo
          </button>
        </div>
      </div>

      {/* Form */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}
      >
        <Input label="Full Name" value="Parth Bindra" />

        <Input
          label="Email"
          value="parth@example.com"
        />

        <Input
          label="Phone Number"
          value="+91 9876543210"
        />

        <Input
          label="Bar Council Number"
          value="MH/XXXX/2025"
        />

        <Input
          label="Law Firm"
          value="Clausio Technologies"
        />

        <Input
          label="Designation"
          value="Founder & Advocate"
        />

        <Input
          label="Experience"
          value="3 Years"
        />

        <Input
          label="City"
          value="Mumbai"
        />

        <Input
          label="Country"
          value="India"
        />

        <Input
          label="Language"
          value="English"
        />

        <Input
          label="Time Zone"
          value="Asia/Kolkata"
        />

        <Input
          label="Website"
          value="www.clausio.ai"
        />
      </div>

      {/* Save */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 32,
        }}
      >
        <button
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 22px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <i
            className="ti ti-device-floppy"
            style={{ marginRight: 8 }}
          />
          Save Profile
        </button>
      </div>

    </div>
  )
}

interface InputProps {
  label: string
  value: string
}

function Input({
  label,
  value,
}: InputProps) {
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

      <input
        defaultValue={value}
        style={{
          width: '100%',
          height: 42,
          border: '1px solid #dbe3ef',
          borderRadius: 10,
          padding: '0 14px',
          fontSize: 14,
          outline: 'none',
          background: '#fff',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}