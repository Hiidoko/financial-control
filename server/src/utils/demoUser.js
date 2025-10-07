const DEFAULT_DEMO_USER_ID = '64f1e3c2b7a5d1f0c9e8a7b6'

export const DEMO_MODE_ENABLED = (process.env.DEMO_MODE ?? 'true') !== 'false'
export const DEMO_EMAIL = process.env.DEMO_EMAIL ?? 'demo.pro@financialfuture.dev'
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'Pro!Demo2025'
export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? DEFAULT_DEMO_USER_ID

const baseProfile = Object.freeze({
  id: DEMO_USER_ID,
  name: 'Experiência Pro 2025',
  email: DEMO_EMAIL,
  role: 'pro',
  birthDate: '1993-05-12T00:00:00.000Z',
  householdMembers: 2,
  proFeatures: {
    comparativeReports: true,
    collaborativeGoals: true,
    bankingIntegrations: true
  },
  createdAt: '2024-01-12T13:00:00.000Z',
  updatedAt: '2025-05-19T16:00:00.000Z'
})

function toSafeJSON () {
  const { toSafeJSON: _omit, ...rest } = this
  return rest
}

export function getDemoUserProfile () {
  return { ...baseProfile }
}

export function getDemoUserDocument () {
  return {
    _id: DEMO_USER_ID,
    ...baseProfile,
    toSafeJSON
  }
}

export function isDemoCredential ({ email, password }) {
  if (!DEMO_MODE_ENABLED) return false
  return email?.toLowerCase() === DEMO_EMAIL.toLowerCase() && password === DEMO_PASSWORD
}

export function isDemoUserId (id) {
  if (!DEMO_MODE_ENABLED) return false
  return id === DEMO_USER_ID || id === 'demo-pro-user'
}
