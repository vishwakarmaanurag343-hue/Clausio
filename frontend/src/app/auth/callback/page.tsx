'use client'

import { useEffect } from 'react'

// Same base resolution as src/lib/api.ts
const RAW = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5123').replace(/\/+$/, '')
const API_BASE = RAW.endsWith('/api') ? RAW : `${RAW}/api`

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      window.location.replace('/auth/login')
      return
    }

    // Establish the session exactly like authApi.login() does:
    //  - localStorage 'clausio_token' for the API client
    //  - cookie 'clausio_token' for the Next.js middleware auth guard
    //  - drop any previous user's cached page permissions
    try {
      localStorage.setItem('clausio_token', token)
      localStorage.removeItem('clausio_page_permissions')
      document.cookie = `clausio_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`
    } catch {
      /* storage unavailable — cookie still lets the guard through */
    }

    // Best effort: hydrate the full user object so authApi.getUser() works.
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user) {
          try {
            localStorage.setItem('clausio_user', JSON.stringify(user))
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* ignore — token is valid, dashboard will fetch what it needs */
      })
      .finally(() => {
        const isMobile =
          typeof window !== 'undefined' && window.innerWidth <= 768
        window.location.replace(isMobile ? '/chat' : '/dashboard')
      })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      background: '#f8fafc',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚖️</div>
        <div style={{ fontSize: 16, color: '#64748b', fontWeight: 600 }}>
          Setting up your workspace...
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
          You will be redirected shortly
        </div>
      </div>
    </div>
  )
}
