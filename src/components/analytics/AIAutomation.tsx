'use client'

import React from 'react'

const stats = [
  {
    title: 'Active Automations',
    value: '18',
    icon: 'ti-robot',
    color: '#3b82f6',
  },
  {
    title: 'TodayExecutions',
    value: '142',
    icon: 'ti-bolt',
    color: '#16a34a',
  },
  {
    title: 'Success Rate',
    value: '98%',
    icon: 'ti-check',
    color: '#ea580c',
  },
  {
    title: 'Hours Saved',
    value: '36h',
    icon: 'ti-clock',
    color: '#7c3aed',
  },
]

export default function AIAutomation() {
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
            }}
          >
            AI Automation
          </h2>

          <p
            style={{
              marginTop: 8,
              color: '#64748b',
              lineHeight: 1.7,
            }}
          >
            Automate repetitive legal workflows using AI-powered triggers,
            actions and notifications.
          </p>
        </div>

        <button style={primaryButton}>
          <i
            className="ti ti-plus"
            style={{ marginRight: 8 }}
          />
          Create Automation
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
                color: item.color,
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ================= ACTIVE AUTOMATIONS ================= */}

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
            Active Automations
          </h3>

          <button style={secondaryButton}>
            View All
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
          <AutomationRow
            title="Hearing Preparation"
            trigger="New Hearing"
            action="Generate Hearing Brief"
            status="Active"
            color="#16a34a"
          />

          <AutomationRow
            title="Client WhatsApp Update"
            trigger="Hearing Completed"
            action="Generate Client Update"
            status="Active"
            color="#16a34a"
          />

          <AutomationRow
            title="Judge Analysis"
            trigger="Judge Selected"
            action="Generate Judge Insights"
            status="Running"
            color="#2563eb"
          />

          <AutomationRow
            title="Evidence Intelligence"
            trigger="Evidence Uploaded"
            action="AI Evidence Analysis"
            status="Paused"
            color="#ea580c"
          />

          <AutomationRow
            title="Financial Intelligence"
            trigger="Income Affidavit Added"
            action="Maintenance Calculation"
            status="Active"
            color="#16a34a"
          />

          <AutomationRow
            title="Legal Research"
            trigger="Issue Added"
            action="Find Relevant Judgments"
            status="Active"
            color="#16a34a"
          />
        </div>
      </div>

      {/* ================= QUICK AUTOMATIONS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 18,
          marginBottom: 30,
        }}
      >
        <AutomationCard
          icon="ti-calendar-event"
          title="Hearing Automation"
          description="Automatically prepare hearings."
          color="#2563eb"
        />

        <AutomationCard
          icon="ti-file-text"
          title="Draft Automation"
          description="Generate petitions & drafts."
          color="#16a34a"
        />

        <AutomationCard
          icon="ti-scale"
          title="Research Automation"
          description="Find judgments automatically."
          color="#7c3aed"
        />

        <AutomationCard
          icon="ti-message"
          title="Client Updates"
          description="Generate WhatsApp updates."
          color="#ea580c"
        />
      </div>
            {/* ================= AUTOMATION TEMPLATES ================= */}

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
            Automation Templates
          </h3>

          <button style={secondaryButton}>
            Browse Templates
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 20,
          }}
        >
          <TemplateCard
            title="Hearing Assistant"
            trigger="New Hearing"
            actions="6 AI Actions"
            color="#2563eb"
          />

          <TemplateCard
            title="Judge Intelligence"
            trigger="Judge Assigned"
            actions="4 AI Actions"
            color="#16a34a"
          />

          <TemplateCard
            title="Research Assistant"
            trigger="Legal Issue Added"
            actions="5 AI Actions"
            color="#7c3aed"
          />

          <TemplateCard
            title="Evidence Intelligence"
            trigger="Evidence Uploaded"
            actions="7 AI Actions"
            color="#ea580c"
          />

          <TemplateCard
            title="Financial Intelligence"
            trigger="Income Affidavit"
            actions="5 AI Actions"
            color="#0891b2"
          />

          <TemplateCard
            title="Client Communication"
            trigger="Hearing Completed"
            actions="3 AI Actions"
            color="#dc2626"
          />
        </div>
      </div>

      {/* ================= WORKFLOW BUILDER ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr .6fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        {/* Workflow */}

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
            Workflow Builder
          </h3>

          <WorkflowCard
            step="1"
            title="Trigger"
            description="New Hearing Scheduled"
            color="#2563eb"
          />

          <WorkflowArrow />

          <WorkflowCard
            step="2"
            title="Condition"
            description="Family Court Matter"
            color="#16a34a"
          />

          <WorkflowArrow />

          <WorkflowCard
            step="3"
            title="AI Action"
            description="Generate Hearing Brief"
            color="#7c3aed"
          />

          <WorkflowArrow />

          <WorkflowCard
            step="4"
            title="Notification"
            description="Send WhatsApp Update"
            color="#ea580c"
          />
        </div>

        {/* Trigger Builder */}

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
            Trigger Builder
          </h3>

          <TriggerItem
            title="Case Created"
            active
          />

          <TriggerItem
            title="Hearing Added"
            active
          />

          <TriggerItem
            title="Document Uploaded"
          />

          <TriggerItem
            title="Judge Assigned"
            active
          />

          <TriggerItem
            title="Evidence Added"
          />

          <TriggerItem
            title="Settlement Proposed"
          />

          <TriggerItem
            title="Client Message"
          />

          <button
            style={{
              ...primaryButton,
              width: '100%',
              marginTop: 18,
            }}
          >
            + Add Trigger
          </button>
        </div>
      </div>

      {/* ================= AI ACTIONS ================= */}

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
            marginBottom: 20,
          }}
        >
          AI Actions Available
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 18,
          }}
        >
          <ActionTile
            icon="ti-file-text"
            title="Draft Petition"
          />

          <ActionTile
            icon="ti-scale"
            title="Legal Research"
          />

          <ActionTile
            icon="ti-brain"
            title="Judge Analysis"
          />

          <ActionTile
            icon="ti-message"
            title="Client Update"
          />

          <ActionTile
            icon="ti-search"
            title="Evidence Analysis"
          />

          <ActionTile
            icon="ti-chart-bar"
            title="Financial Report"
          />

          <ActionTile
            icon="ti-list-details"
            title="Case Summary"
          />

          <ActionTile
            icon="ti-calendar-event"
            title="Prepare Hearing"
          />
        </div>
      </div>
            {/* ================= EXECUTION HISTORY ================= */}

      <div
        style={{
          marginBottom: 30,
        }}
      >
        <div
          style={{
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center',
            marginBottom:18,
          }}
        >
          <h3
            style={{
              margin:0,
            }}
          >
            Execution History
          </h3>

          <button style={secondaryButton}>
            View Logs
          </button>
        </div>

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius:16,
            overflow:'hidden',
          }}
        >
          <HistoryRow
            automation="Hearing Preparation"
            status="Success"
            time="2 mins ago"
            color="#16a34a"
          />

          <HistoryRow
            automation="Client WhatsApp Update"
            status="Success"
            time="10 mins ago"
            color="#16a34a"
          />

          <HistoryRow
            automation="Evidence Intelligence"
            status="Running"
            time="18 mins ago"
            color="#2563eb"
          />

          <HistoryRow
            automation="Judge Analysis"
            status="Failed"
            time="35 mins ago"
            color="#dc2626"
          />

          <HistoryRow
            automation="Financial Intelligence"
            status="Success"
            time="1 hour ago"
            color="#16a34a"
          />
        </div>
      </div>

      {/* ================= ANALYTICS ================= */}

      <div
        style={{
          marginBottom:30,
        }}
      >
        <h3
          style={{
            marginBottom:18,
          }}
        >
          Automation Analytics
        </h3>

        <div
          style={{
            display:'grid',
            gridTemplateColumns:'repeat(4,1fr)',
            gap:18,
          }}
        >
          <AnalyticsCard
            title="Automations Executed"
            value="2,845"
            icon="ti-bolt"
            color="#2563eb"
          />

          <AnalyticsCard
            title="Documents Generated"
            value="1,124"
            icon="ti-file-text"
            color="#16a34a"
          />

          <AnalyticsCard
            title="Time Saved"
            value="324 hrs"
            icon="ti-clock"
            color="#ea580c"
          />

          <AnalyticsCard
            title="AI Accuracy"
            value="98%"
            icon="ti-brain"
            color="#7c3aed"
          />
        </div>
      </div>

      {/* ================= NOTIFICATIONS ================= */}

      <div
        style={{
          display:'grid',
          gridTemplateColumns:'1fr 1fr',
          gap:24,
          marginBottom:30,
        }}
      >
        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius:16,
            padding:24,
          }}
        >
          <h3
            style={{
              marginTop:0,
              marginBottom:18,
            }}
          >
            Notifications
          </h3>

          <NotificationRow
            title="Automation Completed"
            description="Hearing Brief generated successfully."
          />

          <NotificationRow
            title="Research Finished"
            description="Latest judgments have been added."
          />

          <NotificationRow
            title="Client Update Sent"
            description="WhatsApp draft generated."
          />

          <NotificationRow
            title="Evidence Processed"
            description="OCR and indexing completed."
          />

          <NotificationRow
            title="Judge Analysis Ready"
            description="Insights available for review."
          />
        </div>

        <div
      className="glass-card"
      style={{
        background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius:16,
            padding:24,
          }}
        >
          <h3
            style={{
              marginTop:0,
              marginBottom:18,
            }}
          >
            Upcoming Scheduled Automations
          </h3>

          <ScheduleCard
            title="Daily Case Summary"
            schedule="Every Day • 08:00 AM"
          />

          <ScheduleCard
            title="Research Sync"
            schedule="Every 2 Hours"
          />

          <ScheduleCard
            title="Weekly Backup"
            schedule="Sunday • 11:00 PM"
          />

          <ScheduleCard
            title="Financial Analysis"
            schedule="Every Friday"
          />

          <ScheduleCard
            title="Client Reminder"
            schedule="Before Every Hearing"
          />
        </div>
      </div>
            {/* ================= SETTINGS ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 30,
        }}
      >
        {/* Settings */}

        <div
          style={card}
        >
          <h3 style={heading}>
            Automation Settings
          </h3>

          <SettingRow
            title="Enable AI Automation"
            description="Master switch for all AI workflows."
          />

          <SettingRow
            title="Auto Retry Failed Tasks"
            description="Retry failed workflows automatically."
          />

          <SettingRow
            title="Send Email Notifications"
            description="Notify users via email."
          />

          <SettingRow
            title="WhatsApp Notifications"
            description="Send client WhatsApp updates."
          />

          <SettingRow
            title="Automatic Backups"
            description="Backup workflow execution history."
          />
        </div>

        {/* Permissions */}

        <div
          style={card}
        >
          <h3 style={heading}>
            Team Permissions
          </h3>

          <SettingRow
            title="Partners"
            description="Full automation access."
          />

          <SettingRow
            title="Associates"
            description="Create & edit workflows."
          />

          <SettingRow
            title="Interns"
            description="View only."
          />

          <SettingRow
            title="Support Staff"
            description="Run approved workflows."
          />

          <SettingRow
            title="AI Admin"
            description="Manage AI settings."
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
        <button style={secondaryButton}>
          Save Settings
        </button>

        <div
          style={{
            display:'flex',
            gap:14,
          }}
        >
          <button style={secondaryButton}>
            Export Workflows
          </button>

          <button style={primaryButton}>
            Create Automation
          </button>
        </div>
      </div>

    </div>
  )
}

/* ================= COMPONENTS ================= */

function AutomationRow({
  title,
  trigger,
  action,
  status,
  color,
}:{
  title:string
  trigger:string
  action:string
  status:string
  color:string
}) {
  return (
    <div
      style={{
        display:'grid',
        gridTemplateColumns:'2fr 1.5fr 2fr 1fr',
        padding:18,
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        alignItems:'center',
      }}
    >
      <strong>{title}</strong>
      <span>{trigger}</span>
      <span>{action}</span>
      <strong style={{color}}>{status}</strong>
    </div>
  )
}

function AutomationCard({
  icon,
  title,
  description,
  color,
}:{
  icon:string
  title:string
  description:string
  color:string
}) {
  return (
    <div style={card}>
      <i
        className={`ti ${icon}`}
        style={{
          fontSize:30,
          color,
        }}
      />

      <h4 style={{marginTop:16}}>
        {title}
      </h4>

      <div
        style={{
          color:'#64748b',
        }}
      >
        {description}
      </div>
    </div>
  )
}

function TemplateCard({
  title,
  trigger,
  actions,
  color,
}:{
  title:string
  trigger:string
  actions:string
  color:string
}) {
  return (
    <div style={card}>
      <h4>{title}</h4>

      <div style={{color:'#64748b'}}>
        {trigger}
      </div>

      <div
        style={{
          marginTop:12,
          color,
          fontWeight:600,
        }}
      >
        {actions}
      </div>
    </div>
  )
}

function WorkflowCard({
  step,
  title,
  description,
  color,
}:{
  step:string
  title:string
  description:string
  color:string
}) {
  return (
    <div
      style={{
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius:14,
        padding:18,
      }}
    >
      <div
        style={{
          width:36,
          height:36,
          borderRadius:'50%',
          background:color,
          color:'#fff',
          display:'flex',
          justifyContent:'center',
          alignItems:'center',
          fontWeight:700,
          marginBottom:12,
        }}
      >
        {step}
      </div>

      <strong>{title}</strong>

      <div
        style={{
          marginTop:6,
          color:'#64748b',
        }}
      >
        {description}
      </div>
    </div>
  )
}

function WorkflowArrow() {
  return (
    <div
      style={{
        textAlign:'center',
        fontSize:28,
        padding:'12px 0',
      }}
    >
      ↓
    </div>
  )
}

function TriggerItem({
  title,
  active,
}:{
  title:string
  active?:boolean
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

      <strong
        style={{
          color:active ? '#16a34a' : '#94a3b8',
        }}
      >
        {active ? 'ON' : 'OFF'}
      </strong>
    </div>
  )
}

function ActionTile({
  icon,
  title,
}:{
  icon:string
  title:string
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.6)',
        borderRadius:14,
        padding:18,
        textAlign:'center',
      }}
    >
      <i className={`ti ${icon}`} style={{fontSize:28,color: '#3b82f6'}} />
      <div style={{marginTop:12,fontWeight:600}}>
        {title}
      </div>
    </div>
  )
}

function HistoryRow({
  automation,
  status,
  time,
  color,
}:{
  automation:string
  status:string
  time:string
  color:string
}) {
  return (
    <div
      style={{
        display:'grid',
        gridTemplateColumns:'2fr 1fr 1fr',
        padding:18,
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <strong>{automation}</strong>
      <span style={{color,fontWeight:600}}>{status}</span>
      <span>{time}</span>
    </div>
  )
}

function AnalyticsCard({
  title,
  value,
  icon,
  color,
}:{
  title:string
  value:string
  icon:string
  color:string
}) {
  return (
    <div style={card}>
      <i className={`ti ${icon}`} style={{fontSize:28,color}} />
      <div style={{marginTop:10,color:'#64748b'}}>{title}</div>
      <div style={{marginTop:10,fontSize:26,fontWeight:700,color}}>
        {value}
      </div>
    </div>
  )
}

function NotificationRow({
  title,
  description,
}:{
  title:string
  description:string
}) {
  return (
    <div
      style={{
        padding:'14px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <strong>{title}</strong>
      <div style={{color:'#64748b',marginTop:4}}>
        {description}
      </div>
    </div>
  )
}

function ScheduleCard({
  title,
  schedule,
}:{
  title:string
  schedule:string
}) {
  return (
    <div
      style={{
        padding:'14px 0',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <strong>{title}</strong>
      <div style={{color:'#64748b',marginTop:4}}>
        {schedule}
      </div>
    </div>
  )
}

function SettingRow({
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

      <input type="checkbox" defaultChecked />
    </div>
  )
}

/* ================= STYLES ================= */

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.4)',
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius:16,
  padding:24,
}

const heading: React.CSSProperties = {
  marginTop:0,
  marginBottom:18,
}

const primaryButton: React.CSSProperties = {
  border:'none',
  background: '#3b82f6',
  color:'#fff',
  borderRadius:10,
  padding:'10px 18px',
  cursor:'pointer',
  fontWeight:600,
}

const secondaryButton: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.05)',
  background: 'rgba(255,255,255,0.4)',
  color:'#334155',
  borderRadius:10,
  padding:'10px 18px',
  cursor:'pointer',
  fontWeight:600,
}