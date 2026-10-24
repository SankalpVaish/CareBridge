/**
 * Property-based tests for medicine-change notes (spec task 1.2).
 * Run: node tests/medication.pbt.mjs
 */
import { check, gen, expect, done } from './pbt/prop.mjs'
import {
  cleanMedicationChanges,
  visibleChanges,
  describeChange,
  CHANGE_TYPES,
  MAX_CHANGES,
  MAX_FIELD,
} from '../src/features/coordinate/medicationChanges.js'

const words = ['Metoprolol', 'tablet', 'dose', 'lower', 'heart', 'rate', 'better', 'sleep', 'side', 'effect', '  ', '']
const field = gen.map(gen.record({ s: gen.sentence(gen.pick(words), 0, 6), pad: gen.bool(0.2), long: gen.bool(0.05) }),
  ({ s, pad, long }) => (long ? 'x'.repeat(MAX_FIELD + 1) : pad ? `  ${s}  ` : s))
const unwrap = (v) => (v && typeof v === 'object' && 'value' in v ? v.value : v)

const noteGen = gen.record({
  medicine: field,
  change: gen.pick([...Object.keys(CHANGE_TYPES), 'renamed', '']),
  from: field,
  reasonClinical: field,
  reasonPlain: field,
})
const toNote = (n) => Object.fromEntries(Object.entries(n).map(([k, v]) => [k, unwrap(v)]))
const listGen = gen.array(noteGen, 0, MAX_CHANGES + 2)

const REQUIRED = (note) => [
  'medicine', 'change', 'reasonClinical', 'reasonPlain', ...(note.change === 'switched' ? ['from'] : []),
]

check('Req 1.3/1.4: cleaning either throws a helpful message or returns only complete, bounded notes', listGen, (raw) => {
  const input = raw.map(toNote)
  let out
  try {
    out = cleanMedicationChanges(input)
  } catch (e) {
    expect(/^(Medicine change \d+: |Add at most)/.test(e.message), `unhelpful message: ${e.message}`)
    return
  }
  expect(out.length <= MAX_CHANGES, `${out.length} notes kept`)
  expect(out.length === input.length, 'notes dropped silently')
  for (const n of out) {
    expect(n.change in CHANGE_TYPES, `bad change ${n.change}`)
    for (const k of REQUIRED(n)) {
      expect(typeof n[k] === 'string' && n[k].length > 0 && n[k] === n[k].trim(), `${k} empty or untrimmed`)
      expect(n[k].length <= MAX_FIELD, `${k} too long`)
    }
    if (n.change !== 'switched') expect(!('from' in n), '"from" kept on a non-switch')
  }
})

check('Req 1.3: a note missing any required field is rejected, naming that field', gen.record({
  note: noteGen,
  drop: gen.pick(['medicine', 'reasonClinical', 'reasonPlain', 'from']),
}), ({ note, drop }) => {
  const valid = {
    medicine: 'Metoprolol', change: drop === 'from' ? 'switched' : unwrap(note.change) in CHANGE_TYPES ? unwrap(note.change) : 'started',
    from: 'Atenolol', reasonClinical: 'Lower resting heart rate.', reasonPlain: 'To slow your heart a little.',
  }
  valid[drop] = '   '
  let message = null
  try {
    cleanMedicationChanges([valid])
  } catch (e) {
    message = e.message
  }
  if (drop === 'from' && valid.change !== 'switched') return
  expect(message, `missing ${drop} was accepted`)
  const names = { medicine: 'the medicine', reasonClinical: 'reason for the clinic', reasonPlain: 'reason in plain words', from: 'switched from' }
  expect(message.includes(names[drop]), `message doesn't name ${drop}: ${message}`)
})

check('Req 2.1/2.2/3.3: patients and health workers never see the clinical reason; clinicians always do', gen.record({
  notes: gen.array(gen.record({ medicine: gen.pick(['A', 'B']), change: gen.pick(Object.keys(CHANGE_TYPES)), reasonClinical: gen.pick(['clinical-x', 'clinical-y']), reasonPlain: gen.pick(['plain']) }), 0, 6),
  role: gen.pick(['patient', 'chw', 'pcp', 'specialist', 'admin', '', undefined]),
}), ({ notes, role }) => {
  const seen = visibleChanges(notes, role)
  expect(seen.length === notes.length, 'notes lost')
  const clinician = role === 'pcp' || role === 'specialist'
  for (const n of seen) {
    if (clinician) expect(n.reasonClinical, 'clinician missing clinical reason')
    else expect(!('reasonClinical' in n), `${role} saw the clinical reason`)
    expect(n.reasonPlain === 'plain', 'plain reason lost')
  }
  expect(JSON.stringify(notes).includes('clinical') || notes.length === 0, 'input was changed')
})

check('describeChange always reads as a sentence that names the medicine', gen.record({
  medicine: gen.pick(['Metoprolol', 'Atenolol']),
  change: gen.pick(Object.keys(CHANGE_TYPES)),
  from: gen.pick(['Lisinopril']),
}), (c) => {
  const s = describeChange(c)
  expect(s.includes(c.medicine) && !s.includes('undefined'), s)
  if (c.change === 'switched') expect(s.includes(c.from), s)
})

done()
