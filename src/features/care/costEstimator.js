/**
 * Cost helper — turns a patient + provider into a full-cost estimate, with
 * editable inputs and a best-case / worst-case range (Workstream A, A-7/A-8).
 *
 * A-7: the full cost of specialist care, start to finish — consultation,
 *      tests, treatment, medicines, travel, lodging, lost wages.
 * A-8: how much of that is actually KNOWN before care starts. Some line items
 *      (the consultation fee, the bus fare) are fairly certain; others (tests,
 *      treatment, medicines) are not known until the patient is seen. We model
 *      that uncertainty as a best/worst range so families aren't blindsided by
 *      a surprise bill.
 *
 * Returns a CostEstimate (see src/shared/models.js) for the point ("expected")
 * figure, plus a `range` with best/worst totals and per-line detail.
 *
 * Pure functions only — no React, no I/O — so this is easy to test and reuse.
 */

/**
 * The editable line items that make up a full-journey cost (A-7).
 * `certain` marks costs usually known before care starts (A-8). Uncertain
 * items get a wider best→worst spread.
 *
 * @typedef {Object} CostLine
 * @property {string} key
 * @property {string} label
 * @property {number} best      Low end of what this could cost.
 * @property {number} expected  The single best-guess figure.
 * @property {number} worst     High end (the "surprise bill" side).
 * @property {boolean} certain  Is this usually known up front? (A-8)
 * @property {string} note      Plain-language explanation.
 */

/** Round to whole currency units. */
const r = (n) => Math.max(0, Math.round(Number(n) || 0))

/**
 * Build the default editable line items for a patient + provider.
 * Callers can show these in inputs and let the user adjust them (A-8).
 *
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} provider
 * @returns {CostLine[]}
 */
export function buildCostInputs(patient, provider) {
  const miles = patient?.distanceToSpecialistMiles ?? 0
  const consult = provider?.consultFeeUsd ?? 0

  // Travel scales with distance; round trip at ~$0.80/mi (ties to C-8, C-11).
  const travel = r(miles * 0.8)
  const farAway = miles > 50
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
      best: r(travel * 0.8),
      expected: travel,
      worst: r(travel * 1.5), // a missed bus, a hired ride
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
        en: 'Time off work, and a companion may lose a day too (C-11).',
        es: 'Tiempo sin trabajar, y un acompañante también puede perder un día (C-11).',
      },
    },
  ]
}

/**
 * How much of a scheme covers. Simple stand-in model: a held+accepted scheme
 * covers consultation + tests + treatment + medicines at ~80%. Travel/lodging/
 * wages are out of pocket unless a travel grant applies.
 */
function coverageFor(lines, patient, provider) {
  const held = new Set(patient?.schemeIds ?? [])
  const accepted = provider?.acceptedSchemeIds ?? []
  const usable = accepted.filter((id) => held.has(id))
  if (usable.length === 0) return { expected: 0, best: 0, worst: 0, coveredBy: [] }

  const clinicalKeys = new Set(['consult', 'tests', 'treatment', 'medicines'])
  const sum = (field) =>
    lines
      .filter((l) => clinicalKeys.has(l.key))
      .reduce((acc, l) => acc + (Number(l[field]) || 0), 0)

  // Covered amount tracks the actual bill: more cost → more covered.
  return {
    expected: r(sum('expected') * 0.8),
    best: r(sum('best') * 0.8),
    worst: r(sum('worst') * 0.8),
    coveredBy: usable,
  }
}

/**
 * Compute a full estimate from (possibly edited) line items.
 *
 * @param {CostLine[]} lines
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} provider
 */
export function computeEstimate(lines, patient, provider) {
  const total = (field) => lines.reduce((acc, l) => acc + (Number(l[field]) || 0), 0)

  const grossExpected = r(total('expected'))
  const grossBest = r(total('best'))
  const grossWorst = r(total('worst'))

  const cov = coverageFor(lines, patient, provider)

  const oopExpected = r(grossExpected - cov.expected)
  const oopBest = r(grossBest - cov.best)
  const oopWorst = r(grossWorst - cov.worst)

  // How much of the EXPECTED cost is known up front (A-8)?
  const certainExpected = r(
    lines.filter((l) => l.certain).reduce((a, l) => a + (Number(l.expected) || 0), 0),
  )
  const knownPct = grossExpected > 0 ? Math.round((certainExpected / grossExpected) * 100) : 0

  // Keep the legacy flat fields so existing callers don't break.
  const byKey = Object.fromEntries(lines.map((l) => [l.key, r(l.expected)]))

  return {
    patientId: patient?.id,
    providerId: provider?.id,

    // Legacy flat fields (expected values) — kept for backward compatibility.
    consultUsd: byKey.consult ?? 0,
    testsUsd: byKey.tests ?? 0,
    travelUsd: byKey.travel ?? 0,
    lodgingUsd: byKey.lodging ?? 0,
    lostWagesUsd: byKey.lostWages ?? 0,
    coveredUsd: cov.expected,
    outOfPocketUsd: oopExpected,

    // New: full line detail and the best/worst range (A-7, A-8).
    lines,
    coveredBy: cov.coveredBy,
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
 * Backward-compatible entry point. Same signature as before, now backed by the
 * range model. Accepts optional pre-edited `lines` so callers can recompute.
 *
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} provider
 * @param {CostLine[]} [lines]
 */
export function estimateCost(patient, provider, lines) {
  const items = lines ?? buildCostInputs(patient, provider)
  return computeEstimate(items, patient, provider)
}
