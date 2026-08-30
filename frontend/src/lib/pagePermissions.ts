// ── Page-access permission model shared by the Sidebar and Masters → Roles ──

export interface PageDef { key: string; label: string; href: string }

export const PAGE_SECTIONS: { section: string; superAdminOnly?: boolean; pages: PageDef[] }[] = [
  {
    section: 'Workspace',
    pages: [
      { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
      { key: 'cases',     label: 'Cases',     href: '/cases' },
      { key: 'clients',   label: 'Clients',   href: '/client' },
      { key: 'hearings',  label: 'Hearings',  href: '/hearings' },
      { key: 'documents', label: 'Documents', href: '/documents' },
      { key: 'calendar',  label: 'Calendar',  href: '/calendar' },
      { key: 'strategy',  label: 'Strategy',  href: '/strategy' },
    ],
  },
  {
    section: 'AI',
    pages: [
      { key: 'analytics',      label: 'AI Analytics',   href: '/analytics' },
      { key: 'analysis',       label: 'Analysis',       href: '/analysis' },
      { key: 'drafting',       label: 'Drafting',       href: '/drafting' },
      { key: 'readiness',      label: 'Readiness',      href: '/readiness' },
      { key: 'evidence-graph', label: 'Evidence Graph', href: '/evidence-graph' },
    ],
  },
  {
    section: 'Business',
    pages: [
      { key: 'financial', label: 'Financial', href: '/financial' },
      { key: 'billing',   label: 'Billing',   href: '/billing' },
    ],
  },
  {
    section: 'Masters',
    superAdminOnly: true,
    pages: [
      { key: 'masters/users', label: 'User Master',  href: '/masters/users' },
      { key: 'masters/roles', label: 'Roles Master', href: '/masters/roles' },
    ],
  },
]

const PERM_KEY = 'clausio_page_permissions'

interface PermBlob { userId: string; unrestricted: boolean; keys: string[] }

function currentUser(): { id?: string; role?: string } {
  try {
    const u = JSON.parse(localStorage.getItem('clausio_user') || '{}')
    // The login response stores the id as `userId`; /auth/me uses `id`.
    return { id: u.userId || u.id, role: u.role }
  } catch {
    return {}
  }
}

export function getRole(): string {
  return currentUser().role || ''
}

/** Called after fetching /admin/my-permissions — tagged with the user id it belongs to. */
export function storePermissions(userId: string, pageKeys: string[], unrestricted: boolean) {
  try {
    const blob: PermBlob = { userId, unrestricted: !!unrestricted, keys: Array.isArray(pageKeys) ? pageKeys : [] }
    localStorage.setItem(PERM_KEY, JSON.stringify(blob))
  } catch { /* private mode */ }
}

export function clearPermissions() {
  try { localStorage.removeItem(PERM_KEY) } catch { /* ignore */ }
}

function readBlob(): PermBlob | null {
  try {
    const raw = localStorage.getItem(PERM_KEY)
    if (!raw) return null
    const b = JSON.parse(raw)
    return (b && typeof b === 'object' && Array.isArray(b.keys)) ? b as PermBlob : null
  } catch { return null }
}

/**
 * SuperAdmin → always allowed. Otherwise: allowed until this user's permissions have
 * actually been loaded this session; then allowed when unrestricted, when no rows are
 * configured (default = allow all), or when the key is in the list.
 */
export function hasPagePermission(pageKey: string): boolean {
  const me = currentUser()
  if (me.role === 'SuperAdmin') return true

  const blob = readBlob()
  if (!blob || blob.userId !== me.id) return true   // not loaded for this user yet → allow (pending refresh)
  if (blob.unrestricted) return true
  if (blob.keys.length === 0) return true           // no permissions configured → allow all
  return blob.keys.includes(pageKey)
}

/** True once we have a permission blob for the currently signed-in user. */
export function permissionsLoadedForCurrentUser(): boolean {
  const me = currentUser()
  if (me.role === 'SuperAdmin') return true
  const blob = readBlob()
  return !!blob && blob.userId === me.id
}

/** Map a pathname to its page key (for the direct-URL redirect guard). */
export function pageKeyForPath(pathname: string): string | null {
  for (const s of PAGE_SECTIONS) {
    for (const p of s.pages) {
      if (pathname === p.href || pathname.startsWith(p.href + '/')) return p.key
    }
  }
  return null
}
