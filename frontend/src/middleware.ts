import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes accessible without authentication
const PUBLIC_PATHS = ['/auth/login', '/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
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
    '/auth/:path*',
    '/login',
  ]
}