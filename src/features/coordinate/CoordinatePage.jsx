/**
 * Coordinate — now DYNAMIC and role-aware.
 *
 * Referrals are fetched from the backend (/api/referrals), filtered by the
 * signed-in role, and every change is persisted via PATCH. The referral
 * workflow (C-1..C-4) is unchanged in meaning — the server applies the same
 * stage / stall / missing-info semantics the pure helpers used to.
 *
 * Role shapes what you can do:
 *   - patient:    read-only view of their own referral(s)
 *   - pcp:        can edit (they own the referral they created)
 *   - specialist: can edit (they receive the referral)
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../../app/AuthContext.jsx'
import { api } from '../../shared/api.js'
import { PageHeader, Card, Badge, Button } from '../../shared/ui.jsx'
import { REFERRAL_STATUS_LABELS, USER_ROLE_LABELS } from '../../shared/models.js'
import { PIPELINE, RESPONSIBLE_PARTIES, RESPONSIBLE_LABELS, stageIndex } from './referralWorkflow.js'

export default function CoordinatePage() {
  const { user } = useAuth()
  const canEdit = user.role === 'pcp' || user.role === 'specialist'

  const [referrals, setReferrals] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load this user's referrals once on mount.
  useEffect(() => {
    let active = true
    api
      .listReferrals()
      .then(({ referrals }) => {
        if (!active) return
        setReferrals(referrals)
        setSelectedId(referrals[0]?.id ?? null)
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const referral = referrals.find((r) => r.id === selectedId) ?? null

  /** Send a workflow action to the server, then store the returned referral. */
  async function apply(action) {
    setError('')
    try {
      const { referral: updated } = await api.updateReferral(selectedId, action)
      setReferrals((list) => list.map((r) => (r.id === updated.id ? updated : r)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Coordinate"
        subtitle="Track referrals, keep care teams in sync, and plan the trip."
        accent="coordinate"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="blue">Signed in as {USER_ROLE_LABELS[user.role]}</Badge>
        {!canEdit && (
          <span className="text-xs text-slate-500">
            Patients see a read-only view. A provider updates the referral.
          </span>
        )}
      </div>

      {loading && <p className="text-slate-500">Loading referrals…</p>}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!loading && referrals.length === 0 && (
        <Card>
          <p className="text-slate-600">
            No referrals for your account yet. The seeded demo links referrals to
            the <code>maria@example.com</code>, <code>pcp@example.com</code>, and{' '}
            <code>specialist@example.com</code> accounts.
          </p>
        </Card>
      )}

      {referral && (
        <div className="grid gap-5 lg:grid-cols-2">
          <ReferralCard referral={referral} canEdit={canEdit} apply={apply} />
          <TravelCard referral={referral} />
          <TelehealthCard referral={referral} />
        </div>
      )}
    </div>
  )
}

function ReferralCard({ referral, canEdit, apply }) {
  const currentIndex = stageIndex(referral.status)
  const isStalled = referral.status === 'stalled'

  return (
    <Card className="lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Referral</h2>
        <Badge tone={isStalled ? 'red' : 'blue'}>
          {REFERRAL_STATUS_LABELS[referral.status]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-slate-600">{referral.reason}</p>

      {/* Stage chips (editable for providers, C-1) */}
      <ol className="mt-4 flex flex-wrap gap-2">
        {PIPELINE.map((step, i) => {
          const reached = !isStalled && i <= currentIndex
          return (
            <li key={step}>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => apply({ action: 'setStage', stage: step })}
                aria-current={!isStalled && i === currentIndex ? 'step' : undefined}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  reached ? 'bg-coordinate text-white' : 'bg-slate-100 text-slate-500',
                  canEdit ? 'hover:opacity-90' : 'cursor-default',
                ].join(' ')}
              >
                {REFERRAL_STATUS_LABELS[step]}
              </button>
            </li>
          )
        })}
      </ol>

      {canEdit && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => apply({ action: 'setStage', stage: PIPELINE[Math.max(currentIndex - 1, 0)] })}
          >
            ← Back a step
          </Button>
          <Button
            onClick={() =>
              apply({
                action: 'setStage',
                stage: PIPELINE[Math.min((currentIndex < 0 ? 0 : currentIndex) + 1, PIPELINE.length - 1)],
              })
            }
          >
            Advance a step →
          </Button>
        </div>
      )}

      <MissingInfo referral={referral} canEdit={canEdit} apply={apply} />
      <StallPanel referral={referral} canEdit={canEdit} apply={apply} isStalled={isStalled} />

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

function MissingInfo({ referral, canEdit, apply }) {
  const [draft, setDraft] = useState('')

  function add(e) {
    e.preventDefault()
    apply({ action: 'addMissingInfo', item: draft })
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
            <li key={item} className="flex items-center justify-between gap-2 text-sm text-amber-800">
              <span>{item}</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => apply({ action: 'resolveMissingInfo', item })}
                  className="rounded px-2 py-0.5 text-xs font-medium text-amber-900 underline hover:no-underline"
                >
                  Mark received
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
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
      )}
    </section>
  )
}

function StallPanel({ referral, canEdit, apply, isStalled }) {
  const [party, setParty] = useState('specialist')
  const [reason, setReason] = useState('')

  function stall(e) {
    e.preventDefault()
    apply({ action: 'markStalled', responsibleParty: party, reason })
    setReason('')
  }

  if (isStalled) {
    return (
      <section className="mt-5 rounded-lg border border-slate-200 p-3">
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <p className="font-medium">
            Stalled — responsible: {RESPONSIBLE_LABELS[referral.responsibleParty]}
          </p>
          {referral.stallReason && <p className="mt-1">Reason: {referral.stallReason}</p>}
          {canEdit && (
            <p className="mt-2 text-xs text-red-700">
              Use the stage chips or “Advance a step” above to resume once resolved.
            </p>
          )}
        </div>
      </section>
    )
  }

  if (!canEdit) return null

  return (
    <section className="mt-5 rounded-lg border border-slate-200 p-3">
      <form onSubmit={stall}>
        <h3 className="text-sm font-medium text-slate-900">Mark stalled (C-2, C-4)</h3>
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
    </section>
  )
}

function TravelCard({ referral }) {
  return (
    <Card>
      <h2 className="font-semibold text-slate-900">Getting there</h2>
      <p className="mt-2 text-sm text-slate-600">
        Plan the trip to the specialist for this referral.
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
  )
}

function TelehealthCard({ referral }) {
  return (
    <Card>
      <h2 className="font-semibold text-slate-900">Could this be remote?</h2>
      <p className="mt-2 text-sm text-slate-600">
        Some follow-ups may not need the full trip — ask the specialist whether a
        video visit is an option.
      </p>
      <p className="mt-3 text-xs text-slate-500">
        What can safely happen remotely is a clinical judgment (C-12, X-1).
      </p>
    </Card>
  )
}
