'use client'

export default function BackupSettings() {
  return (
    <div>

      {/* ================= HEADER ================= */}

      <div style={{ marginBottom: 30 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Backup & Data
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          Protect your case files, client information and AI-generated documents.
        </p>
      </div>

      {/* ================= STORAGE ================= */}

      <Section title="Storage Usage">

        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 22,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontWeight: 600 }}>Storage Used</span>

            <span style={{ color: '#2563eb', fontWeight: 700 }}>
              12.8 GB / 100 GB
            </span>
          </div>

          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: '#e2e8f0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '13%',
                height: '100%',
                background: '#2563eb',
              }}
            />
          </div>

          <div
            style={{
              marginTop: 12,
              color: '#64748b',
              fontSize: 13,
            }}
          >
            Last backup completed successfully.
          </div>
        </div>

      </Section>

      {/* ================= AUTOMATIC BACKUP ================= */}

      <Section title="Automatic Backup">

        <Toggle
          title="Enable Daily Backup"
          subtitle="Automatically backup your workspace every day."
          enabled
        />

        <Toggle
          title="Cloud Backup"
          subtitle="Store encrypted backups in cloud storage."
          enabled
        />

        <Toggle
          title="Version History"
          subtitle="Keep previous versions of documents."
          enabled
        />

      </Section>

      {/* ================= EXPORT ================= */}

      <Section title="Export Data">

        <Grid>

          <ActionCard
            icon="ti-download"
            title="Export All Cases"
            description="Download all cases as ZIP."
            button="Export"
          />

          <ActionCard
            icon="ti-file-export"
            title="Export Reports"
            description="Download generated reports."
            button="Download"
          />

          <ActionCard
            icon="ti-users"
            title="Export Clients"
            description="CSV file containing client information."
            button="Export CSV"
          />

          <ActionCard
            icon="ti-database"
            title="Export Database"
            description="Full encrypted database backup."
            button="Backup"
          />

        </Grid>

      </Section>

      {/* ================= RESTORE ================= */}

      <Section title="Restore Backup">

        <div
          style={{
            border: '1px dashed #cbd5e1',
            borderRadius: 14,
            padding: 30,
            textAlign: 'center',
          }}
        >
          <i
            className="ti ti-upload"
            style={{
              fontSize: 42,
              color: '#2563eb',
            }}
          />

          <h3
            style={{
              marginTop: 16,
              marginBottom: 8,
              color: '#0f172a',
            }}
          >
            Restore Backup
          </h3>

          <p
            style={{
              color: '#64748b',
              marginBottom: 18,
            }}
          >
            Upload a previously exported Clausio backup file.
          </p>

          <button style={primaryButton}>
            Choose Backup File
          </button>
        </div>

      </Section>

      {/* ================= DANGER ================= */}

      <Section title="Danger Zone">

        <div
          style={{
            border: '1px solid #fecaca',
            background: '#fef2f2',
            borderRadius: 14,
            padding: 22,
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: '#dc2626',
            }}
          >
            Delete Workspace
          </h3>

          <p
            style={{
              color: '#7f1d1d',
              marginBottom: 20,
            }}
          >
            Permanently delete all cases, clients, documents and AI history.
            This action cannot be undone.
          </p>

          <button
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 18px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Delete Workspace
          </button>
        </div>

      </Section>

    </div>
  )
}

/* ---------------------------------------------------------------- */

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: 18,
          color: '#0f172a',
          fontSize: 18,
        }}
      >
        {title}
      </h3>

      {children}
    </div>
  )
}

function Grid({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
      }}
    >
      {children}
    </div>
  )
}

function ActionCard({
  icon,
  title,
  description,
  button,
}: {
  icon: string
  title: string
  description: string
  button: string
}) {
  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: 22,
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{
          fontSize: 28,
          color: '#2563eb',
        }}
      />

      <h4
        style={{
          marginTop: 14,
          marginBottom: 8,
          color: '#0f172a',
        }}
      >
        {title}
      </h4>

      <p
        style={{
          color: '#64748b',
          fontSize: 13,
          minHeight: 40,
        }}
      >
        {description}
      </p>

      <button style={primaryButton}>
        {button}
      </button>
    </div>
  )
}

function Toggle({
  title,
  subtitle,
  enabled,
}: {
  title: string
  subtitle: string
  enabled?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 0',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div
          style={{
            marginTop: 4,
            color: '#64748b',
            fontSize: 13,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          width: 46,
          height: 24,
          borderRadius: 999,
          background: enabled ? '#2563eb' : '#cbd5e1',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: enabled ? 25 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
          }}
        />
      </div>
    </div>
  )
}

const primaryButton: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 14,
}