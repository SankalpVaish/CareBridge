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

// Diagnostic phrasing and dosing, e.g. "you have", "diagnosed with", "50 mg".
const PATTERNS = [
  /\byou (?:may |might |probably |likely )?(?:have|are suffering from)\b/,
  /\bsounds like (?:you have|a case of)\b/,
  /\bdiagnos(?:ed|is of|e you)\b/,
  /\bprescri/,
  /\b\d+\s?(?:mg|mcg|ml)\b/,
  /\b(?:take|start|stop|increase|reduce) (?:your |the |some |a )?\w+ (?:twice|daily|once|every)\b/,
]

const wordPattern = (term) => new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}`, 'i')
const TERM_PATTERNS = [...CONDITIONS, ...MEDICINES].map((t) => [t, wordPattern(t)])

/**
 * @param {string[]} texts  Every string the AI wrote that will be shown.
 * @returns {string[]}      The terms or patterns found; empty means safe.
 */
export function findUnsafeTerms(texts) {
  const text = texts.filter((t) => typeof t === 'string').join(' \n ').toLowerCase()
  const hits = TERM_PATTERNS.filter(([, re]) => re.test(text)).map(([t]) => t)
  for (const re of PATTERNS) {
    if (re.test(text)) hits.push(re.source)
  }
  return hits
}
