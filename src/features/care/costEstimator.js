/**
 * Cost helper — turns a patient + provider into a full-cost estimate.
 * Returns a CostEstimate (see src/shared/models.js). Replace these rough rules
 * with something more realistic (see TODO.md, A-7/A-8).
 */

/**
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} provider
 * @returns {import('../../shared/models.js').CostEstimate}
 */
export function estimateCost(patient, provider) {
  const consultUsd = provider.consultFeeUsd
  const testsUsd = 150 // placeholder for typical first-visit tests

  // Travel + lodging scale with distance (ties to C-8, C-11).
  const miles = patient.distanceToSpecialistMiles
  const travelUsd = Math.round(miles * 0.8) // ~$0.80/mi round trip
  const lodgingUsd = miles > 50 ? 90 : 0 // overnight if far
  const lostWagesUsd = miles > 30 ? 80 : 40 // a day or half-day off work

  const gross = consultUsd + testsUsd + travelUsd + lodgingUsd + lostWagesUsd

  // Apply the best scheme the provider accepts and the patient holds.
  const held = new Set(patient.schemeIds)
  const usable = provider.acceptedSchemeIds.filter((id) => held.has(id))
  // Simple model: Medicaid covers consult+tests at its coverage %.
  const coveredBase = usable.length > 0 ? consultUsd + testsUsd : 0
  const coveredUsd = Math.round(coveredBase * 0.8) // 80% stand-in

  const outOfPocketUsd = Math.max(0, gross - coveredUsd)

  return {
    patientId: patient.id,
    providerId: provider.id,
    consultUsd,
    testsUsd,
    travelUsd,
    lodgingUsd,
    lostWagesUsd,
    coveredUsd,
    outOfPocketUsd,
  }
}
