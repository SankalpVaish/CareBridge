/**
 * Find & Trust — searches specialty providers by specialty, name, or service,
 * filters by trust, scheme, and travel distance, ranks the results with
 * reasons, and explains every trust warning. See TODO.md for what's left to
 * build (research questions B-1..B-14 in README.md).
 */
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader, Card } from '../../shared/ui.jsx'
import { providers, demoPatient, byId } from '../../data/mockData.js'
import { SPECIALTY_LABELS, URGENCY_LABELS } from '../../shared/models.js'
import { rankProviders } from './ranking.js'
import {
  searchProviders,
  matchedServices,
  isWithinTravel,
  nearestPrimaryCare,
} from './search.js'
import { TrustBadge, VerificationLine, WarningSigns } from './TrustPanel.jsx'
import HowWeRank from './HowWeRank.jsx'

const isVerified = (p) => p.verification.status === 'verified'
const hasKnownDistance = (p) => typeof p.distanceMiles === 'number'
const acceptsSchemeOf = (patient) => (p) =>
  p.acceptedSchemeIds.some((id) => patient.schemeIds.includes(id))

const TRAVEL_OPTIONS = [25, 50, 75, 100, 150, null] // null = any distance
const SEARCH_EXAMPLES = ['echocardiogram', 'mammography', 'oncology']

const REASON_STYLES = {
  good: { icon: '✓', className: 'text-green-700' },
  neutral: { icon: '•', className: 'text-slate-600' },
  warn: { icon: '!', className: 'text-amber-700' },
}

export default function FindPage() {
  const patient = demoPatient
  // Arriving from the symptom checker: /find?specialty=cardiology (O1 hand-off).
  const [searchParams] = useSearchParams()
  const fromCheck = searchParams.get('specialty')
  const urgencyParam = searchParams.get('urgency')
  const urgency = URGENCY_LABELS[urgencyParam] ? urgencyParam : 'routine'
  const [query, setQuery] = useState(fromCheck ?? 'cardiology')
  // On by default: unverified listings are hidden unless the user asks (PLAN §6, §9).
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [schemeOnly, setSchemeOnly] = useState(false)
  const [maxMiles, setMaxMiles] = useState(patient.maxTravelMiles ?? null)
  const [showHowWeRank, setShowHowWeRank] = useState(false)

  const view = useMemo(() => {
    const base = searchProviders(providers, query).filter(
      schemeOnly ? acceptsSchemeOf(patient) : () => true,
    )
    const inRange = base.filter((p) => isWithinTravel(p, maxMiles))
    const outOfRange = base.filter((p) => !isWithinTravel(p, maxMiles))

    // B3: nothing verified within range offers this, so widen to the
    // nearest verified providers further away.
    const widened = !inRange.some(isVerified) && outOfRange.some(isVerified)
    const candidates = widened ? [...inRange, ...outOfRange.filter(isVerified)] : inRange
    const shown = verifiedOnly ? candidates.filter(isVerified) : candidates

    return {
      results: rankProviders(shown, patient, { urgency }),
      widened,
      hiddenUnverified: candidates.length - shown.length,
      hiddenFar: widened ? 0 : outOfRange.length,
    }
  }, [query, verifiedOnly, schemeOnly, maxMiles, patient, urgency])

  const schemeNames = patient.schemeIds.map((id) => byId.scheme(id)?.name ?? id).join(', ')

  return (
    <div>
      <PageHeader
        title="Find & Trust"
        subtitle="Find the nearest centre that offers the care Maria needs, and check it’s legitimate."
        accent="find"
      />

      {fromCheck && <FromSymptomCheck specialty={fromCheck} urgency={urgencyParam} />}

      {/* Search controls */}
      <Card className="mb-5">
        <label className="block">
          <span className="sr-only">Search a specialty, test, treatment, or provider</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a specialty, test, or treatment (e.g. echocardiogram)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Try:{' '}
          {SEARCH_EXAMPLES.map((ex, i) => (
            <span key={ex}>
              {i > 0 && ', '}
              <button
                type="button"
                onClick={() => setQuery(ex)}
                className="font-medium text-brand-600 hover:underline"
              >
                {ex}
              </button>
            </span>
          ))}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            Travel up to
            <select
              value={maxMiles ?? 'any'}
              onChange={(e) =>
                setMaxMiles(e.target.value === 'any' ? null : Number(e.target.value))
              }
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            >
              {TRAVEL_OPTIONS.map((m) => (
                <option key={m ?? 'any'} value={m ?? 'any'}>
                  {m == null ? 'any distance' : `${m} mi`}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            Verified only
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={schemeOnly}
              onChange={(e) => setSchemeOnly(e.target.checked)}
            />
            Accepts my scheme ({schemeNames})
          </label>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Distances are from {patient.location} (Maria’s town). Ranked by
          evidence, never by payment.{' '}
          <button
            type="button"
            onClick={() => setShowHowWeRank(true)}
            className="font-medium text-brand-600 hover:underline"
          >
            How we rank
          </button>
          {' · '}
          <Link to="/find/safety" className="font-medium text-brand-600 hover:underline">
            How to spot a fake clinic
          </Link>
        </p>
        {view.hiddenUnverified > 0 && (
          <p className="mt-2 text-xs text-amber-700">
            {view.hiddenUnverified} unverified{' '}
            {view.hiddenUnverified === 1 ? 'listing is' : 'listings are'} hidden. Untick
            “Verified only” to see {view.hiddenUnverified === 1 ? 'it' : 'them'} with
            warnings.
          </p>
        )}
        {view.hiddenFar > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {view.hiddenFar} more {view.hiddenFar === 1 ? 'result is' : 'results are'}{' '}
            further than {maxMiles} mi.
          </p>
        )}
      </Card>

      {/* B3: not available nearby */}
      {view.widened && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            No verified provider within {maxMiles} mi offers “{query.trim()}”.
          </p>
          <p className="mt-1">
            We widened the search to the nearest verified centres further away.
            Ask your clinic about travel help and video follow-ups so you make
            fewer trips.
          </p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {view.results.map(({ provider: p, score, reasons }, i) => {
          const offers = matchedServices(p, query)
          const beyondLimit = maxMiles != null && hasKnownDistance(p) && p.distanceMiles > maxMiles
          return (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {score != null && (
                      <span className="text-sm font-semibold text-slate-400">#{i + 1}</span>
                    )}
                    <h2 className="font-semibold text-slate-900">{p.name}</h2>
                    <TrustBadge provider={p} />
                  </div>
                  <VerificationLine provider={p} />
                  <p className="mt-2 text-sm text-slate-600">
                    {p.specialties.join(', ')} · {p.location} ·{' '}
                    {hasKnownDistance(p) ? (
                      <span className={beyondLimit ? 'text-amber-700' : ''}>
                        {p.distanceMiles} mi{beyondLimit && ' (beyond your limit)'}
                      </span>
                    ) : (
                      <span className="text-red-700">distance unknown (no address)</span>
                    )}
                  </p>
                  {offers.length > 0 && (
                    <p className="mt-1 text-sm text-slate-600">Offers: {offers.join(', ')}</p>
                  )}
                  {/* No star ratings: they are easy to fake and not a ranking signal (X-6). */}
                  <p className="mt-1 text-sm text-slate-600">
                    Typical wait {p.waitDays} days
                    {p.offersTelehealth && ' · video follow-ups available'}
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

              <WarningSigns provider={p} />
            </Card>
          )
        })}
        {view.results.length === 0 && (
          <p className="text-sm text-slate-500">
            No providers in our list match. Try a wider travel distance or a
            different search, or start with a primary-care doctor, who can refer you.
          </p>
        )}
      </div>

      <HowWeRank open={showHowWeRank} onClose={() => setShowHowWeRank(false)} />
    </div>
  )
}

/**
 * Shown when the user came from the symptom checker. Every suggestion says to
 * see a primary-care doctor first, so the nearest verified one is shown here
 * (A-4: avoid going to the wrong provider first).
 */
function FromSymptomCheck({ specialty, urgency }) {
  const label = SPECIALTY_LABELS[specialty] ?? specialty
  const pcp = specialty === 'primary care' ? null : nearestPrimaryCare(providers)
  const soon = urgency === 'within_days'

  return (
    <Card className="mb-5 border-find/40 bg-find/5">
      <p className="text-sm text-slate-700">
        From your symptom check: <span className="font-semibold text-slate-900">{label}</span>
      </p>
      {URGENCY_LABELS[urgency] && (
        <p className="mt-1 text-sm text-slate-700">
          How soon:{' '}
          <span className={`font-semibold ${soon ? 'text-amber-700' : 'text-slate-900'}`}>
            {URGENCY_LABELS[urgency]}
          </span>
          {soon && ' · results favour shorter waits and less travel'}
        </p>
      )}
      {pcp && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <p className="font-medium text-slate-900">
            First step: see a primary-care doctor
          </p>
          <p className="mt-1 text-slate-600">
            Nearest verified: <span className="font-medium">{pcp.name}</span>, {pcp.location} (
            {pcp.distanceMiles} mi) · typical wait {pcp.waitDays} days. They can check you and
            send a referral if you need a specialist.
          </p>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">
        This is guidance, not a diagnosis. Your doctor decides whether you need a specialist.
      </p>
    </Card>
  )
}
