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

/**
 * @typedef {Object} CareSuggestion
 * @property {'emergency'|'suggestion'|'unclear'} kind
 * @property {string} careType          Plain-language care type, e.g. "Heart specialist (cardiology)". Empty for emergency/unclear.
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
    careType: { en: 'Heart specialist (cardiology)', es: 'Especialista del corazón (cardiología)' },
    firstStep: {
      en: 'a primary-care or general doctor, who can check your heart and refer you if needed',
      es: 'un médico general o de atención primaria, que puede revisar su corazón y remitirlo si hace falta',
    },
    words: [
      'chest tight', 'tight chest', 'chest tightness', 'chest pressure',
      'short of breath', 'shortness of breath', 'breathless',
      'palpitations', 'heart racing', 'heart flutter', 'heart pounding',
    ],
  },
  {
    careType: { en: 'Lung / breathing specialist (pulmonology)', es: 'Especialista de pulmones / respiración (neumología)' },
    firstStep: { en: 'a primary-care or general doctor first', es: 'primero un médico general o de atención primaria' },
    words: [
      'long cough', 'cough for weeks', 'persistent cough', 'wheezing',
      'wheeze', 'coughing a lot', 'breathing problem',
    ],
  },
  {
    careType: { en: 'Diabetes / hormone specialist (endocrinology)', es: 'Especialista en diabetes / hormonas (endocrinología)' },
    firstStep: {
      en: 'a primary-care or general doctor, who can run blood tests first',
      es: 'un médico general o de atención primaria, que puede hacer análisis de sangre primero',
    },
    words: [
      'sugar problem', 'sugar high', 'high sugar', 'diabetes', 'very thirsty',
      'always thirsty', 'peeing a lot', 'urinating a lot', 'blurry vision and thirsty',
    ],
  },
  {
    careType: { en: 'Bone & joint specialist (orthopedics)', es: 'Especialista de huesos y articulaciones (ortopedia)' },
    firstStep: {
      en: 'a primary-care or general doctor first, unless it followed an injury',
      es: 'primero un médico general o de atención primaria, salvo que haya sido por una lesión',
    },
    words: [
      'joint pain', 'knee pain', 'back pain', 'swollen joint', 'can’t walk',
      "can't walk properly", 'bone pain', 'hip pain',
    ],
  },
  {
    careType: { en: 'Skin specialist (dermatology)', es: 'Especialista de la piel (dermatología)' },
    firstStep: {
      en: 'a primary-care or general doctor, who can look and refer if needed',
      es: 'un médico general o de atención primaria, que puede revisarlo y remitirlo si hace falta',
    },
    words: ['skin rash', 'rash', 'itchy skin', 'skin lump', 'mole changing', 'spot on skin'],
  },
  {
    careType: { en: "Women's health specialist (obstetrics & gynaecology)", es: 'Especialista en salud de la mujer (obstetricia y ginecología)' },
    firstStep: { en: 'a primary-care doctor or a women’s health clinic', es: 'un médico de atención primaria o una clínica de salud de la mujer' },
    words: ['breast lump', 'lump in breast', 'heavy bleeding', 'pregnancy', 'pregnant', 'missed periods', 'pelvic pain'],
  },
  {
    careType: { en: 'Eye specialist (ophthalmology)', es: 'Especialista de los ojos (oftalmología)' },
    firstStep: { en: 'a primary-care doctor or an eye clinic', es: 'un médico de atención primaria o una clínica de los ojos' },
    words: ['blurry vision', 'blurred vision', 'eye pain', 'can’t see well', 'vision problem', 'red eye'],
  },
  {
    careType: { en: 'Mental health support', es: 'Apoyo de salud mental' },
    firstStep: { en: 'a primary-care doctor or a counsellor you trust', es: 'un médico de atención primaria o un consejero de confianza' },
    words: ['feeling low', 'depressed', 'anxious', 'can’t sleep', 'cannot sleep', 'very stressed', 'panic'],
  },
]

/** Pick a localized string from a { en, es } object. */
function L(obj, code) {
  if (obj == null) return ''
  if (typeof obj === 'string') return obj
  return obj[code] ?? obj.en ?? ''
}

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
 * @param {string} [code] Language code: 'en' | 'es'. Defaults to 'en'.
 * @returns {CareSuggestion}
 */
export function suggestCareType(text, code = 'en') {
  const input = normalise(text)

  const COPY = {
    emptyHeadline: {
      en: 'Tell us what you are feeling, in your own words.',
      es: 'Díganos qué está sintiendo, con sus propias palabras.',
    },
    emptyNote: {
      en: 'For example: “chest feels tight when I walk uphill” or “cough for three weeks”.',
      es: 'Por ejemplo: “el pecho se siente apretado al subir una cuesta” o “tos por tres semanas”.',
    },
    emergencyHeadline: {
      en: 'This may be an emergency. Call emergency services now.',
      es: 'Esto puede ser una emergencia. Llame a los servicios de emergencia ahora.',
    },
    emergencyNotes: {
      en: [
        'Do not wait and do not drive yourself if you can avoid it.',
        'If you have a community health worker, alert them as well.',
      ],
      es: [
        'No espere y no conduzca usted mismo si puede evitarlo.',
        'Si tiene un trabajador de salud comunitario, avísele también.',
      ],
    },
    suggestHeadline: {
      en: (ct) => `This sounds like it may need ${ct}.`,
      es: (ct) => `Esto parece que podría necesitar ${ct}.`,
    },
    suggestNotes: {
      en: (fs) => [
        `A good first step is to see ${fs}.`,
        'Seeing the right kind of doctor first can save a wasted trip and money (A-4).',
        'The sooner you ask, the more options you usually have — it rarely helps to wait (A-1).',
      ],
      es: (fs) => [
        `Un buen primer paso es ver ${fs}.`,
        'Ver al tipo de médico correcto primero puede ahorrar un viaje y dinero (A-4).',
        'Mientras antes pregunte, más opciones suele tener — rara vez ayuda esperar (A-1).',
      ],
    },
    unclearHeadline: {
      en: 'We can’t match this to a specific kind of care.',
      es: 'No podemos relacionar esto con un tipo de atención específico.',
    },
    unclearNotes: {
      en: [
        'That’s okay. A primary-care or general doctor is a safe first stop — they can check and point you to a specialist if you need one.',
        'If the problem is getting worse quickly, treat it as urgent.',
      ],
      es: [
        'Está bien. Un médico general o de atención primaria es un primer paso seguro — pueden revisarlo y remitirlo a un especialista si hace falta.',
        'Si el problema empeora rápido, trátelo como urgente.',
      ],
    },
  }

  if (input === '') {
    return {
      kind: 'unclear',
      careType: '',
      headline: L(COPY.emptyHeadline, code),
      notes: [L(COPY.emptyNote, code)],
      matchedWords: [],
    }
  }

  // 1) EMERGENCY FIRST — never skip this (X-2).
  const emergencyHits = EMERGENCY_SIGNS.filter((sign) => input.includes(sign))
  if (emergencyHits.length > 0) {
    return {
      kind: 'emergency',
      careType: '',
      headline: L(COPY.emergencyHeadline, code),
      notes: L(COPY.emergencyNotes, code),
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
    const careType = L(primary.careType, code)
    const firstStep = L(primary.firstStep, code)
    return {
      kind: 'suggestion',
      careType,
      headline: L(COPY.suggestHeadline, code)(careType),
      notes: L(COPY.suggestNotes, code)(firstStep),
      matchedWords: dedupe(matches),
    }
  }

  // 3) NOT RECOGNISED — do not guess. Point to a safe general first step.
  return {
    kind: 'unclear',
    careType: '',
    headline: L(COPY.unclearHeadline, code),
    notes: L(COPY.unclearNotes, code),
    matchedWords: [],
  }
}

/** Example phrases in everyday language, for quick-pick chips (A-5). */
const EXAMPLES = {
  en: [
    'Chest feels tight when I walk uphill',
    'Cough for three weeks',
    'Always thirsty and peeing a lot',
    'Knee pain when I stand up',
    'A lump in my breast',
    'Sudden slurred speech', // demonstrates the emergency path
  ],
  es: [
    'El pecho se siente apretado al subir una cuesta',
    'Tos durante tres semanas',
    'Siempre con sed y orinando mucho',
    'Dolor de rodilla al ponerme de pie',
    'Un bulto en el pecho',
    'Habla arrastrada de repente', // demonstrates the emergency path
  ],
}

/** @param {string} [code] 'en' | 'es' */
export function getExampleSymptoms(code = 'en') {
  return EXAMPLES[code] ?? EXAMPLES.en
}

/** Back-compat English export (kept for any existing importers). */
export const EXAMPLE_SYMPTOMS = EXAMPLES.en

function dedupe(arr) {
  return Array.from(new Set(arr))
}
