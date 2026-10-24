/**
 * Coordinate workflow helpers for the editable referral pipeline (C-1..C-4).
 *
 * Pure functions only — no React here — so the logic is easy to reason about
 * and test. Everything operates on the shared Referral shape
 * (see src/shared/models.js); we only ever add timeline strings and edit
 * fields that already exist on the model, so no shared-contract change is needed.
 */

/** Ordered happy-path stages (ties to C-1). 'stalled' is a side state, not in here. */
export const PIPELINE = [
  'requested',
  'info_sent',
  'accepted',
  'scheduled',
  'seen',
  'findings_returned', // the loop closes here (O8)
  'followed_up',
]

/** Who can be on the hook when a referral stalls (ties to C-4). */
export const RESPONSIBLE_PARTIES = ['patient', 'pcp', 'specialist']

export const RESPONSIBLE_LABELS = {
  patient: 'Patient',
  pcp: 'Primary-care provider',
  specialist: 'Specialist',
}

/** Index of a stage in the pipeline, or -1 for 'stalled'/unknown. */
export function stageIndex(status) {
  return PIPELINE.indexOf(status)
}

/** Timestamp prefix for timeline entries, e.g. "2026-10-24". */
function today() {
  return new Date().toISOString().slice(0, 10)
}

/** Append a timeline line with today's date. Returns a NEW array. */
export function logEntry(timeline, text) {
  return [...timeline, `${today()} — ${text}`]
}

/**
 * Move the referral to an explicit stage (clicking a chip, C-1).
 * Clears any stall and the responsible party, since the referral is moving again.
 * @param {import('../../shared/models.js').Referral} referral
 * @param {string} nextStatus a value from PIPELINE
 */
export function setStage(referral, nextStatus) {
  if (!PIPELINE.includes(nextStatus)) return referral
  const wasStalled = referral.status === 'stalled'
  const label = nextStatus.replaceAll('_', ' ')
  const note = wasStalled
    ? `Un-stalled and moved to "${label}"`
    : `Moved to "${label}"`
  return {
    ...referral,
    status: nextStatus,
    responsibleParty: null,
    stallReason: '',
    timeline: logEntry(referral.timeline, note),
  }
}

/** Advance one stage along the pipeline (convenience for the forward button). */
export function advanceStage(referral) {
  const i = stageIndex(referral.status)
  const from = i < 0 ? 0 : i // if stalled, resume from the start of the happy path
  const next = PIPELINE[Math.min(from + 1, PIPELINE.length - 1)]
  return setStage(referral, next)
}

/** Step back one stage (undo / correction). */
export function previousStage(referral) {
  const i = stageIndex(referral.status)
  if (i <= 0) return referral
  return setStage(referral, PIPELINE[i - 1])
}

/**
 * Mark the referral stalled, recording WHO is responsible and WHY (C-2, C-4).
 * @param {import('../../shared/models.js').Referral} referral
 * @param {string} responsibleParty one of RESPONSIBLE_PARTIES
 * @param {string} reason free-text explanation
 */
export function markStalled(referral, responsibleParty, reason) {
  const owner = RESPONSIBLE_LABELS[responsibleParty] ?? 'Unknown'
  const why = reason.trim() || 'no reason given'
  return {
    ...referral,
    status: 'stalled',
    responsibleParty,
    stallReason: reason.trim(),
    timeline: logEntry(
      referral.timeline,
      `Stalled — waiting on ${owner}: ${why}`,
    ),
  }
}

/** Add a missing-info item the specialist still needs (C-3). Returns NEW referral. */
export function addMissingInfo(referral, item) {
  const text = item.trim()
  if (!text || referral.missingInfo.includes(text)) return referral
  return {
    ...referral,
    missingInfo: [...referral.missingInfo, text],
    timeline: logEntry(referral.timeline, `Noted missing info: ${text}`),
  }
}

/** Resolve (remove) a missing-info item once it has been supplied (C-3). */
export function resolveMissingInfo(referral, item) {
  if (!referral.missingInfo.includes(item)) return referral
  return {
    ...referral,
    missingInfo: referral.missingInfo.filter((m) => m !== item),
    timeline: logEntry(referral.timeline, `Resolved missing info: ${item}`),
  }
}
