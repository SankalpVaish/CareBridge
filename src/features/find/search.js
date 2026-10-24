/**
 * Search and filters for Find & Trust (B-1, B-2, B-3), plus "nearest" lookups
 * used by the symptom checker hand-off (O1).
 */

const isVerified = (p) => p.verification.status === 'verified'
const isPrimaryCareOnly = (p) => p.specialties.every((s) => s === 'primary care')

/**
 * Providers that match the query by name, specialty, or a service they offer
 * (a test or treatment such as "echocardiogram").
 * This page finds specialist care, so primary-care-only providers are left
 * out unless the query asks for primary care itself.
 *
 * @param {import('../../shared/models.js').Provider[]} providers
 * @param {string} query
 */
export function searchProviders(providers, query) {
  const q = query.trim().toLowerCase()
  const wantsPrimaryCare = q.includes('primary')
  return providers
    .filter((p) => wantsPrimaryCare || !isPrimaryCareOnly(p))
    .filter(
      (p) =>
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.specialties.some((s) => s.toLowerCase().includes(q)) ||
        p.services.some((s) => s.toLowerCase().includes(q)),
    )
}

/** The services of a provider that match the query, to show "Offers: ...". */
export function matchedServices(provider, query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return provider.services.filter((s) => s.toLowerCase().includes(q))
}

/**
 * True when the provider is within the travel limit.
 * `maxMiles` of null means no limit. Unknown distance counts as within range
 * so a listing with no address is still shown (with its warning), never hidden
 * behind a filter the patient can't see.
 */
export function isWithinTravel(provider, maxMiles) {
  if (maxMiles == null) return true
  if (typeof provider.distanceMiles !== 'number') return true
  return provider.distanceMiles <= maxMiles
}

/** Nearest verified provider with a known distance that passes `test`, or null. */
function nearestVerified(providers, test) {
  return (
    providers
      .filter((p) => isVerified(p) && typeof p.distanceMiles === 'number' && test(p))
      .sort((a, b) => a.distanceMiles - b.distanceMiles)[0] ?? null
  )
}

/** Nearest verified primary-care provider: the safe first stop (A-4). */
export function nearestPrimaryCare(providers) {
  return nearestVerified(providers, (p) => p.specialties.includes('primary care'))
}

/** Nearest verified provider with an emergency department (A-3, X-2). */
export function nearestEmergency(providers) {
  return nearestVerified(providers, (p) => p.hasEmergencyDepartment)
}
