/**
 * SQLite database layer.
 *
 * One embedded file (server/data/app.db) — no server to run. We create the
 * schema on first boot and seed it with the shared demo scenario (Maria's
 * referral) so the app works out of the box and the frontend demo still holds.
 *
 * Data is relational: users, providers, patients, and referrals reference each
 * other by id. SQLite gives us real foreign keys and simple role-filtered
 * queries without any infrastructure.
 */
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'
import bcrypt from 'bcryptjs'
// One source of truth for providers: the shared demo data the frontend uses.
import { providers as sharedProviders } from '../src/data/mockData.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
mkdirSync(dataDir, { recursive: true })

const db = new Database(join(dataDir, 'app.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// --- Schema ---------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,            -- bcrypt hash, never plaintext
    role        TEXT NOT NULL CHECK (role IN ('patient','pcp','specialist','chw')),
    provider_id TEXT,                     -- pcp/specialist: provider they act as
    patient_id  TEXT,                     -- patient: their patient record
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS providers (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,
    location    TEXT
  );

  CREATE TABLE IF NOT EXISTS patients (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    location    TEXT
  );

  CREATE TABLE IF NOT EXISTS referrals (
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
    missing_info      TEXT NOT NULL DEFAULT '[]'    -- JSON array of strings
  );

  -- Which patients each community health worker looks after.
  CREATE TABLE IF NOT EXISTS chw_patients (
    chw_user_id TEXT NOT NULL REFERENCES users(id),
    patient_id  TEXT NOT NULL REFERENCES patients(id),
    PRIMARY KEY (chw_user_id, patient_id)
  );

  -- Symptom checks. Patient mode saves nothing until the patient shares, so
  -- every row here is visible to the CHW named in chw_user_id.
  CREATE TABLE IF NOT EXISTS triage_sessions (
    id               TEXT PRIMARY KEY,
    patient_id       TEXT NOT NULL REFERENCES patients(id),
    chw_user_id      TEXT NOT NULL REFERENCES users(id),
    started_in       TEXT NOT NULL CHECK (started_in IN ('patient','chw')),
    status           TEXT NOT NULL CHECK (status IN ('shared','reviewed')),
    symptom_text     TEXT NOT NULL,
    result           TEXT NOT NULL,                 -- JSON CareSuggestion
    readings         TEXT NOT NULL DEFAULT '{}',    -- JSON, recorded by the CHW
    consent_recorded INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
  );
`)

// --- Migrations: add columns the referral loop needs (O7, O8) --------------
// Safe to run on every boot; existing databases keep their data.
function addColumn(table, column, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
  }
}
addColumn('patients', 'pcp_provider_id', 'TEXT') // the patient's own clinic
addColumn('referrals', 'findings', 'TEXT') // JSON, set when the specialist sends findings back
addColumn('referrals', 'triage_session_id', 'TEXT') // the symptom check it came from
addColumn('referrals', 'is_history', 'INTEGER NOT NULL DEFAULT 0') // past referrals, only for loop stats
addColumn('triage_sessions', 'sent_to_clinic_at', 'TEXT')
addColumn('triage_sessions', 'clinic_provider_id', 'TEXT')
addColumn('triage_sessions', 'referral_id', 'TEXT')

const usersTableSql =
  db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get()?.sql ?? ''
if (!usersTableSql.includes("'chw'")) {
  console.warn(
    '[db] server/data/app.db predates the CHW role. Delete it and restart the server to reseed.',
  )
}

// --- Seed (only if empty) --------------------------------------------------
const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n

if (userCount === 0) {
  const now = new Date().toISOString()

  // Providers and patient that mirror src/data/mockData.js so the demo matches.
  const insertProvider = db.prepare(
    'INSERT INTO providers (id, name, type, location) VALUES (?, ?, ?, ?)',
  )
  insertProvider.run('prov-pcp-hometown', 'Hometown Family Practice', 'clinic', 'Cedar Falls')
  insertProvider.run('prov-cardio-county', 'County Cardiology Clinic', 'clinic', 'Milburn')
  insertProvider.run('prov-cardio-regional', 'Regional Heart Center', 'hospital', 'Springfield')

  db.prepare('INSERT INTO patients (id, name, location) VALUES (?, ?, ?)').run(
    'patient-maria',
    'Maria Alvarez',
    'Cedar Falls',
  )

  // Demo users, one per role. Password for all: "demo1234".
  const hash = bcrypt.hashSync('demo1234', 10)
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, role, provider_id, patient_id, created_at)
    VALUES (@id, @name, @email, @password, @role, @provider_id, @patient_id, @created_at)
  `)
  insertUser.run({
    id: 'user-maria', name: 'Maria Alvarez', email: 'maria@example.com',
    password: hash, role: 'patient', provider_id: null, patient_id: 'patient-maria',
    created_at: now,
  })
  insertUser.run({
    id: 'user-pcp', name: 'Dr. Hometown PCP', email: 'pcp@example.com',
    password: hash, role: 'pcp', provider_id: 'prov-pcp-hometown', patient_id: null,
    created_at: now,
  })
  insertUser.run({
    id: 'user-specialist', name: 'Dr. County Cardiology', email: 'specialist@example.com',
    password: hash, role: 'specialist', provider_id: 'prov-cardio-county', patient_id: null,
    created_at: now,
  })
  insertUser.run({
    id: 'user-chw', name: 'Ana Torres', email: 'chw@example.com',
    password: hash, role: 'chw', provider_id: null, patient_id: null,
    created_at: now,
  })
  db.prepare('INSERT INTO chw_patients (chw_user_id, patient_id) VALUES (?, ?)').run(
    'user-chw',
    'patient-maria',
  )

  // Maria's referral — same data as the original mock.
  db.prepare(`
    INSERT INTO referrals
      (id, patient_id, from_provider_id, to_provider_id, reason, status,
       responsible_party, stall_reason, created_date, timeline, missing_info)
    VALUES
      (@id, @patient_id, @from_provider_id, @to_provider_id, @reason, @status,
       @responsible_party, @stall_reason, @created_date, @timeline, @missing_info)
  `).run({
    id: 'ref-maria-cardio',
    patient_id: 'patient-maria',
    from_provider_id: 'prov-pcp-hometown',
    to_provider_id: 'prov-cardio-county',
    reason: 'Suspected angina — needs cardiology evaluation',
    status: 'info_sent',
    responsible_party: null,
    stall_reason: null,
    created_date: '2026-10-20',
    timeline: JSON.stringify([
      '2026-10-20 — PCP requested cardiology referral',
      '2026-10-22 — Clinical notes and ECG sent to specialist',
    ]),
    missing_info: JSON.stringify(['Recent blood work (lipid panel)']),
  })

  console.log('[db] Seeded demo data (4 users, password: demo1234)')
}

// --- Idempotent demo data for the referral loop (runs on every boot) -------

// Every provider from the shared demo data, so referrals can go to any of them.
const insertProviderIfMissing = db.prepare(
  'INSERT OR IGNORE INTO providers (id, name, type, location) VALUES (?, ?, ?, ?)',
)
for (const p of sharedProviders) insertProviderIfMissing.run(p.id, p.name, p.type, p.location)
insertProviderIfMissing.run('prov-history-clinics', 'Other clinics (demo history)', 'clinic', 'Various')

// Maria's own clinic receives the checks her health worker sends (O7).
db.prepare(
  "UPDATE patients SET pcp_provider_id = 'prov-pcp-hometown' WHERE id = 'patient-maria' AND pcp_provider_id IS NULL",
).run()

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
db.prepare(
  "INSERT OR IGNORE INTO patients (id, name, location) VALUES ('patient-history', 'Past patients (demo history)', 'Various')",
).run()
const insertHistory = db.prepare(`
  INSERT OR IGNORE INTO referrals
    (id, patient_id, from_provider_id, to_provider_id, reason, status, created_date,
     timeline, missing_info, findings, is_history)
  VALUES (@id, 'patient-history', 'prov-history-clinics', @to, 'Past referral (demo history)',
          @status, @created, '[]', '[]', @findings, 1)
`)
for (const [to, [seen, returned]] of Object.entries(LOOP_HISTORY)) {
  for (let i = 0; i < seen; i++) {
    const created = `2026-${String((i % 9) + 1).padStart(2, '0')}-15`
    insertHistory.run({
      id: `hist-${to}-${i}`,
      to,
      status: i < returned ? 'followed_up' : 'seen',
      created,
      findings: i < returned ? JSON.stringify({ forClinician: '', forPatient: '', by: 'demo history', at: created }) : null,
    })
  }
}

export default db
