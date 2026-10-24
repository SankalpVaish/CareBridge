/**
 * Cost helper — turns a patient + provider into a full-cost estimate, with
 * what each scheme pays today and what the patient could save by applying
 * for schemes they qualify for (O5, O6, A-11, A-12).
 * Returns a CostEstimate (see src/shared/models.js). The cost rules below are
 * rough placeholders (see TODO.md, A-7/A-8).
 */
import { schemes as allSchemes } from '../../data/mockData.js'
import { matchScheme, relevantSchemes } from './aid.js'
import { applyCoverage } from './coverage.js'

/**
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} provider
 * @param {import('../../shared/models.js').Scheme[]} [schemes]
 * @returns {import('../../shared/models.js').CostEstimate}
 */
export function estimateCost(patient, provider, schemes = allSchemes) {
  const items = visitCostItems(patient, provider)
  const grossUsd = Object.values(items).reduce((a, b) => a + b, 0)

  // Schemes pay in list order; each one covers part of what's still unpaid.
  const remaining = { ...items }
  const matches = relevantSchemes(schemes, patient).map((s) => matchScheme(s, patient, provider))
  const pay = (scheme) =>
    applyCoverage(scheme, remaining, {
      provider,
      deductibleMetUsd: patient.memberCoverage?.[scheme.id]?.deductibleMetUsd ?? 0,
    }).paidUsd

  const coveredBy = matches
    .filter((m) => m.status === 'enrolled' && m.usableHere)
    .map((m) => ({ schemeId: m.scheme.id, amountUsd: pay(m.scheme) }))
    .filter((c) => c.amountUsd > 0)
  const coveredUsd = sum(coveredBy)

  const couldSave = matches
    .filter((m) => m.status === 'eligible')
    .map((m) => ({ schemeId: m.scheme.id, amountUsd: pay(m.scheme) }))
    .filter((c) => c.amountUsd > 0)

  const outOfPocketUsd = Math.max(0, grossUsd - coveredUsd)

  return {
    patientId: patient.id,
    providerId: provider.id,
    consultUsd: items.consult,
    testsUsd: items.tests,
    travelUsd: items.travel,
    lodgingUsd: items.lodging,
    lostWagesUsd: items.lostWages,
    grossUsd,
    coveredUsd,
    outOfPocketUsd,
    coveredBy,
    couldSave,
    outOfPocketIfAppliedUsd: Math.max(0, outOfPocketUsd - sum(couldSave)),
  }
}

/**
 * Cost of one visit per item (CostItem keys), before any help.
 * @returns {{ consult: number, tests: number, travel: number, lodging: number, lostWages: number }}
 */
export function visitCostItems(patient, provider) {
  // Travel + lodging scale with this provider's distance (ties to C-8, C-11).
  const miles =
    typeof provider.distanceMiles === 'number'
      ? provider.distanceMiles
      : patient.distanceToSpecialistMiles
  return {
    consult: provider.consultFeeUsd,
    tests: 150, // placeholder for typical first-visit tests
    travel: Math.round(miles * 0.8), // ~$0.80/mi round trip
    lodging: miles > 50 ? 90 : 0, // overnight if far
    lostWages: miles > 30 ? 80 : 40, // a day or half-day off work
  }
}

const sum = (list) => list.reduce((a, c) => a + c.amountUsd, 0)
