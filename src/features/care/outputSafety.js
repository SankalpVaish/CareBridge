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
  /\byou (?:may |might |probably |likely )?(?:have|are suffering from)\b/,
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

/**
 * @param {string[]} texts  Every string the AI wrote that will be shown.
 * @returns {string[]}      The terms or patterns found; empty means safe.
 */
export function findUnsafeTerms(texts) {
  const text = plain(texts.filter((t) => typeof t === 'string').join(' \n '))
  const hits = TERM_PATTERNS.filter(([, re]) => re.test(text)).map(([t]) => t)
  for (const re of PATTERNS) {
    if (re.test(text)) hits.push(re.source)
  }
  return hits
}
