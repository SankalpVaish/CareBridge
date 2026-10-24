/**
 * Loop-closure numbers per specialist (O7, O8, B-14): of the patients a
 * provider has seen through a referral, how many had findings sent back to
 * the referring clinic. Public, because Find & Trust ranks with it before
 * anyone signs in. Returns totals only — no patient data.
 */
import { Router } from 'express'
import db from '../db.js'

const router = Router()

// Stages that mean the patient was seen (whether or not findings came back).
const SEEN_OR_LATER = ['seen', 'findings_returned', 'followed_up']

// GET /api/loop-stats → { stats: { [providerId]: { seen, returned, rate } } }
router.get('/', (_req, res) => {
  const rows = db
    .prepare(`
      SELECT to_provider_id AS providerId,
             COUNT(*) AS seen,
             SUM(CASE WHEN findings IS NOT NULL THEN 1 ELSE 0 END) AS returned
      FROM referrals
      WHERE status IN (${SEEN_OR_LATER.map(() => '?').join(', ')})
      GROUP BY to_provider_id
    `)
    .all(...SEEN_OR_LATER)

  const stats = {}
  for (const r of rows) {
    stats[r.providerId] = { seen: r.seen, returned: r.returned, rate: r.returned / r.seen }
  }
  res.json({ stats })
})

export default router
