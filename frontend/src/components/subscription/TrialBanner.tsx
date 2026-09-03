'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { subscriptionCheckApi } from '@/lib/billingApi'

type SubStatus = {
  isActive: boolean
  canUseAI: boolean
  planName: string
  status: string
  daysRemaining: number
  isTrial: boolean
  showWarning: boolean
  message: string | null
}

export default function TrialBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [showExpiredModal, setShowExpiredModal] = useState(false)

  useEffect(() => {
    subscriptionCheckApi.check()
      .then(data => {
        setSubStatus(data)
        // ── ENABLE AFTER PAID PLANS GO LIVE ──
        // Disabled for launch (26 Sep 2026) so the expired-trial modal never blocks users.
        // if (!data.isActive) {
        //   setShowExpiredModal(true)
        // }
      })
      .catch(() => {})
  }, [])

  // Never block the billing page itself — the advocate needs to reach the plans to upgrade.
  const onBilling = pathname?.startsWith('/billing') ?? false

  // EXPIRED MODAL — blocks the UI
  if (showExpiredModal && !onBilling) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '40px 32px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>

          <h2 style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 8,
          }}>
            Your Free Trial Has Ended
          </h2>

          <p style={{
            fontSize: 14,
            color: '#64748b',
            lineHeight: 1.6,
            marginBottom: 24,
          }}>
            Your 5-day free trial is complete. Upgrade to a plan to continue
            using Clausio and access all your cases and documents.
          </p>

          <div style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            textAlign: 'left',
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}>
              Your data is safe
            </div>
            {[
              '✓ All your cases are preserved',
              '✓ All documents are saved',
              '✓ All hearing history kept',
              '✓ Upgrade anytime to access',
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 13, color: '#374151', padding: '4px 0' }}>
                {item}
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/billing?tab=Subscription')}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: 10,
            }}
          >
            View Plans & Upgrade
          </button>

          <p style={{ fontSize: 12, color: '#94a3b8' }}>
            Questions? Email us at{' '}
            <a href="mailto:support@clausiotech.com" style={{ color: '#2563eb' }}>
              support@clausiotech.com
            </a>
          </p>
        </div>
      </div>
    )
  }

  // TRIAL WARNING BANNER
  // ── ENABLE AFTER PAID PLANS GO LIVE ──
  // Trial warning strip disabled for launch (26 Sep 2026). To restore:
  //   1. delete this "return null"
  //   2. uncomment the guard + the banner block below (remove the /* and */)
  return null

  /*  ── ENABLE AFTER PAID PLANS GO LIVE ──
  if (!subStatus?.showWarning || dismissed) return null

  const isLastDay = subStatus.daysRemaining <= 1

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: isLastDay ? '#dc2626' : '#d97706',
      color: '#fff',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        fontWeight: 600,
      }}>
        <span>⚠️</span>
        <span>{subStatus.message}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => router.push('/billing?tab=Subscription')}
          style={{
            padding: '6px 16px',
            borderRadius: 8,
            border: '2px solid #fff',
            background: 'transparent',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Upgrade Now
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 18,
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
  */
}
