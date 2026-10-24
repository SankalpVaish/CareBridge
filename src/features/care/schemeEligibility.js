/**
 * Scheme & aid eligibility checker (Workstream A, A-9..A-12).
 *
 * A-9: which schemes a patient holds, and what each actually covers.
 * A-10: coverage RULES that can block or delay care (approved-hospital lists,
 *       pre-authorization, claim paperwork).
 * A-11: scholarships / charity / NGO aid for treatment, travel, lodging, and
 *       why it goes unclaimed (people never learn they qualify).
 * A-12: the documents and proof each program needs, flagged by how hard they
 *       are for a rural family to produce.
 *
 * LANGUAGE (A-14): all human-readable strings carry both 'en' and 'es'. The
 * checker takes a language code and returns strings in that language, falling
 * back to English. This keeps the whole aid section translatable without any
 * shared-data change.
 *
 * BOUNDARY: lives entirely in the care feature. It READS the shared `schemes`
 * data but never changes it or the shared model.
 *
 * Pure functions only — no React, no I/O.
 */
import { schemes as sharedSchemes } from '../../data/mockData.js'

/** Pick a localized string from a { en, es } object (fallback to en). */
function L(obj, code) {
  if (obj == null) return ''
  if (typeof obj === 'string') return obj
  return obj[code] ?? obj.en ?? ''
}
/** Localize an array of { en, es } (or plain strings). */
function LA(arr, code) {
  return (arr ?? []).map((x) => L(x, code))
}

/**
 * Documents, each with a canonical key, localized name, and difficulty (A-12).
 * `certain`→difficulty: how hard it is for a rural family to produce.
 */
const DOCS = {
  income: { name: { en: 'Proof of income', es: 'Comprobante de ingresos' }, difficulty: 'medium' },
  stateId: { name: { en: 'State ID', es: 'Identificación oficial' }, difficulty: 'easy' },
  residency: { name: { en: 'Residency proof', es: 'Comprobante de domicilio' }, difficulty: 'medium' },
  referral: { name: { en: 'Referral letter', es: 'Carta de remisión' }, difficulty: 'easy' },
  travelReceipts: { name: { en: 'Travel receipts', es: 'Recibos de viaje' }, difficulty: 'hard' },
  bank: { name: { en: 'Bank account details', es: 'Datos de cuenta bancaria' }, difficulty: 'medium' },
  records: { name: { en: 'Medical records / diagnosis summary', es: 'Historial médico / resumen del diagnóstico' }, difficulty: 'medium' },
  enrollment: { name: { en: 'Proof of enrollment in a scheme', es: 'Comprobante de inscripción en un programa' }, difficulty: 'medium' },
}

/** Plain-language names for the shared scheme ids (shared data has only en). */
const SCHEME_I18N = {
  medicaid: {
    name: { en: 'Medicaid', es: 'Medicaid' },
    notes: {
      en: 'Covers most specialty visits at approved providers.',
      es: 'Cubre la mayoría de las visitas a especialistas en proveedores aprobados.',
    },
  },
  'rural-health-grant': {
    name: { en: 'Rural Health Travel Grant', es: 'Subvención de viaje de salud rural' },
    notes: {
      en: 'Reimburses travel and lodging for distant specialty care.',
      es: 'Reembolsa viaje y alojamiento para atención especializada lejana.',
    },
  },
}

const COVER = {
  consultation: { en: 'Consultation', es: 'Consulta' },
  tests: { en: 'Tests', es: 'Análisis' },
  treatment: { en: 'Treatment', es: 'Tratamiento' },
  medicines: { en: 'Medicines', es: 'Medicinas' },
  travel: { en: 'Travel', es: 'Viaje' },
  lodging: { en: 'Lodging', es: 'Alojamiento' },
}

/**
 * Care-local augmentation for the SHARED schemes, keyed by scheme id (A-10/A-12).
 */
const SCHEME_DETAIL = {
  medicaid: {
    covers: [COVER.consultation, COVER.tests, COVER.treatment, COVER.medicines],
    docs: ['income', 'stateId', 'residency'],
    blockers: [
      { en: 'Only at approved providers — check the provider accepts it before you go.', es: 'Solo en proveedores aprobados — confirme que lo aceptan antes de ir.' },
      { en: 'Some procedures need pre-authorization, which can take a few days.', es: 'Algunos procedimientos requieren autorización previa, que puede tardar unos días.' },
    ],
    howToApply: { en: 'You are enrolled. Bring your Medicaid card and a photo ID.', es: 'Ya está inscrito. Lleve su tarjeta de Medicaid y una identificación con foto.' },
    eligibility: [
      { field: 'monthlyBudgetUsd', op: 'lte', value: 2000, why: { en: 'Low to moderate household income', es: 'Ingresos del hogar bajos o moderados' } },
    ],
  },
  'rural-health-grant': {
    covers: [COVER.travel, COVER.lodging],
    docs: ['referral', 'travelReceipts'],
    blockers: [
      { en: 'You must have a referral letter first.', es: 'Primero necesita una carta de remisión.' },
      { en: 'Reimbursed after the trip — keep every travel and lodging receipt.', es: 'Se reembolsa después del viaje — guarde todos los recibos de viaje y alojamiento.' },
    ],
    howToApply: { en: 'Apply at the clinic’s front desk or the grant’s website before you travel.', es: 'Solicítelo en la recepción de la clínica o en el sitio web del programa antes de viajar.' },
    eligibility: [
      { field: 'distanceToSpecialistMiles', op: 'gte', value: 40, why: { en: 'Specialist is far from home', es: 'El especialista está lejos de casa' } },
    ],
  },
}

/** Care-local AID PROGRAMS the shared Scheme list doesn't carry (A-11). */
const AID_PROGRAMS = [
  {
    id: 'heart-fund',
    name: { en: 'Community Heart Fund', es: 'Fondo Comunitario del Corazón' },
    kind: 'charity',
    covers: [COVER.treatment, COVER.medicines],
    summary: { en: 'Helps with specialist treatment costs for heart conditions.', es: 'Ayuda con los costos de tratamiento especializado para problemas del corazón.' },
    docs: ['records', 'income', 'bank'],
    howToApply: { en: 'Ask your clinic’s social worker to refer you, or apply online.', es: 'Pida a la trabajadora social de su clínica que lo remita, o solicite en línea.' },
    blockers: [{ en: 'Funds are limited each quarter — apply early.', es: 'Los fondos son limitados cada trimestre — solicite pronto.' }],
    eligibility: [
      { field: 'monthlyBudgetUsd', op: 'lte', value: 800, why: { en: 'Limited household budget', es: 'Presupuesto del hogar limitado' } },
    ],
  },
  {
    id: 'travel-companion-grant',
    name: { en: 'Patient Travel & Companion Grant', es: 'Subvención de Viaje y Acompañante' },
    kind: 'ngo_grant',
    covers: [COVER.travel, COVER.lodging],
    summary: { en: 'Covers a bus or shared ride and one overnight stay for a companion.', es: 'Cubre autobús o viaje compartido y una noche de alojamiento para un acompañante.' },
    docs: ['referral', 'enrollment'],
    howToApply: { en: 'Apply through the referring clinic once you have a referral.', es: 'Solicítelo a través de la clínica que lo remite una vez que tenga la remisión.' },
    blockers: [{ en: 'Only for trips over 50 miles.', es: 'Solo para viajes de más de 50 millas.' }],
    eligibility: [
      { field: 'distanceToSpecialistMiles', op: 'gte', value: 50, why: { en: 'Long trip to the specialist', es: 'Viaje largo hasta el especialista' } },
    ],
  },
  {
    id: 'womens-health-scholarship',
    name: { en: 'Women’s Health Access Scholarship', es: 'Beca de Acceso a Salud de la Mujer' },
    kind: 'charity',
    covers: [COVER.consultation, COVER.tests, COVER.treatment],
    summary: { en: 'Supports women over 40 getting specialty screening and care.', es: 'Apoya a mujeres mayores de 40 años para exámenes y atención especializada.' },
    docs: ['stateId', 'records'],
    howToApply: { en: 'Apply directly on the foundation’s site; no referral needed.', es: 'Solicite directamente en el sitio de la fundación; no necesita remisión.' },
    blockers: [],
    eligibility: [
      { field: 'age', op: 'gte', value: 40, why: { en: 'Age 40 or older', es: '40 años o más' } },
      { field: 'sex', op: 'eq', value: 'female', why: { en: 'Program is for women', es: 'El programa es para mujeres' } },
    ],
  },
]

function ruleMet(rule, patient) {
  const v = patient?.[rule.field]
  if (v == null) return false
  switch (rule.op) {
    case 'lte': return Number(v) <= rule.value
    case 'gte': return Number(v) >= rule.value
    case 'eq': return v === rule.value
    case 'in': return Array.isArray(rule.value) && rule.value.includes(v)
    default: return false
  }
}

function evaluate(rules, patient, code) {
  const met = []
  const unmet = []
  for (const rule of rules ?? []) {
    ;(ruleMet(rule, patient) ? met : unmet).push(L(rule.why, code))
  }
  return { met, unmet, eligible: unmet.length === 0 }
}

/** Localized documents for a list of doc keys (A-12). */
function docsFor(keys, code) {
  return (keys ?? []).map((k) => {
    const d = DOCS[k]
    return { name: L(d?.name, code), difficulty: d?.difficulty ?? 'medium' }
  })
}

/**
 * Check a patient against all shared schemes + care-local aid programs.
 *
 * @param {import('../../shared/models.js').Patient} patient
 * @param {string} [code]  Language code: 'en' | 'es'. Defaults to 'en'.
 */
export function checkEligibility(patient, code = 'en') {
  const held = new Set(patient?.schemeIds ?? [])

  const schemeResults = sharedSchemes.map((s) => {
    const detail = SCHEME_DETAIL[s.id] ?? {}
    const i18n = SCHEME_I18N[s.id]
    const enrolled = held.has(s.id)
    const evalResult = evaluate(detail.eligibility, patient, code)
    return {
      id: s.id,
      name: i18n ? L(i18n.name, code) : s.name,
      kind: s.kind,
      coveragePct: s.coveragePct,
      notes: i18n ? L(i18n.notes, code) : s.notes,
      covers: LA(detail.covers, code),
      blockers: LA(detail.blockers, code),
      howToApply: L(detail.howToApply, code),
      documents: docsFor(detail.docs, code),
      enrolled,
      status: enrolled ? 'enrolled' : evalResult.eligible ? 'may_qualify' : 'unlikely',
      reasons: enrolled ? ['__enrolled__'] : evalResult.met,
      missingReasons: enrolled ? [] : evalResult.unmet,
    }
  })

  const aidResults = AID_PROGRAMS.map((a) => {
    const evalResult = evaluate(a.eligibility, patient, code)
    return {
      id: a.id,
      name: L(a.name, code),
      kind: a.kind,
      summary: L(a.summary, code),
      covers: LA(a.covers, code),
      blockers: LA(a.blockers, code),
      howToApply: L(a.howToApply, code),
      documents: docsFor(a.docs, code),
      status: evalResult.eligible ? 'may_qualify' : 'unlikely',
      reasons: evalResult.met,
      missingReasons: evalResult.unmet,
    }
  })

  const usable = [...schemeResults, ...aidResults].filter(
    (x) => x.status === 'enrolled' || x.status === 'may_qualify',
  )
  const hardDocs = Array.from(
    new Set(
      usable
        .flatMap((x) => x.documents)
        .filter((d) => d.difficulty === 'hard')
        .map((d) => d.name),
    ),
  )

  return { schemes: schemeResults, aid: aidResults, hardDocs }
}
