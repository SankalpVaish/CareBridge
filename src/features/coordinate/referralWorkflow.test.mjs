/**
 * Standalone smoke test for the referral workflow (C-1..C-4).
 * Run with: node src/features/coordinate/referralWorkflow.test.mjs
 * No test framework needed — plain asserts.
 */
import assert from 'node:assert/strict'
import {
  PIPELINE,
  setStage,
  advanceStage,
  previousStage,
  markStalled,
  addMissingInfo,
  resolveMissingInfo,
  stageIndex,
} from './referralWorkflow.js'

function base() {
  return {
    id: 'r1',
    patientId: 'p1',
    fromProviderId: 'a',
    toProviderId: 'b',
    reason: 'test',
    status: 'info_sent',
    createdDate: '2026-10-20',
    timeline: ['start'],
    missingInfo: ['lipid panel'],
    responsibleParty: null,
    stallReason: '',
  }
}

let passed = 0
function check(name, fn) {
  fn()
  passed++
  console.log(`  ok - ${name}`)
}

// C-1: advance moves forward one stage and logs it
check('advance moves one stage forward', () => {
  const r = advanceStage(base())
  assert.equal(r.status, 'accepted')
  assert.equal(r.timeline.length, 2)
})

// C-1: back moves one stage, and never past the first stage
check('previous moves one stage back', () => {
  const r = previousStage(base())
  assert.equal(r.status, 'requested')
})
check('previous clamps at first stage', () => {
  const r = previousStage({ ...base(), status: 'requested' })
  assert.equal(r.status, 'requested') // unchanged
})

// C-1: advance clamps at the last stage
check('advance clamps at last stage', () => {
  const r = advanceStage({ ...base(), status: 'followed_up' })
  assert.equal(r.status, 'followed_up')
})

// C-1: jump directly to any stage via chip click
check('setStage jumps to an explicit stage', () => {
  const r = setStage(base(), 'scheduled')
  assert.equal(r.status, 'scheduled')
  assert.equal(stageIndex(r.status), PIPELINE.indexOf('scheduled'))
})
check('setStage ignores an unknown stage', () => {
  const r = setStage(base(), 'nonsense')
  assert.equal(r.status, 'info_sent') // unchanged
})

// C-2 + C-4: marking stalled records the responsible party and reason
check('markStalled records owner and reason', () => {
  const r = markStalled(base(), 'specialist', 'No response in 10 days')
  assert.equal(r.status, 'stalled')
  assert.equal(r.responsibleParty, 'specialist')
  assert.equal(r.stallReason, 'No response in 10 days')
  assert.match(r.timeline.at(-1), /Stalled — waiting on Specialist/)
})

// Resuming from stalled clears the owner/reason (C-1)
check('moving off stalled clears owner and reason', () => {
  const stalled = markStalled(base(), 'pcp', 'Missing notes')
  const resumed = setStage(stalled, 'accepted')
  assert.equal(resumed.status, 'accepted')
  assert.equal(resumed.responsibleParty, null)
  assert.equal(resumed.stallReason, '')
  assert.match(resumed.timeline.at(-1), /Un-stalled/)
})

// advance from stalled resumes the happy path (doesn't get stuck)
check('advance from stalled resumes pipeline', () => {
  const stalled = markStalled(base(), 'patient', 'Did not confirm')
  const resumed = advanceStage(stalled)
  assert.ok(PIPELINE.includes(resumed.status))
  assert.notEqual(resumed.status, 'stalled')
})

// C-3: add + resolve missing info, immutably and without duplicates
check('addMissingInfo appends a new item', () => {
  const r = addMissingInfo(base(), 'ECG report')
  assert.deepEqual(r.missingInfo, ['lipid panel', 'ECG report'])
})
check('addMissingInfo ignores duplicates and blanks', () => {
  const r1 = addMissingInfo(base(), 'lipid panel')
  assert.equal(r1.missingInfo.length, 1)
  const r2 = addMissingInfo(base(), '   ')
  assert.equal(r2.missingInfo.length, 1)
})
check('resolveMissingInfo removes an item', () => {
  const r = resolveMissingInfo(base(), 'lipid panel')
  assert.deepEqual(r.missingInfo, [])
})

// Immutability: original object is never mutated
check('helpers never mutate the input', () => {
  const original = base()
  const snapshot = JSON.stringify(original)
  advanceStage(original)
  markStalled(original, 'pcp', 'x')
  addMissingInfo(original, 'y')
  assert.equal(JSON.stringify(original), snapshot)
})

console.log(`\nAll ${passed} checks passed.`)
