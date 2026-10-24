/**
 * Express API server for CareBridge: Rural Specialty Care Navigator.
 *
 * Run: npm run server   (or npm run dev:all to run API + Vite together)
 * Storage: embedded SQLite (server/data/app.db), seeded on first boot.
 */
import express from 'express'
import cors from 'cors'
import './db.js' // initialize + seed the database on boot
import authRoutes from './routes/authRoutes.js'
import referralRoutes from './routes/referralRoutes.js'
import triageRoutes from './routes/triageRoutes.js'
import loopStatsRoutes from './routes/loopStatsRoutes.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/referrals', referralRoutes)
app.use('/api/triage', triageRoutes)
app.use('/api/loop-stats', loopStatsRoutes)

app.listen(PORT, () => {
  console.log(`[server] API listening on http://localhost:${PORT}`)
})
