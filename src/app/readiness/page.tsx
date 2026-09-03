'use client'

import { useState } from 'react'

import ReadinessTabs from '@/components/readiness/ReadinessTabs'
import EmergencyResponse from '@/components/readiness/EmergencyResponse'
import ReadinessScore from '@/components/readiness/ReadinessScore'
import GapAnalysis from '@/components/readiness/GapAnalysis'
import StrengthAnalysis from '@/components/readiness/StrengthAnalysis'
import GenerateReadinessModal from '@/components/readiness/GenerateReadinessModal'

export default function ReadinessPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>
        {/* ================= HEADER ================= */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Case Readiness
            </h1>
            <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
              AI readiness assessment before your next hearing.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 600, fontSize: 11, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              Family & Matrimonial
            </div>
            <button
              className="glass-button"
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, border: 'none', borderRadius: 10, cursor: 'pointer', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            >
              <i className="ti ti-sparkles" />
              Generate AI Report
            </button>
          </div>
        </div>

        {/* ================= TABS ================= */}

        <ReadinessTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* ================= OVERVIEW ================= */}

        {activeTab === 'Overview' && (
          <>
            <EmergencyResponse />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '40% 60%',
                gap: 24,
                marginTop: 24,
              }}
            >
              <ReadinessScore />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                <GapAnalysis />

                <StrengthAnalysis />
              </div>
            </div>
          </>
        )}

        {/* ================= EVIDENCE ================= */}

        {activeTab === 'Evidence' && (
          <ComingSoonCard
            icon="ti-file-search"
            title="Evidence Analysis"
            description="AI will analyse evidence quality, contradictions, missing exhibits and witness support."
          />
        )}

        {/* ================= ARGUMENTS ================= */}

        {activeTab === 'Arguments' && (
          <ComingSoonCard
            icon="ti-scale"
            title="Arguments Review"
            description="Analyse legal arguments, probable objections and counter-strategies before court."
          />
        )}

        {/* ================= DOCUMENTS ================= */}

        {activeTab === 'Documents' && (
          <ComingSoonCard
            icon="ti-files"
            title="Document Readiness"
            description="Review filing status, pending documents and affidavit completeness."
          />
        )}

        {/* ================= TIMELINE ================= */}

        {activeTab === 'Timeline' && (
          <ComingSoonCard
            icon="ti-calendar-event"
            title="Timeline Review"
            description="View chronological events, hearings, deadlines and AI observations."
          />
        )}
      </div>

      {showModal && (
        <GenerateReadinessModal
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

/* ========================================================= */

function ComingSoonCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div
      className="glass-card"
      style={{
        marginTop: 24,
        padding: '60px 40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          marginBottom: 16,
        }}
      >
        <i className={`ti ${icon}`} />
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 600,
          color: '#0f172a',
          letterSpacing: '-0.3px',
        }}
      >
        {title}
      </h2>

      <p
        style={{
          maxWidth: 420,
          margin: '8px auto 0',
          color: '#64748b',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  )
}