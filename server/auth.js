/**
 * Auth helpers: password hashing (bcrypt) and JWT signing/verifying.
 *
 * Demo-grade: real hashing and real signed tokens, but no refresh tokens,
 * email verification, or rate limiting. Good enough for a hackathon demo,
 * not hardened for production.
 *
 * The JWT secret comes from the JWT_SECRET env var with a dev-only fallback,
 * so no production secret is ever committed to source.
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// The fallback is in the public repo, so anyone could forge logins with it.
if (process.env.VERCEL && !process.env.JWT_SECRET) {
  throw new Error('Set JWT_SECRET in the Vercel project settings.')
}
const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-only-insecure-secret-change-in-production'
const TOKEN_TTL = '7d'

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

/** Sign a token carrying the user's id and role. */
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  )
}

/** Express middleware: require a valid Bearer token; attaches req.auth. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }
  try {
    req.auth = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
