'use client'

import { useState } from 'react'

import AnalyticsTabs from '@/components/analytics/AnalyticsTabs'

import AIChat from '@/components/analytics/AIChat'
import LegalResearch from '@/components/analytics/LegalResearch'
import CrossExamination from '@/components/analytics/CrossExamination'
import StrategyAssistant from '@/components/analytics/StrategyAssistant'
import JudgeInsights from '@/components/analytics/JudgeInsights'
import PromptLibrary from '@/components/analytics/PromptLibrary'
import AIHistory from '@/components/analytics/AIHistory'
import KnowledgeBase from '@/components/analytics/KnowledgeBase'
import AITools from '@/components/analytics/AITools'
import AIAutomation from '@/components/analytics/AIAutomation'

export default function AnalyticsPage() {

  const [activeTab, setActiveTab] = useState('AI Chat')

  return (
    <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>
      {/* ================= HEADER ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            AI Analytics
          </h1>
          <p style={{ marginTop: 4, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            Your AI legal operating system for research, analysis and automation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontWeight: 600, fontSize: 11, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            AI Credits : 842
          </div>

          <button
            className="glass-button"
            style={{ height: 38, padding: '0 16px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="ti ti-upload" />
            Upload Knowledge
          </button>

          <button
            className="glass-button"
            style={{ height: 38, padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
          >
            <i className="ti ti-message-chatbot" />
            New Chat
          </button>
        </div>
      </div>

      {/* ================= TABS ================= */}

      <AnalyticsTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ================= CONTENT ================= */}

      <div
        style={{
          marginTop: 24,
        }}
      >
        {activeTab === 'AI Chat' && <AIChat />}

        {activeTab === 'Legal Research' && (
          <LegalResearch />
        )}

        {activeTab === 'Cross Examination' && (
          <CrossExamination />
        )}

        {activeTab === 'Strategy Assistant' && (
          <StrategyAssistant />
        )}

        {activeTab === 'Judge Insights' && (
          <JudgeInsights />
        )}

        {activeTab === 'Prompt Library' && (
          <PromptLibrary />
        )}

        {activeTab === 'History' && (
          <AIHistory />
        )}

        {activeTab === 'Knowledge Base' && (
          <KnowledgeBase />
        )}

        {activeTab === 'AI Tools' && (
          <AITools />
        )}

        {activeTab === 'Automation' && (
          <AIAutomation />
        )}
      </div>
    </div>
  )
}