/**
 * Live loop-closure numbers for Find & Trust (O7, O8, B-14).
 *
 * The server counts, per specialist, how many referred patients were seen and
 * how many had findings sent back (/api/loop-stats). Providers with live
 * numbers get them in place of the seed `loopClosureRate`; the rest keep the
 * seed value. If the server isn't running, everything keeps the seed values.
 */
import { useEffect, useState } from 'react'
import { api } from '../../shared/api.js'

/** @returns {{ stats: Record<string, {seen: number, returned: number, rate: number}>, live: boolean }} */
export function useLoopStats() {
  const [state, setState] = useState({ stats: {}, live: false })
  useEffect(() => {
    let active = true
    api
      .loopStats()
      .then(({ stats }) => active && setState({ stats, live: true }))
      .catch(() => active && setState({ stats: {}, live: false }))
    return () => {
      active = false
    }
  }, [])
  return state
}

/** Providers with live loop numbers merged in. */
export function withLoopStats(providers, stats) {
  return providers.map((p) => {
    const s = stats[p.id]
    if (!s || s.seen === 0) return p
    return { ...p, loopClosureRate: s.rate, loopCounts: { seen: s.seen, returned: s.returned } }
  })
}
