/**
 * Referral routes — the dynamic data behind the Coordinate section.
 *
 * Reads are ROLE-FILTERED so each person sees only their referrals:
 *   - patient:    referrals where they are the patient
 *   - pcp:        referrals they sent (from_provider_id = their provider)
 *   - specialist: referrals sent to them (to_provider_id = their provider)
 *
 * Updates reuse the same pipeline semantics as the frontend workflow
 * (C-1..C-4): change stage, mark stalled with owner+reason, edit missing info.
 */
import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

const PIPELINE = ['requested', 'info_sent', 'accepted', 'scheduled', 'seen', 'followed_up']
const RESPONSIBLE_PARTIES = ['patient', 'pcp', 'specialist']

/** Map a DB row to the shape the frontend expects (camelCase + parsed JSON). */
function toReferral(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    fromProviderId: row.from_provider_id,
    toProviderId: row.to_provider_id,
    reason: row.reason,
    status: row.status,
    responsibleParty: row.responsible_party,
    stallReason: row.stall_reason ?? '',
    createdDate: row.created_date,
    timeline: JSON.parse(row.timeline),
    missingInfo: JSON.parse(row.missing_info),
  }
}

/** The current user's full row (role, provider_id, patient_id). */
function currentUser(req) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.sub)
}

/** Can this user see/edit this referral row, given their role? */
function canAccess(user, row) {
  if (!row) return false
  if (user.role === 'patient') return row.patient_id === user.patient_id
  if (user.role === 'pcp') return row.from_provider_id === user.provider_id
  if (user.role === 'specialist') return row.to_provider_id === user.provider_id
  return false
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

// GET /api/referrals  — role-filtered list
router.get('/', (req, res) => {
  const user = currentUser(req)
  let rows = []
  if (user.role === 'patient') {
    rows = db.prepare('SELECT * FROM referrals WHERE patient_id = ?').all(user.patient_id)
  } else if (user.role === 'pcp') {
    rows = db.prepare('SELECT * FROM referrals WHERE from_provider_id = ?').all(user.provider_id)
  } else if (user.role === 'specialist') {
    rows = db.prepare('SELECT * FROM referrals WHERE to_provider_id = ?').all(user.provider_id)
  }
  res.json({ referrals: rows.map(toReferral) })
})

// GET /api/referrals/:id
router.get('/:id', (req, res) => {
  const user = currentUser(req)
  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(req.params.id)
  if (!canAccess(user, row)) return res.status(404).json({ error: 'Referral not found' })
  res.json({ referral: toReferral(row) })
})

// PATCH /api/referrals/:id  — apply a workflow action
// body: { action, ...args }
//   action = 'setStage'      { stage }
//            'markStalled'    { responsibleParty, reason }
//            'addMissingInfo' { item }
//            'resolveMissingInfo' { item }
router.patch('/:id', (req, res) => {
  const user = currentUser(req)
  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(req.params.id)
  if (!canAccess(user, row)) return res.status(404).json({ error: 'Referral not found' })

  const ref = toReferral(row)
  const { action } = req.body ?? {}

  if (action === 'setStage') {
    const { stage } = req.body
    if (!PIPELINE.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' })
    }
    const wasStalled = ref.status === 'stalled'
    ref.status = stage
    ref.responsibleParty = null
    ref.stallReason = ''
    ref.timeline.push(
      `${today()} — ${wasStalled ? 'Un-stalled and moved' : 'Moved'} to "${stage.replaceAll('_', ' ')}"`,
    )
  } else if (action === 'markStalled') {
    const { responsibleParty, reason } = req.body
    if (!RESPONSIBLE_PARTIES.includes(responsibleParty)) {
      return res.status(400).json({ error: 'Invalid responsibleParty' })
    }
    ref.status = 'stalled'
    ref.responsibleParty = responsibleParty
    ref.stallReason = (reason ?? '').trim()
    const owner = { patient: 'Patient', pcp: 'Primary-care provider', specialist: 'Specialist' }[responsibleParty]
    ref.timeline.push(`${today()} — Stalled — waiting on ${owner}: ${ref.stallReason || 'no reason given'}`)
  } else if (action === 'addMissingInfo') {
    const item = (req.body.item ?? '').trim()
    if (!item) return res.status(400).json({ error: 'item is required' })
    if (!ref.missingInfo.includes(item)) {
      ref.missingInfo.push(item)
      ref.timeline.push(`${today()} — Noted missing info: ${item}`)
    }
  } else if (action === 'resolveMissingInfo') {
    const item = req.body.item
    if (ref.missingInfo.includes(item)) {
      ref.missingInfo = ref.missingInfo.filter((m) => m !== item)
      ref.timeline.push(`${today()} — Resolved missing info: ${item}`)
    }
  } else {
    return res.status(400).json({ error: 'Unknown action' })
  }

  db.prepare(`
    UPDATE referrals
    SET status = @status,
        responsible_party = @responsibleParty,
        stall_reason = @stallReason,
        timeline = @timeline,
        missing_info = @missingInfo
    WHERE id = @id
  `).run({
    id: ref.id,
    status: ref.status,
    responsibleParty: ref.responsibleParty,
    stallReason: ref.stallReason,
    timeline: JSON.stringify(ref.timeline),
    missingInfo: JSON.stringify(ref.missingInfo),
  })

  res.json({ referral: ref })
})

export default router
