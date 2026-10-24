/**
 * Find & Trust — lists specialty providers from the shared mock data, lets the
 * user search/filter, and flags whether each is verified (fraud check). See
 * TODO.md for what's left to build (research questions B-1..B-14 in README.md).
 */
import { useMemo, useState } from 'react'
import { PageHeader, Card, Badge } from '../../shared/ui.jsx'
import { providers, demoPatient } from '../../data/mockData.js'

const isVerified = (p) => p.verification.status === 'verified'

export default function FindPage() {
  const [query, setQuery] = useState('cardiology')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return providers
      .filter((p) => p.specialties.some((s) => s !== 'primary care'))
      .filter((p) =>
        q === ''
          ? true
          : p.name.toLowerCase().includes(q) ||
            p.specialties.some((s) => s.includes(q)),
      )
      .filter((p) => (verifiedOnly ? isVerified(p) : true))
      .sort((a, b) => a.distanceMiles - b.distanceMiles)
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
          Distances are from {demoPatient.location} (Maria’s town).
        </p>
      </Card>

      {/* Results */}
      <div className="space-y-3">
        {results.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{p.name}</h2>
                  {isVerified(p) ? (
                    <Badge tone="green">✓ Verified</Badge>
                  ) : (
                    <Badge tone="red">⚠ Unverified</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {p.specialties.join(', ')} · {p.location} · {p.distanceMiles} mi
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  ★ {p.rating.toFixed(1)} ({p.reviewCount} reviews) · wait{' '}
                  {p.waitDays} days
                  {p.offersTelehealth && ' · telehealth available'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  ${p.consultFeeUsd}
                </p>
                <p className="text-xs text-slate-500">consult fee</p>
              </div>
            </div>

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

    </div>
  )
}
