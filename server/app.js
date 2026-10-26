/**
 * The Express API for CareBridge: Rural Specialty Care Navigator.
 *
 * Runs two ways:
 *   - locally: server/index.js starts it on a port (npm run server / dev:all)
 *   - on Vercel: api/index.js exports it as a serverless function
 * Storage: Neon Postgres (see server/db.js).
 */
import './env.js'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import referralRoutes from './routes/referralRoutes.js'
import triageRoutes from './routes/triageRoutes.js'
import loopStatsRoutes from './routes/loopStatsRoutes.js'
import aiRoutes from './routes/aiRoutes.js'

const app = express()

// On Vercel, requests arrive through Vercel's proxy; trust it so req.ip is the
// visitor's address (the AI rate limit is per address).
if (process.env.VERCEL) app.set('trust proxy', 1)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/referrals', referralRoutes)
app.use('/api/triage', triageRoutes)
app.use('/api/loop-stats', loopStatsRoutes)
app.use('/api/ai', aiRoutes)

export default app
