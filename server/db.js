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
    role        TEXT NOT NULL CHECK (role IN ('patient','pcp','specialist')),
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
`)

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

  console.log('[db] Seeded demo data (3 users, password: demo1234)')
}

export default db
