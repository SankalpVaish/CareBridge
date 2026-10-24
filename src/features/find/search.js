/**
 * Search and filters for Find & Trust (B-1, B-2, B-3).
 */

/**
 * Specialist providers that match the query by name, specialty, or a service
 * they offer (a test or treatment such as "echocardiogram").
 * Primary-care-only providers are left out: this page finds specialist care.
 *
 * @param {import('../../shared/models.js').Provider[]} providers
 * @param {string} query
 */
export function searchProviders(providers, query) {
  const q = query.trim().toLowerCase()
  return providers
    .filter((p) => p.specialties.some((s) => s !== 'primary care'))
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
