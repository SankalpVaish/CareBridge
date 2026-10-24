/**
 * Shared data contract for all three workstreams.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The winning hackathon demo feels like ONE product, not three disconnected
 * pages. To get there, every workstream must agree on the shape of the core
 * objects (Patient, Provider, Referral, Scheme, ...). This file is that
 * agreement. We use JSDoc typedefs + factory functions so plain JS gets editor
 * autocomplete and inline docs with no TypeScript build step.
 *
 * RULE OF THUMB
 * -------------
 * - Need a new field on a shared object? Add it HERE and tell the other two owners.
 * - Need something only your workstream uses? Keep it in your own feature folder.
 *
 * IDs below reference observations (O1..O15) and questions (A-*, B-*, C-*, X-*)
 * from README.md so data shapes trace back to the problem statement.
 */

/**
 * @typedef {Object} Patient
 * @property {string} id
 * @property {string} name
 * @property {number} age
 * @property {string} location            Town / district label
 * @property {number} distanceToSpecialistMiles  Rough travel distance (ties to O6, O12)
 * @property {string[]} languages         Spoken languages (ties to A-14, X-5)
 * @property {boolean} hasSmartphone      Device access (ties to A-15, C-13)
 * @property {number} monthlyBudgetUsd    What the household can spend (ties to A-13)
 * @property {string[]} schemeIds         Insurance / govt schemes held (ties to A-9)
 * @property {string} [primarySymptom]    Free-text symptom in patient words (ties to A-5)
 */

/**
 * @typedef {Object} Provider
 * @property {string} id
 * @property {string} name
 * @property {'hospital'|'clinic'|'specialist'} type
 * @property {string[]} specialties       e.g. ['cardiology','oncology'] (ties to O3, B-4)
 * @property {string} location
 * @property {number} distanceMiles       From the demo patient (ties to B-3)
 * @property {boolean} verified           Licensed / accredited? (ties to O7, B-13)
 * @property {number} rating              0..5 average (ties to B-9, B-11)
 * @property {number} reviewCount
 * @property {number} waitDays            Typical wait for an appointment (ties to B-7, O5)
 * @property {boolean} offersTelehealth   (ties to C-12..C-14)
 * @property {string[]} acceptedSchemeIds Schemes billed directly (ties to A-10)
 * @property {number} consultFeeUsd
 */

/**
 * @typedef {Object} Scheme
 * @property {string} id
 * @property {string} name
 * @property {'insurance'|'government'|'charity'} kind
 * @property {number} coveragePct         Share of eligible costs covered (0..100)
 * @property {string[]} requiredDocs      Proof needed to claim (ties to A-12)
 * @property {string} notes
 */

/**
 * @typedef {'requested'|'info_sent'|'accepted'|'scheduled'|'seen'|'followed_up'|'stalled'} ReferralStatus
 */

/**
 * @typedef {Object} Referral
 * @property {string} id
 * @property {string} patientId
 * @property {string} fromProviderId     Referring PCP / clinic
 * @property {string} toProviderId       Specialist / hospital
 * @property {string} reason             Why the referral was made
 * @property {ReferralStatus} status     (ties to O11, C-1..C-4)
 * @property {string} createdDate        ISO date
 * @property {string[]} timeline         Human-readable status history
 * @property {string[]} missingInfo      What the specialist still needs (ties to C-3)
 */

/**
 * @typedef {Object} CostEstimate
 * @property {string} patientId
 * @property {string} providerId
 * @property {number} consultUsd
 * @property {number} testsUsd
 * @property {number} travelUsd          (ties to C-8, C-11)
 * @property {number} lodgingUsd
 * @property {number} lostWagesUsd
 * @property {number} coveredUsd         Paid by schemes
 * @property {number} outOfPocketUsd     What the family actually pays (ties to O8, A-7)
 */

// ---------------------------------------------------------------------------
// Factory functions — every object is created through one of these so defaults
// stay consistent. Pass a partial object; required fields should be provided.
// ---------------------------------------------------------------------------

/** @param {Partial<Patient>} p @returns {Patient} */
export function makePatient(p = {}) {
  return {
    id: p.id ?? crypto.randomUUID(),
    name: p.name ?? 'Unknown patient',
    age: p.age ?? 0,
    location: p.location ?? 'Unknown',
    distanceToSpecialistMiles: p.distanceToSpecialistMiles ?? 0,
    languages: p.languages ?? ['English'],
    hasSmartphone: p.hasSmartphone ?? false,
    monthlyBudgetUsd: p.monthlyBudgetUsd ?? 0,
    schemeIds: p.schemeIds ?? [],
    primarySymptom: p.primarySymptom ?? '',
  }
}

/** @param {Partial<Provider>} p @returns {Provider} */
export function makeProvider(p = {}) {
  return {
    id: p.id ?? crypto.randomUUID(),
    name: p.name ?? 'Unknown provider',
    type: p.type ?? 'clinic',
    specialties: p.specialties ?? [],
    location: p.location ?? 'Unknown',
    distanceMiles: p.distanceMiles ?? 0,
    verified: p.verified ?? false,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    waitDays: p.waitDays ?? 0,
    offersTelehealth: p.offersTelehealth ?? false,
    acceptedSchemeIds: p.acceptedSchemeIds ?? [],
    consultFeeUsd: p.consultFeeUsd ?? 0,
  }
}

/** @param {Partial<Scheme>} s @returns {Scheme} */
export function makeScheme(s = {}) {
  return {
    id: s.id ?? crypto.randomUUID(),
    name: s.name ?? 'Unknown scheme',
    kind: s.kind ?? 'insurance',
    coveragePct: s.coveragePct ?? 0,
    requiredDocs: s.requiredDocs ?? [],
    notes: s.notes ?? '',
  }
}

/** @param {Partial<Referral>} r @returns {Referral} */
export function makeReferral(r = {}) {
  return {
    id: r.id ?? crypto.randomUUID(),
    patientId: r.patientId ?? '',
    fromProviderId: r.fromProviderId ?? '',
    toProviderId: r.toProviderId ?? '',
    reason: r.reason ?? '',
    status: r.status ?? 'requested',
    createdDate: r.createdDate ?? new Date().toISOString().slice(0, 10),
    timeline: r.timeline ?? [],
    missingInfo: r.missingInfo ?? [],
  }
}

/** Human-readable labels for each referral status (shared so B & C agree). */
export const REFERRAL_STATUS_LABELS = {
  requested: 'Requested',
  info_sent: 'Info sent',
  accepted: 'Accepted',
  scheduled: 'Scheduled',
  seen: 'Seen',
  followed_up: 'Followed up',
  stalled: 'Stalled',
}
