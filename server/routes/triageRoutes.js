/**
 * Triage session routes — the shared record behind Care's two modes.
 *
 *   - patient: can only share a finished check with their own CHW (POST).
 *              Nothing is stored unless they share (A-8, X-3).
 *   - chw:     sees checks shared with them, checks patients they look after,
 *              records consent and readings (A-7).
 *   - other roles get 403.
 */
import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { query, one } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()
router.use(requireAuth)

const RESULT_KINDS = ['emergency', 'suggestion', 'unclear']
const URGENCIES = ['emergency', 'within_days', 'within_weeks', 'routine']
const READING_KEYS = ['temperature', 'bloodPressure', 'pulse', 'weight']
const MAX_TEXT = 2000

const SELECT_SESSION = `
  SELECT t.*, p.name AS patient_name, u.name AS chw_name, c.name AS clinic_name
  FROM triage_sessions t
  JOIN patients p ON p.id = t.patient_id
  JOIN users u ON u.id = t.chw_user_id
  LEFT JOIN providers c ON c.id = t.clinic_provider_id
`

function toSession(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    chwUserId: row.chw_user_id,
    chwName: row.chw_name,
    startedIn: row.started_in,
    status: row.status,
    symptomText: row.symptom_text,
    result: JSON.parse(row.result),
    readings: JSON.parse(row.readings),
    consentRecorded: Boolean(row.consent_recorded),
    sentToClinicAt: row.sent_to_clinic_at ?? null,
    clinicName: row.clinic_name ?? null,
    referralId: row.referral_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function currentUser(req) {
  return one('SELECT * FROM users WHERE id = $1', [req.auth.sub])
}

function getSession(id) {
  return one(`${SELECT_SESSION} WHERE t.id = $1`, [id])
}

function cleanText(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text && text.length <= MAX_TEXT ? text : null
}

/** Keep only the CareSuggestion fields the UI renders. */
function cleanResult(r) {
  if (!r || !RESULT_KINDS.includes(r.kind) || typeof r.headline !== 'string') return null
  const strings = (a) => (Array.isArray(a) ? a.filter((s) => typeof s === 'string').slice(0, 10) : [])
  return {
    kind: r.kind,
    careType: typeof r.careType === 'string' ? r.careType : '',
    specialty: typeof r.specialty === 'string' ? r.specialty.slice(0, 40) : '',
    urgency: URGENCIES.includes(r.urgency) ? r.urgency : '',
    headline: r.headline,
    notes: strings(r.notes),
    matchedWords: strings(r.matchedWords),
    source: typeof r.source === 'string' ? r.source : '',
  }
}

function cleanReadings(r) {
  const out = {}
  for (const key of READING_KEYS) {
    const v = typeof r?.[key] === 'string' ? r[key].trim().slice(0, 20) : ''
    if (v) out[key] = v
  }
  return out
}

async function chwServesPatient(chwUserId, patientId) {
  if (typeof patientId !== 'string') return false
  return Boolean(
    await one('SELECT 1 FROM chw_patients WHERE chw_user_id = $1 AND patient_id = $2', [
      chwUserId,
      patientId,
    ]),
  )
}

// GET /api/triage — checks shared with or made by this CHW, newest first
router.get('/', async (req, res) => {
  const user = await currentUser(req)
  if (user.role !== 'chw') return res.status(403).json({ error: 'Only health workers can list checks' })
  const rows = await query(`${SELECT_SESSION} WHERE t.chw_user_id = $1 ORDER BY t.updated_at DESC`, [
    user.id,
  ])
  res.json({ sessions: rows.map(toSession) })
})

// GET /api/triage/inbox — checks health workers sent to this clinician's clinic (O7)
router.get('/inbox', async (req, res) => {
  const user = await currentUser(req)
  if (user.role !== 'pcp') return res.status(403).json({ error: 'Only clinic staff have an inbox' })
  const rows = await query(
    `${SELECT_SESSION} WHERE t.clinic_provider_id = $1 AND t.sent_to_clinic_at IS NOT NULL ORDER BY t.sent_to_clinic_at DESC`,
    [user.provider_id],
  )
  res.json({ sessions: rows.map(toSession) })
})

// POST /api/triage/:id/send — CHW sends a saved check to the patient's own clinic (O7)
router.post('/:id/send', async (req, res) => {
  const user = await currentUser(req)
  const row = await getSession(req.params.id)
  if (user.role !== 'chw' || !row || row.chw_user_id !== user.id) {
    return res.status(404).json({ error: 'Check not found' })
  }
  if (row.status !== 'reviewed') {
    return res.status(400).json({ error: 'Save the check first' })
  }
  const clinic = await one('SELECT pcp_provider_id FROM patients WHERE id = $1', [row.patient_id])
  if (!clinic?.pcp_provider_id) {
    return res.status(400).json({ error: 'This patient has no clinic on record yet' })
  }
  if (!row.sent_to_clinic_at) {
    await query('UPDATE triage_sessions SET sent_to_clinic_at = $1, clinic_provider_id = $2 WHERE id = $3', [
      new Date().toISOString(),
      clinic.pcp_provider_id,
      row.id,
    ])
  }
  res.json({ session: toSession(await getSession(row.id)) })
})

// GET /api/triage/patients — patients this CHW looks after
router.get('/patients', async (req, res) => {
  const user = await currentUser(req)
  if (user.role !== 'chw') return res.status(403).json({ error: 'Only health workers have patients' })
  const patients = await query(
    `SELECT p.id, p.name, p.location FROM chw_patients c
     JOIN patients p ON p.id = c.patient_id
     WHERE c.chw_user_id = $1 ORDER BY p.name`,
    [user.id],
  )
  res.json({ patients })
})

// POST /api/triage
//   patient: { symptomText, result }                       → shares with their CHW
//   chw:     { patientId, symptomText, result, readings, consent }
router.post('/', async (req, res) => {
  const user = await currentUser(req)
  const body = req.body ?? {}
  const symptomText = cleanText(body.symptomText)
  const result = cleanResult(body.result)
  if (!symptomText || !result) {
    return res.status(400).json({ error: 'symptomText and a valid result are required' })
  }

  const now = new Date().toISOString()
  const session = {
    id: randomUUID(),
    symptom_text: symptomText,
    result: JSON.stringify(result),
    created_at: now,
    updated_at: now,
  }

  if (user.role === 'patient') {
    if (!user.patient_id) {
      return res.status(400).json({ error: 'Your account is not linked to a patient record yet' })
    }
    const link = await one('SELECT chw_user_id FROM chw_patients WHERE patient_id = $1 LIMIT 1', [
      user.patient_id,
    ])
    if (!link) {
      return res.status(400).json({ error: 'No community health worker is linked to you yet' })
    }
    Object.assign(session, {
      patient_id: user.patient_id,
      chw_user_id: link.chw_user_id,
      started_in: 'patient',
      status: 'shared',
      readings: '{}',
      consent_recorded: 1, // the patient chose to share
    })
  } else if (user.role === 'chw') {
    if (!(await chwServesPatient(user.id, body.patientId))) {
      return res.status(404).json({ error: 'Patient not found in your list' })
    }
    if (body.consent !== true) {
      return res.status(400).json({ error: "Record the patient's consent first" })
    }
    Object.assign(session, {
      patient_id: body.patientId,
      chw_user_id: user.id,
      started_in: 'chw',
      status: 'reviewed',
      readings: JSON.stringify(cleanReadings(body.readings)),
      consent_recorded: 1,
    })
  } else {
    return res.status(403).json({ error: 'Only patients and health workers can save checks' })
  }

  await query(
    `INSERT INTO triage_sessions
       (id, patient_id, chw_user_id, started_in, status, symptom_text, result,
        readings, consent_recorded, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      session.id,
      session.patient_id,
      session.chw_user_id,
      session.started_in,
      session.status,
      session.symptom_text,
      session.result,
      session.readings,
      session.consent_recorded,
      session.created_at,
      session.updated_at,
    ],
  )

  res.status(201).json({ session: toSession(await getSession(session.id)) })
})

// PATCH /api/triage/:id — CHW continues a check: { symptomText, result, readings }
router.patch('/:id', async (req, res) => {
  const user = await currentUser(req)
  const row = await getSession(req.params.id)
  if (user.role !== 'chw' || !row || row.chw_user_id !== user.id) {
    return res.status(404).json({ error: 'Check not found' })
  }

  const body = req.body ?? {}
  const symptomText = cleanText(body.symptomText)
  const result = cleanResult(body.result)
  if (!symptomText || !result) {
    return res.status(400).json({ error: 'symptomText and a valid result are required' })
  }

  await query(
    `UPDATE triage_sessions
     SET symptom_text = $1, result = $2, readings = $3, status = 'reviewed', updated_at = $4
     WHERE id = $5`,
    [
      symptomText,
      JSON.stringify(result),
      JSON.stringify(cleanReadings(body.readings)),
      new Date().toISOString(),
      row.id,
    ],
  )

  res.json({ session: toSession(await getSession(row.id)) })
})

export default router
