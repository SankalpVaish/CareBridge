/**
 * "Help paying for care" (O6, A-13..A-16): every scheme with whether the
 * patient qualifies and why, what it saves at this visit, how to apply, and
 * which documents are still missing.
 */
import { Card, Badge, money } from '../../shared/ui.jsx'

const STATUS_BADGES = {
  enrolled: { tone: 'green', label: 'Enrolled' },
  eligible: { tone: 'blue', label: 'You qualify' },
  maybe: { tone: 'amber', label: 'You may qualify' },
  not_here: { tone: 'slate', label: 'Not at this provider' },
  not_eligible: { tone: 'slate', label: 'Doesn’t fit you' },
}

const KIND_LABELS = {
  insurance: 'Insurance',
  government: 'Government programme',
  charity: 'Charity / aid',
}

/**
 * @param {Object} props
 * @param {ReturnType<import('./aid.js').matchAid>} props.matches
 * @param {import('../../shared/models.js').CostEstimate} props.estimate
 * @param {import('../../shared/models.js').Provider} props.provider
 */
export default function AidPanel({ matches, estimate, provider }) {
  const paid = Object.fromEntries(
    [...estimate.coveredBy, ...estimate.couldSave].map((c) => [c.schemeId, c.amountUsd]),
  )
  const useful = matches.filter((m) => m.status !== 'not_eligible')
  const notForYou = matches.filter((m) => m.status === 'not_eligible')

  return (
    <Card className="lg:col-span-2">
      <h2 className="font-semibold text-slate-900">Help paying for care</h2>
      <p className="mt-1 text-sm text-slate-600">
        What Maria already has, what she qualifies for, and how to apply. Savings
        are for a visit to {provider.name}.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {useful.map((m) => (
          <SchemeCard key={m.scheme.id} match={m} savedUsd={paid[m.scheme.id] ?? 0} />
        ))}
      </div>

      {notForYou.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Not for Maria right now ({notForYou.length})
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {notForYou.map((m) => (
              <SchemeCard key={m.scheme.id} match={m} savedUsd={0} />
            ))}
          </div>
        </details>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Demo programmes with simplified rules. Always confirm with the programme
        before you rely on it.
      </p>
    </Card>
  )
}

function SchemeCard({ match, savedUsd }) {
  const { scheme, status, reasons, missingDocs } = match
  const badge = STATUS_BADGES[status]
  const canApply = status === 'eligible' || status === 'maybe' || status === 'not_here'

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{scheme.name}</p>
          <p className="text-xs text-slate-500">{KIND_LABELS[scheme.kind]}</p>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-600">{scheme.notes}</p>

      <SavingLine status={status} savedUsd={savedUsd} />

      {/* Why (A-15) */}
      <ul className="mt-2 space-y-1 text-sm">
        {reasons.map((r) => (
          <li key={r.text} className="flex gap-2">
            <span
              aria-hidden="true"
              className={`w-3 text-center font-semibold ${
                r.met === true ? 'text-green-700' : r.met === false ? 'text-slate-500' : 'text-amber-700'
              }`}
            >
              {r.met === true ? '✓' : r.met === false ? '✗' : '?'}
            </span>
            <span className={r.met === false ? 'text-slate-500' : 'text-slate-700'}>
              <span className="sr-only">
                {r.met === true ? 'Met: ' : r.met === false ? 'Not met: ' : 'Unknown: '}
              </span>
              {r.text}
              {r.yours && <span className="text-slate-500"> · {r.yours}</span>}
              {r.met === null && r.needed && (
                <span className="text-amber-700"> · we need {r.needed}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {canApply && <HowToApply scheme={scheme} missingDocs={missingDocs} />}
      {status === 'enrolled' && (
        <p className="mt-2 text-xs text-slate-500">Bring: {scheme.requiredDocs.join(', ')}</p>
      )}
    </div>
  )
}

function SavingLine({ status, savedUsd }) {
  if (status === 'enrolled') {
    return savedUsd > 0 ? (
      <p className="mt-2 text-sm font-medium text-green-700">Pays about {money(savedUsd)} of this visit</p>
    ) : (
      <p className="mt-2 text-sm text-slate-500">Doesn’t pay for this visit</p>
    )
  }
  if (status === 'eligible') {
    return savedUsd > 0 ? (
      <p className="mt-2 text-sm font-medium text-brand-700">
        Could save about {money(savedUsd)} on this visit
      </p>
    ) : (
      <p className="mt-2 text-sm text-slate-500">
        Nothing left for it to pay on this visit (other help already covers it)
      </p>
    )
  }
  return null
}

/** Steps, where, contact, wait, and a document checklist (A-16). */
function HowToApply({ scheme, missingDocs }) {
  const h = scheme.howToApply
  return (
    <details className="mt-3 rounded-lg bg-slate-50 p-2 text-sm">
      <summary className="cursor-pointer font-medium text-brand-700">How to apply</summary>
      {h.steps.length > 0 && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
          {h.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
      <div className="mt-2 space-y-0.5 text-xs text-slate-600">
        {h.where && <p><span className="font-medium">Where:</span> {h.where}</p>}
        {h.contact && <p><span className="font-medium">Contact:</span> {h.contact}</p>}
        {h.typicalWait && <p><span className="font-medium">How long:</span> {h.typicalWait}</p>}
      </div>
      {scheme.requiredDocs.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-slate-700">Documents</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {scheme.requiredDocs.map((d) => {
              const missing = missingDocs.includes(d)
              return (
                <li key={d} className={missing ? 'text-amber-700' : 'text-green-700'}>
                  {missing ? '✗' : '✓'} {d}
                  {missing ? ' · you still need this' : ' · you have this'}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </details>
  )
}
