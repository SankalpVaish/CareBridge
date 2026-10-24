/**
 * Auth routes: signup, login, and "who am I".
 * Passwords are hashed with bcrypt; sessions are stateless JWTs.
 */
import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import db from '../db.js'
import {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
} from '../auth.js'
import { USER_ROLES as ROLES } from '../../src/shared/models.js'

const router = Router()

/** Strip the password hash before sending a user to the client. */
function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    providerId: row.provider_id,
    patientId: row.patient_id,
  }
}

// POST /api/auth/signup  { name, email, password, role }
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body ?? {}

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' })
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLES.join(', ')}` })
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' })
  }

  const hash = await hashPassword(password)
  const user = {
    id: randomUUID(),
    name,
    email,
    password: hash,
    role,
    provider_id: null,
    patient_id: null,
    created_at: new Date().toISOString(),
  }
  db.prepare(`
    INSERT INTO users (id, name, email, password, role, provider_id, patient_id, created_at)
    VALUES (@id, @name, @email, @password, @role, @provider_id, @patient_id, @created_at)
  `).run(user)

  const token = signToken(user)
  res.status(201).json({ token, user: publicUser(user) })
})

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  // Same generic message whether the email or the password is wrong.
  if (!row || !(await verifyPassword(password, row.password))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signToken(row)
  res.json({ token, user: publicUser(row) })
})

// GET /api/auth/me  (requires token)
router.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.sub)
  if (!row) return res.status(404).json({ error: 'User not found' })
  res.json({ user: publicUser(row) })
})

export default router
