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
 * @property {number|null} maxTravelMiles  Furthest the patient can travel one way; null = no limit given (ties to B-3)
 * @property {string|null} state           US state code, e.g. 'IA'; null = not given (ties to A-13, O6)
 * @property {number|null} householdSize   People in the household; null = not given (ties to A-15)
 * @property {number|null} monthlyIncomeUsd  Household income before tax; null = not given (ties to A-15)
 * @property {boolean|null} employed       Loses wages when travelling for care; null = not given (ties to A-11)
 * @property {string[]} documentsHeld      Proof the patient already has, e.g. ['State ID'] (ties to A-16)
 * @property {Object<string, {memberId: string, deductibleMetUsd: number}>} memberCoverage
 *           Per held scheme id: member number and how much of this year's deductible is paid (ties to A-13)
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
 * @property {number|null} distanceMiles  From the demo patient; null = unknown (no physical address) (ties to B-3)
 * @property {Verification} verification  License / accreditation check (ties to O4, B-10, B-11)
 * @property {string[]} fraudSignals      Warning-sign codes, e.g. 'upfront_payment'; explained in src/features/find/trust.js (ties to O4, B-9, B-12)
 * @property {string[]} languages         Languages staff can consult in (ties to A-9)
 * @property {number|null} loopClosureRate  Share of referrals (0..1) whose findings returned to the referring clinic; null = no history (ties to O7, B-14)
 * @property {number} rating              0..5 average. Not a ranking signal (ties to X-6)
 * @property {number} reviewCount
 * @property {number} waitDays            Typical wait for an appointment
 * @property {boolean} offersTelehealth   Video follow-ups can save repeat trips (ties to O3)
 * @property {string[]} acceptedSchemeIds Schemes billed directly (ties to A-14)
 * @property {number} consultFeeUsd
 * @property {boolean} hasEmergencyDepartment  Open for emergencies (ties to A-3, X-2)
 */

/**
 * How soon to be seen, most urgent first. Shared by the symptom checker (A),
 * which sets it, and Find & Trust (B), which shifts its ranking weights for it.
 */
export const URGENCY_LABELS = {
  emergency: 'Emergency: call for help now',
  within_days: 'Be seen within a few days',
  within_weeks: 'Be seen within 1–2 weeks',
  routine: 'Book the next convenient appointment',
}

/**
 * Specialty keys shared by the symptom checker (A) and Find & Trust (B).
 * A care suggestion's `specialty` and every entry in Provider.specialties use
 * these keys, so a triage result can open a matching provider search.
 */
export const SPECIALTY_LABELS = {
  'primary care': 'Primary care / general doctor',
  cardiology: 'Heart specialist (cardiology)',
  pulmonology: 'Lung / breathing specialist (pulmonology)',
  endocrinology: 'Diabetes / hormone specialist (endocrinology)',
  orthopedics: 'Bone & joint specialist (orthopedics)',
  dermatology: 'Skin specialist (dermatology)',
  obgyn: "Women's health specialist (obstetrics & gynaecology)",
  ophthalmology: 'Eye specialist (ophthalmology)',
  'mental health': 'Mental health support',
  oncology: 'Cancer specialist (oncology)',
  'surgical oncology': 'Cancer surgeon (surgical oncology)',
  'emergency care': 'Emergency department',
}

/**
 * @typedef {'patient'|'pcp'|'specialist'|'chw'} UserRole
 *
 * Roles that access the app:
 *   - patient:    the person receiving care (e.g. Maria)
 *   - pcp:        primary-care provider who makes the referral
 *   - specialist: the specialist the referral is sent to
 *   - chw:        community health worker who checks symptoms with patients (A-7)
 */

/** The roles, shared by frontend and backend so they never drift. */
export const USER_ROLES = ['patient', 'pcp', 'specialist', 'chw']

/** Human-readable role labels. */
export const USER_ROLE_LABELS = {
  patient: 'Patient',
  pcp: 'Primary-care provider',
  specialist: 'Specialist',
  chw: 'Community health worker',
}

/**
 * @typedef {Object} TriageSession
 * A symptom check saved for a CHW. Patient mode saves nothing until the
 * patient taps "Share with my CHW" (A-8, X-3).
 * @property {string} id
 * @property {string} patientId
 * @property {string} patientName
 * @property {string} chwUserId
 * @property {string} chwName
 * @property {'patient'|'chw'} startedIn   Which mode the check began in
 * @property {'shared'|'reviewed'} status  shared = waiting for the CHW; reviewed = CHW saved it
 * @property {string} symptomText          The patient's own words (A-5)
 * @property {Object} result               CareSuggestion from the symptom checker
 * @property {{temperature?: string, bloodPressure?: string, pulse?: string, weight?: string}} readings
 * @property {boolean} consentRecorded
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {UserRole} role
 * @property {string|null} providerId   For pcp/specialist: which Provider they act as (null for patients)
 * @property {string|null} patientId    For patients: which Patient record is theirs (null for providers)
 */

/**
 * Cost items a scheme can pay for. Same names as the CostEstimate fields
 * without the "Usd" suffix.
 * @typedef {'consult'|'tests'|'travel'|'lodging'|'lostWages'} CostItem
 */

/**
 * One eligibility condition (ties to O6, A-13..A-16). `field` is a key from
 * the eligibility context built in src/features/care/aid.js, e.g.
 * 'incomePctOfPoverty', 'age', 'state', 'travelMiles', 'heldSchemeIds'.
 * @typedef {Object} EligibilityRule
 * @property {string} field
 * @property {'eq'|'in'|'lte'|'gte'|'has'} op   'has' = the field is a list that contains `value`
 * @property {*} value
 * @property {string} label               Plain-language requirement, e.g. "Age 65 or older"
 */

/**
 * Terms of a private insurance plan (work or Marketplace plan). Only applies
 * to the items in Scheme.covers. In network, the consultation costs the
 * copay; anything else goes toward the deductible first, then the patient
 * pays `coinsurancePct`. Out of network, the plan pays
 * `outOfNetworkCoveragePct` after the deductible (0 = not covered).
 * @typedef {Object} InsurancePlan
 * @property {number} deductibleUsd           Patient pays this much per year before the plan shares costs
 * @property {number|null} consultCopayUsd    Fixed in-network specialist visit cost; null = visit goes to the deductible
 * @property {number} coinsurancePct          Patient's share after the deductible, in network (0..100)
 * @property {number} outOfNetworkCoveragePct Plan's share out of network after the deductible (0..100)
 * @property {string[]} inNetworkProviderIds  Providers in the plan's network
 * @property {CostItem[]} preauthItems        Items the plan must approve before care
 */

/**
 * @typedef {Object} Scheme
 * @property {string} id
 * @property {string} name
 * @property {'insurance'|'government'|'charity'} kind
 * @property {CostItem[]} covers          Which cost items it pays for (ties to A-11)
 * @property {number} coveragePct         Share of those items covered (0..100)
 * @property {number|null} maxAmountUsd   Cap per visit; null = no cap
 * @property {boolean} billedByProvider   true = only usable where the provider accepts it: Provider.acceptedSchemeIds, or plan.inNetworkProviderIds for private plans (ties to A-14)
 * @property {InsurancePlan|null} plan    Private insurance terms; null for programmes that just pay a share
 * @property {EligibilityRule[]} eligibility  All must be met (ties to A-15)
 * @property {string[]} requiredDocs      Proof needed to apply or claim (ties to A-16)
 * @property {{ steps: string[], where: string, contact: string, typicalWait: string }} howToApply
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
 * @property {number} grossUsd           Total before any help
 * @property {number} coveredUsd         Paid by schemes the patient is already enrolled in
 * @property {number} outOfPocketUsd     What the family actually pays today (ties to O5, A-11)
 * @property {{ schemeId: string, amountUsd: number }[]} coveredBy   Enrolled schemes and what each pays
 * @property {{ schemeId: string, amountUsd: number }[]} couldSave   Schemes the patient qualifies for but hasn't applied to (ties to O6)
 * @property {number} outOfPocketIfAppliedUsd  Out of pocket after applying for every scheme in couldSave
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
    maxTravelMiles: p.maxTravelMiles ?? null,
    state: p.state ?? null,
    householdSize: p.householdSize ?? null,
    monthlyIncomeUsd: p.monthlyIncomeUsd ?? null,
    employed: p.employed ?? null,
    documentsHeld: p.documentsHeld ?? [],
    memberCoverage: p.memberCoverage ?? {},
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
    // Explicit null means "unknown"; only a missing value defaults to 0.
    distanceMiles: p.distanceMiles === undefined ? 0 : p.distanceMiles,
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
    hasEmergencyDepartment: p.hasEmergencyDepartment ?? false,
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
    covers: s.covers ?? [],
    coveragePct: s.coveragePct ?? 0,
    maxAmountUsd: s.maxAmountUsd ?? null,
    billedByProvider: s.billedByProvider ?? false,
    plan: s.plan
      ? {
          deductibleUsd: 0,
          consultCopayUsd: null,
          coinsurancePct: 0,
          outOfNetworkCoveragePct: 0,
          inNetworkProviderIds: [],
          preauthItems: [],
          ...s.plan,
        }
      : null,
    eligibility: s.eligibility ?? [],
    requiredDocs: s.requiredDocs ?? [],
    howToApply: {
      steps: [],
      where: '',
      contact: '',
      typicalWait: '',
      ...s.howToApply,
    },
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
