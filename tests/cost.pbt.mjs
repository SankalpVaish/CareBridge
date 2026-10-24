/**
 * Property-based tests for costs, coverage, and aid (Care & Cost).
 * Run: node tests/cost.pbt.mjs
 */
import { check, gen, expect, done } from './pbt/prop.mjs'
import { estimateCost } from '../src/features/care/costEstimator.js'
import { applyCoverage } from '../src/features/care/coverage.js'
import { matchAid, relevantSchemes } from '../src/features/care/aid.js'
import { providers, schemes, demoPatient } from '../src/data/mockData.js'

const schemeIds = schemes.map((s) => s.id)
const DOCS = ['State ID', 'Proof of income', 'Residency proof', 'Medicaid card', 'Referral letter']

const patientGen = gen.record({
  schemeIds: gen.subset(schemeIds),
  deductibleMet: gen.int(0, 7000),
  income: gen.nullable(gen.int(0, 12000)),
  household: gen.nullable(gen.int(1, 8)),
  state: gen.nullable(gen.pick(['IA', 'NE', 'MN'])),
  age: gen.int(0, 95),
  employed: gen.nullable(gen.bool()),
  transport: gen.subset(['community shuttle', 'shared ride']),
  docs: gen.subset(DOCS),
})
const toPatient = (p) => ({
  ...demoPatient,
  schemeIds: p.schemeIds,
  memberCoverage: Object.fromEntries(p.schemeIds.map((id) => [id, { memberId: 'x', deductibleMetUsd: p.deductibleMet }])),
  monthlyIncomeUsd: p.income,
  householdSize: p.household,
  state: p.state,
  age: p.age,
  employed: p.employed,
  transport: p.transport,
  documentsHeld: p.docs,
})

const providerGen = gen.record({
  base: gen.pick(providers),
  miles: gen.nullable(gen.int(0, 400), 0.1),
  fee: gen.int(0, 1500),
})
const toProvider = (p) => ({ ...p.base, distanceMiles: p.miles, consultFeeUsd: p.fee })

const caseGen = gen.record({ patient: patientGen, provider: providerGen })
const estimateFor = (c) => estimateCost(toPatient(c.patient), toProvider(c.provider))

check('covered amount is never negative or more than the total', caseGen, (c) => {
  const e = estimateFor(c)
  expect(e.coveredUsd >= 0, `covered ${e.coveredUsd}`)
  expect(e.coveredUsd <= e.grossUsd, `covered ${e.coveredUsd} > total ${e.grossUsd}`)
  expect(e.outOfPocketUsd === e.grossUsd - e.coveredUsd, 'out of pocket ≠ total − covered')
})

check('applying for help never makes the bill bigger', caseGen, (c) => {
  const e = estimateFor(c)
  expect(e.outOfPocketIfAppliedUsd >= 0, `negative: ${e.outOfPocketIfAppliedUsd}`)
  expect(e.outOfPocketIfAppliedUsd <= e.outOfPocketUsd, `${e.outOfPocketIfAppliedUsd} > ${e.outOfPocketUsd}`)
})

check('best case ≤ expected ≤ worst case, for the total and for what you pay', caseGen, (c) => {
  const { range: r } = estimateFor(c)
  expect(r.grossBest <= r.grossExpected && r.grossExpected <= r.grossWorst, `total ${r.grossBest}/${r.grossExpected}/${r.grossWorst}`)
  expect(r.oopBest <= r.oopExpected && r.oopExpected <= r.oopWorst, `you pay ${r.oopBest}/${r.oopExpected}/${r.oopWorst}`)
})

check('only schemes you hold pay today; only schemes you don’t hold are “could save”', caseGen, (c) => {
  const patient = toPatient(c.patient)
  const e = estimateFor(c)
  for (const x of e.coveredBy) expect(patient.schemeIds.includes(x.schemeId), `${x.schemeId} paid but not held`)
  for (const x of e.couldSave) expect(!patient.schemeIds.includes(x.schemeId), `${x.schemeId} offered but already held`)
  for (const x of [...e.coveredBy, ...e.couldSave]) expect(x.amountUsd > 0, `${x.schemeId} listed with $${x.amountUsd}`)
})

check('one scheme never pays more than the bill, its cap, or leaves a negative balance',
  gen.record({
    scheme: gen.pick(schemes),
    items: gen.record({
      consult: gen.int(0, 2000), tests: gen.int(0, 2000), treatment: gen.int(0, 5000),
      medicines: gen.int(0, 500), travel: gen.int(0, 600), lodging: gen.int(0, 400), lostWages: gen.int(0, 400),
    }),
    provider: gen.pick(providers),
    met: gen.int(0, 8000),
  }),
  ({ scheme, items, provider, met }) => {
    const remaining = { ...items }
    const { paidUsd, lines } = applyCoverage(scheme, remaining, { provider, deductibleMetUsd: met })
    for (const l of lines) {
      expect(l.schemePaysUsd >= 0 && l.schemePaysUsd <= l.costUsd, `${l.item}: pays ${l.schemePaysUsd} of ${l.costUsd}`)
    }
    for (const [k, v] of Object.entries(remaining)) expect(v >= 0, `${k} left at ${v}`)
    if (scheme.maxAmountUsd != null) expect(paidUsd <= scheme.maxAmountUsd, `paid ${paidUsd} over cap ${scheme.maxAmountUsd}`)
    const before = Object.values(items).reduce((a, b) => a + b, 0)
    const after = Object.values(remaining).reduce((a, b) => a + b, 0)
    expect(before - after === paidUsd, 'paid amount doesn’t match what was taken off')
  },
  { runs: 1000 },
)

check('aid statuses follow the rules: missing information never means “doesn’t fit”', caseGen, (c) => {
  const patient = toPatient(c.patient)
  const provider = toProvider(c.provider)
  for (const m of matchAid(schemes, patient, provider)) {
    if (m.status === 'enrolled') expect(patient.schemeIds.includes(m.scheme.id), `${m.scheme.id} enrolled but not held`)
    if (m.status === 'not_eligible') {
      expect(
        m.reasons.some((r) => r.met === false && !r.aboutProvider),
        `${m.scheme.id} "doesn’t fit" without a failed personal rule: ${JSON.stringify(m.reasons)}`,
      )
    }
    if (m.status === 'eligible') expect(m.reasons.every((r) => r.met === true), `${m.scheme.id} eligible with unmet rule`)
  }
  for (const s of relevantSchemes(schemes, patient)) {
    if (s.plan) expect(patient.schemeIds.includes(s.id), `private plan ${s.id} listed but not held`)
  }
})

done()
