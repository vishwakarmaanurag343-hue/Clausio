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

  return NextResponse.next()
}

// Routes this middleware protects
export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/dashboard/:path*',
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