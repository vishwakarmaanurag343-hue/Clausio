import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes accessible without authentication
const PUBLIC_PATHS = ['/auth/login', '/login', '/auth/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static assets, images, and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Auth callback (landing-site signup/login hands the JWT here). Always let it
  // run so it can set the session cookie — regardless of current auth state.
  if (pathname === '/auth/callback') {
    return NextResponse.next()
  }

  const token = request.cookies.get('clausio_token')?.value
  const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))

  // Block Coming Soon pages — redirect everyone to dashboard
  const COMING_SOON_PATHS = ['/billing', '/analytics', '/financial', '/readiness', '/calendar']
  if (COMING_SOON_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // 1. If user is NOT logged in and tries to access protected pages -> redirect to /auth/login immediately on server
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 2. If user IS logged in and tries to access login/register pages -> redirect to /dashboard
  if (token && isPublicPath) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // 3. Client-portal vs dashboard role separation. Decodes the JWT's own "role"
  // claim client-side-style (split on "." + atob() on the payload, no library).
  // Any decode failure or missing token just falls through — no redirect.
  if (token) {
    const isClientPortal = pathname === '/client-portal' || pathname.startsWith('/client-portal/')
    const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/')

    if (isClientPortal || isDashboard) {
      try {
        const payloadB64 = token.split('.')[1]
        const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(normalized))
        const role =
          payload?.role ||
          payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']

        // Rule 1: Protect /client-portal — non-Client roles get sent to /dashboard
        if (isClientPortal && role !== 'Client') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Rule 2: Protect /dashboard from clients — Client role gets sent to /client-portal
        if (isDashboard && role === 'Client') {
          return NextResponse.redirect(new URL('/client-portal', request.url))
        }
      } catch {
        // Missing/invalid JWT payload — do not redirect, let existing auth handling take over.
      }
    }
  }

  return NextResponse.next()
}

// Routes this middleware protects
export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/dashboard/:path*',
    '/client-portal/:path*',
    '/cases/:path*',
    '/hearings/:path*',
    '/strategy/:path*',
    '/client/:path*',
    '/financial/:path*',
    '/readiness/:path*',
    '/analysis/:path*',
    '/analytics/:path*',
    '/billing/:path*',
    '/settings/:path*',
    '/drafting/:path*',
    '/console/:path*',
    '/masters/:path*',
    '/auth/:path*',
    '/login',
  ]
}