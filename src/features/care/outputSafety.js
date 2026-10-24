/**
 * Checks AI-written text for things the symptom checker must never say (X-1):
 * disease or condition names, medicine names or doses, and diagnostic phrasing.
 *
 * The prompt already forbids these. This check is the part we can rely on:
 * if anything matches, the caller throws the AI answer away and uses the
 * offline keyword helper instead.
 *
 * Keep the list conservative. Rejecting a harmless answer only costs us the
 * AI wording; letting a diagnosis through is the failure we must avoid.
 * Pure module, no I/O.
 */
import { SPECIALTY_LABELS } from '../../shared/models.js'
import { careTypeLabel } from './symptomChecker.js'

const CONDITIONS = [
  'cancer', 'tumor', 'tumour', 'malignan', 'diabetes', 'diabetic', 'angina',
  'heart attack', 'heart disease', 'heart failure', 'arrhythmia', 'stroke',
  'hypertension', 'high blood pressure', 'asthma', 'copd', 'pneumonia',
  'bronchitis', 'tuberculosis', 'infection', 'covid', 'hiv', 'hepatitis',
  'kidney disease', 'arthritis', 'osteoporosis', 'fracture', 'depression',
  'anxiety disorder', 'bipolar', 'migraine', 'epilepsy', 'dementia',
  'eczema', 'psoriasis', 'melanoma', 'glaucoma', 'cataract',
]

const MEDICINES = [
  'aspirin', 'ibuprofen', 'paracetamol', 'acetaminophen', 'naproxen',
  'metformin', 'insulin', 'antibiotic', 'amoxicillin', 'statin',
  'nitroglycerin', 'inhaler', 'steroid', 'prednisone', 'painkiller',
  'antidepressant', 'antihistamine',
]

// Spanish, because the AI can now answer in Spanish. Accents are kept; the
// check also runs on an accent-stripped copy of the text.
const CONDITIONS_ES = [
  'cancer', 'tumor', 'maligno', 'diabetes', 'diabetico', 'angina', 'infarto',
  'enfermedad cardiaca', 'insuficiencia cardiaca', 'arritmia', 'derrame cerebral',
  'accidente cerebrovascular', 'hipertension', 'presion alta', 'asma', 'epoc',
  'neumonia', 'bronquitis', 'tuberculosis', 'infeccion', 'vih', 'hepatitis',
  'enfermedad renal', 'artritis', 'osteoporosis', 'fractura', 'depresion',
  'trastorno de ansiedad', 'bipolar', 'migrana', 'epilepsia', 'demencia',
  'eccema', 'psoriasis', 'melanoma', 'glaucoma', 'catarata',
]
const MEDICINES_ES = [
  'aspirina', 'ibuprofeno', 'paracetamol', 'acetaminofen', 'naproxeno',
  'metformina', 'insulina', 'antibiotico', 'amoxicilina', 'estatina',
  'nitroglicerina', 'inhalador', 'esteroide', 'prednisona', 'analgesico',
  'antidepresivo', 'antihistaminico',
]

// Diagnostic phrasing and dosing, e.g. "you have", "diagnosed with", "50 mg".
const PATTERNS = [
  /\busted (?:tiene|padece|sufre)\b/,
  /\bdiagnosticad[oa]\b|\bsu diagnostico es\b|\bdiagnostico de\b/,
  /\b(?:le )?recet(?:o|amos|ara|amos)\b/,
  // "You may have…" guesses at a diagnosis; plain "you have" is everyday
  // English ("if you have a health worker"), so it only counts before a
  // diagnosis word. Condition names themselves are caught by the term list.
  // Narrowed after tests/safety.pbt.mjs flagged our own emergency advice.
  /\byou (?:may|might|probably|likely|could) (?:have|be suffering from)\b/,
  /\byou are suffering from\b/,
  /\byou have (?:a |an )?(?:condition|disease|disorder|illness|syndrome)\b/,
  /\bsounds like (?:you have|a case of)\b/,
  /\bdiagnos(?:ed|is of|e you)\b/,
  /\bprescri/,
  /\b\d+\s?(?:mg|mcg|ml)\b/,
  /\b(?:take|start|stop|increase|reduce) (?:your |the |some |a )?\w+ (?:twice|daily|once|every)\b/,
]

const wordPattern = (term) => new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}`, 'i')
const TERM_PATTERNS = [...CONDITIONS, ...MEDICINES, ...CONDITIONS_ES, ...MEDICINES_ES].map(
  (t) => [t, wordPattern(t)],
)

/** Lowercase and remove accents, so "cáncer" matches "cancer". */
const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Every banned condition and medicine term (for tests). */
export const UNSAFE_TERMS = [...CONDITIONS, ...MEDICINES, ...CONDITIONS_ES, ...MEDICINES_ES]

/**
 * Our own care-type labels (e.g. "Diabetes / hormone specialist
 * (endocrinology)", "Cancer specialist (oncology)") name a *kind of doctor*,
 * not the patient's condition. They're removed before checking, so the AI may
 * repeat our exact wording; the same words used any other way still count.
 * Found by the property test "none of the app's own headlines and tips are
 * flagged as unsafe" (tests/safety.pbt.mjs).
 */
let ownLabels = null
function getOwnLabels() {
  ownLabels ??= [
    ...Object.values(SPECIALTY_LABELS),
    ...['en', 'es'].flatMap((code) => Object.keys(SPECIALTY_LABELS).map((k) => careTypeLabel(k, code))),
  ]
    .filter(Boolean)
    .map(plain)
    .sort((a, b) => b.length - a.length) // longest first, so nested labels go cleanly
  return ownLabels
}

/**
 * @param {string[]} texts  Every string the AI wrote that will be shown.
 * @returns {string[]}      The terms or patterns found; empty means safe.
 */
export function findUnsafeTerms(texts) {
  let text = plain(texts.filter((t) => typeof t === 'string').join(' \n '))
  for (const label of getOwnLabels()) text = text.split(label).join(' ')
  const hits = TERM_PATTERNS.filter(([, re]) => re.test(text)).map(([t]) => t)
  for (const re of PATTERNS) {
    if (re.test(text)) hits.push(re.source)
  }
  return hits
}
