/**
 * Property-based tests for the trip plan (shared by Find & Trust, Coordinate,
 * and the cost estimate). Run: node tests/travel.pbt.mjs
 */
import { check, gen, expect, done } from './pbt/prop.mjs'
import { planTrip, OVERNIGHT_AFTER_MINUTES } from '../src/features/find/travel.js'
import { demoPatient, providers } from '../src/data/mockData.js'

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const tripGen = gen.record({
  miles: gen.int(0, 450),
  transport: gen.subset(['community shuttle', 'shared ride']),
  medicaid: gen.bool(),
  apptHour: gen.int(6, 17),
  apptMin: gen.pick([0, 15, 30, 45]),
})
const plan = (t) => {
  const patient = { ...demoPatient, transport: t.transport, schemeIds: t.medicaid ? ['medicaid'] : [] }
  const provider = { ...providers[0], distanceMiles: t.miles }
  const appointmentTime = `${String(t.apptHour).padStart(2, '0')}:${String(t.apptMin).padStart(2, '0')}`
  return { p: planTrip(patient, provider, { appointmentTime }), appt: t.apptHour * 60 + t.apptMin }
}

check('you always arrive before the appointment, leaving after you set off', tripGen, (t) => {
  const { p, appt } = plan(t)
  for (const o of p.options.filter((x) => x.available)) {
    const leave = toMin(o.leaveBy) - (o.leavesDayBefore ? 1440 : 0)
    const arrive = toMin(o.arrive)
    expect(arrive <= appt, `${o.label} arrives ${o.arrive} for ${p.appointmentTime}`)
    expect(leave + o.oneWayMinutes - (o.id === 'community shuttle' ? 0 : 0) <= appt, `${o.label} leaves too late`)
    // A leave-by time shown as e.g. "8:45 pm" for a 6 am visit must say it's the night before.
    if (toMin(o.leaveBy) > appt) {
      expect(o.leavesDayBefore === true, `${o.label}: leave by ${o.leaveBy} for a ${p.appointmentTime} visit, not marked as the day before`)
    }
  }
}, { runs: 1500 })

check('costs are never negative and the recommended option is the cheapest usable one', tripGen, (t) => {
  const { p } = plan(t)
  for (const o of p.options) expect(o.roundTripCostUsd >= 0, `${o.label} costs ${o.roundTripCostUsd}`)
  const usable = p.options.filter((o) => o.available)
  if (usable.length === 0) return expect(p.recommended === null, 'recommended with nothing usable')
  const cheapest = Math.min(...usable.map((o) => o.roundTripCostUsd))
  expect(p.recommended.roundTripCostUsd === cheapest, `recommended ${p.recommended.roundTripCostUsd}, cheapest ${cheapest}`)
})

check('overnight stay is flagged exactly when even the fastest way is a long trip', tripGen, (t) => {
  const { p } = plan(t)
  const usable = p.options.filter((o) => o.available)
  if (usable.length === 0) return
  const fastest = Math.min(...usable.map((o) => o.oneWayMinutes))
  expect(p.overnightNeeded === fastest > OVERNIGHT_AFTER_MINUTES, `fastest ${fastest} min, overnight ${p.overnightNeeded}`)
})

check('unknown distance gives no plan rather than a wrong one', gen.constant(null), () => {
  expect(planTrip(demoPatient, { ...providers[0], distanceMiles: null }) === null, 'plan for unknown distance')
})

done()
