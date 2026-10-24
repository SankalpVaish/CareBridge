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
  'pain in chest', // also matches "pain in my chest"
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
  // Spanish (the care section can run in Spanish). Written with and without
  // accents, because people often type without them.
  'dolor de pecho',
  'dolor en el pecho',
  'presión en el pecho',
  'presion en el pecho',
  'no puedo respirar',
  'me cuesta respirar',
  'cara caída',
  'cara caida',
  'habla arrastrada',
  'arrastra las palabras',
  'debilidad repentina',
  'debilidad de un lado',
  'entumecido de un lado',
  'el peor dolor de cabeza',
  'dolor de cabeza fuerte y repentino',
  'sangrado que no para',
  'sangra y no para',
  'tos con sangre',
  'tosiendo sangre',
  'inconsciente',
  'se desmayó',
  'se desmayo',
  'me desmayé',
  'me desmaye',
  'convulsión',
  'convulsion',
  'labios azules',
  'quiero morir',
  'quitarme la vida',
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
    careType: { en: 'Heart specialist (cardiology)', es: 'Especialista del corazón (cardiología)' },
    firstStep: {
      en: 'a primary-care or general doctor, who can check your heart and refer you if needed',
      es: 'un médico general o de atención primaria, que puede revisar su corazón y remitirlo si hace falta',
    },
    words: [
      'chest tight', 'tight chest', 'chest tightness', 'chest pressure',
      'short of breath', 'shortness of breath', 'breathless',
      'palpitations', 'heart racing', 'heart flutter', 'heart pounding',
      // Spanish
      'pecho apretado', 'opresion en el pecho', 'falta de aire', 'me falta el aire',
      'me ahogo', 'palpitaciones', 'corazon acelerado', 'corazon late rapido',
    ],
  },
  {
    specialty: 'pulmonology',
    careType: { en: 'Lung / breathing specialist (pulmonology)', es: 'Especialista de pulmones / respiración (neumología)' },
    firstStep: { en: 'a primary-care or general doctor first', es: 'primero un médico general o de atención primaria' },
    words: [
      'long cough', 'cough for weeks', 'persistent cough', 'wheezing',
      'wheeze', 'coughing a lot', 'breathing problem',
      // Spanish
      'tos semanas', 'tos persistente', 'tos que no se quita', 'mucha tos',
      'silbido al respirar', 'sibilancias', 'problema para respirar',
    ],
  },
  {
    specialty: 'endocrinology',
    careType: { en: 'Diabetes / hormone specialist (endocrinology)', es: 'Especialista en diabetes / hormonas (endocrinología)' },
    firstStep: {
      en: 'a primary-care or general doctor, who can run blood tests first',
      es: 'un médico general o de atención primaria, que puede hacer análisis de sangre primero',
    },
    words: [
      'sugar problem', 'sugar high', 'high sugar', 'diabetes', 'very thirsty',
      'always thirsty', 'peeing a lot', 'urinating a lot', 'blurry vision and thirsty',
      // Spanish
      'mucha sed', 'siempre con sed', 'orinando mucho', 'orino mucho',
      'azucar alta', 'problema de azucar',
    ],
  },
  {
    specialty: 'orthopedics',
    careType: { en: 'Bone & joint specialist (orthopedics)', es: 'Especialista de huesos y articulaciones (ortopedia)' },
    firstStep: {
      en: 'a primary-care or general doctor first, unless it followed an injury',
      es: 'primero un médico general o de atención primaria, salvo que haya sido por una lesión',
    },
    words: [
      'joint pain', 'knee pain', 'back pain', 'swollen joint', 'can’t walk',
      "can't walk properly", 'bone pain', 'hip pain',
      // Spanish
      'dolor de rodilla', 'dolor de espalda', 'dolor de cadera', 'dolor de huesos',
      'dolor en las articulaciones', 'articulacion hinchada', 'no puedo caminar bien',
    ],
  },
  {
    specialty: 'dermatology',
    careType: { en: 'Skin specialist (dermatology)', es: 'Especialista de la piel (dermatología)' },
    firstStep: {
      en: 'a primary-care or general doctor, who can look and refer if needed',
      es: 'un médico general o de atención primaria, que puede revisarlo y remitirlo si hace falta',
    },
    words: [
      'skin rash', 'rash', 'itchy skin', 'skin lump', 'mole changing', 'spot on skin',
      // Spanish
      'sarpullido', 'erupcion en la piel', 'picazon en la piel', 'lunar que cambia',
      'mancha en la piel', 'bulto en la piel',
    ],
  },
  {
    specialty: 'obgyn',
    careType: { en: "Women's health specialist (obstetrics & gynaecology)", es: 'Especialista en salud de la mujer (obstetricia y ginecología)' },
    firstStep: { en: 'a primary-care doctor or a women’s health clinic', es: 'un médico de atención primaria o una clínica de salud de la mujer' },
    words: [
      'breast lump', 'lump in breast', 'heavy bleeding', 'pregnancy', 'pregnant', 'missed periods', 'pelvic pain',
      // Spanish ("pecho" also means breast)
      'bulto en el seno', 'bulto en el pecho', 'sangrado abundante', 'embarazo',
      'embarazada', 'falta de regla', 'no me baja la regla', 'dolor pelvico',
    ],
  },
  {
    specialty: 'ophthalmology',
    careType: { en: 'Eye specialist (ophthalmology)', es: 'Especialista de los ojos (oftalmología)' },
    firstStep: { en: 'a primary-care doctor or an eye clinic', es: 'un médico de atención primaria o una clínica de los ojos' },
    words: [
      'blurry vision', 'blurred vision', 'eye pain', 'can’t see well', 'vision problem', 'red eye',
      // Spanish
      'vision borrosa', 'veo borroso', 'dolor de ojo', 'ojo rojo', 'no veo bien',
    ],
  },
  {
    specialty: 'mental health',
    careType: { en: 'Mental health support', es: 'Apoyo de salud mental' },
    firstStep: { en: 'a primary-care doctor or a counsellor you trust', es: 'un médico de atención primaria o un consejero de confianza' },
    words: [
      'feeling low', 'depressed', 'anxious', 'can’t sleep', 'cannot sleep', 'very stressed', 'panic',
      // Spanish
      'me siento triste', 'deprimido', 'deprimida', 'ansioso', 'ansiosa',
      'no puedo dormir', 'muy estresado', 'muy estresada', 'panico',
    ],
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
 * Words for matching: lowercase, accents removed ("caída" → "caida"), curly
 * apostrophes straightened, punctuation dropped.
 */
function words(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** Up to this many other words may sit between the words of a phrase. */
const MAX_GAP = 2

/** A word matches exactly, or as a longer form ("tight" → "tightness"). */
const wordMatches = (word, target) =>
  word === target || (target.length >= 4 && word.startsWith(target))

/**
 * True when the phrase's words appear in order in the input, with at most
 * MAX_GAP words between each. So "chest tight" matches "chest feels tight"
 * and "lump in breast" matches "a lump in my breast" (A-5: everyday wording).
 *
 * @param {string[]} input   words(text)
 * @param {string} phrase
 */
function phraseMatches(input, phrase) {
  const target = words(phrase)
  if (target.length === 0) return false
  for (let start = 0; start < input.length; start++) {
    if (!wordMatches(input[start], target[0])) continue
    let pos = start
    let ok = true
    for (let k = 1; k < target.length && ok; k++) {
      const end = Math.min(pos + 1 + MAX_GAP, input.length - 1)
      let found = -1
      for (let j = pos + 1; j <= end; j++) {
        if (wordMatches(input[j], target[k])) {
          found = j
          break
        }
      }
      if (found < 0) ok = false
      else pos = found
    }
    if (ok) return true
  }
  return false
}

/**
 * Fixed advice added to every non-emergency result (O1: people self-medicate).
 * Our own wording, so it never names a medicine.
 */
export const SELF_MEDICATION_NOTE = {
  en: 'Don’t start, stop, or change any medicine on your own. Ask a doctor or pharmacist first.',
  es: 'No empiece, deje ni cambie ninguna medicina por su cuenta. Pregunte primero a un médico o farmacéutico.',
}

/** @param {string} [code] 'en' | 'es' */
export function selfMedicationNote(code = 'en') {
  return L(SELF_MEDICATION_NOTE, code)
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
      specialty: '',
      headline: L(COPY.emptyHeadline, code),
      notes: [L(COPY.emptyNote, code)],
      matchedWords: [],
    }
  }

  const inputWords = words(text)

  // 1) EMERGENCY FIRST — never skip this (X-2). Exact text OR the looser word
  // match, so the looser match can only catch more emergencies, never fewer.
  const emergencyHits = EMERGENCY_SIGNS.filter(
    (sign) => input.includes(sign) || phraseMatches(inputWords, sign),
  )
  if (emergencyHits.length > 0) {
    return {
      kind: 'emergency',
      careType: '',
      specialty: 'emergency care',
      headline: L(COPY.emergencyHeadline, code),
      notes: L(COPY.emergencyNotes, code),
      matchedWords: dedupe(emergencyHits),
    }
  }

  // 2) CARE-TYPE SUGGESTION (A-4, A-5).
  const matches = []
  let primary = null
  for (const rule of CARE_RULES) {
    const hits = rule.words.filter((w) => phraseMatches(inputWords, w))
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
      specialty: primary.specialty,
      headline: L(COPY.suggestHeadline, code)(careType),
      notes: [...L(COPY.suggestNotes, code)(firstStep), selfMedicationNote(code)],
      matchedWords: dedupe(matches),
    }
  }

  // 3) NOT RECOGNISED — do not guess. Point to a safe general first step.
  return {
    kind: 'unclear',
    careType: '',
    specialty: 'primary care',
    headline: L(COPY.unclearHeadline, code),
    notes: [...L(COPY.unclearNotes, code), selfMedicationNote(code)],
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

/**
 * Plain-language care type for a specialty key, in the given language.
 * Uses the rule's own wording when there is one, else the shared label
 * (English only). Primary care returns '' to match keyword results.
 *
 * @param {string} specialty  Key from SPECIALTY_LABELS
 * @param {string} [code]     'en' | 'es'
 */
export function careTypeLabel(specialty, code = 'en') {
  if (!specialty || specialty === 'primary care') return ''
  const rule = CARE_RULES.find((r) => r.specialty === specialty)
  return rule ? L(rule.careType, code) : (SPECIALTY_LABELS[specialty] ?? '')
}

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
