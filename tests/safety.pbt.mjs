/**
 * Property-based tests for the clinical safety rules (.kiro/steering/safety.md).
 * Run: node tests/safety.pbt.mjs   (replay a failure: PBT_SEED=<seed> node ...)
 */
import { check, gen, expect, done } from './pbt/prop.mjs'
import {
  suggestCareType,
  EMERGENCY_SIGNS,
  getExampleSymptoms,
  selfMedicationNote,
} from '../src/features/care/symptomChecker.js'
import { findUnsafeTerms, UNSAFE_TERMS } from '../src/features/care/outputSafety.js'
import { SPECIALTY_LABELS } from '../src/shared/models.js'

// Everyday filler words, including words from non-emergency care rules, so an
// emergency phrase has to win against competing matches.
const FILLER = [
  'i', 'have', 'my', 'since', 'yesterday', 'really', 'bad', 'and', 'also',
  'tight', 'chest', 'cough', 'knee', 'pain', 'thirsty', 'rash', 'tengo', 'mucho',
  'el', 'la', 'con', 'desde', 'ayer', 'muy', 'dolor', 'pecho', 'sed', 'tos',
]
const filler = gen.sentence(gen.pick(FILLER), 0, 6)
const lang = gen.pick(['en', 'es'])

/** Randomly upper-cases some letters: "ChEst PAin". */
const casing = gen.map(gen.array(gen.bool(), 0, 0), () => null) // placeholder, see below
const randomCase = (text, seedish) =>
  [...text].map((c, i) => ((i * 7 + seedish) % 3 === 0 ? c.toUpperCase() : c)).join('')

// --- Requirement: danger signs always produce the emergency result ----------
check(
  'any danger phrase, in any position, any casing, either language → emergency',
  gen.record({
    sign: gen.pick(EMERGENCY_SIGNS),
    before: filler,
    after: filler,
    lang,
    caseSeed: gen.int(0, 2),
  }),
  ({ sign, before, after, lang, caseSeed }) => {
    const text = randomCase([before, sign, after].filter(Boolean).join(' '), caseSeed)
    const r = suggestCareType(text, lang)
    expect(r.kind === 'emergency', `"${text}" (${lang}) gave ${r.kind}`)
    expect(r.specialty === 'emergency care', `specialty was ${r.specialty}`)
  },
  { runs: 2000 },
)

// --- Requirement: every result is well-formed and points somewhere safe ------
check(
  'every result has a known kind and specialty; non-emergencies carry the medicine note',
  gen.record({ text: gen.sentence(gen.pick([...FILLER, ...EMERGENCY_SIGNS.slice(0, 5)]), 0, 8), lang }),
  ({ text, lang }) => {
    const r = suggestCareType(text, lang)
    expect(['emergency', 'suggestion', 'unclear'].includes(r.kind), `kind ${r.kind}`)
    expect(r.specialty === '' || r.specialty in SPECIALTY_LABELS, `unknown specialty "${r.specialty}"`)
    if (text.trim() === '') return
    if (r.kind !== 'emergency') {
      expect(r.notes.includes(selfMedicationNote(lang)), `no medicine note for "${text}"`)
    }
  },
  { runs: 1500 },
)

// --- Requirement: the AI output check catches every banned term --------------
const ACCENTS = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', n: 'ñ' }
check(
  'every banned condition or medicine is caught, in any casing, with or without accents',
  gen.record({
    term: gen.pick(UNSAFE_TERMS),
    before: gen.sentence(gen.pick(['see', 'your', 'doctor', 'about', 'the', 'vea', 'a', 'su', 'médico']), 0, 5),
    after: gen.sentence(gen.pick(['soon', 'today', 'pronto', 'hoy', 'please']), 0, 3),
    accentAt: gen.int(-1, 12),
    upper: gen.bool(),
  }),
  ({ term, before, after, accentAt, upper }) => {
    let t = term
    if (accentAt >= 0 && accentAt < t.length && ACCENTS[t[accentAt]]) {
      t = t.slice(0, accentAt) + ACCENTS[t[accentAt]] + t.slice(accentAt + 1)
    }
    if (upper) t = t.toUpperCase()
    const text = [before, t, after].filter(Boolean).join(' ')
    expect(findUnsafeTerms([text]).length > 0, `not caught: "${text}"`)
  },
  { runs: 2000 },
)

// --- Requirement: our own fixed advice never trips the safety check ----------
// (If it did, every AI answer would silently fall back to "offline".)
const OUR_ADVICE = []
for (const l of ['en', 'es']) {
  OUR_ADVICE.push(selfMedicationNote(l))
  for (const ex of getExampleSymptoms(l)) {
    const r = suggestCareType(ex, l)
    OUR_ADVICE.push(r.headline, ...r.notes)
  }
}
check(
  'none of the app’s own headlines and tips are flagged as unsafe',
  gen.array(gen.pick(OUR_ADVICE), 1, 4),
  (texts) => {
    const hits = findUnsafeTerms(texts)
    expect(hits.length === 0, `flagged ${JSON.stringify(hits)} in ${JSON.stringify(texts)}`)
  },
  { runs: 500 },
)

done()
