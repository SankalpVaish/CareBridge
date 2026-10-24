/**
 * Provider profile (screen B2): trust details, what the provider offers, the
 * trip, and the doctors who treat what the patient searched for, with an
 * evidence-based reputation for each (B-2, B-10, B-14, X-6).
 *
 * Route: /find/provider/:id?service=<what was searched>
 */
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader, Card, Badge } from '../../shared/ui.jsx'
import { byId, demoPatient } from '../../data/mockData.js'
import { trustCheck } from './trust.js'
import { TrustBadge, VerificationLine, WarningSigns, LookupResult } from './TrustPanel.jsx'
import { lookupLicense, formatDate } from './registry.js'
import { doctorsFor, findingsRate, FEW_VISITS } from './doctors.js'
import { useLoopStats, withLoopStats } from './loopStats.js'
import TripPlan from './TripPlan.jsx'

export default function ProviderPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const service = params.get('service') ?? ''
  const loop = useLoopStats()

  const base = byId.provider(id)
  if (!base) {
    return (
      <Card>
        <p className="text-slate-700">We couldn’t find that provider.</p>
        <Link to="/find" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">
          ← Back to Find & Trust
        </Link>
      </Card>
    )
  }
  const [provider] = withLoopStats([base], loop.stats)
  const patient = demoPatient
  const trust = trustCheck(provider)
  const backTo = service ? `/find?q=${encodeURIComponent(service)}` : '/find'
  const matchesService = (s) => service && s.toLowerCase().includes(service.toLowerCase())

  return (
    <div>
      <p className="mb-3 text-sm">
        <Link to={backTo} className="font-medium text-brand-600 hover:underline">
          ← Back to results
        </Link>
      </p>
      <PageHeader title={provider.name} subtitle={`${provider.location} · ${provider.type}`} accent="find" />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Trust and facts */}
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <TrustBadge provider={provider} />
            {provider.hasEmergencyDepartment && <Badge tone="red">Emergency department</Badge>}
          </div>
          <VerificationLine provider={provider} />

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Fact label="Offers">
              {provider.services.map((s, i) => (
                <span key={s}>
                  {i > 0 && ', '}
                  <span className={matchesService(s) ? 'font-semibold text-find' : ''}>{s}</span>
                </span>
              ))}
            </Fact>
            <Fact label="Accepts">
              {provider.acceptedSchemeIds.length > 0
                ? provider.acceptedSchemeIds.map((s) => byId.scheme(s)?.name ?? s).join(', ')
                : 'No schemes'}
            </Fact>
            <Fact label="Typical wait">{provider.waitDays} days</Fact>
            <Fact label="Languages">{provider.languages.join(', ') || 'Not listed'}</Fact>
            <Fact label="Findings sent back to the referring clinic">
              {provider.loopCounts
                ? `${provider.loopCounts.returned} of ${provider.loopCounts.seen} referred patients`
                : provider.loopClosureRate != null
                  ? `${Math.round(provider.loopClosureRate * 100)}% of referrals`
                  : 'No referral history yet'}
            </Fact>
            <Fact label="Video follow-ups">{provider.offersTelehealth ? 'Yes' : 'No'}</Fact>
          </dl>

          <WarningSigns provider={provider} />
        </Card>

        {/* Trip */}
        <Card>
          <h2 className="font-semibold text-slate-900">Getting there</h2>
          <div className="mt-2">
            {trust.level === 'verified' ? (
              <TripPlan patient={patient} provider={provider} />
            ) : (
              <p className="text-sm text-slate-500">
                We don’t plan trips to listings we couldn’t verify.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Doctors */}
      {trust.level === 'verified' ? (
        <Doctors provider={provider} service={service} onService={(s) => setParams(s ? { service: s } : {})} />
      ) : (
        <Card className="mt-5">
          <p className="text-sm text-slate-600">
            We don’t list doctors for a provider we couldn’t verify. See the warning signs above.
          </p>
        </Card>
      )}
    </div>
  )
}

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-slate-800">{children}</dd>
    </div>
  )
}

/** Doctors at this provider, filtered by treatment, with reputation (B-14). */
function Doctors({ provider, service, onService }) {
  const list = doctorsFor(provider.id, service)
  const treating = list.filter((d) => d.treatsService)
  const shown = service && treating.length > 0 ? treating : list
  const others = service && treating.length > 0 ? list.length - treating.length : 0
  // The dropdown shows the exact service when the search names one.
  const selected =
    provider.services.find((s) => s.toLowerCase() === service.trim().toLowerCase()) ?? ''

  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {service && treating.length > 0 ? `Doctors who do ${service}` : 'Doctors'}
          </h2>
          <p className="text-sm text-slate-600">
            Reputation from evidence: a checked license, how many patients they treated, whether
            findings went back to the clinic, and feedback only from patients whose referral was
            completed. No star ratings or paid reviews.
          </p>
        </div>
        {/* Filter by treatment */}
        <label className="text-sm text-slate-700">
          <span className="mr-2">Treatment</span>
          <select
            value={selected}
            onChange={(e) => onService(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All treatments</option>
            {provider.services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {service && treating.length === 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          No doctor here is listed for “{service}”. Showing everyone at {provider.name}.
        </p>
      )}

      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No doctors listed for this provider yet.</p>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {shown.map((d) => (
            <DoctorCard key={d.doctor.id} entry={d} service={service} />
          ))}
        </div>
      )}
      {others > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          {others} other {others === 1 ? 'doctor works' : 'doctors work'} here.{' '}
          <button type="button" onClick={() => onService('')} className="font-medium text-brand-600 hover:underline">
            Show everyone
          </button>
        </p>
      )}
    </section>
  )
}

function DoctorCard({ entry, service }) {
  const { doctor: d, matched, cases } = entry
  const [lookup, setLookup] = useState(null)
  const rate = findingsRate(d)
  const fb = d.feedback
  const few = fb.verifiedVisits < FEW_VISITS

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">
            {d.name}, {d.credentials}
          </p>
          <p className="text-sm text-slate-600">{d.role}</p>
        </div>
        {d.license.status === 'verified' ? (
          <Badge tone="green">✓ License checked</Badge>
        ) : (
          <Badge tone="red">⚠ License not confirmed</Badge>
        )}
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {d.license.registry} · {d.license.licenseId} · checked {formatDate(d.license.checkedOn)}{' '}
        <button
          type="button"
          onClick={() => setLookup(lookupLicense(d.license.licenseId))}
          className="font-medium text-brand-600 hover:underline"
        >
          Check registry
        </button>
      </p>
      {lookup && (
        <div className="text-xs">
          <LookupResult records={lookup} />
        </div>
      )}

      {/* Experience with the searched treatment */}
      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        {matched.length > 0 && (
          <li className="font-medium text-find">
            ✓ Treated {cases.toLocaleString('en-US')} patients for {matched.join(', ')} in the last year
          </li>
        )}
        <li>
          {d.boardCertification ? `Board certified: ${d.boardCertification}` : 'Not board certified'}
        </li>
        <li>{d.yearsInPractice} years in practice · speaks {d.languages.join(', ')}</li>
        {rate != null && (
          <li>
            Sent findings back for {d.referrals.findingsReturned} of {d.referrals.seen} referred patients
            ({Math.round(rate * 100)}%)
          </li>
        )}
        {d.offersTelehealth && <li>Offers video follow-ups</li>}
        <li className="text-xs text-slate-500">Treats: {d.treats.join(', ')}</li>
      </ul>

      {/* Feedback from completed referrals only */}
      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
        <p className="text-xs font-medium text-slate-500">
          From {fb.verifiedVisits} patients with a completed referral
          {few && ' · few visits so far, so treat these numbers with care'}
        </p>
        <p className="mt-1 text-slate-800">
          {fb.wouldRecommendPct}% would recommend · {fb.explainedClearlyPct}% said things were
          explained clearly
        </p>
        {fb.comments.length > 0 && (
          <ul className="mt-2 space-y-1 text-slate-600">
            {fb.comments.map((c) => (
              <li key={c} className="italic">
                “{c}”
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
