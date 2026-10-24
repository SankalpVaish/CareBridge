/**
 * Trip plan (O3, B-4..B-8): how a patient gets to a provider and back, with
 * time, fare, when to leave, and whether they need to stay overnight.
 * Used by Find & Trust, Coordinate's "Getting there", and the cost estimate,
 * so all three show the same numbers. Pure module, no React.
 *
 * Simplified demo model: straight-line distance, a fixed speed per mode, and
 * fares from transportOptions in src/data/mockData.js.
 */
import { transportOptions as allOptions } from '../../data/mockData.js'

/** One way, longer than this means an overnight stay is likely. */
export const OVERNIGHT_AFTER_MINUTES = 150
/** Time to arrive before the appointment. */
const ARRIVE_EARLY_MINUTES = 15
/** Default appointment time when none is booked yet. */
export const DEFAULT_APPOINTMENT = '10:00'

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const toHhmm = (mins) => {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** "06:50" → "6:50 am" */
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h < 12 ? 'am' : 'pm'
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** "75 min" or "2 h 5 min" */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/**
 * @typedef {Object} TripOption
 * @property {string} id
 * @property {string} label
 * @property {string} icon
 * @property {boolean} available      Can be used for this trip
 * @property {string} [whyNot]        When not available
 * @property {number} oneWayMinutes
 * @property {number} roundTripCostUsd
 * @property {string} leaveBy         'HH:MM'
 * @property {boolean} leavesDayBefore  leaveBy is on the day before the appointment
 * @property {string} arrive          'HH:MM'
 * @property {string[]} notes         Plain-language conditions (days, booking)
 * @property {boolean} needsBooking
 */

/**
 * @param {import('../../shared/models.js').Patient} patient
 * @param {import('../../shared/models.js').Provider} provider
 * @param {{ appointmentTime?: string, options?: object[] }} [opts]
 * @returns {null | {
 *   miles: number,
 *   appointmentTime: string,
 *   options: TripOption[],
 *   recommended: TripOption|null,      cheapest usable option
 *   cheapestPaid: TripOption|null,     cheapest option that costs money (used for the cost estimate)
 *   priciestPaid: TripOption|null,
 *   overnightNeeded: boolean,
 * }}  null when the distance is unknown
 */
export function planTrip(patient, provider, opts = {}) {
  if (typeof provider?.distanceMiles !== 'number') return null
  const miles = provider.distanceMiles
  const appointmentTime = opts.appointmentTime ?? DEFAULT_APPOINTMENT
  const appt = toMinutes(appointmentTime)
  const held = new Set(patient?.schemeIds ?? [])
  const canUse = (o) =>
    o.requiresSchemeId ? held.has(o.requiresSchemeId) : (patient?.transport ?? []).includes(o.id)

  const options = (opts.options ?? allOptions).filter(canUse).map((o) => {
    const ride = Math.round((miles / o.mph) * 60)
    const oneWayMinutes = ride + (o.walkMinutes ?? 0)
    const roundTripCostUsd =
      o.roundTripFareUsd ?? Math.round(miles * 2 * (o.costPerMileUsd ?? 0))
    const notes = []
    let available = true
    let whyNot

    let leaveBy
    let arrive
    let leavesDayBefore = false
    if (o.kind === 'scheduled') {
      leaveBy = toHhmm(toMinutes(o.departs) - (o.walkMinutes ?? 0))
      arrive = toHhmm(toMinutes(o.departs) + ride)
      notes.push(`${o.days.join(' and ')} only. Leaves ${formatTime(o.departs)} from ${o.pickup}.`)
      notes.push(`Returns at ${formatTime(o.returnsAt)}.`)
      if (miles > o.maxMiles) {
        available = false
        whyNot = `Doesn’t go farther than ${o.maxMiles} mi`
      } else if (toMinutes(arrive) > appt - ARRIVE_EARLY_MINUTES) {
        available = false
        whyNot = `Arrives ${formatTime(arrive)}, too late for a ${formatTime(appointmentTime)} appointment. Ask for a later time.`
      }
    } else {
      const leaveAt = appt - oneWayMinutes - ARRIVE_EARLY_MINUTES
      leaveBy = toHhmm(leaveAt)
      arrive = toHhmm(appt - ARRIVE_EARLY_MINUTES)
      // A long trip to an early appointment can mean setting off the night
      // before. Without this, "leave by 11:58 pm" read as the same day.
      // Found by the property test in tests/travel.pbt.mjs.
      if (leaveAt < 0) {
        leavesDayBefore = true
        notes.push('Leave the day before, or ask for a later appointment.')
      }
      if (o.pickup) notes.push(`${o.pickup}.`)
    }
    if (o.kind === 'booked') {
      notes.push(`Free with your scheme. Book at least ${o.bookAheadDays} working days ahead.`)
    }

    return {
      id: o.id,
      label: o.label,
      icon: o.icon,
      available,
      whyNot,
      oneWayMinutes,
      roundTripCostUsd,
      leaveBy,
      leavesDayBefore,
      arrive,
      notes,
      needsBooking: o.kind === 'booked',
    }
  })

  const usable = options.filter((o) => o.available)
  const byCost = [...usable].sort(
    (a, b) => a.roundTripCostUsd - b.roundTripCostUsd || a.oneWayMinutes - b.oneWayMinutes,
  )
  const paid = byCost.filter((o) => o.roundTripCostUsd > 0)
  const fastest = Math.min(...usable.map((o) => o.oneWayMinutes), Infinity)

  return {
    miles,
    appointmentTime,
    options,
    recommended: byCost[0] ?? null,
    cheapestPaid: paid[0] ?? null,
    priciestPaid: paid.at(-1) ?? null,
    // Even the fastest way there is a long day: plan to stay over.
    overnightNeeded: fastest !== Infinity && fastest > OVERNIGHT_AFTER_MINUTES,
  }
}
