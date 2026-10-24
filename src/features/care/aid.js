/**
 * Which insurance, government schemes, and financial aid a patient qualifies
 * for, with plain reasons (O6, A-13..A-16). Pure module, no React.
 *
 * Each scheme lists eligibility rules (src/data/mockData.js). A rule reads one
 * field from the context built below and is met, not met, or unknown (we don't
 * have that information yet). Unknown is never treated as "not eligible": the
 * patient is told what we'd need to know instead.
 */
import { referrals, byId } from '../../data/mockData.js'
import { isInNetwork, paysAtProvider } from './coverage.js'

// 2025 HHS poverty guideline for the 48 contiguous states, per year.
// Demo use only: update yearly and use the patient's state rules for real use.
const POVERTY_BASE_USD = 15650
const POVERTY_PER_EXTRA_PERSON_USD = 5500

/** Monthly poverty line for a household of `size` people. */
export function povertyLineMonthlyUsd(size) {
  return (POVERTY_BASE_USD + POVERTY_PER_EXTRA_PERSON_USD * (size - 1)) / 12
}

/** Rule fields that depend on where care happens rather than on the patient. */
const PROVIDER_FIELDS = new Set(['providerId', 'providerSpecialties', 'travelMiles'])

/**
 * Everything eligibility rules can read. null = we don't know yet.
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} [provider]  Where care would happen
 */
export function eligibilityContext(patient, provider) {
  const own = referrals.filter((r) => r.patientId === patient.id)
  const income = patient.monthlyIncomeUsd
  const size = patient.householdSize
  return {
    age: patient.age > 0 ? patient.age : null,
    state: patient.state,
    employed: patient.employed,
    incomePctOfPoverty:
      income != null && size > 0 ? Math.round((income / povertyLineMonthlyUsd(size)) * 100) : null,
    heldSchemeIds: patient.schemeIds,
    hasReferral: own.length > 0,
    referralSpecialties: own.flatMap((r) => byId.provider(r.toProviderId)?.specialties ?? []),
    providerId: provider?.id ?? null,
    providerSpecialties: provider?.specialties ?? null,
    travelMiles: typeof provider?.distanceMiles === 'number' ? provider.distanceMiles : null,
  }
}

/** @returns {true|false|null} null = unknown */
function checkRule(rule, ctx) {
  const v = ctx[rule.field]
  if (v == null) return null
  switch (rule.op) {
    case 'eq':
      return v === rule.value
    case 'in':
      return rule.value.includes(v)
    case 'lte':
      return v <= rule.value
    case 'gte':
      return v >= rule.value
    case 'has':
      return Array.isArray(v) && v.includes(rule.value)
    default:
      return null
  }
}

/** The patient's own value, shown next to a rule, e.g. "Yours: about 95%". */
function yourValue(rule, ctx) {
  const v = ctx[rule.field]
  if (v == null) return ''
  if (rule.field === 'incomePctOfPoverty') return `Yours: about ${v}%`
  if (rule.field === 'age') return `You’re ${v}`
  if (rule.field === 'travelMiles') return `This one is ${v} mi away`
  return ''
}

/** What we'd need to know to check an unknown rule. */
const NEEDED = {
  age: 'your age',
  state: 'which state you live in',
  employed: 'whether you lose pay for the visit',
  incomePctOfPoverty: 'your household income and size',
  travelMiles: 'which provider you’ll see',
  providerId: 'which provider you’ll see',
  providerSpecialties: 'which provider you’ll see',
}

/**
 * @typedef {'enrolled'|'eligible'|'maybe'|'not_here'|'not_eligible'} AidStatus
 *   enrolled     = already has it (see usableHere)
 *   eligible     = meets every rule and can use it at this provider
 *   maybe        = nothing fails, but we're missing information
 *   not_here     = qualifies personally, but not for care at this provider
 *   not_eligible = fails a rule about the patient
 */

/**
 * @param {import('../../shared/models.js').Scheme} scheme
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} [provider]
 */
export function matchScheme(scheme, patient, provider) {
  const ctx = eligibilityContext(patient, provider)
  const reasons = scheme.eligibility.map((rule) => ({
    text: rule.label,
    met: checkRule(rule, ctx),
    yours: yourValue(rule, ctx),
    needed: NEEDED[rule.field] ?? '',
    aboutProvider: PROVIDER_FIELDS.has(rule.field),
  }))

  // Coverage constraint (A-14): some schemes only work where the provider
  // accepts them, or (private plans) pay less out of network.
  if (scheme.billedByProvider && provider) {
    const inNetwork = isInNetwork(scheme, provider)
    const pays = paysAtProvider(scheme, provider)
    let text
    if (scheme.plan) {
      text = inNetwork
        ? `${provider.name} is in the ${scheme.name} network`
        : pays
          ? `${provider.name} is out of network: the plan pays only ${scheme.plan.outOfNetworkCoveragePct}% after the deductible`
          : `${provider.name} is out of network: not covered`
    } else {
      text = inNetwork
        ? `${provider.name} accepts ${scheme.name}`
        : `${provider.name} doesn’t accept ${scheme.name}`
    }
    reasons.push({ text, met: pays, yours: '', needed: '', aboutProvider: true })
  }

  const personal = reasons.filter((r) => !r.aboutProvider)
  const atProvider = reasons.filter((r) => r.aboutProvider)
  const usableHere = atProvider.every((r) => r.met === true)
  const enrolled = patient.schemeIds.includes(scheme.id)

  let status
  if (enrolled) status = 'enrolled'
  else if (personal.some((r) => r.met === false)) status = 'not_eligible'
  else if (!usableHere) status = 'not_here'
  else if (personal.some((r) => r.met === null)) status = 'maybe'
  else status = 'eligible'

  const missingDocs = scheme.requiredDocs.filter((d) => !patient.documentsHeld.includes(d))

  return { scheme, status, usableHere, reasons, missingDocs }
}

const STATUS_ORDER = ['enrolled', 'eligible', 'maybe', 'not_here', 'not_eligible']

/**
 * Private insurance plans are bought or come with a job, so we can't tell a
 * patient they "qualify". Only list the plans they hold.
 */
export function relevantSchemes(schemes, patient) {
  return schemes.filter((s) => !s.plan || patient.schemeIds.includes(s.id))
}

/**
 * Every scheme, matched for this patient and provider, most useful first.
 * Within a status, the order in mockData.js is kept.
 */
export function matchAid(schemes, patient, provider) {
  return relevantSchemes(schemes, patient)
    .map((s, i) => ({ ...matchScheme(s, patient, provider), order: i }))
    .sort(
      (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.order - b.order,
    )
}
