/**
 * Trust check (B-9, B-12): turns a provider's verification result and listed
 * warning signs into plain-language explanations a patient can act on.
 *
 * Providers list warning signs as codes in `fraudSignals` (see mockData.js).
 * Some signs are also derived from the data itself (license status, missing
 * address), so they can't be forgotten when a listing is added.
 */

/** Every warning sign we know how to explain. */
export const WARNING_SIGNS = {
  no_license: {
    title: 'Not found in the licensing registry',
    why: 'Every licensed doctor and hospital is listed with the state. If a provider isn’t listed, nobody has checked their training.',
  },
  expired_license: {
    title: 'License has expired',
    why: 'A provider with an expired license isn’t allowed to practise until it is renewed.',
  },
  not_checked: {
    title: 'License not checked yet',
    why: 'We haven’t been able to confirm this provider with the registry. Ask your clinic before you go.',
  },
  guaranteed_cure: {
    title: 'Promises a “guaranteed cure”',
    why: 'Real doctors can’t promise a result. Guarantees are a common sales trick.',
  },
  upfront_payment: {
    title: 'Asks for full payment before any visit',
    why: 'Legitimate clinics bill after care, or through your insurance or scheme.',
  },
  review_burst: {
    title: 'Few reviews, all posted at once',
    why: 'A burst of glowing reviews in one week is often fake.',
  },
  price_outlier: {
    title: 'Price far below similar providers',
    why: 'Very low prices are used to pull people in before extra charges appear.',
  },
  no_address: {
    title: 'No physical address',
    why: 'You can’t visit in person, and it’s hard to complain or get your records back.',
  },
  unproven_treatment: {
    title: 'Sells treatments that aren’t standard medical care',
    why: 'Therapies like “detox” or “natural cures” aren’t part of standard care. Ask your clinic before paying for one.',
  },
}

/** Signs that come from the data itself rather than the listed codes. */
function derivedSigns(provider) {
  const codes = []
  const status = provider.verification.status
  if (status === 'not_found') codes.push('no_license')
  if (status === 'expired') codes.push('expired_license')
  if (status === 'unchecked') codes.push('not_checked')
  if (typeof provider.distanceMiles !== 'number') codes.push('no_address')
  return codes
}

/**
 * @param {import('../../shared/models.js').Provider} provider
 * @returns {{
 *   level: 'verified'|'caution'|'flagged',
 *   signs: { code: string, title: string, why: string }[],
 * }}
 *   verified = license confirmed and no warning signs;
 *   caution  = not checked yet, nothing else wrong;
 *   flagged  = license problem or any listed warning sign.
 */
export function trustCheck(provider) {
  const codes = [...new Set([...derivedSigns(provider), ...provider.fraudSignals])]
  const signs = codes.map((code) => ({
    code,
    ...(WARNING_SIGNS[code] ?? { title: code, why: '' }),
  }))

  let level = 'flagged'
  if (signs.length === 0 && provider.verification.status === 'verified') level = 'verified'
  else if (codes.length === 1 && codes[0] === 'not_checked') level = 'caution'

  return { level, signs }
}

// --- Reports -----------------------------------------------------------------
// The demo has no backend for reports, so they are kept on this device only.

const REPORTS_KEY = 'rscn.reportedListings'

function readReports() {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY)) ?? []
  } catch {
    return []
  }
}

export function isReported(providerId) {
  return readReports().some((r) => r.providerId === providerId)
}

export function reportListing(providerId) {
  if (isReported(providerId)) return
  const reports = readReports()
  reports.push({ providerId, at: new Date().toISOString() })
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
}
