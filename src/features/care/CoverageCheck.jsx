/**
 * "Check my coverage" (A-13, A-14): the patient enters the member number from
 * their card and sees, for this visit, what the plan pays item by item, what
 * isn't covered, the deductible, the network, and what needs approval first.
 * Uses mock insurer records (coverageLookup.js).
 */
import { useState } from 'react'
import { Card, Badge, Button, money } from '../../shared/ui.jsx'
import { lookupCoverage, DEMO_MEMBER_IDS } from './coverageLookup.js'
import { applyCoverage, COST_ITEM_LABELS, isInNetwork } from './coverage.js'
import { formatDate } from '../find/registry.js'

/**
 * @param {Object} props
 * @param {object} props.provider     Where the visit would be
 * @param {Record<string, number>} props.items  Visit cost per item (visitCostItems)
 * @param {(found: ReturnType<typeof lookupCoverage>) => void} props.onFound  Called after each check with the active plan, or null
 */
export default function CoverageCheck({ provider, items, onFound }) {
  const [memberId, setMemberId] = useState('')
  const [found, setFound] = useState(undefined) // undefined = not checked, null = not found

  function check(id) {
    const result = lookupCoverage(id)
    setMemberId(id)
    setFound(result)
    // Each check replaces the last one; an ended or unknown plan adds nothing.
    onFound(result?.active ? result : null)
  }

  return (
    <Card className="lg:col-span-2">
      <h2 className="font-semibold text-slate-900">Check my coverage</h2>
      <p className="mt-1 text-sm text-slate-600">
        Enter the member number from your insurance or Medicaid card to see what
        it pays for a visit to {provider.name}.
      </p>

      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          check(memberId)
        }}
      >
        <label className="min-w-[12rem] flex-1">
          <span className="sr-only">Member number</span>
          <input
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="e.g. PHP-204-118"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <Button type="submit">Check</Button>
      </form>
      <p className="mt-2 text-xs text-slate-500">
        Demo cards:{' '}
        {DEMO_MEMBER_IDS.map((d, i) => (
          <span key={d.memberId}>
            {i > 0 && ' · '}
            <button
              type="button"
              onClick={() => check(d.memberId)}
              className="font-medium text-brand-600 hover:underline"
            >
              {d.label}
            </button>
          </span>
        ))}
      </p>

      {found === null && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800" role="status">
          We couldn’t find that member number. Check it against your card, or call
          the number on the back of the card.
        </p>
      )}
      {found && !found.active && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="status">
          <span className="font-medium">{found.scheme.name}</span> coverage ended on{' '}
          {formatDate(found.record.coveredThrough)}. It won’t pay for visits now. See
          “Help paying for care” below for other options.
        </p>
      )}
      {found?.active && <CoverageResult found={found} provider={provider} items={items} />}

      <p className="mt-3 text-xs text-slate-500">
        Demo lookup with made-up plans. A real version would ask you to log in to
        your insurer and agree to share your coverage.
      </p>
    </Card>
  )
}

function CoverageResult({ found, provider, items }) {
  const { scheme, record } = found
  const plan = scheme.plan
  // This plan on its own, before any other help.
  const { lines: allLines, paidUsd } = applyCoverage(scheme, { ...items }, {
    provider,
    deductibleMetUsd: record.deductibleMetUsd,
  })
  // Hide covered items that cost nothing on this visit (e.g. no treatment yet).
  const lines = allLines.filter((l) => l.costUsd > 0)
  const notCovered = Object.entries(items).filter(
    ([item, cost]) => cost > 0 && !scheme.covers.includes(item),
  )
  const coveredTotal = lines.reduce((a, l) => a + l.costUsd, 0)
  const network = scheme.billedByProvider ? isInNetwork(scheme, provider) : true
  const preauth = (plan?.preauthItems ?? []).filter((i) => scheme.covers.includes(i))

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-slate-900">
          {scheme.name} · {record.memberName}
        </p>
        <Badge tone="green">Active until {formatDate(record.coveredThrough)}</Badge>
      </div>

      <p className={`mt-2 text-sm ${network ? 'text-green-700' : 'text-amber-700'}`}>
        {network
          ? `✓ ${provider.name} is in network.`
          : plan && plan.outOfNetworkCoveragePct > 0
            ? `! ${provider.name} is out of network. The plan pays only ${plan.outOfNetworkCoveragePct}% after the deductible.`
            : `✗ ${provider.name} is out of network. This plan pays nothing there.`}
      </p>

      {plan && (
        <p className="mt-1 text-sm text-slate-600">
          Deductible: {money(record.deductibleMetUsd)} of {money(plan.deductibleUsd)} paid
          this year, {money(Math.max(0, plan.deductibleUsd - record.deductibleMetUsd))} left.
          {plan.consultCopayUsd != null && ` Specialist visit copay: ${money(plan.consultCopayUsd)}.`}
        </p>
      )}

      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="py-1 font-medium">This visit</th>
            <th className="py-1 text-right font-medium">Cost</th>
            <th className="py-1 text-right font-medium">Plan pays</th>
            <th className="py-1 text-right font-medium">Left for you</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.item} className="border-t border-slate-100 align-top">
              <td className="py-1.5 text-slate-700">
                {COST_ITEM_LABELS[l.item]}
                <span className="block text-xs text-slate-500">{l.note}</span>
              </td>
              <td className="py-1.5 text-right">{money(l.costUsd)}</td>
              <td className="py-1.5 text-right text-green-700">{money(l.schemePaysUsd)}</td>
              <td className="py-1.5 text-right">{money(l.youPayUsd)}</td>
            </tr>
          ))}
          <tr className="border-t border-slate-200 font-medium">
            <td className="py-1.5">Covered items</td>
            <td className="py-1.5 text-right">{money(coveredTotal)}</td>
            <td className="py-1.5 text-right text-green-700">{money(paidUsd)}</td>
            <td className="py-1.5 text-right">{money(coveredTotal - paidUsd)}</td>
          </tr>
        </tbody>
      </table>

      {notCovered.length > 0 && (
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium">Not covered by this plan:</span>{' '}
          {notCovered.map(([item, cost]) => `${COST_ITEM_LABELS[item]} (${money(cost)})`).join(', ')}.
          Other help below may pay for these.
        </p>
      )}

      {network && preauth.length > 0 && (
        <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-800">
          Needs approval first: {preauth.map((i) => COST_ITEM_LABELS[i]).join(', ')}. Ask your
          doctor’s office to get approval from the plan before these, or it may not pay.
        </p>
      )}

      <p className="mt-2 text-xs text-slate-500">
        The cost estimate above includes this {plan ? 'plan. Insurance pays first, then Medicaid and other help.' : 'coverage.'}
      </p>
    </div>
  )
}
