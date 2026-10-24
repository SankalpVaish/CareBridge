/**
 * Find & Trust — lists specialty providers from the shared mock data, lets the
 * user search/filter, and flags whether each is verified (fraud check). See
 * TODO.md for what's left to build (research questions B-1..B-14 in README.md).
 */
import { useMemo, useState } from 'react'
import { PageHeader, Card, Badge } from '../../shared/ui.jsx'
import { providers, demoPatient } from '../../data/mockData.js'
import { rankProviders } from './ranking.js'
import HowWeRank from './HowWeRank.jsx'

const isVerified = (p) => p.verification.status === 'verified'
const hasKnownDistance = (p) => typeof p.distanceMiles === 'number'

const REASON_STYLES = {
  good: { icon: '✓', className: 'text-green-700' },
  neutral: { icon: '•', className: 'text-slate-600' },
  warn: { icon: '!', className: 'text-amber-700' },
}

export default function FindPage() {
  const [query, setQuery] = useState('cardiology')
  // On by default: unverified listings are hidden unless the user asks (PLAN §6, §9).
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [showHowWeRank, setShowHowWeRank] = useState(false)

  const { results, hiddenCount } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = providers
      .filter((p) => p.specialties.some((s) => s !== 'primary care'))
      .filter((p) =>
        q === ''
          ? true
          : p.name.toLowerCase().includes(q) ||
            p.specialties.some((s) => s.includes(q)),
      )
    const shown = verifiedOnly ? matches.filter(isVerified) : matches
    return {
      results: rankProviders(shown, demoPatient),
      hiddenCount: matches.length - shown.length,
    }
  }, [query, verifiedOnly])

  return (
    <div>
      <PageHeader
        title="Find & Trust"
        subtitle="Discover specialists near Maria, compare them, and check they’re legitimate."
        accent="find"
      />

      {/* Search controls */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex-1">
            <span className="sr-only">Search specialty or provider</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search specialty or provider (e.g. cardiology)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            Verified only
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Distances are from {demoPatient.location} (Maria’s town). Ranked by
          evidence, never by payment.{' '}
          <button
            type="button"
            onClick={() => setShowHowWeRank(true)}
            className="font-medium text-brand-600 hover:underline"
          >
            How we rank
          </button>
        </p>
        {verifiedOnly && hiddenCount > 0 && (
          <p className="mt-2 text-xs text-amber-700">
            {hiddenCount} unverified {hiddenCount === 1 ? 'listing is' : 'listings are'}{' '}
            hidden. Untick “Verified only” to see {hiddenCount === 1 ? 'it' : 'them'} with
            warnings.
          </p>
        )}
      </Card>

      {/* Results */}
      <div className="space-y-3">
        {results.map(({ provider: p, score, reasons }, i) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {score != null && (
                    <span className="text-sm font-semibold text-slate-400">#{i + 1}</span>
                  )}
                  <h2 className="font-semibold text-slate-900">{p.name}</h2>
                  {isVerified(p) ? (
                    <Badge tone="green">✓ Verified</Badge>
                  ) : (
                    <Badge tone="red">⚠ Unverified</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {p.specialties.join(', ')} · {p.location} ·{' '}
                  {hasKnownDistance(p) ? (
                    `${p.distanceMiles} mi`
                  ) : (
                    <span className="text-red-700">distance unknown (no address)</span>
                  )}
                </p>
                {/* No star ratings: they are easy to fake and not a ranking signal (X-6). */}
                <p className="mt-1 text-sm text-slate-600">
                  Typical wait {p.waitDays} days
                  {p.offersTelehealth && ' · telehealth available'}
                </p>
              </div>
              <div className="text-right">
                {score != null && (
                  <>
                    <p className="text-sm font-semibold text-slate-900">
                      {Math.round(score * 100)}/100
                    </p>
                    <p className="text-xs text-slate-500">match score</p>
                  </>
                )}
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  ${p.consultFeeUsd}
                </p>
                <p className="text-xs text-slate-500">consult fee</p>
              </div>
            </div>

            {/* Why it is ranked here (B-13, B-14) */}
            <ul className="mt-3 space-y-1 text-sm">
              {reasons.map((r) => {
                const style = REASON_STYLES[r.tone] ?? REASON_STYLES.neutral
                return (
                  <li key={r.text} className={`flex gap-2 ${style.className}`}>
                    <span aria-hidden="true" className="w-3 text-center font-semibold">
                      {style.icon}
                    </span>
                    {r.text}
                  </li>
                )
              })}
            </ul>

            {p.fraudSignals.length > 0 && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">Why this is flagged</p>
                <ul className="mt-1 list-disc pl-5">
                  {p.fraudSignals.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p className="mt-2">Don’t pay upfront.</p>
              </div>
            )}
          </Card>
        ))}
        {results.length === 0 && (
          <p className="text-sm text-slate-500">No providers match that search.</p>
        )}
      </div>

      <HowWeRank open={showHowWeRank} onClose={() => setShowHowWeRank(false)} />
    </div>
  )
}
