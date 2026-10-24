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
 * IDs below reference observations (O1..O10) and questions (A-*, B-*, C-*, X-*)
 * from README.md so data shapes trace back to the problem statement.
 */

/**
 * @typedef {Object} Patient
 * @property {string} id
 * @property {string} name
 * @property {number} age
 * @property {string} location            Town / district label
 * @property {number} distanceToSpecialistMiles  Rough travel distance (ties to O2, O3)
 * @property {string[]} languages         Spoken languages (ties to A-9, X-5)
 * @property {boolean} hasSmartphone      Device access (ties to A-10, C-9)
 * @property {number} monthlyBudgetUsd    What the household can spend (ties to A-17)
 * @property {string[]} schemeIds         Insurance / govt schemes held (ties to A-13)
 * @property {string[]} transport         Ways the patient can travel, e.g. ['community shuttle'] (ties to B-5)
 * @property {string} [primarySymptom]    Free-text symptom in patient words (ties to A-5)
 */

/**
 * @typedef {'verified'|'not_found'|'expired'|'unchecked'} VerificationStatus
 */

/**
 * @typedef {Object} Verification
 * @property {VerificationStatus} status
 * @property {string} registry            Where the license was checked, e.g. 'State Medical Board' (ties to B-11)
 * @property {string|null} licenseId
 * @property {string|null} checkedOn      ISO date of the last check
 */

/**
 * @typedef {Object} Provider
 * @property {string} id
 * @property {string} name
 * @property {'hospital'|'clinic'|'specialist'} type
 * @property {string[]} specialties       e.g. ['cardiology','oncology'] (ties to O2, B-2)
 * @property {string[]} services          Treatments and tests offered, e.g. ['Echocardiogram'] (ties to O2, B-2)
 * @property {string} location
 * @property {number} distanceMiles       From the demo patient (ties to B-3)
 * @property {Verification} verification  License / accreditation check (ties to O4, B-10, B-11)
 * @property {string[]} fraudSignals      Warning signs found for this provider (ties to O4, B-9, B-12)
 * @property {string[]} languages         Languages staff can consult in (ties to A-9)
 * @property {number|null} loopClosureRate  Share of referrals (0..1) whose findings returned to the referring clinic; null = no history (ties to O7, B-14)
 * @property {number} rating              0..5 average. Not a ranking signal (ties to X-6)
 * @property {number} reviewCount
 * @property {number} waitDays            Typical wait for an appointment
 * @property {boolean} offersTelehealth   Video follow-ups can save repeat trips (ties to O3)
 * @property {string[]} acceptedSchemeIds Schemes billed directly (ties to A-14)
 * @property {number} consultFeeUsd
 */

/**
 * @typedef {Object} Scheme
 * @property {string} id
 * @property {string} name
 * @property {'insurance'|'government'|'charity'} kind
 * @property {number} coveragePct         Share of eligible costs covered (0..100)
 * @property {string[]} requiredDocs      Proof needed to claim (ties to A-16)
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
 * @property {ReferralStatus} status     (ties to O7, C-1..C-4)
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
 * @property {number} travelUsd          (ties to B-4, B-7)
 * @property {number} lodgingUsd
 * @property {number} lostWagesUsd
 * @property {number} coveredUsd         Paid by schemes
 * @property {number} outOfPocketUsd     What the family actually pays (ties to O5, A-11)
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
    transport: p.transport ?? [],
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
    services: p.services ?? [],
    location: p.location ?? 'Unknown',
    distanceMiles: p.distanceMiles ?? 0,
    verification: {
      status: 'unchecked',
      registry: '',
      licenseId: null,
      checkedOn: null,
      ...p.verification,
    },
    fraudSignals: p.fraudSignals ?? [],
    languages: p.languages ?? [],
    loopClosureRate: p.loopClosureRate ?? null,
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
