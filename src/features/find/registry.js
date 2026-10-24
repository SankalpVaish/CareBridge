/**
 * Mock licensing registry (B-10, B-11).
 *
 * Stands in for official sources such as a State Medical Board or the state
 * hospital license registry. A real version would query those (or the US NPI
 * Registry API) instead of this seed list. Keep these records in step with the
 * `verification` field of each provider in src/data/mockData.js.
 */

/**
 * @typedef {Object} RegistryRecord
 * @property {string} licenseId
 * @property {string} name
 * @property {string} registry
 * @property {'active'|'expired'} status
 * @property {string} expiresOn   ISO date
 */

/** @type {RegistryRecord[]} */
export const REGISTRY_RECORDS = [
  { licenseId: 'H-004218', name: 'Regional Heart Center', registry: 'State hospital license registry', status: 'active', expiresOn: '2027-06-30' },
  { licenseId: 'MD-118734', name: 'County Cardiology Clinic', registry: 'State Medical Board', status: 'active', expiresOn: '2027-03-31' },
  { licenseId: 'MD-093321', name: 'Hometown Family Practice', registry: 'State Medical Board', status: 'active', expiresOn: '2027-01-31' },
  { licenseId: 'H-005902', name: 'University Cancer Institute', registry: 'State hospital license registry', status: 'active', expiresOn: '2027-09-30' },
  { licenseId: 'MD-121456', name: 'Lakeside Oncology Associates', registry: 'State Medical Board', status: 'active', expiresOn: '2027-05-31' },
  { licenseId: 'MD-077120', name: 'Hope Natural Cancer Clinic', registry: 'State Medical Board', status: 'expired', expiresOn: '2025-12-31' },
]

/**
 * Looks up a license number (exact match) or a provider name (partial match).
 * @param {string} input
 * @returns {RegistryRecord[]}
 */
export function lookupLicense(input) {
  const q = input.trim().toLowerCase()
  if (!q) return []
  return REGISTRY_RECORDS.filter(
    (r) => r.licenseId.toLowerCase() === q || r.name.toLowerCase().includes(q),
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Formats an ISO date like 2026-09-15 as "15 Sep 2026" (no timezone shift). */
export function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
