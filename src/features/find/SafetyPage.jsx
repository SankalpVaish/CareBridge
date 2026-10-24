/**
 * Safety (screen B5): warning signs of healthcare fraud, a registry lookup,
 * and the listings we have flagged (B-9 to B-12).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Card, Button } from '../../shared/ui.jsx'
import { providers } from '../../data/mockData.js'
import { WARNING_SIGNS, trustCheck } from './trust.js'
import { lookupLicense } from './registry.js'
import { TrustBadge, WarningSigns, LookupResult } from './TrustPanel.jsx'

export default function SafetyPage() {
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState(null)
  const flagged = providers.filter((p) => trustCheck(p).level === 'flagged')

  return (
    <div>
      <PageHeader
        title="Stay safe"
        subtitle="How to spot a fake doctor or clinic before you travel or pay."
        accent="find"
      />
      <p className="-mt-3 mb-5 text-sm">
        <Link to="/find" className="font-medium text-brand-600 hover:underline">
          ← Back to Find & Trust
        </Link>
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-slate-900">Warning signs</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {Object.entries(WARNING_SIGNS).map(([code, s]) => (
              <li key={code}>
                <p className="font-medium text-slate-900">{s.title}</p>
                <p className="text-slate-600">{s.why}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900">Check a license</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter a license number or a provider’s name.
          </p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setRecords(lookupLicense(query))
            }}
          >
            <label className="flex-1">
              <span className="sr-only">License number or provider name</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. MD-118734"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <Button type="submit">Check</Button>
          </form>
          {records && (
            <div className="mt-3 text-sm">
              <LookupResult records={records} />
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Demo registry. A real version would check the State Medical Board,
            the state hospital license registry, or the NPI Registry.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Flagged listings</h2>
          <div className="mt-3 space-y-4">
            {flagged.map((p) => (
              <div key={p.id} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{p.name}</p>
                  <TrustBadge provider={p} />
                </div>
                <p className="text-sm text-slate-600">
                  {p.specialties.join(', ')} · {p.location}
                </p>
                <WarningSigns provider={p} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
