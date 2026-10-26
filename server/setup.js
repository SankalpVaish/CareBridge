/**
 * Creates the tables and the demo data in the Neon database.
 *
 *   npm run db:setup   create anything missing (safe to run again; never duplicates rows)
 *   npm run db:reset   drop every table first, back to a clean demo
 *
 * Demo accounts all use the password "demo1234".
 */
import './env.js'
import bcrypt from 'bcryptjs'
import { sql, one } from './db.js'
// One source of truth for providers: the shared demo data the frontend uses.
import { providers as sharedProviders } from '../src/data/mockData.js'

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,            -- bcrypt hash, never plaintext
    role        TEXT NOT NULL CHECK (role IN ('patient','pcp','specialist','chw')),
    provider_id TEXT,                     -- pcp/specialist: provider they act as
    patient_id  TEXT,                     -- patient: their patient record
    created_at  TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS providers (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    type     TEXT NOT NULL,
    location TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS patients (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    location        TEXT,
    pcp_provider_id TEXT                  -- the patient's own clinic
  )`,
  `CREATE TABLE IF NOT EXISTS referrals (
    id                TEXT PRIMARY KEY,
    patient_id        TEXT NOT NULL REFERENCES patients(id),
    from_provider_id  TEXT NOT NULL REFERENCES providers(id),
    to_provider_id    TEXT NOT NULL REFERENCES providers(id),
    reason            TEXT NOT NULL,
    status            TEXT NOT NULL,
    responsible_party TEXT,                  -- who a stall is waiting on (C-4)
    stall_reason      TEXT,                  -- why it stalled (C-2)
    created_date      TEXT NOT NULL,
    timeline          TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
    missing_info      TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
    findings          TEXT,                         -- JSON, set when the specialist sends findings back
    triage_session_id TEXT,                         -- the symptom check it came from
    is_history        INTEGER NOT NULL DEFAULT 0    -- past referrals, only for loop stats
  )`,
  // Which patients each community health worker looks after.
  `CREATE TABLE IF NOT EXISTS chw_patients (
    chw_user_id TEXT NOT NULL REFERENCES users(id),
    patient_id  TEXT NOT NULL REFERENCES patients(id),
    PRIMARY KEY (chw_user_id, patient_id)
  )`,
  // Symptom checks. Patient mode saves nothing until the patient shares, so
  // every row here is visible to the CHW named in chw_user_id.
  `CREATE TABLE IF NOT EXISTS triage_sessions (
    id                 TEXT PRIMARY KEY,
    patient_id         TEXT NOT NULL REFERENCES patients(id),
    chw_user_id        TEXT NOT NULL REFERENCES users(id),
    started_in         TEXT NOT NULL CHECK (started_in IN ('patient','chw')),
    status             TEXT NOT NULL CHECK (status IN ('shared','reviewed')),
    symptom_text       TEXT NOT NULL,
    result             TEXT NOT NULL,                 -- JSON CareSuggestion
    readings           TEXT NOT NULL DEFAULT '{}',    -- JSON, recorded by the CHW
    consent_recorded   INTEGER NOT NULL DEFAULT 0,
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL,
    sent_to_clinic_at  TEXT,
    clinic_provider_id TEXT,
    referral_id        TEXT
  )`,
]

const DROP_ALL =
  'DROP TABLE IF EXISTS triage_sessions, chw_patients, referrals, users, patients, providers CASCADE'

// Past referrals per specialist: [patients seen, findings sent back]. These
// give the loop-closure numbers in Find & Trust a starting history; new
// referrals made in the app are added on top (O7, O8, B-14).
const LOOP_HISTORY = {
  'prov-cardio-regional': [11, 9],
  'prov-cardio-county': [11, 7],
  'prov-onc-university': [10, 9],
  'prov-onc-lakeside': [7, 5],
  'prov-er-cedar-falls': [12, 7],
}

function seed(txn) {
  const now = new Date().toISOString()
  const hash = bcrypt.hashSync('demo1234', 10)
  const q = []

  const provider = 'INSERT INTO providers (id, name, type, location) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING'
  for (const p of sharedProviders) q.push(txn.query(provider, [p.id, p.name, p.type, p.location]))
  q.push(txn.query(provider, ['prov-history-clinics', 'Other clinics (demo history)', 'clinic', 'Various']))

  const patient = 'INSERT INTO patients (id, name, location, pcp_provider_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING'
  q.push(txn.query(patient, ['patient-maria', 'Maria Alvarez', 'Cedar Falls', 'prov-pcp-hometown']))
  q.push(txn.query(patient, ['patient-history', 'Past patients (demo history)', 'Various', null]))

  const user = `
    INSERT INTO users (id, name, email, password, role, provider_id, patient_id, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`
  for (const [id, name, email, role, providerId, patientId] of [
    ['user-maria', 'Maria Alvarez', 'maria@example.com', 'patient', null, 'patient-maria'],
    ['user-pcp', 'Dr. Hometown PCP', 'pcp@example.com', 'pcp', 'prov-pcp-hometown', null],
    ['user-specialist', 'Dr. County Cardiology', 'specialist@example.com', 'specialist', 'prov-cardio-county', null],
    ['user-chw', 'Ana Torres', 'chw@example.com', 'chw', null, null],
  ]) {
    q.push(txn.query(user, [id, name, email, hash, role, providerId, patientId, now]))
  }
  q.push(
    txn.query(
      'INSERT INTO chw_patients (chw_user_id, patient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      ['user-chw', 'patient-maria'],
    ),
  )

  // Maria's referral — same data as the original mock.
  q.push(
    txn.query(
      `INSERT INTO referrals
         (id, patient_id, from_provider_id, to_provider_id, reason, status, created_date, timeline, missing_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
      [
        'ref-maria-cardio',
        'patient-maria',
        'prov-pcp-hometown',
        'prov-cardio-county',
        'Suspected angina — needs cardiology evaluation',
        'info_sent',
        '2026-10-20',
        JSON.stringify([
          '2026-10-20 — PCP requested cardiology referral',
          '2026-10-22 — Clinical notes and ECG sent to specialist',
        ]),
        JSON.stringify(['Recent blood work (lipid panel)']),
      ],
    ),
  )

  const history = `
    INSERT INTO referrals
      (id, patient_id, from_provider_id, to_provider_id, reason, status, created_date,
       timeline, missing_info, findings, is_history)
    VALUES ($1, 'patient-history', 'prov-history-clinics', $2, 'Past referral (demo history)',
            $3, $4, '[]', '[]', $5, 1)
    ON CONFLICT DO NOTHING`
  for (const [to, [seen, returned]] of Object.entries(LOOP_HISTORY)) {
    for (let i = 0; i < seen; i++) {
      const created = `2026-${String((i % 9) + 1).padStart(2, '0')}-15`
      const findings =
        i < returned
          ? JSON.stringify({ forClinician: '', forPatient: '', by: 'demo history', at: created })
          : null
      q.push(txn.query(history, [`hist-${to}-${i}`, to, i < returned ? 'followed_up' : 'seen', created, findings]))
    }
  }

  return q
}

try {
  if (process.argv.includes('--reset')) {
    await sql.query(DROP_ALL)
    console.log('[db] Dropped all tables')
  }
  await sql.transaction((txn) => SCHEMA.map((s) => txn.query(s)))
  await sql.transaction(seed)
  const { n } = await one('SELECT COUNT(*)::int AS n FROM users')
  console.log(`[db] Ready: ${n} users. Demo password: demo1234`)
} catch (err) {
  console.error('[db] Setup failed:', err.message)
  process.exit(1)
}
