'use client'

interface ActionItem {
  id: number
  title: string
  description: string
  priority: 'High' | 'Medium' | 'Low'
  due: string
  completed: boolean
}

const actions: ActionItem[] = [
  {
    id: 1,
    title: 'Contact Dr. Mehta',
    description: 'Confirm witness availability before the next hearing.',
    priority: 'High',
    due: 'Before 20 Jun',
    completed: false,
  },
  {
    id: 2,
    title: 'Collect HDFC Bank Statement',
    description: 'File the last six months bank statement ending 7734.',
    priority: 'High',
    due: 'Before 21 Jun',
    completed: false,
  },
  {
    id: 3,
    title: 'Submit June 2024 WhatsApp Admission',
    description: 'Prepare and formally submit as supporting evidence.',
    priority: 'Medium',
    due: 'Before 23 Jun',
    completed: false,
  },
  {
    id: 4,
    title: 'Collect Petitioner Salary Records',
    description: 'Gather salary slips and income proof.',
    priority: 'Medium',
    due: 'Before 25 Jun',
    completed: false,
  },
  {
    id: 5,
    title: 'Prepare Cross Examination',
    description: 'Draft expected questions for Respondent.',
    priority: 'Low',
    due: 'Before Next Hearing',
    completed: false,
  },
]

export default function ActionPlan() {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 22,
        boxShadow: '0 2px 8px rgba(15,23,42,.04)',
        height: '100%',
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 22,
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
            30-Day Action Plan
          </h2>

          <p
            style={{
              marginTop: 5,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            AI-generated recommendations
          </p>
        </div>

        <button
          style={{
            border: 'none',
            background: '#eff6ff',
            color: '#2563eb',
            borderRadius: 10,
            padding: '10px 16px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Export
        </button>
      </div>

      {/* Timeline */}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {actions.map((item) => (
          <ActionCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function ActionCard({
  item,
}: {
  item: ActionItem
}) {
  const priorityColor =
    item.priority === 'High'
      ? '#dc2626'
      : item.priority === 'Medium'
      ? '#d97706'
      : '#16a34a'

  const priorityBackground =
    item.priority === 'High'
      ? '#fef2f2'
      : item.priority === 'Medium'
      ? '#fff7ed'
      : '#f0fdf4'

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 16,
        background: '#ffffff',
      }}
    >
      {/* Checkbox */}

      <div
        style={{
          marginTop: 2,
        }}
      >
        <input
          type="checkbox"
          checked={item.completed}
          readOnly
          style={{
            width: 18,
            height: 18,
          }}
        />
      </div>

      {/* Content */}

      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: '#0f172a',
              fontSize: 15,
            }}
          >
            {item.title}
          </div>

          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: priorityColor,
              background: priorityBackground,
            }}
          >
            {item.priority}
          </span>
        </div>

        <div
          style={{
            color: '#64748b',
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {item.description}
        </div>

        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: '#2563eb',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {item.due}
          </span>

          <button
            style={{
              border: 'none',
              background: '#f8fafc',
              color: '#475569',
              borderRadius: 8,
              padding: '7px 12px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  )
}