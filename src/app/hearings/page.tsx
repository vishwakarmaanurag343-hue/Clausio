'use client'

import { useState } from 'react'

import HearingForm from '@/components/hearings/HearingForm'
import HearingHistory from '@/components/hearings/HearingHistory'
import AddHearingModal from '@/components/hearings/AddHearingModal'
import HearingTabs from '@/components/hearings/HearingTabs'
import DeadlineBanner from '@/components/hearings/DeadlineBanner'

export default function HearingsPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  const [activeTab, setActiveTab] = useState('Hearing Diary')

  return (
    <>
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>
        {/* ================= HEADER ================= */}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* Left */}
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Hearings
            </h1>
            <p style={{ marginTop: 4, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              Hearing diary, preparation and witness intelligence
            </p>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 600, fontSize: 11, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              Family & Matrimonial
            </div>
            <button className="glass-button" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, border: 'none', borderRadius: 10, cursor: 'pointer', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
              <i className="ti ti-plus" />
              Add Hearing
            </button>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <HearingTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* ================= DEADLINE ================= */}
        <div style={{ marginTop: 16 }}>
          <DeadlineBanner />
        </div>

        {/* ================= PAGE CONTENT ================= */}
        <div style={{ marginTop: 16 }}>
                    {/* ================= HEARING DIARY ================= */}

          {activeTab === 'Hearing Diary' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '42% 58%',
                gap: 24,
              }}
            >
              <HearingForm />

              <HearingHistory />
            </div>
          )}

          {/* ================= PREP BRIEF ================= */}
          {activeTab === 'Prep Brief' && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', marginBottom: 8, fontWeight: 700 }}>
                Hearing Preparation Brief
              </h2>
              <p style={{ color: '#64748b', marginBottom: 20, fontSize: 13 }}>
                AI generated preparation notes before the next hearing.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginTop: 0, fontSize: 14, color: '#1d4ed8' }}>Today's Objective</h3>
                  <p style={{ fontSize: 13, color: '#334155' }}>
                    Secure interim maintenance order and oppose adjournment.
                  </p>
                </div>

                <div style={{ background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.1)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginTop: 0, fontSize: 14, color: '#a16207' }}>Judge Notes</h3>
                  <p style={{ fontSize: 13, color: '#334155' }}>
                    Previous warning issued to respondent regarding delay.
                  </p>
                </div>

                <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginTop: 0, fontSize: 14, color: '#15803d' }}>Arguments</h3>
                  <ul style={{ fontSize: 13, color: '#334155', margin: 0, paddingLeft: 20 }}>
                    <li>Repeated non-compliance.</li>
                    <li>Financial hardship of petitioner.</li>
                    <li>Delay tactics by respondent.</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginTop: 0, fontSize: 14, color: '#b91c1c' }}>Documents Required</h3>
                  <ul style={{ fontSize: 13, color: '#334155', margin: 0, paddingLeft: 20 }}>
                    <li>Updated Income Affidavit</li>
                    <li>Medical Bills</li>
                    <li>Bank Statements</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ================= WITNESS INTELLIGENCE ================= */}
          {activeTab === 'Witness Intelligence' && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a', marginBottom: 8, fontWeight: 700 }}>
                Witness Intelligence
              </h2>
              <p style={{ color: '#64748b', marginBottom: 20, fontSize: 13 }}>
                AI analysis of witness credibility and cross examination.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginTop: 0, fontSize: 14 }}>Primary Witness</h3>
                  <p style={{ fontSize: 13, color: '#334155' }}>Mother of petitioner</p>
                  <p style={{ color: '#16a34a', fontWeight: 600, fontSize: 13, margin: 0 }}>
                    Credibility Score: 92%
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginTop: 0, fontSize: 14 }}>Risk Factors</h3>
                  <ul style={{ fontSize: 13, color: '#334155', margin: 0, paddingLeft: 20 }}>
                    <li>Memory inconsistencies</li>
                    <li>Financial questions expected</li>
                    <li>Timeline clarification required</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginTop: 0, fontSize: 14, color: '#1d4ed8' }}>Cross Examination Questions</h3>
                  <ul style={{ fontSize: 13, color: '#334155', margin: 0, paddingLeft: 20 }}>
                    <li>Income proof?</li>
                    <li>Medical expenditure proof?</li>
                    <li>Communication records?</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ marginTop: 0, fontSize: 14, color: '#15803d' }}>AI Recommendation</h3>
                  <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>
                    Prepare documentary evidence before oral examination.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {showAddModal && (
        <AddHearingModal
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  )
}
        