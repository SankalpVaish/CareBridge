/**
 * Coordinate — shows Maria’s referral moving through its stages, what info is
 * still missing, and travel/telehealth options. See TODO.md for what's left to
 * build (research questions C-1..C-25 in README.md).
 */
import { useState } from 'react'
import { PageHeader, Card, Badge, Button } from '../../shared/ui.jsx'
import {
  referrals,
  byId,
  demoPatient,
} from '../../data/mockData.js'
import { REFERRAL_STATUS_LABELS } from '../../shared/models.js'

// Ordered pipeline so we can show progress (ties to O11, C-1..C-4).
const PIPELINE = [
  'requested',
  'info_sent',
  'accepted',
  'scheduled',
  'seen',
  'followed_up',
]

export default function CoordinatePage() {
  const initial = referrals[0]
  const [status, setStatus] = useState(initial.status)

  const from = byId.provider(initial.fromProviderId)
  const to = byId.provider(initial.toProviderId)
  const currentIndex = PIPELINE.indexOf(status)

  function advance() {
    const next = PIPELINE[Math.min(currentIndex + 1, PIPELINE.length - 1)]
    setStatus(next)
  }

  return (
    <div>
      <PageHeader
        title="Coordinate"
        subtitle="Keep Maria’s referral, scheduling, travel, and care teams in sync."
        accent="coordinate"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Referral pipeline */}
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Referral</h2>
            <Badge tone={status === 'stalled' ? 'red' : 'blue'}>
              {REFERRAL_STATUS_LABELS[status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {from.name} → {to.name} · {initial.reason}
          </p>

          {/* Progress bar */}
          <ol className="mt-4 flex flex-wrap gap-2">
            {PIPELINE.map((step, i) => (
              <li
                key={step}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium',
                  i <= currentIndex
                    ? 'bg-coordinate text-white'
                    : 'bg-slate-100 text-slate-500',
                ].join(' ')}
              >
                {REFERRAL_STATUS_LABELS[step]}
              </li>
            ))}
          </ol>

          {initial.missingInfo.length > 0 && currentIndex < 2 && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium">Specialist is still waiting on (C-3)</p>
              <ul className="mt-1 list-disc pl-5">
                {initial.missingInfo.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <Button onClick={advance}>Advance to next step</Button>
          </div>
        </Card>

        {/* Travel plan (ties to O12, C-8..C-11) */}
        <Card>
          <h2 className="font-semibold text-slate-900">Getting there</h2>
          <p className="mt-2 text-sm text-slate-600">
            {to.name} is {to.distanceMiles} miles from {demoPatient.location}.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>🚌 Community shuttle — Tue/Thu mornings, $12 round trip</li>
            <li>🚗 Shared ride — flexible, ~$45 round trip</li>
            <li>🩺 Non-emergency medical transport — if eligible via scheme</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            A companion and a day off work add to the real cost (C-11).
          </p>
        </Card>

        {/* Telehealth (ties to O13, C-12..C-14) */}
        <Card>
          <h2 className="font-semibold text-slate-900">Could this be remote?</h2>
          {to.offersTelehealth ? (
            <p className="mt-2 text-sm text-green-700">
              {to.name} offers telehealth — follow-ups may not need the full trip.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              {to.name} doesn’t offer telehealth yet. The first visit is in person.
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            What can safely happen remotely is a clinical judgment (C-12, X-1).
          </p>
        </Card>
      </div>

    </div>
  )
}
