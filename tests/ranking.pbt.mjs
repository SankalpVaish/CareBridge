/**
 * Property-based tests for "ranking nobody can buy" (Find & Trust).
 * Run: node tests/ranking.pbt.mjs
 */
import { check, gen, expect, done } from './pbt/prop.mjs'
import { rankProviders, WEIGHTS, URGENT_WEIGHTS } from '../src/features/find/ranking.js'
import { providers as seedProviders, schemes } from '../src/data/mockData.js'

const LANGS = ['English', 'Spanish', 'Vietnamese']

const provider = gen.record({
  base: gen.pick(seedProviders),
  status: gen.pick(['verified', 'verified', 'not_found', 'expired', 'unchecked']),
  loop: gen.nullable(gen.int(0, 100)),
  miles: gen.nullable(gen.int(0, 400), 0.15),
  wait: gen.int(0, 120),
  languages: gen.subset(LANGS),
  fee: gen.int(0, 900),
})
const toProvider = (p, i) => ({
  ...p.base,
  id: `${p.base.id}-${i}`,
  verification: { ...p.base.verification, status: p.status },
  loopClosureRate: p.loop == null ? null : p.loop / 100,
  distanceMiles: p.miles,
  waitDays: p.wait,
  languages: p.languages,
  consultFeeUsd: p.fee,
})

const input = gen.record({
  providers: gen.array(provider, 0, 8),
  languages: gen.subset(LANGS),
  schemeIds: gen.subset(schemes.map((s) => s.id)),
  budget: gen.int(0, 1000),
  urgency: gen.pick(['routine', 'within_weeks', 'within_days', 'emergency']),
})
const run = ({ providers, languages, schemeIds, budget, urgency }) => {
  const list = providers.map(toProvider)
  const patient = { location: 'Cedar Falls', languages, schemeIds, monthlyBudgetUsd: budget }
  return { list, ranked: rankProviders(list, patient, { urgency }) }
}

check('published weights add up to 100%', gen.constant(null), () => {
  for (const w of [WEIGHTS, URGENT_WEIGHTS]) {
    const sum = Object.values(w).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 1) < 1e-9, `weights sum to ${sum}`)
  }
})

check('no unverified provider is ever ranked above a verified one, or scored', input, (inp) => {
  const { ranked } = run(inp)
  let seenUnverified = false
  for (const r of ranked) {
    const verified = r.provider.verification.status === 'verified'
    if (!verified) {
      seenUnverified = true
      expect(r.score === null, `unverified ${r.provider.id} got score ${r.score}`)
    } else {
      expect(!seenUnverified, `verified ${r.provider.id} ranked below an unverified one`)
    }
  }
})

check('verified scores are between 0 and 1 and sorted best first', input, (inp) => {
  const scores = run(inp).ranked.filter((r) => r.score !== null).map((r) => r.score)
  scores.forEach((s, i) => {
    expect(s >= 0 && s <= 1, `score ${s} out of range`)
    if (i > 0) expect(scores[i - 1] >= s, `not sorted: ${scores[i - 1]} then ${s}`)
  })
})

check('every result explains itself: loop closure first, no empty reasons', input, (inp) => {
  for (const r of run(inp).ranked) {
    expect(r.reasons.length >= 1, 'no reasons')
    for (const reason of r.reasons) {
      expect(reason.text.trim().length > 0, 'empty reason')
      expect(!/\s$/.test(reason.text), `reason ends mid-sentence: "${reason.text}"`)
    }
    if (r.score !== null) {
      expect(r.reasons.length >= 2, `only ${r.reasons.length} reason(s)`)
      expect(/findings|referral history/i.test(r.reasons[0].text), `first reason: ${r.reasons[0].text}`)
    }
  }
})

check('ranking keeps every provider exactly once', input, (inp) => {
  const { list, ranked } = run(inp)
  expect(ranked.length === list.length, `${list.length} in, ${ranked.length} out`)
  const ids = new Set(ranked.map((r) => r.provider.id))
  expect(ids.size === list.length, 'duplicates or losses')
})

done()
