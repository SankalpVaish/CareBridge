/**
 * Thin API client for the Express backend.
 *
 * Uses same-origin '/api/...' paths — in dev, Vite proxies these to the
 * Express server (see vite.config.js). The auth token is kept in localStorage
 * and attached as a Bearer header automatically.
 */

const TOKEN_KEY = 'rscn.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** Core request helper. Throws an Error with the server message on failure. */
async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  listReferrals: () => request('/referrals'),
  updateReferral: (id, action) =>
    request(`/referrals/${id}`, { method: 'PATCH', body: action }),
  listTriage: () => request('/triage'),
  listChwPatients: () => request('/triage/patients'),
  createTriage: (payload) => request('/triage', { method: 'POST', body: payload }),
  updateTriage: (id, payload) => request(`/triage/${id}`, { method: 'PATCH', body: payload }),
  // Referral loop (O7, O8)
  sendTriageToClinic: (id) => request(`/triage/${id}/send`, { method: 'POST' }),
  listClinicInbox: () => request('/triage/inbox'),
  createReferral: (payload) => request('/referrals', { method: 'POST', body: payload }),
  loopStats: () => request('/loop-stats'),
  // Medicine-change history for one patient (O9)
  medicationHistory: (patientId) =>
    request(`/referrals/patient/${encodeURIComponent(patientId)}/medication-history`),
}
