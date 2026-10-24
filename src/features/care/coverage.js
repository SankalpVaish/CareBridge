/**
 * What a scheme pays for one visit, item by item (O5, O6, A-11, A-13, A-14).
 * Handles both programmes that pay a flat share (e.g. Medicaid 80%) and
 * private insurance plans with a deductible, copay, coinsurance, and network.
 * Pure module, no React.
 */

export const COST_ITEM_LABELS = {
  consult: 'Consultation',
  tests: 'Tests',
  travel: 'Travel',
  lodging: 'Lodging',
  lostWages: 'Lost wages',
}

/**
 * Whether the provider is in the scheme's network. Private plans list their
 * network; other schemes use the provider's accepted list.
 */
export function isInNetwork(scheme, provider) {
  if (scheme.plan) return scheme.plan.inNetworkProviderIds.includes(provider.id)
  return provider.acceptedSchemeIds.includes(scheme.id)
}

/** True when the scheme pays anything at all at this provider. */
export function paysAtProvider(scheme, provider) {
  if (!scheme.billedByProvider) return true
  if (isInNetwork(scheme, provider)) return true
  return Boolean(scheme.plan && scheme.plan.outOfNetworkCoveragePct > 0)
}

/**
 * @typedef {Object} CoverageLine
 * @property {string} item           CostItem key
 * @property {number} costUsd        What was still unpaid before this scheme
 * @property {number} schemePaysUsd
 * @property {number} youPayUsd      What's left after this scheme (other help may still pay part)
 * @property {string} note           Plain explanation, e.g. "$40 copay"
 */

/**
 * Applies one scheme to the unpaid amounts. `remaining` is mutated.
 *
 * @param {import('../../shared/models.js').Scheme} scheme
 * @param {Record<string, number>} remaining  Unpaid amount per cost item
 * @param {{ provider?: object, deductibleMetUsd?: number }} [opts]
 * @returns {{ paidUsd: number, lines: CoverageLine[], inNetwork: boolean, deductibleLeftUsd: number|null }}
 */
export function applyCoverage(scheme, remaining, { provider, deductibleMetUsd = 0 } = {}) {
  const inNetwork = provider ? isInNetwork(scheme, provider) : true
  const lines = []
  let paidUsd = 0

  const record = (item, cost, pays, note) => {
    remaining[item] = cost - pays
    paidUsd += pays
    lines.push({ item, costUsd: cost, schemePaysUsd: pays, youPayUsd: cost - pays, note })
  }

  // Programmes that pay a flat share, with an optional cap.
  if (!scheme.plan) {
    const cap = scheme.maxAmountUsd ?? Infinity
    for (const item of scheme.covers) {
      const cost = remaining[item] ?? 0
      const pays = Math.min(Math.round((cost * scheme.coveragePct) / 100), cap - paidUsd)
      record(item, cost, pays, `${scheme.coveragePct}% covered`)
    }
    return { paidUsd, lines, inNetwork, deductibleLeftUsd: null }
  }

  // Private insurance plan.
  const plan = scheme.plan
  let deductibleLeft = Math.max(0, plan.deductibleUsd - deductibleMetUsd)
  for (const item of scheme.covers) {
    const cost = remaining[item] ?? 0
    if (cost === 0) continue

    if (!inNetwork && plan.outOfNetworkCoveragePct === 0) {
      record(item, cost, 0, 'Out of network: not covered')
      continue
    }
    if (inNetwork && item === 'consult' && plan.consultCopayUsd != null) {
      const copay = Math.min(cost, plan.consultCopayUsd)
      record(item, cost, cost - copay, `$${copay} copay`)
      continue
    }

    const toDeductible = Math.min(cost, deductibleLeft)
    deductibleLeft -= toDeductible
    const rest = cost - toDeductible
    const planShare = inNetwork ? 100 - plan.coinsurancePct : plan.outOfNetworkCoveragePct
    const pays = Math.round((rest * planShare) / 100)

    const parts = []
    if (!inNetwork) parts.push('Out of network')
    if (toDeductible > 0) parts.push(`$${toDeductible} goes toward your deductible`)
    if (rest > 0) parts.push(`you pay ${100 - planShare}% of the rest`)
    record(item, cost, pays, parts.join('; '))
  }
  return { paidUsd, lines, inNetwork, deductibleLeftUsd: deductibleLeft }
}
