/**
 * Symptom-to-care-type helper (Workstream A, questions A-1..A-5).
 *
 * WHAT THIS IS
 * ------------
 * A keyword-based helper that turns a patient's own words into:
 *   1. an emergency check that runs FIRST (A-3, X-2), and
 *   2. a suggested *type* of care to seek first (A-4), with plain-language
 *      "what to do next" guidance so people neither wait too long (A-1) nor
 *      walk into the wrong kind of clinic (A-4).
 *
 * HARD GUARDRAILS (see README X-1, X-2)
 * -------------------------------------
 * - This NEVER diagnoses and NEVER names a disease or medicine. It only points
 *   to a *kind* of care (e.g. "a heart specialist / cardiology").
 * - Emergency danger-sign phrases are checked before anything else, and the
 *   result tells the person to call emergency services right away. Emergencies
 *   are never silently downgraded into ordinary guidance.
 *
 * WHY KEYWORDS (A-5)
 * ------------------
 * Patients describe symptoms in everyday language ("my chest feels tight",
 * "can't catch my breath", "sugar problem"). Each rule below lists the plain
 * words people actually use, and maps them to the medical-sounding care type
 * only on the output side. That gap between patient words and medical language
 * is exactly what A-5 is about.
 *
 * This module is pure (no React, no I/O) so it is easy to test and reuse.
 */
import { SPECIALTY_LABELS } from '../../shared/models.js'

/**
 * @typedef {Object} CareSuggestion
 * @property {'emergency'|'suggestion'|'unclear'} kind
 * @property {string} careType          Plain-language care type, e.g. "Heart specialist (cardiology)". Empty for emergency/unclear.
 * @property {string} specialty         Key from SPECIALTY_LABELS (src/shared/models.js) used to open a matching
 *                                      search in Find & Trust: 'emergency care' for emergencies, 'primary care'
 *                                      when unclear, '' when nothing was entered.
 * @property {string} headline          Short "what to do next" line.
 * @property {string[]} notes           Extra plain-language guidance (A-1, A-4).
 * @property {string[]} matchedWords    The patient words we recognised (A-5), for transparency.
 */

/**
 * Emergency danger signs (A-3, X-2). Checked FIRST, before any care-type rule.
 * Phrases are intentionally plain and lowercase. Keep this conservative:
 * when in doubt, it is safer to send someone to emergency care.
 */
const EMERGENCY_SIGNS = [
  'chest pain',
  'crushing chest',
  'pressure in chest',
  'can’t breathe',
  "can't breathe",
  'cannot breathe',
  'struggling to breathe',
  'face drooping',
  'face is drooping',
  'slurred speech',
  'slurring',
  'sudden weakness',
  'weakness on one side',
  'numb on one side',
  'worst headache',
  'sudden severe headache',
  'uncontrolled bleeding',
  'bleeding that won’t stop',
  "bleeding that won't stop",
  'coughing blood',
  'coughing up blood',
  'unconscious',
  'passed out',
  'fainted',
  'seizure',
  'fitting',
  'blue lips',
  'suicidal',
  'want to end my life',
]

/**
 * Care-type rules (A-4, A-5). Each rule lists everyday patient words and the
 * plain-language care type to suggest first. Order matters only for the
 * matched-words list; the first matching rule wins for the headline.
 *
 * NOTE: careType is a *kind of care*, never a diagnosis.
 */
const CARE_RULES = [
  {
    specialty: 'cardiology',
    careType: 'Heart specialist (cardiology)',
    firstStep: 'a primary-care or general doctor, who can check your heart and refer you if needed',
    words: [
      'chest tight',
      'tight chest',
      'chest tightness',
      'chest pressure',
      'short of breath',
      'shortness of breath',
      'breathless',
      'palpitations',
      'heart racing',
      'heart flutter',
      'heart pounding',
    ],
  },
  {
    specialty: 'pulmonology',
    careType: 'Lung / breathing specialist (pulmonology)',
    firstStep: 'a primary-care or general doctor first',
    words: [
      'long cough',
      'cough for weeks',
      'persistent cough',
      'wheezing',
      'wheeze',
      'coughing a lot',
      'breathing problem',
    ],
  },
  {
    specialty: 'endocrinology',
    careType: 'Diabetes / hormone specialist (endocrinology)',
    firstStep: 'a primary-care or general doctor, who can run blood tests first',
    words: [
      'sugar problem',
      'sugar high',
      'high sugar',
      'diabetes',
      'very thirsty',
      'always thirsty',
      'peeing a lot',
      'urinating a lot',
      'blurry vision and thirsty',
    ],
  },
  {
    specialty: 'orthopedics',
    careType: 'Bone & joint specialist (orthopedics)',
    firstStep: 'a primary-care or general doctor first, unless it followed an injury',
    words: [
      'joint pain',
      'knee pain',
      'back pain',
      'swollen joint',
      'can’t walk',
      "can't walk properly",
      'bone pain',
      'hip pain',
    ],
  },
  {
    specialty: 'dermatology',
    careType: 'Skin specialist (dermatology)',
    firstStep: 'a primary-care or general doctor, who can look and refer if needed',
    words: [
      'skin rash',
      'rash',
      'itchy skin',
      'skin lump',
      'mole changing',
      'spot on skin',
    ],
  },
  {
    specialty: 'obgyn',
    careType: "Women's health specialist (obstetrics & gynaecology)",
    firstStep: 'a primary-care doctor or a women’s health clinic',
    words: [
      'breast lump',
      'lump in breast',
      'heavy bleeding',
      'pregnancy',
      'pregnant',
      'missed periods',
      'pelvic pain',
    ],
  },
  {
    specialty: 'ophthalmology',
    careType: 'Eye specialist (ophthalmology)',
    firstStep: 'a primary-care doctor or an eye clinic',
    words: [
      'blurry vision',
      'blurred vision',
      'eye pain',
      'can’t see well',
      'vision problem',
      'red eye',
    ],
  },
  {
    specialty: 'mental health',
    careType: 'Mental health support',
    firstStep: 'a primary-care doctor or a counsellor you trust',
    words: [
      'feeling low',
      'depressed',
      'anxious',
      'can’t sleep',
      'cannot sleep',
      'very stressed',
      'panic',
    ],
  },
]

/** Normalise text for matching: lowercase, collapse whitespace. */
function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Turn a free-text symptom description into a care suggestion.
 * Emergency signs are always checked first (A-3, X-2).
 *
 * @param {string} text  The patient's own words (A-5).
 * @returns {CareSuggestion}
 */
export function suggestCareType(text) {
  const input = normalise(text)

  if (input === '') {
    return {
      kind: 'unclear',
      careType: '',
      specialty: '',
      headline: 'Tell us what you are feeling, in your own words.',
      notes: [
        'For example: “chest feels tight when I walk uphill” or “cough for three weeks”.',
      ],
      matchedWords: [],
    }
  }

  // 1) EMERGENCY FIRST — never skip this (X-2).
  const emergencyHits = EMERGENCY_SIGNS.filter((sign) => input.includes(sign))
  if (emergencyHits.length > 0) {
    return {
      kind: 'emergency',
      careType: '',
      specialty: 'emergency care',
      headline: 'This may be an emergency. Call emergency services now.',
      notes: [
        'Do not wait and do not drive yourself if you can avoid it.',
        'If you have a community health worker, alert them as well.',
      ],
      matchedWords: dedupe(emergencyHits),
    }
  }

  // 2) CARE-TYPE SUGGESTION (A-4, A-5).
  const matches = []
  let primary = null
  for (const rule of CARE_RULES) {
    const hits = rule.words.filter((w) => input.includes(w))
    if (hits.length > 0) {
      matches.push(...hits)
      if (!primary) primary = rule
    }
  }

  if (primary) {
    return {
      kind: 'suggestion',
      careType: primary.careType,
      specialty: primary.specialty,
      headline: `This sounds like it may need ${primary.careType}.`,
      notes: [
        `A good first step is to see ${primary.firstStep}.`,
        'Seeing the right kind of doctor first can save a wasted trip and money (A-4).',
        'The sooner you ask, the more options you usually have — it rarely helps to wait (A-1).',
      ],
      matchedWords: dedupe(matches),
    }
  }

  // 3) NOT RECOGNISED — do not guess. Point to a safe general first step.
  return {
    kind: 'unclear',
    careType: '',
    specialty: 'primary care',
    headline: 'We can’t match this to a specific kind of care.',
    notes: [
      'That’s okay. A primary-care or general doctor is a safe first stop — they can check and point you to a specialist if you need one.',
      'If the problem is getting worse quickly, treat it as urgent.',
    ],
    matchedWords: [],
  }
}

/** Example phrases in everyday language, for quick-pick chips (A-5). */
export const EXAMPLE_SYMPTOMS = [
  'Chest feels tight when I walk uphill',
  'Cough for three weeks',
  'Always thirsty and peeing a lot',
  'Knee pain when I stand up',
  'A lump in my breast',
  'Sudden slurred speech', // demonstrates the emergency path
]

/**
 * Works out the specialty key from free-text care type (e.g. the AI's answer).
 * Matches the key itself ("cardiology") or its full label; falls back to
 * primary care, which is always a safe first step.
 *
 * @param {string} careType
 * @returns {string}  A key from SPECIALTY_LABELS
 */
export function specialtyFromCareType(careType) {
  const text = normalise(careType)
  if (!text) return 'primary care'
  // Specialists only (primary care is the fallback), and longest keys first so
  // "surgical oncology" wins over "oncology".
  const keys = Object.keys(SPECIALTY_LABELS)
    .filter((k) => k !== 'primary care')
    .sort((a, b) => b.length - a.length)
  return (
    keys.find((k) => text.includes(k) || text.includes(normalise(SPECIALTY_LABELS[k]))) ??
    'primary care'
  )
}

function dedupe(arr) {
  return Array.from(new Set(arr))
}
