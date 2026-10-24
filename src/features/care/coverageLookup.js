/**
 * Mock insurer records for "Check my coverage" (A-13, A-14).
 *
 * Stands in for an insurer's member lookup. A real version would ask the
 * patient to log in to their insurer and agree to share (e.g. a payer's FHIR
 * Patient Access API). Demo data only; never put real member numbers here.
 */
import { byId } from '../../data/mockData.js'

/**
 * @typedef {Object} MemberRecord
 * @property {string} memberId
 * @property {string} schemeId          Key into schemes in mockData.js
 * @property {string} memberName
 * @property {string} coveredFrom       ISO date
 * @property {string} coveredThrough    ISO date
 * @property {number} deductibleMetUsd  Paid toward this year's deductible so far
 */

/** @type {MemberRecord[]} */
const MEMBER_RECORDS = [
  { memberId: 'MCD-IA-448812', schemeId: 'medicaid', memberName: 'Maria Alvarez', coveredFrom: '2026-01-01', coveredThrough: '2026-12-31', deductibleMetUsd: 0 },
  { memberId: 'PHP-204-118', schemeId: 'prairie-ppo', memberName: 'Maria Alvarez', coveredFrom: '2026-01-01', coveredThrough: '2026-12-31', deductibleMetUsd: 250 },
  { memberId: 'HBC-700-321', schemeId: 'heartland-bronze', memberName: 'Maria Alvarez', coveredFrom: '2026-01-01', coveredThrough: '2026-12-31', deductibleMetUsd: 0 },
  { memberId: 'PHP-000-999', schemeId: 'prairie-ppo', memberName: 'Maria Alvarez', coveredFrom: '2025-01-01', coveredThrough: '2026-06-30', deductibleMetUsd: 0 },
]

/** Member numbers to try in the demo, with what each one shows. */
export const DEMO_MEMBER_IDS = [
  { memberId: 'MCD-IA-448812', label: 'Maria’s Medicaid' },
  { memberId: 'PHP-204-118', label: 'Work plan (PPO)' },
  { memberId: 'HBC-700-321', label: 'Marketplace plan (small network)' },
  { memberId: 'PHP-000-999', label: 'Plan that has ended' },
]

/**
 * @param {string} memberId
 * @param {string} [today]  ISO date, for testing
 * @returns {null | { record: MemberRecord, scheme: object, active: boolean }}
 */
export function lookupCoverage(memberId, today = new Date().toISOString().slice(0, 10)) {
  const id = String(memberId || '').trim().toUpperCase()
  const record = MEMBER_RECORDS.find((r) => r.memberId === id)
  if (!record) return null
  const scheme = byId.scheme(record.schemeId)
  const active = record.coveredFrom <= today && today <= record.coveredThrough
  return { record, scheme, active }
}
