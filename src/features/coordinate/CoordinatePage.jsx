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
import { byId, providers } from '../../data/mockData.js'
import { URGENCY_LABELS } from '../../shared/models.js'
import TripPlan from '../find/TripPlan.jsx'
import { rankProviders } from '../find/ranking.js'
import { searchProviders } from '../find/search.js'

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
            Read-only view. The clinicians update the referral.
          </span>
        )}
      </div>

      {/* Checks health workers sent to this clinic (O7) */}
      {user.role === 'pcp' && (
        <ClinicInbox
          onReferred={(created) => {
            setReferrals((list) => [created, ...list])
            setSelectedId(created.id)
          }}
        />
      )}

      {referrals.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Referrals">
          {referrals.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={r.id === selectedId}
              onClick={() => setSelectedId(r.id)}
              className={[
                'rounded-lg border px-3 py-1.5 text-left text-xs',
                r.id === selectedId ? 'border-coordinate bg-coordinate/10' : 'border-slate-200 bg-white hover:bg-slate-50',
              ].join(' ')}
            >
              <span className="block font-medium text-slate-900">
                {byId.provider(r.toProviderId)?.name ?? 'Specialist'}
              </span>
              <span className="text-slate-500">{REFERRAL_STATUS_LABELS[r.status]}</span>
            </button>
          ))}
        </div>
      )}

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
          <ReferralCard referral={referral} canEdit={canEdit} apply={apply} role={user.role} />
          <TravelCard referral={referral} />
          <TelehealthCard referral={referral} />
        </div>
      )}
    </div>
  )
}

function ReferralCard({ referral, canEdit, apply, role }) {
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

      <Findings key={referral.id} referral={referral} role={role} apply={apply} />
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

/**
 * Clinic inbox (O7): symptom checks a health worker sent to this clinic. The
 * clinician decides, and refers to a specialist ranked by Find & Trust.
 */
function ClinicInbox({ onReferred }) {
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    api
      .listClinicInbox()
      .then(({ sessions }) => setSessions(sessions))
      .catch((err) => setError(err.message))
  }, [])

  const waiting = sessions.filter((s) => !s.referralId)

  return (
    <Card className="mb-5">
      <h2 className="font-semibold text-slate-900">
        Clinic inbox <span className="font-normal text-slate-500">({waiting.length} waiting)</span>
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Symptom checks your health workers sent. You decide whether to refer.
      </p>
      {error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {waiting.length === 0 && !error && (
        <p className="mt-3 text-sm text-slate-500">Nothing waiting. New checks appear here.</p>
      )}
      <ul className="mt-3 space-y-3">
        {waiting.map((s) => (
          <li key={s.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-slate-900">{s.patientName}</span>
              <span className="flex gap-1">
                {s.result.kind === 'emergency' && <Badge tone="red">Emergency signs</Badge>}
                {s.result.urgency && URGENCY_LABELS[s.result.urgency] && (
                  <Badge tone={s.result.urgency === 'within_days' ? 'amber' : 'slate'}>
                    {URGENCY_LABELS[s.result.urgency]}
                  </Badge>
                )}
              </span>
            </div>
            <p className="mt-1 text-sm italic text-slate-600">“{s.symptomText}”</p>
            <p className="mt-1 text-xs text-slate-500">
              {s.result.careType || s.result.headline} · checked by {s.chwName}
              {Object.keys(s.readings).length > 0 &&
                ` · ${Object.entries(s.readings).map(([k, v]) => `${k} ${v}`).join(', ')}`}
            </p>
            {openId === s.id ? (
              <ReferForm
                session={s}
                onCancel={() => setOpenId(null)}
                onDone={(referral) => {
                  setSessions((list) => list.map((x) => (x.id === s.id ? { ...x, referralId: referral.id } : x)))
                  setOpenId(null)
                  onReferred(referral)
                }}
              />
            ) : (
              <div className="mt-2">
                <Button variant="outline" onClick={() => setOpenId(s.id)}>
                  Refer to a specialist
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Pick a specialist (ranked the same way as Find & Trust) and write the reason. */
function ReferForm({ session, onCancel, onDone }) {
  const patient = byId.patient(session.patientId)
  const specialty = session.result.specialty
  const verifiedSpecialists = providers.filter(
    (p) => p.verification.status === 'verified' && !p.specialties.every((s) => s === 'primary care'),
  )
  const matching =
    specialty && specialty !== 'primary care'
      ? searchProviders(verifiedSpecialists, specialty)
      : []
  const ranked = patient
    ? rankProviders(matching.length > 0 ? matching : verifiedSpecialists, patient)
    : (matching.length > 0 ? matching : verifiedSpecialists).map((p) => ({ provider: p, score: null }))

  const [toProviderId, setToProviderId] = useState(ranked[0]?.provider.id ?? '')
  const [reason, setReason] = useState(
    `${session.result.careType || 'Specialist review'}. Health worker check: “${session.symptomText}”`,
  )
  const [state, setState] = useState({ state: 'idle' })

  async function submit(e) {
    e.preventDefault()
    setState({ state: 'sending' })
    try {
      const { referral } = await api.createReferral({
        triageSessionId: session.id,
        toProviderId,
        reason,
      })
      onDone(referral)
    } catch (err) {
      setState({ state: 'error', message: err.message })
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
      <label className="block">
        <span className="font-medium text-slate-700">Specialist</span>
        <select
          value={toProviderId}
          onChange={(e) => setToProviderId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
        >
          {ranked.map(({ provider: p, score }) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.distanceMiles} mi
              {score != null ? ` · match ${Math.round(score * 100)}/100` : ''}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          {matching.length > 0
            ? 'Verified providers for this care type, best match first (same ranking as Find & Trust).'
            : 'No verified match for this care type, so all verified specialists are listed.'}
        </span>
      </label>
      <label className="block">
        <span className="font-medium text-slate-700">Reason for referral</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{state.state === 'sending' ? 'Sending…' : 'Send referral'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {state.state === 'error' && (
        <p className="text-red-700" role="alert">
          {state.message}
        </p>
      )}
    </form>
  )
}

/**
 * Findings (O8, C-5..C-7). The specialist writes a clinic version and a
 * plain-language version and approves both; they go back to the referring
 * clinic and the health worker, and the patient sees the plain version.
 */
function Findings({ referral, role, apply }) {
  const f = referral.findings
  const canWrite =
    role === 'specialist' && PIPELINE.indexOf(referral.status) >= PIPELINE.indexOf('seen')
  const [editing, setEditing] = useState(false)
  const [forClinician, setForClinician] = useState(f?.forClinician ?? '')
  const [forPatient, setForPatient] = useState(f?.forPatient ?? '')

  async function submit(e) {
    e.preventDefault()
    await apply({ action: 'returnFindings', forClinician, forPatient })
    setEditing(false)
  }

  const showForm = canWrite && (!f || editing)

  return (
    <section className="mt-5 rounded-lg border border-slate-200 p-3">
      <h3 className="text-sm font-semibold text-slate-900">Findings</h3>

      {f && !editing && (
        <div className="mt-2 space-y-2 text-sm">
          {f.forClinician && (
            <div>
              <p className="text-xs font-medium text-slate-500">For the clinic</p>
              <p className="whitespace-pre-line text-slate-800">{f.forClinician}</p>
            </div>
          )}
          <div className="rounded-lg bg-green-50 p-2">
            <p className="text-xs font-medium text-green-800">In plain words, for the patient</p>
            <p className="whitespace-pre-line text-slate-800">{f.forPatient}</p>
          </div>
          <p className="text-xs text-slate-500">
            Sent by {f.by} on {f.at}, to the referring clinic and the health worker.
          </p>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit findings
            </Button>
          )}
        </div>
      )}

      {!f && !showForm && (
        <p className="mt-1 text-sm text-slate-500">
          {PIPELINE.indexOf(referral.status) >= PIPELINE.indexOf('seen')
            ? 'Waiting for the specialist to send findings back.'
            : 'The specialist sends findings back after the visit.'}
        </p>
      )}

      {showForm && (
        <form onSubmit={submit} className="mt-2 space-y-2 text-sm">
          <label className="block">
            <span className="font-medium text-slate-700">For the clinic</span>
            <textarea
              value={forClinician}
              onChange={(e) => setForClinician(e.target.value)}
              rows={3}
              placeholder="What you found, what you did, and what the clinic should do next."
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="font-medium text-slate-700">In plain words, for the patient</span>
            <textarea
              value={forPatient}
              onChange={(e) => setForPatient(e.target.value)}
              rows={3}
              placeholder="Short sentences, no medical terms. What happens next and when."
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Approve and send back</Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Both versions go to the referring clinic and the health worker. The patient sees the
            plain-language version.
          </p>
        </form>
      )}
    </section>
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
        Information the specialist still needs
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
        <h3 className="text-sm font-medium text-slate-900">Mark stalled</h3>
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
  // Same trip plan as Find & Trust (O3). Patients and providers live in the
  // shared demo data; the server referral only carries their ids.
  const provider = byId.provider(referral.toProviderId)
  const patient = byId.patient(referral.patientId)
  return (
    <Card>
      <h2 className="font-semibold text-slate-900">Getting there</h2>
      {provider && patient ? (
        <>
          <p className="mt-1 text-sm text-slate-600">To {provider.name}, {provider.location}.</p>
          <div className="mt-2">
            <TripPlan patient={patient} provider={provider} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-600">No trip details for this referral yet.</p>
      )}
      <p className="mt-3 text-xs text-slate-500">
        A companion and a day off work add to the real cost.
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
        Whether a visit can safely happen by video is the specialist’s decision.
      </p>
    </Card>
  )
}
