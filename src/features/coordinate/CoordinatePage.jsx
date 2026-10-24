/**
 * Coordinate — shows Maria’s referral moving through its stages, what info is
 * still missing, who it’s stalled on, and travel/telehealth options. See
 * TODO.md for what's left to build (research questions C-1..C-25 in README.md).
 */
import { useState } from 'react'
import { PageHeader, Card, Badge, Button } from '../../shared/ui.jsx'
import { referrals, byId, demoPatient } from '../../data/mockData.js'
import { REFERRAL_STATUS_LABELS } from '../../shared/models.js'
import {
  PIPELINE,
  RESPONSIBLE_PARTIES,
  RESPONSIBLE_LABELS,
  stageIndex,
  setStage,
  advanceStage,
  previousStage,
  markStalled,
  addMissingInfo,
  resolveMissingInfo,
} from './referralWorkflow.js'

export default function CoordinatePage() {
  // Local, editable copy of the shared referral. We never mutate mockData;
  // all workflow helpers return a new referral object (C-1..C-4).
  const [referral, setReferral] = useState(() => ({
    ...referrals[0],
    responsibleParty: referrals[0].responsibleParty ?? null,
    stallReason: referrals[0].stallReason ?? '',
  }))

  const from = byId.provider(referral.fromProviderId)
  const to = byId.provider(referral.toProviderId)
  const currentIndex = stageIndex(referral.status)
  const isStalled = referral.status === 'stalled'

  return (
    <div>
      <PageHeader
        title="Coordinate"
        subtitle="Keep Maria’s referral, scheduling, travel, and care teams in sync."
        accent="coordinate"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <ReferralCard
          referral={referral}
          setReferral={setReferral}
          from={from}
          to={to}
          currentIndex={currentIndex}
          isStalled={isStalled}
        />

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

/**
 * Editable referral pipeline (C-1..C-4): click a stage to jump to it, step
 * forward/back, mark it stalled with a responsible party + reason, and edit the
 * missing-info checklist. Every change is appended to the timeline.
 */
function ReferralCard({ referral, setReferral, from, to, currentIndex, isStalled }) {
  return (
    <Card className="lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Referral</h2>
        <Badge tone={isStalled ? 'red' : 'blue'}>
          {REFERRAL_STATUS_LABELS[referral.status]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {from.name} → {to.name} · {referral.reason}
      </p>

      {/* Editable stage chips (C-1) */}
      <ol className="mt-4 flex flex-wrap gap-2">
        {PIPELINE.map((step, i) => {
          const reached = !isStalled && i <= currentIndex
          return (
            <li key={step}>
              <button
                type="button"
                onClick={() => setReferral((r) => setStage(r, step))}
                aria-current={!isStalled && i === currentIndex ? 'step' : undefined}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  reached
                    ? 'bg-coordinate text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                ].join(' ')}
              >
                {REFERRAL_STATUS_LABELS[step]}
              </button>
            </li>
          )
        })}
      </ol>

      {/* Forward / back controls (C-1) */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setReferral((r) => previousStage(r))}>
          ← Back a step
        </Button>
        <Button onClick={() => setReferral((r) => advanceStage(r))}>
          Advance a step →
        </Button>
      </div>

      {/* Missing info checklist (C-3) */}
      <MissingInfo referral={referral} setReferral={setReferral} />

      {/* Stall panel: who is responsible + why (C-2, C-4) */}
      <StallPanel referral={referral} setReferral={setReferral} isStalled={isStalled} />

      {/* Timeline — the audit trail of every change */}
      <section className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
        <ol className="mt-2 space-y-1 border-l-2 border-slate-200 pl-3 text-sm text-slate-600">
          {referral.timeline.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ol>
      </section>
    </Card>
  )
}

/** Add / resolve the information the specialist still needs (C-3). */
function MissingInfo({ referral, setReferral }) {
  const [draft, setDraft] = useState('')

  function add(e) {
    e.preventDefault()
    setReferral((r) => addMissingInfo(r, draft))
    setDraft('')
  }

  return (
    <section className="mt-5 rounded-lg bg-amber-50 p-3">
      <h3 className="text-sm font-medium text-amber-900">
        Information the specialist still needs (C-3)
      </h3>

      {referral.missingInfo.length === 0 ? (
        <p className="mt-2 text-sm text-amber-800">
          Nothing outstanding — the specialist has everything.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {referral.missingInfo.map((item) => (
            <li
              key={item}
              className="flex items-center justify-between gap-2 text-sm text-amber-800"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => setReferral((r) => resolveMissingInfo(r, item))}
                className="rounded px-2 py-0.5 text-xs font-medium text-amber-900 underline hover:no-underline"
              >
                Mark received
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-3 flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Add missing item</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add an item the specialist is waiting on…"
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm"
          />
        </label>
        <Button type="submit" variant="outline">
          Add
        </Button>
      </form>
    </section>
  )
}

/** Record that a referral has stalled, on whom, and why (C-2, C-4). */
function StallPanel({ referral, setReferral, isStalled }) {
  const [party, setParty] = useState(referral.responsibleParty ?? 'specialist')
  const [reason, setReason] = useState('')

  function stall(e) {
    e.preventDefault()
    setReferral((r) => markStalled(r, party, reason))
    setReason('')
  }

  return (
    <section className="mt-5 rounded-lg border border-slate-200 p-3">
      {isStalled ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <p className="font-medium">
            Stalled — responsible: {RESPONSIBLE_LABELS[referral.responsibleParty]}
          </p>
          {referral.stallReason && (
            <p className="mt-1">Reason: {referral.stallReason}</p>
          )}
          <p className="mt-2 text-xs text-red-700">
            Use the stage chips or “Advance a step” above to resume once resolved.
          </p>
        </div>
      ) : (
        <form onSubmit={stall}>
          <h3 className="text-sm font-medium text-slate-900">
            Mark stalled (C-2, C-4)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Record who the referral is waiting on and why, so follow-up has an owner.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-sm text-slate-700">
              <span className="sr-only">Responsible party</span>
              <select
                value={party}
                onChange={(e) => setParty(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              >
                {RESPONSIBLE_PARTIES.map((p) => (
                  <option key={p} value={p}>
                    {RESPONSIBLE_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[12rem] flex-1">
              <span className="sr-only">Reason</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is it stalled?"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </label>
            <Button type="submit" variant="outline">
              Mark stalled
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
