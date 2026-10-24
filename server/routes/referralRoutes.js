/**
 * Referral routes — the dynamic data behind the Coordinate section.
 *
 * Reads are ROLE-FILTERED so each person sees only their referrals:
 *   - patient:    referrals where they are the patient
 *   - pcp:        referrals they sent (from_provider_id = their provider)
 *   - specialist: referrals sent to them (to_provider_id = their provider)
 *   - chw:        referrals for patients they look after (read-only)
 * Past "history" referrals are never listed; they only feed the loop stats.
 *
 * Updates reuse the same pipeline semantics as the frontend workflow
 * (C-1..C-4): change stage, mark stalled with owner+reason, edit missing info,
 * and (C-5..C-7, O8) the specialist sends findings back.
 */
import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import db from '../db.js'
import { requireAuth } from '../auth.js'
// Same rules as the UI (spec: .kiro/specs/medication-change-notes).
import {
  cleanMedicationChanges,
  visibleChanges,
} from '../../src/features/coordinate/medicationChanges.js'

const router = Router()
router.use(requireAuth)

export const PIPELINE = [
  'requested',
  'info_sent',
  'accepted',
  'scheduled',
  'seen',
  'findings_returned',
  'followed_up',
]
const RESPONSIBLE_PARTIES = ['patient', 'pcp', 'specialist']
const MAX_TEXT = 4000

/**
 * Map a DB row to the shape the frontend expects (camelCase + parsed JSON).
 * Patients and health workers get only the plain-language findings; the
 * clinical version is for the two clinicians.
 */
function toReferral(row, user) {
  const findings = row.findings ? JSON.parse(row.findings) : null
  const clinician = user?.role === 'pcp' || user?.role === 'specialist'
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
    triageSessionId: row.triage_session_id ?? null,
    findings: findings && {
      forPatient: findings.forPatient,
      forClinician: clinician ? findings.forClinician : undefined,
      // Medicine changes, filtered by role (O9, Req 2.1, 2.2)
      medicationChanges: visibleChanges(findings.medicationChanges, user?.role),
      by: findings.by,
      at: findings.at,
    },
  }
}

/** The current user's full row (role, provider_id, patient_id). */
function currentUser(req) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.sub)
}

function chwServesPatient(chwUserId, patientId) {
  return Boolean(
    db
      .prepare('SELECT 1 FROM chw_patients WHERE chw_user_id = ? AND patient_id = ?')
      .get(chwUserId, patientId),
  )
}

/** Can this user see this referral row, given their role? */
function canView(user, row) {
  if (!row || row.is_history) return false
  if (user.role === 'patient') return row.patient_id === user.patient_id
  if (user.role === 'pcp') return row.from_provider_id === user.provider_id
  if (user.role === 'specialist') return row.to_provider_id === user.provider_id
  if (user.role === 'chw') return chwServesPatient(user.id, row.patient_id)
  return false
}

/** Only the two clinicians change a referral. */
function canEdit(user, row) {
  return (user.role === 'pcp' || user.role === 'specialist') && canView(user, row)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function cleanText(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text && text.length <= MAX_TEXT ? text : null
}

function providerName(id) {
  return db.prepare('SELECT name FROM providers WHERE id = ?').get(id)?.name ?? 'the clinic'
}

// GET /api/referrals  — role-filtered list
router.get('/', (req, res) => {
  const user = currentUser(req)
  let rows = []
  if (user.role === 'patient') {
    rows = db.prepare('SELECT * FROM referrals WHERE patient_id = ? AND is_history = 0').all(user.patient_id)
  } else if (user.role === 'pcp') {
    rows = db.prepare('SELECT * FROM referrals WHERE from_provider_id = ? AND is_history = 0').all(user.provider_id)
  } else if (user.role === 'specialist') {
    rows = db.prepare('SELECT * FROM referrals WHERE to_provider_id = ? AND is_history = 0').all(user.provider_id)
  } else if (user.role === 'chw') {
    rows = db
      .prepare(`
        SELECT r.* FROM referrals r
        JOIN chw_patients c ON c.patient_id = r.patient_id
        WHERE c.chw_user_id = ? AND r.is_history = 0
      `)
      .all(user.id)
  }
  res.json({ referrals: rows.map((r) => toReferral(r, user)) })
})

/**
 * Who may see a patient's medicine history (O9, Req 3.2): the patient, their
 * health workers, their own clinic, and specialists with a referral for them.
 */
function canSeePatientHistory(user, patientId) {
  if (user.role === 'patient') return user.patient_id === patientId
  if (user.role === 'chw') return chwServesPatient(user.id, patientId)
  if (user.role === 'pcp') {
    const p = db.prepare('SELECT pcp_provider_id FROM patients WHERE id = ?').get(patientId)
    if (p?.pcp_provider_id === user.provider_id) return true
    return Boolean(
      db
        .prepare('SELECT 1 FROM referrals WHERE patient_id = ? AND from_provider_id = ? AND is_history = 0')
        .get(patientId, user.provider_id),
    )
  }
  if (user.role === 'specialist') {
    return Boolean(
      db
        .prepare('SELECT 1 FROM referrals WHERE patient_id = ? AND to_provider_id = ? AND is_history = 0')
        .get(patientId, user.provider_id),
    )
  }
  return false
}

// GET /api/referrals/patient/:patientId/medication-history — newest first (O9, Req 3.1–3.4)
// Defined before '/:id' so that route doesn't capture it.
router.get('/patient/:patientId/medication-history', (req, res) => {
  const user = currentUser(req)
  const { patientId } = req.params
  if (!canSeePatientHistory(user, patientId)) {
    return res.status(404).json({ error: 'Patient not found' })
  }
  const rows = db
    .prepare(`
      SELECT r.findings, p.name AS provider_name
      FROM referrals r JOIN providers p ON p.id = r.to_provider_id
      WHERE r.patient_id = ? AND r.is_history = 0 AND r.findings IS NOT NULL
    `)
    .all(patientId)

  const history = []
  for (const row of rows) {
    const f = JSON.parse(row.findings)
    for (const c of visibleChanges(f.medicationChanges, user.role)) {
      history.push({ ...c, at: f.at, by: f.by, providerName: row.provider_name })
    }
  }
  history.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  res.json({ history })
})

// GET /api/referrals/:id
router.get('/:id', (req, res) => {
  const user = currentUser(req)
  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(req.params.id)
  if (!canView(user, row)) return res.status(404).json({ error: 'Referral not found' })
  res.json({ referral: toReferral(row, user) })
})

// POST /api/referrals — the patient's clinician refers a symptom check that a
// health worker sent to their clinic (O7).
//   body: { triageSessionId, toProviderId, reason }
router.post('/', (req, res) => {
  const user = currentUser(req)
  if (user.role !== 'pcp') {
    return res.status(403).json({ error: 'Only the patient’s clinician can make a referral' })
  }
  const body = req.body ?? {}
  const session = db.prepare('SELECT * FROM triage_sessions WHERE id = ?').get(body.triageSessionId)
  if (!session || session.clinic_provider_id !== user.provider_id || !session.sent_to_clinic_at) {
    return res.status(404).json({ error: 'Check not found in your clinic’s inbox' })
  }
  if (session.referral_id) {
    return res.status(409).json({ error: 'This check already has a referral' })
  }
  const to = db.prepare('SELECT * FROM providers WHERE id = ?').get(body.toProviderId)
  if (!to || to.id === user.provider_id) {
    return res.status(400).json({ error: 'Choose a specialist to refer to' })
  }
  const reason = cleanText(body.reason)
  if (!reason) return res.status(400).json({ error: 'Add a reason for the referral' })

  const id = randomUUID()
  const date = today()
  db.prepare(`
    INSERT INTO referrals
      (id, patient_id, from_provider_id, to_provider_id, reason, status, created_date,
       timeline, missing_info, triage_session_id)
    VALUES (?, ?, ?, ?, ?, 'requested', ?, ?, '[]', ?)
  `).run(
    id,
    session.patient_id,
    user.provider_id,
    to.id,
    reason,
    date,
    JSON.stringify([
      `${date} — ${user.name} referred to ${to.name} from the health worker’s check`,
    ]),
    session.id,
  )
  db.prepare('UPDATE triage_sessions SET referral_id = ? WHERE id = ?').run(id, session.id)

  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(id)
  res.status(201).json({ referral: toReferral(row, user) })
})

// PATCH /api/referrals/:id  — apply a workflow action
// body: { action, ...args }
//   action = 'setStage'      { stage }
//            'markStalled'    { responsibleParty, reason }
//            'addMissingInfo' { item }
//            'resolveMissingInfo' { item }
//            'returnFindings' { forClinician, forPatient }   specialist only (O8)
router.patch('/:id', (req, res) => {
  const user = currentUser(req)
  const row = db.prepare('SELECT * FROM referrals WHERE id = ?').get(req.params.id)
  if (!canView(user, row)) return res.status(404).json({ error: 'Referral not found' })
  if (!canEdit(user, row)) return res.status(403).json({ error: 'Only the clinicians can change a referral' })

  const ref = toReferral(row, user)
  let findings = row.findings ? JSON.parse(row.findings) : null
  const { action } = req.body ?? {}

  if (action === 'setStage') {
    const { stage } = req.body
    if (!PIPELINE.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' })
    }
    // The loop only closes when findings really came back (O8).
    if (PIPELINE.indexOf(stage) >= PIPELINE.indexOf('findings_returned') && !findings) {
      return res.status(400).json({ error: 'The specialist must send findings back first' })
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
  } else if (action === 'returnFindings') {
    if (user.role !== 'specialist') {
      return res.status(403).json({ error: 'Only the specialist sends findings back' })
    }
    if (PIPELINE.indexOf(ref.status) < PIPELINE.indexOf('seen')) {
      return res.status(400).json({ error: 'Mark the patient as seen first' })
    }
    const forClinician = cleanText(req.body.forClinician)
    const forPatient = cleanText(req.body.forPatient)
    if (!forClinician || !forPatient) {
      return res.status(400).json({ error: 'Write both the clinic version and the plain-language version' })
    }
    // Optional medicine-change notes, saved with the approved findings (O9, Req 1.3, 1.5)
    let medicationChanges
    try {
      medicationChanges = cleanMedicationChanges(req.body.medicationChanges)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
    const first = !findings
    findings = { forClinician, forPatient, medicationChanges, by: user.name, at: today() }
    if (medicationChanges.length > 0) {
      ref.timeline.push(
        `${today()} — ${user.name} recorded ${medicationChanges.length} medicine change${medicationChanges.length === 1 ? '' : 's'}`,
      )
    }
    if (ref.status === 'seen') ref.status = 'findings_returned'
    ref.timeline.push(
      `${today()} — ${user.name} ${first ? 'sent' : 'updated'} findings: to ${providerName(row.from_provider_id)} and the health worker, with a plain-language version for the patient`,
    )
  } else {
    return res.status(400).json({ error: 'Unknown action' })
  }

  db.prepare(`
    UPDATE referrals
    SET status = @status,
        responsible_party = @responsibleParty,
        stall_reason = @stallReason,
        timeline = @timeline,
        missing_info = @missingInfo,
        findings = @findings
    WHERE id = @id
  `).run({
    id: ref.id,
    status: ref.status,
    responsibleParty: ref.responsibleParty,
    stallReason: ref.stallReason,
    timeline: JSON.stringify(ref.timeline),
    missingInfo: JSON.stringify(ref.missingInfo),
    findings: findings ? JSON.stringify(findings) : null,
  })

  const updated = db.prepare('SELECT * FROM referrals WHERE id = ?').get(ref.id)
  res.json({ referral: toReferral(updated, user) })
})

export default router
