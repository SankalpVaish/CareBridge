/**
 * Ranking nobody can buy (B-13, B-14, X-6).
 *
 * Every verified provider gets a score from 0 to 1 built only from evidence
 * that it serves rural referred patients well. There is no paid placement and
 * star ratings are never used. Each result also gets plain-language reasons so
 * the patient, CHW, or clinician can see why it is ranked where it is.
 *
 * The weights below are published as-is in the "How we rank" modal.
 */
import { byId } from '../../data/mockData.js'

/** Share of the total score each factor contributes. Must add up to 1. */
export const WEIGHTS = {
  loopClosure: 0.25,
  travel: 0.25,
  affordability: 0.2,
  wait: 0.2,
  language: 0.1,
}

/** When care is needed within days, wait and travel time count for more (PLAN §6). */
export const URGENT_WEIGHTS = {
  loopClosure: 0.15,
  travel: 0.3,
  affordability: 0.15,
  wait: 0.3,
  language: 0.1,
}

/** Distance (miles) at or beyond which the travel score is 0. */
export const MAX_TRAVEL_MILES = 150
/** Wait (days) at or beyond which the wait score is 0. */
export const MAX_WAIT_DAYS = 60
/** Score used when a provider has no referral history yet, so new or small centres aren't buried. */
export const NO_HISTORY_LOOP_SCORE = 0.5

export const FACTOR_LABELS = {
  loopClosure: 'Sends findings back to the referring clinic',
  travel: 'Travel distance',
  affordability: 'Accepts your scheme and fits your budget',
  wait: 'Typical wait for an appointment',
  language: 'Staff speak your languages',
}

const clamp01 = (n) => Math.min(1, Math.max(0, n))
const isVerified = (p) => p.verification.status === 'verified'

/**
 * Scores one provider for one patient.
 * Each factor returns a 0..1 sub-score and a reason with a tone:
 * 'good' (helps), 'neutral' (no evidence either way), or 'warn' (a drawback).
 *
 * @param {import('../../shared/models.js').Provider} provider
 * @param {import('../../shared/models.js').Patient} patient
 */
function scoreFactors(provider, patient) {
  const factors = {}

  // Loop closure: the share of referrals whose findings came back (O7).
  if (provider.loopClosureRate == null) {
    factors.loopClosure = {
      score: NO_HISTORY_LOOP_SCORE,
      reason: { text: 'No referral history yet', tone: 'neutral' },
    }
  } else {
    const pct = Math.round(provider.loopClosureRate * 100)
    factors.loopClosure = {
      score: clamp01(provider.loopClosureRate),
      reason: {
        text: `Sent findings back for ${pct}% of referrals`,
        tone: pct >= 75 ? 'good' : pct >= 50 ? 'neutral' : 'warn',
      },
    }
  }

  // Travel: closer is better; unknown distance scores 0 (B-3).
  if (typeof provider.distanceMiles !== 'number') {
    factors.travel = {
      score: 0,
      reason: { text: 'Distance unknown', tone: 'warn' },
    }
  } else {
    const miles = provider.distanceMiles
    factors.travel = {
      score: clamp01(1 - miles / MAX_TRAVEL_MILES),
      reason: {
        text: `${miles} mi from ${patient.location}`,
        tone: miles <= 40 ? 'good' : miles <= 90 ? 'neutral' : 'warn',
      },
    }
  }

  // Affordability: a scheme the patient holds is billed directly (A-14).
  const held = new Set(patient.schemeIds)
  const scheme = provider.acceptedSchemeIds.find((id) => held.has(id))
  const withinBudget = provider.consultFeeUsd <= patient.monthlyBudgetUsd
  if (scheme) {
    factors.affordability = {
      score: 1,
      reason: { text: `Accepts your ${schemeLabel(scheme)}`, tone: 'good' },
    }
  } else if (withinBudget) {
    factors.affordability = {
      score: 0.5,
      reason: { text: 'Doesn’t accept your scheme, but the fee fits your budget', tone: 'neutral' },
    }
  } else {
    factors.affordability = {
      score: 0,
      reason: { text: 'Doesn’t accept your scheme and the fee is over budget', tone: 'warn' },
    }
  }

  // Wait: shorter is better.
  const days = provider.waitDays
  factors.wait = {
    score: clamp01(1 - days / MAX_WAIT_DAYS),
    reason: {
      text: `Typical wait ${days} days`,
      tone: days <= 14 ? 'good' : days <= 30 ? 'neutral' : 'warn',
    },
  }

  // Language: share of the patient's languages the staff can consult in (A-9).
  const spoken = patient.languages.filter((l) => provider.languages.includes(l))
  const missing = patient.languages.filter((l) => !provider.languages.includes(l))
  factors.language = {
    score: patient.languages.length ? spoken.length / patient.languages.length : 1,
    reason:
      missing.length === 0
        ? { text: `Staff speak ${joinWords(spoken)}`, tone: 'good' }
        : { text: `No ${joinWords(missing)}-speaking staff`, tone: 'warn' },
  }

  return factors
}

/**
 * Ranks providers for a patient.
 * Verified providers are scored and sorted best first. Unverified providers are
 * never scored, so no amount of good data can lift them; they go last.
 *
 * @param {import('../../shared/models.js').Provider[]} providers  Already filtered by search
 * @param {import('../../shared/models.js').Patient} patient
 * @param {{ urgency?: 'emergency'|'within_days'|'within_weeks'|'routine' }} [options]
 * @returns {{ provider: object, score: number|null, reasons: {text: string, tone: string}[], factors: object|null }[]}
 */
export function rankProviders(providers, patient, { urgency = 'routine' } = {}) {
  const weights = urgency === 'within_days' ? URGENT_WEIGHTS : WEIGHTS

  const ranked = providers.map((provider) => {
    if (!isVerified(provider)) {
      return {
        provider,
        score: null,
        factors: null,
        reasons: [{ text: 'Not ranked: this provider could not be verified', tone: 'warn' }],
      }
    }

    const factors = scoreFactors(provider, patient)
    const score = Object.entries(weights).reduce(
      (sum, [key, w]) => sum + w * factors[key].score,
      0,
    )
    return { provider, score, factors, reasons: pickReasons(factors, weights) }
  })

  return ranked.sort((a, b) => {
    if ((a.score == null) !== (b.score == null)) return a.score == null ? 1 : -1
    if (a.score == null) return 0
    return b.score - a.score
  })
}

/**
 * Loop closure is always shown (PLAN §6 "Done when"). After that, the two
 * factors that add the most to the score, plus any drawback the patient should
 * know about, up to 4 reasons in total.
 */
function pickReasons(factors, weights) {
  const others = Object.keys(weights)
    .filter((k) => k !== 'loopClosure')
    .sort((a, b) => weights[b] * factors[b].score - weights[a] * factors[a].score)

  const keys = ['loopClosure', ...others.slice(0, 2)]
  const warning = others.slice(2).find((k) => factors[k].reason.tone === 'warn')
  if (warning) keys.push(warning)

  return keys.map((k) => factors[k].reason)
}

function schemeLabel(id) {
  return byId.scheme(id)?.name ?? id
}

function joinWords(words) {
  if (words.length <= 1) return words[0] ?? ''
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}
