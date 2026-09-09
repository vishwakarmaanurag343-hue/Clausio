'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUIStore, useCaseStore } from '@/lib/store'
import { adminApi, walletApi, statsApi } from '@/lib/api'
import { getRole, storePermissions, hasPagePermission, pageKeyForPath } from '@/lib/pagePermissions'
import OutOfCreditsModal from '@/components/subscription/OutOfCreditsModal'

const NAV = [
  {
    group: 'Workspace',
    items: [
      { href: '/chat',      icon: 'ti-messages',         label: 'Chat', mobileOnly: true },
      { href: '/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard', key: 'dashboard' },
      { href: '/cases',     icon: 'ti-folder',           label: 'Cases',     key: 'cases' },
      { href: '/hearings',  icon: 'ti-notebook',         label: 'Hearings',  key: 'hearings' },
      { href: '/calendar',  icon: 'ti-calendar',         label: 'Calendar',  key: 'calendar' },
      { href: '/strategy',  icon: 'ti-target',           label: 'Strategy',  key: 'strategy' },
      { href: '/documents', icon: 'ti-files',            label: 'Documents', key: 'documents' },
      { href: '/client',    icon: 'ti-message-circle',   label: 'Client',    key: 'clients' },
    ],
  },
  {
    group: 'AI',
    items: [
      { href: '/analysis', icon: 'ti-brain',  label: 'Analysis', key: 'analysis' },
      { href: '/drafting', icon: 'ti-pencil', label: 'Drafting', key: 'drafting' },
    ],
  },
  {
    group: 'Business',
    items: [
      { href: '/billing',   icon: 'ti-coin',          label: 'Billing',      key: 'billing' },
      { href: '/analytics', icon: 'ti-chart-bar',     label: 'AI Analytics', key: 'analytics' },
      { href: '/financial', icon: 'ti-cash',          label: 'Financial',    key: 'financial' },
      { href: '/readiness', icon: 'ti-shield-check',  label: 'Readiness',    key: 'readiness' },
    ],
  },
  {
    group: 'Masters',
    superAdminOnly: true,
    items: [
      { href: '/masters/users', icon: 'ti-users',        label: 'User Master',  key: 'masters/users' },
      { href: '/masters/roles', icon: 'ti-shield-check', label: 'Roles Master', key: 'masters/roles' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarExpanded, toggleSidebar } = useUIStore()
  const { selectedCaseId, selectedCaseName } = useCaseStore()

  const expanded = sidebarExpanded

  const [ready, setReady] = useState(false)
  const [role, setRole] = useState('')
  const [permsVersion, setPermsVersion] = useState(0)
  const [credits, setCredits] = useState<number | null>(null)
  const [showNoCredits, setShowNoCredits] = useState(false)
  const [upcomingHearingsCount, setUpcomingHearingsCount] = useState<number>(0)

  const refreshCredits = () => {
    // SuperAdmins don't need credits display - they have unlimited access
    if (role === 'SuperAdmin') return
    walletApi.getSummary().then((d: any) => setCredits(d?.balance ?? 0)).catch(() => {})
  }

  const refreshHearingsCount = () => {
    const currentCaseId = useCaseStore.getState().selectedCaseId
    if (!currentCaseId) {
      setUpcomingHearingsCount(0)
      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('clausio_token') : null
    if (!token) return

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5123/api').replace(/\/+$/, '')
    const url = apiBase.endsWith('/api') ? `${apiBase}/cases/${currentCaseId}/hearings` : `${apiBase}/api/cases/${currentCaseId}/hearings`

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const now = new Date()
          const upcoming = data.filter(h => {
            const d = new Date(h.hearingDate || h.HearingDate)
            return d >= now
          }).length
          setUpcomingHearingsCount(upcoming)
        } else {
          setUpcomingHearingsCount(0)
        }
      })
      .catch(() => setUpcomingHearingsCount(0))
  }

  // Initial load with retry — the auth token may not be readable on the first tick after
  // login, which would otherwise leave the balance stuck on "—" until a manual refresh.
  useEffect(() => {
    if (role === 'SuperAdmin') return
    let attempts = 0
    let timer: ReturnType<typeof setTimeout>
    const fetchCredits = () => {
      attempts++
      walletApi.getSummary()
        .then((d: any) => setCredits(d?.balance ?? 0))
        .catch(() => { if (attempts < 3) timer = setTimeout(fetchCredits, 2000) })
    }
    timer = setTimeout(fetchCredits, 500)
    return () => clearTimeout(timer)
  }, [role])

  useEffect(() => {
    const handler = () => setShowNoCredits(true)
    window.addEventListener('insufficient-credits', handler)
    return () => window.removeEventListener('insufficient-credits', handler)
  }, [])

  // Tablets (768–1024px) default to the icon-only rail — a lawyer's persisted "expanded"
  // preference from a desktop session would otherwise eat a third of a tablet's width.
  // Mobile (<768px) is untouched here — .app-sidebar becomes a fixed overlay there via CSS.
  useEffect(() => {
    function collapseOnTablet() {
      const w = window.innerWidth
      if (w >= 768 && w < 1024 && sidebarExpanded) toggleSidebar()
    }
    collapseOnTablet()
    window.addEventListener('resize', collapseOnTablet)
    return () => window.removeEventListener('resize', collapseOnTablet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarExpanded])

  // Initial load of upcoming hearings count and whenever active case changes
  useEffect(() => {
    refreshHearingsCount()
    const handler = () => refreshHearingsCount()
    window.addEventListener('hearings-updated', handler)
    return () => window.removeEventListener('hearings-updated', handler)
  }, [selectedCaseId])

  // Any successful AI call spends credits — refresh the balance when api.ts signals it.
  useEffect(() => {
    const handler = () => refreshCredits()
    window.addEventListener('credits-updated', handler)
    return () => window.removeEventListener('credits-updated', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  // Load THIS signed-in user's page permissions from the backend every time the sidebar
  // mounts (i.e. on login and on every cross-section navigation). Tagged with the user id
  // so a previous user's cached permissions can never leak into this session.
  useEffect(() => {
    let cancelled = false
    setRole(getRole())
    let raw: any = {}
    try { raw = JSON.parse(localStorage.getItem('clausio_user') || '{}') } catch { raw = {} }
    const myId: string | undefined = raw.userId || raw.id

    if (!myId) { setReady(true); return }

    adminApi.getMyPermissions()
      .then((r: any) => {
        if (cancelled) return
        storePermissions(myId, r?.pageKeys ?? [], !!r?.unrestricted)
      })
      .catch(() => { /* offline / transient — default allow all until next load */ })
      .finally(() => {
        if (cancelled) return
        setPermsVersion(v => v + 1)
        setReady(true)
      })
    return () => { cancelled = true }
  }, [])

  // Direct-URL guard: bounce the user to /dashboard if they open a page they can't access.
  useEffect(() => {
    if (!ready) return
    const key = pageKeyForPath(pathname)
    if (!key) return
    const blocked = key.startsWith('masters/')
      ? getRole() !== 'SuperAdmin'
      : !hasPagePermission(key)
    if (blocked && pathname !== '/dashboard') {
      alert('You do not have access to this page')
      router.replace('/dashboard')
    }
  }, [pathname, ready, permsVersion, router])

  const visibleNav = NAV
    .filter(section => !(section as any).superAdminOnly || role === 'SuperAdmin')
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        !ready || !(item as any).key || hasPagePermission((item as any).key)),
    }))
    .filter(section => section.items.length > 0)

  return (
    <>
      {/* Mobile Backdrop Overlay (< 768px) */}
      {sidebarExpanded && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={toggleSidebar}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9997,
          }}
        />
      )}

      <aside
        className={`glass-sidebar app-sidebar ${sidebarExpanded ? 'mobile-open' : 'mobile-closed'}`}
        style={{
          width: expanded ? 220 : 64, // Slightly wider for iOS feel
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)', // Apple springy feel
          display: 'flex',
          flexDirection: 'column',
          margin: '16px 0 16px 16px',
          borderRadius: 24,
        }}
      >
        {/* Toggle & Mobile Header */}
        <div className="mobile-sidebar-title" style={{ display: 'none', padding: '16px 16px 8px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Clausio</span>
          <button
            onClick={toggleSidebar}
            className="glass-button"
            style={{
              width: 32,
              height: 32,
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 18 }} />
          </button>
        </div>



      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '12px 12px 0 12px'
        }}
      >
        {visibleNav.map((section) => (
          <div key={section.group} style={{ marginBottom: 16 }}>
            {expanded && (
              <div
                style={{
                  padding: '8px 12px 4px',
                  fontSize: 11,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  fontWeight: 600,
                }}
              >
                {section.group}
              </div>
            )}

            {section.items.map((item) => {
              const active = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={(item as any).mobileOnly ? 'mobile-only-nav-item' : ''}
                  title={!expanded ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    gap: expanded ? 12 : 0,
                    margin: '4px 0',
                    padding: expanded ? '0 12px' : 0,
                    height: 40,
                    borderRadius: 16,
                    position: 'relative',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    background: active
                      ? 'rgba(255, 255, 255, 0.8)'
                      : 'transparent',
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  {item.label === 'Analysis' ? (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <video 
                        src="/aivideo.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.8)' }} 
                      />
                    </div>
                  ) : (
                    <i
                      className={`ti ${item.icon}`}
                      style={{
                        fontSize: 20,
                        color: active ? '#0f172a' : '#64748b',
                        flexShrink: 0,
                        transition: 'color 0.2s ease',
                      }}
                    />
                  )}

                  {expanded && (
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: active ? 600 : 500,
                        color: active ? '#0f172a' : '#475569',
                      }}
                    >
                      {item.label}
                    </span>
                  )}

                  {(() => {
                    const badgeValue = item.key === 'hearings' ? upcomingHearingsCount : (item as any).badge
                    if (!badgeValue || badgeValue <= 0) return null

                    if (expanded) {
                      return (
                        <span
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 999,
                            padding: '2px 8px',
                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          {badgeValue}
                        </span>
                      )
                    }

                    return (
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 12,
                          background: '#ef4444',
                          color: '#fff',
                          fontSize: 9,
                          fontWeight: 700,
                          borderRadius: 999,
                          minWidth: 15,
                          height: 15,
                          padding: '0 3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        {badgeValue > 99 ? '99+' : badgeValue}
                      </span>
                    )
                  })()}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── DESKTOP BOTTOM ACTIONS (Credits display only for non-SuperAdmins) ── */}
      <div className="desktop-sidebar-bottom" style={{ padding: '12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        {expanded && role !== 'SuperAdmin' && (
          <div style={{
            margin: '8px 12px 4px',
            padding: '10px 14px',
            borderRadius: 10,
            background: credits !== null && credits < 10
              ? 'rgba(220,38,38,0.08)'
              : 'rgba(37,99,235,0.08)',
            border: credits !== null && credits < 10
              ? '1px solid rgba(220,38,38,0.2)'
              : '1px solid rgba(37,99,235,0.2)',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}>
              AI Credits
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: credits !== null && credits < 10 ? '#dc2626' : '#2563eb',
              lineHeight: 1,
            }}>
              {credits ?? '—'}
            </div>
            {credits !== null && credits < 10 && credits > 0 && (
              <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>
                ⚠️ Low — contact us for more
              </div>
            )}
            {credits === 0 && (
              <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>
                ❌ No credits remaining
              </div>
            )}
          </div>
        )}
        <Link
          href="/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: expanded ? 12 : 0,
            padding: expanded ? '0 12px' : 0,
            height: 40,
            borderRadius: 16,
            color: '#475569',
            textDecoration: 'none',
            transition: 'background 0.2s ease',
          }}
        >
          <i className="ti ti-settings" style={{ fontSize: 20 }} />
          {expanded && <span style={{ fontSize: 14, fontWeight: 500 }}>Settings</span>}
        </Link>
        <button
          onClick={() => {
            document.cookie = 'clausio_token=; path=/; max-age=0'
            localStorage.removeItem('clausio_token')
            localStorage.removeItem('clausio_user')
            localStorage.removeItem('clausio-auth')
            localStorage.removeItem('clausio_page_permissions')
            window.location.href = '/auth/login'
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center', gap: expanded ? 12 : 0, padding: expanded ? '0 12px' : 0, height: 40, borderRadius: 16, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', width: '100%', marginTop: 4, fontFamily: 'inherit' }}
        >
          <i className="ti ti-logout" style={{ fontSize: 20, flexShrink: 0 }} />
          {expanded && <span style={{ fontSize: 14, fontWeight: 500 }}>Logout</span>}
        </button>
      </div>

      {/* ── MOBILE DRAWER BOTTOM ACTIONS (Matching Prototype: White "Log Out" Pill + Circular Gear) ── */}
      <div className="mobile-sidebar-bottom" style={{ display: 'none', padding: '16px', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
        <button
          onClick={() => {
            document.cookie = 'clausio_token=; path=/; max-age=0'
            localStorage.removeItem('clausio_token')
            localStorage.removeItem('clausio_user')
            localStorage.removeItem('clausio-auth')
            localStorage.removeItem('clausio_page_permissions')
            window.location.href = '/auth/login'
          }}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 22,
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            color: '#0f172a',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s',
          }}
          onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Log Out
        </button>

        <Link
          href="/settings"
          onClick={() => toggleSidebar()}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            flexShrink: 0,
            transition: 'transform 0.1s',
          }}
          onPointerDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="ti ti-settings" style={{ fontSize: 20, color: '#0f172a' }} />
        </Link>
      </div>

      {showNoCredits && (
        <OutOfCreditsModal
          onClose={() => {
            setShowNoCredits(false)
            refreshCredits()
          }}
        />
      )}
    </aside>
    </>
  )
}