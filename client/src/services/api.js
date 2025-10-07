const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request (path, { method = 'GET', body, token } = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message = error.error || error.message || 'Erro ao processar requisição'
    throw new Error(message)
  }

  return response.json()
}

export function runSimulation (payload, token) {
  return request('/api/simulations', { method: 'POST', body: payload, token })
}

export function registerUser (payload) {
  return request('/api/auth/register', { method: 'POST', body: payload })
}

export function loginUser (payload) {
  return request('/api/auth/login', { method: 'POST', body: payload })
}

export function fetchCurrentUser (token) {
  return request('/api/auth/me', { token })
}

export function fetchCertifiedPresets () {
  return request('/api/presets')
}

export function createCertifiedPreset (payload, token) {
  return request('/api/presets', { method: 'POST', body: payload, token })
}

export function fetchComparativeReport (payload, token) {
  return request('/api/pro/reports/comparative', { method: 'POST', body: payload, token })
}

export function fetchCollaborativeGoals (payload, token) {
  return request('/api/pro/goals/collaborative', { method: 'POST', body: payload, token })
}

export function fetchOpenFinanceSnapshot (token) {
  return request('/api/pro/open-finance/snapshot', { token })
}
