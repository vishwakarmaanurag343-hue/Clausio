'use client'
// This is the main dashboard page — visible at /dashboard
import { useState }   from 'react'
import { motion }     from 'framer-motion'
import { useUIStore } from '@/lib/store'
import CaseList       from '@/components/cases/CaseList'
import MetricsRow     from '@/components/dashboard/MetricsRow'
import QuickActions   from '@/components/dashboard/QuickActions'
import HearingDiary   from '@/components/dashboard/HearingDiary'
import AIInsights     from '@/components/dashboard/AIInsights'
import { MotionCard, MotionButton } from '@/components/ui/Motion'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
}

const TABS = ['Overview','Documents','Timeline','Hearings','AI analysis','Drafts','Research','Evidence','Witnesses','Tasks','Billing','History']

const ACTIVITY = [
  { dot: '#7c3aed', text: 'AI summary generated',            sub: 'Today 10:30 AM · Clausio AI'  },
  { dot: '#3b82f6', text: 'Hospital records uploaded',       sub: 'Yesterday 4:15 PM · Parth B.' },
  { dot: '#10b981', text: 'Client update sent via WhatsApp', sub: '15 Jun 2:00 PM · Parth B.'    },
  { dot: '#f59e0b', text: '17 Jun hearing date confirmed',   sub: '14 Jun 11:00 AM · System'     },
]

export default function DashboardPage() {
  const { caseListVisible, aiPanelVisible } = useUIStore()
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Three panels side by side */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', paddingBottom: 16, paddingTop: 16, paddingLeft: 16 }}>

        {/* PANEL 1 — Case list (left) */}
        <div style={{ flexShrink: 0, overflow: 'hidden', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', width: caseListVisible ? 280 : 0, marginRight: caseListVisible ? 16 : 0 }}>
          <CaseList />
        </div>

        {/* PANEL 2 — Main workspace (centre) */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, marginRight: 16, borderRadius: 24 }}>

          {/* Breadcrumb & Case header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', flexShrink: 0, background: 'rgba(255,255,255,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', marginBottom: 12 }}>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Cases</span>
              <span style={{ color: '#94a3b8' }}>›</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>Priya v. Rohit Sharma</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Priya v. Rohit Sharma</span>
              <span className="glass-pill" style={{ fontSize: 11, padding: '4px 10px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)' }}>● Hearing today</span>
              <span className="glass-pill" style={{ fontSize: 11, padding: '4px 10px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)' }}>2 overdue</span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Readiness</span>
                <div style={{ width: 80, height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '72%', height: 6, background: '#10b981', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>72%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#475569', fontWeight: 500 }}>
              <span>Family Court Bandra</span><span style={{ color: '#cbd5e1' }}>·</span>
              <span>FC/2847/2023</span><span style={{ color: '#cbd5e1' }}>·</span>
              <span>Next: <strong style={{ color: '#0f172a' }}>17 Jun 2024</strong></span>
            </div>
          </div>

          {/* 12 tabs - iOS Segmented Control style */}
          <div style={{ display: 'flex', overflowX: 'auto', flexShrink: 0, padding: '12px 24px', background: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 4, gap: 2 }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: '6px 14px', fontSize: 12, cursor: 'pointer', background: activeTab === t ? '#fff' : 'transparent', border: 'none', borderRadius: 8, color: activeTab === t ? '#0f172a' : '#64748b', fontWeight: activeTab === t ? 600 : 500, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s ease', boxShadow: activeTab === t ? '0 2px 6px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Overdue alert */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239, 68, 68, 0.05)', borderBottom: '1px solid rgba(239, 68, 68, 0.1)', padding: '12px 24px', fontSize: 12, color: '#7f1d1d', flexShrink: 0 }}>
            <i className="ti ti-alert-triangle" style={{ color: '#dc2626', fontSize: 16 }} />
            <span style={{ fontWeight: 600 }}>2 overdue deadlines</span>
            <span style={{ color: '#475569' }}>— Respondent reply due 27 May. Judge warned of ex-parte proceedings.</span>
            <MotionButton style={{ marginLeft: 'auto', padding: '6px 12px', color: '#dc2626', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Resolve →</MotionButton>
          </div>

          {/* Scrollable content */}
          <motion.div 
            style={{ flex: 1, overflowY: 'auto', padding: '24px' }}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}><MetricsRow /></motion.div>
            <motion.div variants={itemVariants}><QuickActions /></motion.div>

            {/* Two columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <motion.div variants={itemVariants}><HearingDiary /></motion.div>

              {/* Activity feed */}
              <MotionCard variants={itemVariants} style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>
                  <i className="ti ti-activity" style={{ fontSize: 16, color: '#64748b' }} />
                  Activity feed
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>View all</span>
                </div>
                {ACTIVITY.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.dot, flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${a.dot}40` }} />
                    <div>
                      <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 500 }}>{a.text}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{a.sub}</div>
                    </div>
                  </div>
                ))}
              </MotionCard>
            </div>

            {/* Analytics */}
            <MotionCard variants={itemVariants} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
                <i className="ti ti-chart-pie" style={{ fontSize: 16, color: '#64748b' }} />
                Practice analytics
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>Full report →</span>
              </div>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12, overflow: 'hidden' }}>
                {[
                  { val: '82%',  lbl: 'Success rate',  trend: '↑ vs last qtr', clr: '#10b981' },
                  { val: '12.5L',lbl: 'Revenue (Rs)',   trend: '↑ 18% MoM',     clr: '#10b981' },
                  { val: '78%',  lbl: 'AI usage',       trend: '↑ 12pts',       clr: '#7c3aed' },
                  { val: '154',  lbl: 'Active cases',   trend: '→ Stable',      clr: '#f59e0b' },
                ].map((seg, i) => (
                  <div key={i} style={{ flex: 1, padding: '12px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>{seg.val}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 500 }}>{seg.lbl}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: seg.clr, marginTop: 4 }}>{seg.trend}</div>
                  </div>
                ))}
              </div>
            </MotionCard>
          </motion.div>
        </div>

        {/* PANEL 3 — AI Insights (right) */}
        <div style={{ flexShrink: 0, overflow: 'hidden', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', width: aiPanelVisible ? 240 : 0, marginRight: aiPanelVisible ? 16 : 0 }}>
          <AIInsights />
        </div>

      </div>
    </div>
  )
}
