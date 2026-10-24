/**
 * Doctors at a provider, and which of them treat a given service (B-2, B-14).
 * Pure module, no React.
 *
 * Order, when a service is asked for: doctors who provide it first, most
 * patients treated for it in the last year first. Feedback never decides the
 * order on its own, so a handful of glowing reviews can't push anyone up (X-6).
 */
import { doctors as allDoctors } from '../../data/mockData.js'

/** Fewer completed-referral reviews than this: shown, but marked as "few". */
export const FEW_VISITS = 10

/** Services of this doctor that match the query (case-insensitive, partial). */
export function matchingTreatments(doctor, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return []
  return doctor.treats.filter((t) => t.toLowerCase().includes(q))
}

/** Patients treated in the last year for the matching services. */
function casesFor(doctor, treatments) {
  return treatments.reduce((sum, t) => sum + (doctor.casesLastYear[t] ?? 0), 0)
}

/** Share of referred patients whose findings went back to their clinic, or null. */
export function findingsRate(doctor) {
  const { seen, findingsReturned } = doctor.referrals
  return seen > 0 ? findingsReturned / seen : null
}

/**
 * @param {string} providerId
 * @param {string} [service]  e.g. 'echocardiogram'; '' lists everyone
 * @param {object[]} [doctors]
 * @returns {{ doctor: object, treatsService: boolean, matched: string[], cases: number }[]}
 */
export function doctorsFor(providerId, service = '', doctors = allDoctors) {
  return doctors
    .filter((d) => d.providerId === providerId)
    .map((d) => {
      const matched = matchingTreatments(d, service)
      return { doctor: d, treatsService: matched.length > 0, matched, cases: casesFor(d, matched) }
    })
    .sort(
      (a, b) =>
        Number(b.treatsService) - Number(a.treatsService) ||
        b.cases - a.cases ||
        (findingsRate(b.doctor) ?? 0) - (findingsRate(a.doctor) ?? 0),
    )
}
