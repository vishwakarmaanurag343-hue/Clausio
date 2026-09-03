const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5123/api'

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('clausio_token') ?? ''
}

// Convert camelCase keys to PascalCase for .NET backend
function toPascal(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toPascal)
  if (typeof obj !== 'object') return obj
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.charAt(0).toUpperCase() + k.slice(1),
      toPascal(v)
    ])
  )
}

async function req<T>(method: string, path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(toPascal(body)) : undefined,
  })
  if (!res.ok) { const err = await res.text().catch(() => res.statusText); throw new Error(err || `Request failed: ${res.status}`) }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const billingApi = {
  getStats:      ()                           => req<any>('GET',    '/billing/stats'),
  getInvoices:   ()                           => req<any[]>('GET',  '/billing/invoices'),
  createInvoice: (data: any)                  => req<any>('POST',   '/billing/invoices', data),
  updateStatus:  (id: string, status: string) => req<any>('PUT',    `/billing/invoices/${id}/status`, { status }),
  deleteInvoice: (id: string)                 => req<void>('DELETE',`/billing/invoices/${id}`),
  getPayments:   (caseId?: string)            => req<any[]>('GET',  `/billing/payments${caseId ? `?caseId=${caseId}` : ''}`),
  recordPayment: (data: any)                  => req<any>('POST',   '/billing/payments', data),
  deletePayment: (id: string)                 => req<void>('DELETE',`/billing/payments/${id}`),
  getExpenses:   (caseId?: string)            => req<any[]>('GET',  `/billing/expenses${caseId ? `?caseId=${caseId}` : ''}`),
  createExpense: (data: any)                  => req<any>('POST',   '/billing/expenses', data),
  deleteExpense: (id: string)                 => req<void>('DELETE',`/billing/expenses/${id}`),
}

export const subscriptionApi = {
  getStatus: () =>
    req<any>('GET', '/subscription/status'),

  getPlans: () =>
    req<any[]>('GET', '/subscription/plans'),

  createOrder: (data: {
    planName: string
    isAnnual: boolean
  }) =>
    req<any>('POST', '/subscription/create-order', data),

  verifyPayment: (data: {
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
    planName: string
    isAnnual: boolean
  }) =>
    req<any>('POST', '/subscription/verify-payment', data),

  getBillingHistory: () =>
    req<any[]>('GET', '/subscription/billing-history'),

  cancel: (reason: string) =>
    req<any>('POST', '/subscription/cancel', { reason }),
}

export const subscriptionCheckApi = {
  check: () =>
    req<{
      isActive: boolean
      canUseAI: boolean
      planName: string
      status: string
      daysRemaining: number
      isTrial: boolean
      showWarning: boolean
      message: string | null
    }>('GET', '/subscription/check'),
}
