/**
 * Cost helper — turns a patient + provider into a full-cost estimate, with
 * editable inputs, a best-case / worst-case range, and what each scheme pays
 * (Workstream A, A-7/A-8, A-11..A-13, O5, O6).
 *
 * A-7: the full cost of specialist care, start to finish — consultation,
 *      tests, treatment, medicines, travel, lodging, lost wages.
 * A-8: how much of that is actually KNOWN before care starts. Some line items
 *      (the consultation fee, the bus fare) are fairly certain; others (tests,
 *      treatment, medicines) are not known until the patient is seen. We model
 *      that uncertainty as a best/worst range so families aren't blindsided by
 *      a surprise bill.
 * O6:  schemes pay in list order (src/data/mockData.js), each covering part of
 *      what's still unpaid, using their own share, cap, or plan terms
 *      (coverage.js). Schemes the patient qualifies for but hasn't applied to
 *      are shown as possible savings.
 *
 * Returns a CostEstimate (see src/shared/models.js) for the point ("expected")
 * figure, plus a `range` with best/worst totals and per-line detail.
 *
 * Pure functions only — no React, no I/O — so this is easy to test and reuse.
 */
import { schemes as allSchemes } from '../../data/mockData.js'
import { matchScheme, relevantSchemes } from './aid.js'
import { applyCoverage } from './coverage.js'
import { planTrip } from '../find/travel.js'

/**
 * The editable line items that make up a full-journey cost (A-7).
 * `certain` marks costs usually known before care starts (A-8). Uncertain
 * items get a wider best→worst spread. `key` is a CostItem.
 *
 * @typedef {Object} CostLine
 * @property {string} key
 * @property {{en: string, es: string}} label
 * @property {number} best      Low end of what this could cost.
 * @property {number} expected  The single best-guess figure.
 * @property {number} worst     High end (the "surprise bill" side).
 * @property {boolean} certain  Is this usually known up front? (A-8)
 * @property {{en: string, es: string}} note  Plain-language explanation.
 */
/** Round to whole currency units. */
const r = (n) => Math.max(0, Math.round(Number(n) || 0))

/** This provider's distance, falling back to the patient's usual trip. */
function tripMiles(patient, provider) {
  return typeof provider?.distanceMiles === 'number'
    ? provider.distanceMiles
    : (patient?.distanceToSpecialistMiles ?? 0)
}

/**
 * Build the default editable line items for a patient + provider.
 * Callers can show these in inputs and let the user adjust them (A-8).
 *
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} provider
 * @returns {CostLine[]}
 */
export function buildCostInputs(patient, provider) {
  const miles = tripMiles(patient, provider)
  const consult = provider?.consultFeeUsd ?? 0
  // Travel and the overnight stay come from the shared trip plan, so this
  // matches Find & Trust and Coordinate (O3). Free transport (e.g. Medicaid
  // rides) is left out here: it shows as a saving under "Help paying".
  const plan = planTrip(patient, provider)
  const travel = plan?.cheapestPaid ? plan.cheapestPaid.roundTripCostUsd : r(miles * 0.8)
  const travelWorst = plan?.priciestPaid ? plan.priciestPaid.roundTripCostUsd : r(travel * 1.5)
  const farAway = plan ? plan.overnightNeeded : miles > 50
  const lodging = farAway ? 90 : 0
  const lostWages = miles > 30 ? 80 : 40
  return [
    {
      key: 'consult',
      label: { en: 'Consultation', es: 'Consulta' },
      best: consult,
      expected: consult,
      worst: r(consult * 1.2), // a longer visit / extra fee
      certain: true,
      note: {
        en: 'Usually a fixed fee you can ask about before the visit.',
        es: 'Suele ser una tarifa fija que puede consultar antes de la visita.',
      },
    },
    {
      key: 'tests',
      label: { en: 'Tests', es: 'Análisis' },
      best: 60,
      expected: 150,
      worst: 400, // imaging or extra panels add up fast
      certain: false,
      note: {
        en: 'Often not known until the specialist decides what to order.',
        es: 'A menudo no se sabe hasta que el especialista decide qué pedir.',
      },
    },
    {
      key: 'treatment',
      label: { en: 'Treatment / procedure', es: 'Tratamiento / procedimiento' },
      best: 0,
      expected: 0,
      worst: 600,
      certain: false,
      note: {
        en: 'May be nothing on a first visit, or a procedure may be needed.',
        es: 'Puede ser nada en la primera visita, o puede requerir un procedimiento.',
      },
    },
    {
      key: 'medicines',
      label: { en: 'Medicines', es: 'Medicinas' },
      best: 10,
      expected: 40,
      worst: 150,
      certain: false,
      note: {
        en: 'Depends on what, if anything, is prescribed.',
        es: 'Depende de lo que se recete, si es que se receta algo.',
      },
    },
    {
      key: 'travel',
      label: { en: 'Travel (round trip)', es: 'Viaje (ida y vuelta)' },
      best: travel,
      expected: travel,
      worst: Math.max(travel, travelWorst), // the shuttle doesn't run that day: a shared ride
      certain: true,
      note: {
        en: 'Fairly predictable once you know the distance and mode.',
        es: 'Bastante predecible una vez que conoce la distancia y el medio.',
      },
    },
    {
      key: 'lodging',
      label: { en: 'Lodging', es: 'Alojamiento' },
      best: farAway ? 60 : 0,
      expected: lodging,
      worst: farAway ? 140 : 60,
      certain: farAway ? false : true,
      note: farAway
        ? {
            en: 'An overnight stay is likely for a trip this far.',
            es: 'Es probable pasar la noche en un viaje tan lejano.',
          }
        : {
            en: 'Usually not needed for a trip this short.',
            es: 'Normalmente no hace falta en un viaje tan corto.',
          },
    },
    {
      key: 'lostWages',
      label: { en: 'Lost wages', es: 'Salario perdido' },
      best: r(lostWages * 0.5),
      expected: lostWages,
      worst: r(lostWages * 2), // the trip or a follow-up runs long
      certain: false,
      note: {
        en: 'Time off work, and a companion may lose a day too.',
        es: 'Tiempo sin trabajar, y un acompañante también puede perder un día.',
      },
    },
  ]
}

/** Line items as { key: amount } for one field ('best' | 'expected' | 'worst'). */
function itemsFor(lines, field) {
  return Object.fromEntries(lines.map((l) => [l.key, r(l[field])]))
}

/**
 * Cost per item for the default (expected) visit, before any help.
 * Used by the coverage check so it shows the same numbers as the estimate.
 */
export function visitCostItems(patient, provider) {
  return itemsFor(buildCostInputs(patient, provider), 'expected')
}

/**
 * Apply schemes in list order to one set of item amounts.
 * Enrolled schemes that work at this provider pay first; then schemes the
 * patient qualifies for show what applying would save.
 */
function stack(items, matches, patient, provider) {
  const remaining = { ...items }
  const pay = (scheme) =>
    applyCoverage(scheme, remaining, {
      provider,
      deductibleMetUsd: patient?.memberCoverage?.[scheme.id]?.deductibleMetUsd ?? 0,
    }).paidUsd

  const coveredBy = matches
    .filter((m) => m.status === 'enrolled' && m.usableHere)
    .map((m) => ({ schemeId: m.scheme.id, amountUsd: pay(m.scheme) }))
    .filter((c) => c.amountUsd > 0)
  const couldSave = matches
    .filter((m) => m.status === 'eligible')
    .map((m) => ({ schemeId: m.scheme.id, amountUsd: pay(m.scheme) }))
    .filter((c) => c.amountUsd > 0)
  return { coveredBy, couldSave, covered: sum(coveredBy), saved: sum(couldSave) }
}

/**
 * Compute a full estimate from (possibly edited) line items.
 *
 * @param {CostLine[]} lines
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} provider
 * @param {import('../../shared/models.js').Scheme[]} [schemes]
 */
export function computeEstimate(lines, patient, provider, schemes = allSchemes) {
  const total = (field) => lines.reduce((acc, l) => acc + (Number(l[field]) || 0), 0)
  const grossExpected = r(total('expected'))
  const grossBest = r(total('best'))
  const grossWorst = r(total('worst'))

  const matches = relevantSchemes(schemes, patient).map((s) => matchScheme(s, patient, provider))
  const expected = stack(itemsFor(lines, 'expected'), matches, patient, provider)
  const best = stack(itemsFor(lines, 'best'), matches, patient, provider)
  const worst = stack(itemsFor(lines, 'worst'), matches, patient, provider)

  const oopExpected = r(grossExpected - expected.covered)
  const oopBest = r(grossBest - best.covered)
  const oopWorst = r(grossWorst - worst.covered)

  // How much of the EXPECTED cost is known up front (A-8)?
  const certainExpected = r(
    lines.filter((l) => l.certain).reduce((a, l) => a + (Number(l.expected) || 0), 0),
  )
  const knownPct = grossExpected > 0 ? Math.round((certainExpected / grossExpected) * 100) : 0

  const byKey = itemsFor(lines, 'expected')
  return {
    patientId: patient?.id,
    providerId: provider?.id,
    // Flat fields (expected values), kept for existing callers.
    consultUsd: byKey.consult ?? 0,
    testsUsd: byKey.tests ?? 0,
    travelUsd: byKey.travel ?? 0,
    lodgingUsd: byKey.lodging ?? 0,
    lostWagesUsd: byKey.lostWages ?? 0,
    grossUsd: grossExpected,
    coveredUsd: expected.covered,
    outOfPocketUsd: oopExpected,
    coveredBy: expected.coveredBy,
    couldSave: expected.couldSave,
    outOfPocketIfAppliedUsd: r(oopExpected - expected.saved),
    // Full line detail and the best/worst range (A-7, A-8).
    lines,
    range: {
      grossBest,
      grossExpected,
      grossWorst,
      oopBest,
      oopExpected,
      oopWorst,
    },
    knownUpFrontPct: knownPct,
  }
}

/**
 * Entry point. Accepts optional pre-edited `lines` so callers can recompute.
 *
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} provider
 * @param {CostLine[]} [lines]
 */
export function estimateCost(patient, provider, lines) {
  const items = lines ?? buildCostInputs(patient, provider)
  return computeEstimate(items, patient, provider)
}

const sum = (list) => list.reduce((a, c) => a + c.amountUsd, 0)
