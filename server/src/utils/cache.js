const DEFAULT_TTL_MS = Number.parseInt(process.env.SIMULATION_CACHE_TTL ?? '300000', 10)
const MAX_ENTRIES = Number.parseInt(process.env.SIMULATION_CACHE_MAX ?? '200', 10)

const cacheStore = new Map()

function isCacheEnabled () {
  return DEFAULT_TTL_MS > 0 && MAX_ENTRIES > 0
}

function clone (value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

export function getCachedSimulation (key) {
  if (!isCacheEnabled()) return null
  const entry = cacheStore.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    cacheStore.delete(key)
    return null
  }
  return clone(entry.value)
}

function enforceCapacity () {
  while (cacheStore.size > MAX_ENTRIES) {
    const oldestKey = cacheStore.keys().next().value
    if (!oldestKey) break
    cacheStore.delete(oldestKey)
  }
}

export function setCachedSimulation (key, value) {
  if (!isCacheEnabled()) return
  cacheStore.set(key, {
    value: clone(value),
    expiresAt: Date.now() + DEFAULT_TTL_MS
  })
  enforceCapacity()
}

export function clearSimulationCache () {
  cacheStore.clear()
}

export function getSimulationCacheSize () {
  return cacheStore.size
}
