// src/lib/api.ts
export const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5123').replace(/\/+$/, '').endsWith('/api')
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5123').replace(/\/+$/, '')
  : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5123').replace(/\/+$/, '')}/api`

// Every /api/ai/* endpoint returns { result: string }. The AI is prompted to answer in
// plain prose, so `result` is not guaranteed to be JSON — try to parse it as structured
// data (optionally wrapped in a ```json fence) and fall back to null so callers can
// display the raw text instead.
// ============================================================
// REPLACE the existing parseAiJson function in src/lib/api.ts
// with this improved version
// ============================================================

export function parseAiJson<T = any>(raw: string | undefined | null): T | null {
  if (!raw) return null

  // Step 0 — Strip reasoning-model <think> blocks. An UNCLOSED block means the
  // model was cut off mid-deliberation and emitted nothing usable.
  let cleaned = raw.trim()
  if (/<think>/i.test(cleaned)) {
    if (!/<\/think>/i.test(cleaned)) return null
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  }

  // Step 1 — Clean markdown code blocks
  cleaned = cleaned.replace(/^```json\s*/i, '')
  cleaned = cleaned.replace(/^```\s*/i, '')
  cleaned = cleaned.replace(/```\s*$/i, '')
  cleaned = cleaned.trim()

  // Step 2 — Try direct parse first
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // continue to next strategies
  }

  // Step 3 — Find JSON object in text (AI sometimes adds preamble)
  // Look for { ... } pattern
  const objMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]) as T
    } catch {
      // continue
    }
  }

  // Step 4 — Find JSON array in text
  // Look for [ ... ] pattern
  const arrMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]) as T
    } catch {
      // continue
    }
  }

  // Step 5 — Fix common AI JSON mistakes
  // Fix trailing commas (common AI mistake)
  try {
    const fixed = cleaned
      .replace(/,\s*}/g, '}')   // trailing comma before }
      .replace(/,\s*\]/g, ']')  // trailing comma before ]
    return JSON.parse(fixed) as T
  } catch {
    // continue
  }

  // Step 6 — Extract JSON from text with preamble
  // Pattern: "Here is the analysis:\n{...}" or "Result:\n[...]"
  const afterColon = cleaned.indexOf('\n{')
  if (afterColon !== -1) {
    try {
      return JSON.parse(cleaned.substring(afterColon + 1)) as T
    } catch { }
  }

  const afterColonArr = cleaned.indexOf('\n[')
  if (afterColonArr !== -1) {
    try {
      return JSON.parse(cleaned.substring(afterColonArr + 1)) as T
    } catch { }
  }

  // All strategies failed — return null
  return null
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('clausio_token')
}

function headers(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handle(res: Response, fallbackMessage: string) {
  // Capture active sliding session token if issued
  const newToken = res.headers.get('x-new-token')
  if (newToken && typeof window !== 'undefined') {
    localStorage.setItem('clausio_token', newToken)
  }

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('clausio_token')
    localStorage.removeItem('clausio_user')
    document.cookie = 'clausio_token=; path=/; max-age=0'
    if (window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login'
    }
    throw new Error('Security Violation / Session Expired: Access denied. Please sign in again.')
  }
  if (!res.ok) {
    let message = fallbackMessage
    try {
      const data = await res.json()
      message = data.error || data.message || data.title || fallbackMessage
    } catch {
      // response had no JSON body
    }
    // Trial / subscription lapsed — send the advocate to the plans page instead
    // of surfacing a generic error.
    if (typeof message === 'string' && message.includes('SUBSCRIPTION_EXPIRED')) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/billing')) {
        window.location.href = '/billing?tab=Subscription'
      }
    }
    // Out of AI credits — let the shell show the OutOfCreditsModal.
    if (typeof message === 'string' && message.includes('INSUFFICIENT_CREDITS')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('insufficient-credits'))
      }
    }
    throw new Error(message)
  }
  if (res.status === 204) return null
  const responseText = await res.text()
  if (!responseText || !responseText.trim()) return null
  try {
    return JSON.parse(responseText)
  } catch {
    return responseText
  }
}

// Any successful /api/ai/* call may have spent wallet credits — tell the shell to
// refresh the sidebar balance.
function notifyIfAiCall(path: string) {
  if (path.startsWith('/ai/') && typeof window !== 'undefined') {
    try { window.dispatchEvent(new CustomEvent('credits-updated')) } catch { /* no-op */ }
  }
}

function get(path: string, fallbackMessage: string) {
  return fetch(`${BASE}${path}`, { headers: headers() })
    .then(res => handle(res, fallbackMessage))
    .then(result => { notifyIfAiCall(path); return result })
}

function send(method: string, path: string, data: any, fallbackMessage: string, options?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: data !== undefined ? JSON.stringify(data) : undefined,
    ...options,
  })
    .then(res => handle(res, fallbackMessage))
    .then(result => { notifyIfAiCall(path); return result })
}

function del(path: string, fallbackMessage: string) {
  return fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() }).then(res => handle(res, fallbackMessage))
}

export const authApi = {
  register: (data: any) => send('POST', '/auth/register', data, 'Failed to register'),

  login: async (email: string, password: string) => {
    const data = await send('POST', '/auth/login', { email, password }, 'Invalid email or password')
    localStorage.setItem('clausio_token', data.token)
    localStorage.setItem('clausio_user', JSON.stringify(data))
    localStorage.removeItem('clausio_page_permissions') // never carry a previous user's page access
    // ✅ NEW — save to cookie for Next.js middleware auth guard
    if (typeof window !== 'undefined') {
      document.cookie = `clausio_token=${data.token}; path=/; max-age=${604800}`
    }
    return data
  },

  me: () => get('/auth/me', 'Failed to fetch current user'),

  logout: () => {
    localStorage.removeItem('clausio_token')
    localStorage.removeItem('clausio_user')
    localStorage.removeItem('clausio-case')
    if (typeof window !== 'undefined') {
      document.cookie = 'clausio_token=; path=/; max-age=0'
    }
  },
changePassword: (data: any) => send('PUT', '/auth/change-password', data, 'Failed to change password'),
  getUser: () => {
    if (typeof window === 'undefined') return null
    const user = localStorage.getItem('clausio_user')
    return user ? JSON.parse(user) : null
  },
}

export const casesApi = {
  getAll: () => get('/cases', 'Failed to fetch cases'),
  getById: (id: string) => get(`/cases/${id}`, 'Failed to fetch case'),
  create: (data: any) => send('POST', '/cases', data, 'Failed to create case'),
  update: (id: string, data: any) => send('PUT', `/cases/${id}`, data, 'Failed to update case'),
  remove: (id: string) => del(`/cases/${id}`, 'Failed to delete case'),
}

export const aiAnalyticsApi = {
  getOverview: async () => {
    return get('/ai-analytics/overview', 'Failed to fetch AI overview')
  },
  getQuality: async () => {
    return get('/ai-analytics/quality', 'Failed to fetch AI quality metrics')
  },
  getModels: async () => {
    return get('/ai-analytics/models', 'Failed to fetch model metrics')
  },
  getLogs: async (limit: number = 20) => {
    return get(`/ai-analytics/logs?limit=${limit}`, 'Failed to fetch AI telemetry logs')
  }
}
export const clientsApi = {
  getAll: () => get('/clients', 'Failed to fetch clients'),
  getById: (id: string) => get(`/clients/${id}`, 'Failed to fetch client'),
  create: (data: any) => send('POST', '/clients', data, 'Failed to create client'),
  update: (id: string, data: any) => send('PUT', `/clients/${id}`, data, 'Failed to update client'),
  remove: (id: string) => del(`/clients/${id}`, 'Failed to delete client'),
}

export const hearingsApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/hearings`, 'Failed to fetch hearings'),
  create: (caseId: string, data: any) => send('POST', `/cases/${caseId}/hearings`, data, 'Failed to create hearing'),
  update: (caseId: string, id: string, data: any) => send('PUT', `/cases/${caseId}/hearings/${id}`, data, 'Failed to update hearing'),
  remove: (caseId: string, id: string) => del(`/cases/${caseId}/hearings/${id}`, 'Failed to delete hearing'),
  markOrderDone: (caseId: string, hearingId: string, orderId: string) =>
    send('PUT', `/cases/${caseId}/hearings/${hearingId}/orders/${orderId}/done`, undefined, 'Failed to mark order done'),
}

export const witnessesApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/witnesses`, 'Failed to fetch witnesses'),
  create:      (caseId: string, data: any) => send('POST', `/cases/${caseId}/witnesses`, data, 'Failed to add witness'),
  remove:      (caseId: string, id: string) => del(`/cases/${caseId}/witnesses/${id}`, 'Failed to delete witness'),
}

export const notesApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/notes`, 'Failed to fetch notes'),
  create:      (caseId: string, data: any) => send('POST', `/cases/${caseId}/notes`, data, 'Failed to save note'),
  update:      (caseId: string, id: string, data: any) => send('PUT', `/cases/${caseId}/notes/${id}`, data, 'Failed to update note'),
  remove:      (caseId: string, id: string) => del(`/cases/${caseId}/notes/${id}`, 'Failed to delete note'),
}

// Prompt Library / Drafting — the lawyer's own firm documents kept as AI style references.
export const promptReferenceApi = {
  getAll: () => send('GET', '/prompt-references', undefined, 'Failed to load reference docs'),
  getOne: (id: string) => send('GET', `/prompt-references/${id}`, undefined, 'Failed to load reference doc'),
  upload: async (file: File, title: string, docType: string) => {
    const token = (typeof window !== 'undefined' && localStorage.getItem('clausio_token')) || ''
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('docType', docType)
    const res = await fetch(`${BASE}/prompt-references`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) {
      let msg = 'Upload failed'
      try { msg = (await res.json())?.error || msg } catch { /* non-JSON */ }
      throw new Error(msg)
    }
    return res.json()
  },
  delete: (id: string) => send('DELETE', `/prompt-references/${id}`, undefined, 'Failed to delete'),
}

// "Add New Case" description input — extract text from an uploaded PDF / DOCX / TXT.
export const extractTextApi = {
  fromFile: async (file: File): Promise<{ text: string; fileName: string; wordCount: number }> => {
    const token = (typeof window !== 'undefined' && localStorage.getItem('clausio_token')) || ''
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${BASE}/documents/extract-text`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) {
      let msg = 'Failed to extract text'
      try { msg = (await res.json())?.error || msg } catch { /* non-JSON body */ }
      throw new Error(msg)
    }
    return res.json()
  },
}

// Masters → User Master / Roles Master (SuperAdmin). Reuses the /api/admin/* controller.
export const adminApi = {
  getUsers:         () => send('GET', '/admin/users?pageSize=200', undefined, 'Failed to get users'),
  getUser:          (id: string) => send('GET', `/admin/users/${id}`, undefined, 'Failed to get user'),
  createUser:       (data: { firstName: string; lastName: string; email: string; phone?: string; role?: string; tempPassword: string }) =>
                      send('POST', '/admin/users', data, 'Failed to create user'),
  updateUser:       (id: string, data: any) => send('PUT', `/admin/users/${id}`, data, 'Failed to update user'),
  updateUserRole:   (id: string, role: string) => send('PUT', `/admin/users/${id}/role`, { role }, 'Failed to update role'),
  deleteUser:       (id: string) => send('DELETE', `/admin/users/${id}`, undefined, 'Failed to delete user'),
  getPermissions:   (userId: string) => send('GET', `/admin/permissions/${userId}`, undefined, 'Failed to get permissions'),
  savePermissions:  (userId: string, pageKeys: string[]) => send('PUT', `/admin/permissions/${userId}`, { pageKeys }, 'Failed to save permissions'),
  getMyPermissions: () => send('GET', '/admin/my-permissions', undefined, 'Failed to load permissions'),
  getCreditStats:   () => send('GET', '/admin/credit-stats', undefined, 'Failed to load credit stats'),
}

// Settings → Notifications tab (api/notification-settings → NotificationSettingsController)
export const notificationApi = {
  get:    () => send('GET', '/notification-settings', undefined, 'Failed to load notification settings'),
  update: (data: any) => send('PUT', '/notification-settings', data, 'Failed to save notification settings'),
}

// Settings → Team tab (api/team → TeamController)
export const teamApi = {
  getMembers: () => send('GET', '/team/members', undefined, 'Failed to load team'),
  invite: (data: { email: string; firstName?: string; lastName?: string; phone?: string; role?: string }) =>
    send('POST', '/team/invite', data, 'Failed to send invitation'),
  updateRole: (id: string, role: string) =>
    send('PUT', `/team/members/${id}/role`, { role }, 'Failed to update role'),
  removeMember: (id: string) =>
    send('DELETE', `/team/members/${id}`, undefined, 'Failed to remove member'),
}

// Settings → Billing tab (api/settings/billing → SettingsBillingController)
export const settingsBillingApi = {
  getSummary: () => send('GET', '/settings/billing/summary', undefined, 'Failed to load billing summary'),
}

// Floating Notes panel — free-form notepad synced per user (api/notes → NotepadController)
export const notepadApi = {
  getForCase: (caseId: string) =>
    send('GET', `/notes?caseId=${caseId}`, undefined, 'Failed to get notes'),
  getGeneral: () =>
    send('GET', '/notes/general', undefined, 'Failed to get notes'),
  getAll: () =>
    send('GET', '/notes/all', undefined, 'Failed to get notes'),
  save: (data: { caseId?: string; category: string; content: string }) =>
    send('POST', '/notes', data, 'Failed to save note'),
  delete: (id: string) =>
    send('DELETE', `/notes/${id}`, undefined, 'Failed to delete note'),
}

export const integrationsApi = {
  getStatus: () => get(`/integrations/google/status`, 'Failed to fetch calendar status') as Promise<any>,
  getAuthUrl: () => get(`/integrations/google/auth-url`, 'Failed to start Google connection'),
  resync:    () => send('POST', `/integrations/google/sync`, undefined, 'Calendar re-sync failed'),
  disconnect:() => del(`/integrations/google`, 'Failed to disconnect Google Calendar'),
}

export const calendarApi = {
  pushHearing: (caseId: string, hearingId: string) =>
    send('POST', `/cases/${caseId}/calendar/hearings/${hearingId}`, undefined, 'Could not add hearing to calendar'),
  pushOrder: (caseId: string, orderId: string) =>
    send('POST', `/cases/${caseId}/calendar/orders/${orderId}`, undefined, 'Could not add deadline to calendar'),
}

// In-app Calendar tab — proxy over the lawyer's real Google Calendar.
export const userCalendarApi = {
  events: (startIso: string, endIso: string) =>
    get(`/calendar/events?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`, 'Failed to load calendar events') as Promise<any[]>,
  create: (data: any) => send('POST', '/calendar/events', data, 'Failed to create event'),
  update: (eventId: string, data: any) => send('PUT', `/calendar/events/${encodeURIComponent(eventId)}`, data, 'Failed to update event'),
  remove: (eventId: string) => del(`/calendar/events/${encodeURIComponent(eventId)}`, 'Failed to delete event'),
}

export const meetingsApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/meetings`, 'Failed to fetch meetings'),
  create:      (caseId: string, data: any) => send('POST', `/cases/${caseId}/meetings`, data, 'Failed to schedule meeting'),
  remove:      (caseId: string, id: string) => del(`/cases/${caseId}/meetings/${id}`, 'Failed to delete meeting'),
}

export const documentsApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/documents`, 'Failed to fetch documents'),

  upload: async (caseId: string, file: File, documentType: string, exhibitLabel?: string) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    if (exhibitLabel) formData.append('exhibitLabel', exhibitLabel)

    const res = await fetch(`${BASE}/cases/${caseId}/documents`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    })
    return handle(res, 'Failed to upload document')
  },

  remove: (caseId: string, id: string) => del(`/cases/${caseId}/documents/${id}`, 'Failed to delete document'),

  setFilingStatus: (caseId: string, id: string, data: { filingStatus: 'Filed' | 'Not Filed'; filedDate?: string; filedAtHearingId?: string }) =>
    send('PUT', `/cases/${caseId}/documents/${id}/filing-status`, data, 'Failed to update filing status'),
}

export const timelineApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/timeline`, 'Failed to fetch timeline'),
  create: (caseId: string, data: any) => send('POST', `/cases/${caseId}/timeline`, data, 'Failed to create timeline event'),
  update: (caseId: string, id: string, data: any) => send('PUT', `/cases/${caseId}/timeline/${id}`, data, 'Failed to update timeline event'),
  remove: (caseId: string, id: string) => del(`/cases/${caseId}/timeline/${id}`, 'Failed to delete timeline event'),
  bulkCreate: (caseId: string, data: any) => send('POST', `/cases/${caseId}/timeline/bulk`, data, 'Failed to save timeline'),
  // Replace the entire timeline for the case (drops existing events first).
  bulkReplace: (caseId: string, data: any) => send('PUT', `/cases/${caseId}/timeline/bulk`, data, 'Failed to save timeline'),
}

export const contradictionsApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/contradictions`, 'Failed to fetch contradictions'),
  create: (caseId: string, data: any) => send('POST', `/cases/${caseId}/contradictions`, data, 'Failed to create contradiction'),
  update: (caseId: string, id: string, data: any) => send('PUT', `/cases/${caseId}/contradictions/${id}`, data, 'Failed to update contradiction'),
  remove: (caseId: string, id: string) => del(`/cases/${caseId}/contradictions/${id}`, 'Failed to delete contradiction'),
  summary: (caseId: string) => get(`/cases/${caseId}/contradictions/summary`, 'Failed to fetch contradictions summary'),
}

export const actionPlansApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/actionplans`, 'Failed to fetch action plans'),
  create: (caseId: string, data: any) => send('POST', `/cases/${caseId}/actionplans`, data, 'Failed to create action plan item'),
  update: (caseId: string, id: string, data: any) => send('PUT', `/cases/${caseId}/actionplans/${id}`, data, 'Failed to update action plan item'),
  markDone: (caseId: string, id: string) => send('PUT', `/cases/${caseId}/actionplans/${id}/done`, undefined, 'Failed to mark item done'),
  markUndone: (caseId: string, id: string) => send('PUT', `/cases/${caseId}/actionplans/${id}/undone`, undefined, 'Failed to mark item undone'),
  remove: (caseId: string, id: string) => del(`/cases/${caseId}/actionplans/${id}`, 'Failed to delete action plan item'),
  summary: (caseId: string) => get(`/cases/${caseId}/actionplans/summary`, 'Failed to fetch action plan summary'),
}

export const researchApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/research`, 'Failed to fetch research'),
  create: (caseId: string, data: any) => send('POST', `/cases/${caseId}/research`, data, 'Failed to save research item'),
  update: (caseId: string, id: string, data: any) => send('PUT', `/cases/${caseId}/research/${id}`, data, 'Failed to update research item'),
  remove: (caseId: string, id: string) => del(`/cases/${caseId}/research/${id}`, 'Failed to delete research item'),
  summary: (caseId: string) => get(`/cases/${caseId}/research/summary`, 'Failed to fetch research summary'),
}

export const readinessApi = {
  getByCaseId: (caseId: string) => get(`/cases/${caseId}/readiness`, 'Failed to fetch readiness'),
  generate: (caseId: string, data?: any) => send('POST', `/cases/${caseId}/readiness/generate`, data, 'Failed to generate readiness report'),
  updateScore: (caseId: string, data: any) => send('PUT', `/cases/${caseId}/readiness/score`, data, 'Failed to update readiness score'),
}

export const statsApi = {
  overview: () => get('/stats/overview', 'Failed to fetch stats'),
  cases: () => get('/stats/cases', 'Failed to fetch case stats'),
  hearings: () => get('/stats/hearings', 'Failed to fetch hearing stats'),
  documents: () => get('/stats/documents', 'Failed to fetch document stats'),
  activity: () => get('/stats/activity', 'Failed to fetch activity'),
}

export const draftsApi = {
  create: (data: { caseId: string; draftType: string; title?: string; content: string }) =>
    send('POST', '/drafts', data, 'Failed to save draft'),
  getByCaseId: (caseId: string) =>
    send('GET', `/drafts/case/${caseId}`, undefined, 'Failed to load saved drafts'),
  get: (id: string) =>
    send('GET', `/drafts/${id}`, undefined, 'Failed to load draft history'),
  addVersion: (id: string, content: string) =>
    send('POST', `/drafts/${id}/versions`, { content }, 'Failed to save new draft version'),
  finalize: (id: string) =>
    send('PATCH', `/drafts/${id}/finalize`, {}, 'Failed to mark draft as final'),
  remove: (id: string) =>
    del(`/drafts/${id}`, 'Failed to delete draft'),
  removeVersion: (id: string, versionNumber: number) =>
    send('DELETE', `/drafts/${id}/versions/${versionNumber}`, undefined, 'Failed to delete version'),
}

// "?referenceDocId=" tells the backend to inject the lawyer's firm style-reference doc.
const refQ = (refId?: string | null) => (refId ? `?referenceDocId=${encodeURIComponent(refId)}` : '')

// Client page — send a generated update straight to the client's inbox (api/ai/send-email/:caseId → AiController).
export const emailApi = {
  sendClientEmail: (
    caseId: string,
    data: { toEmail: string; toName?: string; subject: string; body: string },
  ) => send('POST', `/ai/send-email/${caseId}`, data, 'Failed to send email'),
}

// Manual "send hearing reminder now" (api/hearings/:id/send-reminder → HearingRemindersController).
export const hearingRemindersApi = {
  sendManual: (hearingId: string) =>
    send('POST', `/hearings/${hearingId}/send-reminder`, undefined, 'Failed to send reminder'),
}

export const aiApi = {
  getSummary: (caseId: string, options?: RequestInit, refId?: string) => send('POST', `/ai/summary/${caseId}${refQ(refId)}`, undefined, 'Failed to generate summary', options),
  getRisks: (caseId: string) => send('POST', `/ai/risks/${caseId}`, undefined, 'Failed to assess case risks'),
  getRecommendations: (caseId: string) => send('POST', `/ai/recommendations/${caseId}`, undefined, 'Failed to generate recommendations'),
  getChronology: (caseId: string, refId?: string) => send('POST', `/ai/chronology/${caseId}${refQ(refId)}`, undefined, 'Failed to generate chronology'),
  getContradictions: (caseId: string, refId?: string) => send('POST', `/ai/contradictions/${caseId}${refQ(refId)}`, undefined, 'Failed to find contradictions'),
  getEvidence: (documentId: string) => send('POST', `/ai/evidence/${documentId}`, undefined, 'Failed to analyse evidence'),
  getCaseEvidence: (caseId: string) => send('POST', `/ai/case-evidence/${caseId}`, undefined, 'Failed to analyse evidence'),
  getLegalResearch: (caseId: string, refId?: string) => send('POST', `/ai/research/${caseId}${refQ(refId)}`, undefined, 'Failed to fetch research'),
  getActionPlan: (caseId: string, refId?: string) => send('POST', `/ai/actionplan/${caseId}${refQ(refId)}`, undefined, 'Failed to generate action plan'),
  getWhatsApp: (caseId: string, data: any) => send('POST', `/ai/whatsapp/${caseId}`, data, 'Failed to generate WhatsApp update'),
  getFinancial: (caseId: string, data?: any, refId?: string) => send('POST', `/ai/financial/${caseId}${refQ(refId)}`, data, 'Failed to analyse financials'),
  getReadiness: (caseId: string, refId?: string) => send('POST', `/ai/readiness/${caseId}${refQ(refId)}`, undefined, 'Failed to generate readiness report'),
  getEmergency: (caseId: string, data: any) => send('POST', `/ai/emergency/${caseId}`, data, 'Failed to generate emergency response'),
  getPrep: (caseId: string, refId?: string) => send('POST', `/ai/prep/${caseId}${refQ(refId)}`, undefined, 'Failed to generate prep notes'),
  getWitness: (caseId: string, data: any, refId?: string) => send('POST', `/ai/witness/${caseId}${refQ(refId)}`, data, 'Failed to generate witness intelligence'),
  translate: (data: any) => send('POST', '/ai/translate', data, 'Failed to translate'),
  getDraft: (caseId: string, data: any, refId?: string) => send('POST', `/ai/draft/${caseId}${refQ(refId)}`, data, 'Failed to generate draft'),
  getCaseType: (data: any) => send('POST', '/ai/casetype', data, 'Failed to detect case type'),

  // Judgment Analysis (Analytics → Judgment Analysis)
  getSimilarJudgments: (caseId: string, topK = 5) =>
    send('GET', `/ai/judgment-analysis/${caseId}?topK=${topK}`, undefined, 'Failed to get similar judgments'),
  compareJudgments: (caseId: string, data: {
    judgment1Text: string; judgment1Name: string;
    judgment2Text: string; judgment2Name: string;
  }) => send('POST', `/ai/judgment-compare/${caseId}`, data, 'Failed to compare judgments'),
  getApplicabilityReport: (caseId: string, data: {
    judgmentText: string; judgmentName: string; caseName: string;
  }) => send('POST', `/ai/judgment-applicability/${caseId}`, data, 'Failed to get applicability report'),
  chat: (data: any, refId?: string) => send('POST', `/ai/chat${refQ(refId)}`, data, 'Failed to get AI response'),
  
  // Streaming version of chat
  chatStream: async function* (data: any): AsyncGenerator<string, void, unknown> {
    const token = getToken()
    const res = await fetch(`${BASE}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      throw new Error('Failed to get AI response stream')
    }

    if (!res.body) {
      throw new Error('No response body')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (dataStr === '[DONE]') {
            return
          }
          try {
            const parsed = JSON.parse(dataStr)
            yield typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
          } catch {
            yield dataStr
          }
        }
      }
    }
  }
}

export const walletApi = {
  getSummary: () =>
    get('/wallet', 'Failed to fetch wallet') as Promise<{
      balance: number
      totalEarned: number
      totalSpent: number
      recent: Array<{
        amount: number
        type: string
        description?: string | null
        createdAt: string
      }>
    }>,
}
