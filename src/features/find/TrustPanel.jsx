/**
 * Trust UI shared by the Find results and the Safety page (B-9 to B-12).
 */
import { useState } from 'react'
import { Badge } from '../../shared/ui.jsx'
import { trustCheck, isReported, reportListing } from './trust.js'
import { lookupLicense, formatDate } from './registry.js'

const LEVEL_BADGES = {
  verified: { tone: 'green', label: '✓ Verified' },
  caution: { tone: 'amber', label: 'License not checked' },
  flagged: { tone: 'red', label: '⚠ Flagged' },
}

export function TrustBadge({ provider }) {
  const { level } = trustCheck(provider)
  const b = LEVEL_BADGES[level]
  return <Badge tone={b.tone}>{b.label}</Badge>
}

/**
 * Where the license was checked, with a button that re-checks it against the
 * (mock) registry and shows the record found.
 */
export function VerificationLine({ provider }) {
  const v = provider.verification
  const [lookup, setLookup] = useState(null) // null = not run yet

  const statusText = {
    verified: 'License confirmed',
    not_found: 'No license found',
    expired: 'License expired',
    unchecked: 'Not checked yet',
  }[v.status]

  return (
    <div className="mt-1 text-xs text-slate-500">
      <span>
        {statusText}
        {v.registry && ` · ${v.registry}`}
        {v.licenseId && ` · ${v.licenseId}`}
        {v.checkedOn && ` · checked ${formatDate(v.checkedOn)}`}
      </span>{' '}
      <button
        type="button"
        onClick={() => setLookup(lookupLicense(v.licenseId ?? provider.name))}
        className="font-medium text-brand-600 hover:underline"
      >
        Check registry
      </button>
      {lookup && <LookupResult records={lookup} />}
    </div>
  )
}

export function LookupResult({ records }) {
  if (records.length === 0) {
    return (
      <p className="mt-1 rounded bg-red-50 px-2 py-1 text-red-800">
        No matching license in the registry.
      </p>
    )
  }
  return (
    <ul className="mt-1 space-y-1">
      {records.map((r) => (
        <li
          key={r.licenseId}
          className={`rounded px-2 py-1 ${
            r.status === 'active' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {r.name} · {r.registry} · {r.licenseId} ·{' '}
          {r.status === 'active'
            ? `active until ${formatDate(r.expiresOn)}`
            : `expired ${formatDate(r.expiresOn)}`}
        </li>
      ))}
    </ul>
  )
}

/** Each warning sign with why it matters, plus a report button. */
export function WarningSigns({ provider }) {
  const { signs } = trustCheck(provider)
  if (signs.length === 0) return null

  return (
    <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
      <p className="font-medium">Why this is flagged</p>
      <ul className="mt-2 space-y-2">
        {signs.map((s) => (
          <li key={s.code}>
            <p className="font-medium">{s.title}</p>
            {s.why && <p className="text-red-700">{s.why}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-3 font-medium">
        Don’t pay upfront. Ask your clinic or health worker before you go.
      </p>
      <ReportButton providerId={provider.id} />
    </div>
  )
}

export function ReportButton({ providerId }) {
  const [reported, setReported] = useState(() => isReported(providerId))
  if (reported) {
    return <p className="mt-2 text-xs text-red-700">Thanks. You reported this listing.</p>
  }
  return (
    <button
      type="button"
      onClick={() => {
        reportListing(providerId)
        setReported(true)
      }}
      className="mt-2 rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
    >
      Report this listing
    </button>
  )
}
