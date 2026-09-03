'use client'

import { useState } from 'react'

import SettingsSidebar from '@/components/settings/ SettingsSidebar'

import ProfileSettings from '@/components/settings/ ProfileSettings'
import AISettings from '@/components/settings/AISettings'
import LegalSettings from '@/components/settings/LegalSettings'
import WorkspaceSettings from '@/components/settings/WorkspaceSettings'
import NotificationSettings from '@/components/settings/NotificationSettings'
import IntegrationSettings from '@/components/settings/IntegrationSettings'
import SecuritySettings from '@/components/settings/SecuritySettings'
import BillingSettings from '@/components/settings/BillingSettings'
import TeamSettings from '@/components/settings/TeamSettings'
import AppearanceSettings from '@/components/settings/AppearanceSettings'
import BackupSettings from '@/components/settings/BackupSettings'
import AboutClausio from '@/components/settings/AboutClausio'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('Profile')

  const renderContent = () => {
    switch (activeSection) {
      case 'Profile':
        return <ProfileSettings />

      case 'AI':
        return <AISettings />

      case 'Legal':
        return <LegalSettings />

      case 'Workspace':
        return <WorkspaceSettings />

      case 'Notifications':
        return <NotificationSettings />

      case 'Integrations':
        return <IntegrationSettings />

      case 'Security':
        return <SecuritySettings />

      case 'Billing':
        return <BillingSettings />

      case 'Team':
        return <TeamSettings />

      case 'Appearance':
        return <AppearanceSettings />

      case 'Backup':
        return <BackupSettings />

      case 'About':
        return <AboutClausio />

      default:
        return <ProfileSettings />
    }
  }

  return (
    <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', margin: '16px', padding: 20, borderRadius: 24 }}>
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
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Settings
          </h1>

          <p
            style={{
              marginTop: 6,
              fontSize: 14,
              color: '#64748b',
            }}
          >
            Manage your account, workspace and AI preferences.
          </p>
        </div>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            borderRadius: 10,
            background: '#2563eb',
            color: '#fff',
            padding: '11px 18px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <i className="ti ti-device-floppy" />
          Save Changes
        </button>
      </div>

      {/* ================= BODY ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Sidebar */}

        <SettingsSidebar
          activeSection={activeSection}
          onChange={setActiveSection}
        />

        {/* Content */}

        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            padding: 28,
            minHeight: 650,
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  )
}