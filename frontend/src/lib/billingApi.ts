const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5123/api'

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('clausio_token') ?? ''
}

async function req<T>(method: string, path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
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
