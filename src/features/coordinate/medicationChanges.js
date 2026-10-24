/**
 * Medicine-change notes (O9, spec: .kiro/specs/medication-change-notes).
 *
 * A specialist records what they changed and why; the app only records and
 * explains it, never suggests medicines (steering: safety.md). Pure module used
 * by both the server and the UI, so validation and the role filter can't drift.
 */

/** Kinds of change, as keys (data-contract.md: keys, not labels). Req 1.1 */
export const CHANGE_TYPES = {
  started: 'Started',
  stopped: 'Stopped',
  dose_changed: 'Changed the dose of',
  switched: 'Switched',
  continued: 'Kept the same',
}

export const MAX_CHANGES = 10 // Req 1.4
export const MAX_FIELD = 300 // Req 1.4

const FIELD_NAMES = {
  medicine: 'the medicine',
  change: 'the type of change',
  from: 'what it was switched from',
  reasonClinical: 'the reason for the clinic',
  reasonPlain: 'the reason in plain words',
}

const text = (v) => (typeof v === 'string' ? v.trim() : '')

/**
 * Validates and normalises change notes. Throws an Error whose message names
 * what's missing, so the server can return it as a 400 (Req 1.3).
 *
 * @param {unknown} input  Array of notes, or undefined/null for none (Req 4.1)
 * @returns {{ medicine: string, change: string, from?: string, reasonClinical: string, reasonPlain: string }[]}
 */
export function cleanMedicationChanges(input) {
  if (input == null) return []
  if (!Array.isArray(input)) throw new Error('Medicine changes must be a list')
  if (input.length > MAX_CHANGES) {
    throw new Error(`Add at most ${MAX_CHANGES} medicine changes`)
  }
  return input.map((raw, i) => {
    const n = `Medicine change ${i + 1}`
    const note = {
      medicine: text(raw?.medicine),
      change: text(raw?.change),
      reasonClinical: text(raw?.reasonClinical),
      reasonPlain: text(raw?.reasonPlain),
    }
    if (!(note.change in CHANGE_TYPES)) {
      throw new Error(`${n}: choose ${FIELD_NAMES.change}`)
    }
    if (note.change === 'switched') note.from = text(raw?.from)

    for (const key of Object.keys(note)) {
      if (!note[key]) throw new Error(`${n}: add ${FIELD_NAMES[key]}`)
      if (note[key].length > MAX_FIELD) {
        throw new Error(`${n}: ${FIELD_NAMES[key]} is longer than ${MAX_FIELD} characters`)
      }
    }
    return note
  })
}

/** Roles that see the clinical reason (Req 2.2). */
const CLINICIANS = new Set(['pcp', 'specialist'])

/**
 * What a role may see (Req 2.1, 2.2, 3.3): patients and health workers get the
 * plain-language reason only.
 * @param {object[]} changes
 * @param {string} role
 */
export function visibleChanges(changes, role) {
  const list = Array.isArray(changes) ? changes : []
  if (CLINICIANS.has(role)) return list.map((c) => ({ ...c }))
  return list.map(({ reasonClinical, ...rest }) => rest)
}

/** One plain line, e.g. "Switched from Atenolol to Metoprolol". */
export function describeChange(c) {
  if (c.change === 'switched') return `Switched from ${c.from} to ${c.medicine}`
  return `${CHANGE_TYPES[c.change] ?? 'Changed'} ${c.medicine}`
}
