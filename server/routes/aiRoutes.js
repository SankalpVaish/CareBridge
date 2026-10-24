/**
 * AI proxy for the symptom checker.
 *
 * The browser sends its prompt here and this server calls Groq. That means:
 *   - the Groq key stays on the server and is never sent to the browser;
 *   - the browser only talks to its own site, so Groq's CORS rules don't apply
 *     (calling Groq straight from the page broke whenever the dev port changed).
 *
 * The key is read from the environment (GROQ_API_KEY) or, for local
 * development, from .env.local in the project folder (GROQ_API_KEY or the
 * older VITE_GROQ_API_KEY). Restart the server after changing it.
 *
 * Public on purpose: patient mode works without signing in. To stop it being
 * used as a free relay, it only accepts one system and one user message of
 * limited size, sets the model and options itself, and rate-limits by address.
 */
import { Router } from 'express'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const router = Router()

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MAX_SYSTEM_CHARS = 8000
const MAX_USER_CHARS = 1500
const TIMEOUT_MS = 20000
const LIMIT_PER_MINUTE = 20

/** KEY=value lines from .env.local, if the file exists. */
function readEnvFile() {
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env.local')
  if (!existsSync(file)) return {}
  const out = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return out
}

const fileEnv = readEnvFile()
const API_KEY =
  process.env.GROQ_API_KEY || fileEnv.GROQ_API_KEY || fileEnv.VITE_GROQ_API_KEY || ''
const MODEL =
  process.env.GROQ_MODEL || fileEnv.GROQ_MODEL || fileEnv.VITE_GROQ_MODEL || 'openai/gpt-oss-20b'

if (!API_KEY) {
  console.log('[ai] No Groq key found; the symptom checker will use its offline rules.')
}

// Simple per-address limit: at most LIMIT_PER_MINUTE requests a minute.
const hits = new Map()
function overLimit(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > LIMIT_PER_MINUTE
}

// GET /api/ai/status → { available }
router.get('/status', (_req, res) => {
  res.json({ available: Boolean(API_KEY) })
})

// POST /api/ai/suggest  { system, user } → { content }
router.post('/suggest', async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: 'AI is not set up on the server' })
  if (overLimit(req.ip)) return res.status(429).json({ error: 'Too many requests, try again in a minute' })

  const { system, user } = req.body ?? {}
  if (typeof system !== 'string' || typeof user !== 'string' || !system.trim() || !user.trim()) {
    return res.status(400).json({ error: 'system and user text are required' })
  }
  if (system.length > MAX_SYSTEM_CHARS || user.length > MAX_USER_CHARS) {
    return res.status(413).json({ error: 'Request too long' })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const groq = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        // gpt-oss reasoning models spend tokens before emitting JSON; give
        // enough headroom or the API returns json_validate_failed.
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: controller.signal,
    })
    const data = await groq.json().catch(() => ({}))
    if (!groq.ok) {
      const detail = data?.error?.message || `status ${groq.status}`
      console.warn('[ai] Groq error:', detail)
      return res.status(502).json({ error: `AI service error: ${detail}` })
    }
    res.json({ content: data?.choices?.[0]?.message?.content ?? '' })
  } catch (err) {
    const timedOut = err?.name === 'AbortError'
    console.warn('[ai] Groq request failed:', timedOut ? 'timed out' : err?.message)
    res.status(timedOut ? 504 : 502).json({ error: timedOut ? 'AI service timed out' : 'AI service unreachable' })
  } finally {
    clearTimeout(timer)
  }
})

export default router
