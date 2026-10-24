/**
 * Health-worker mode: the CHW picks up checks patients shared, or starts one
 * with a patient they look after. Consent comes first. Readings are passed on
 * exactly as entered; the app never interprets them (A-7, X-1, X-3).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Button } from '../../shared/ui.jsx'
import { api } from '../../shared/api.js'
import { useAuth } from '../../app/AuthContext.jsx'
import { USER_ROLE_LABELS } from '../../shared/models.js'
import SymptomChecker from './SymptomChecker.jsx'

const READING_FIELDS = [
  { key: 'temperature', label: 'Temperature', placeholder: 'e.g. 99.1 °F' },
  { key: 'bloodPressure', label: 'Blood pressure', placeholder: 'e.g. 128/82' },
  { key: 'pulse', label: 'Pulse', placeholder: 'e.g. 76 per min' },
  { key: 'weight', label: 'Weight', placeholder: 'e.g. 165 lb' },
]

function newCheck() {
  return {
    key: `new-${Date.now()}`,
    sessionId: null,
    patientId: '',
    patientName: '',
    symptomText: '',
    consent: false,
    fromPatient: false,
    readings: {},
  }
}

function fromSession(s) {
  return {
    key: `${s.id}-${Date.now()}`,
    sessionId: s.id,
    patientId: s.patientId,
    patientName: s.patientName,
    symptomText: s.symptomText,
    consent: s.consentRecorded,
    fromPatient: s.startedIn === 'patient',
    readings: s.readings,
    reviewed: s.status === 'reviewed',
    sentToClinicAt: s.sentToClinicAt,
    clinicName: s.clinicName,
  }
}

export default function ChwTriage() {
  const { user } = useAuth()
  if (user?.role !== 'chw') return <SignInPrompt user={user} />
  return <ChwWorkspace />
}

function ChwWorkspace() {
  const [patients, setPatients] = useState([])
  const [sessions, setSessions] = useState([])
  const [loadError, setLoadError] = useState('')
  const [active, setActive] = useState(newCheck)
  const [checked, setChecked] = useState(null) // { result, text }
  const [save, setSave] = useState({ state: 'idle' }) // idle | saving | saved | error

  async function load() {
    try {
      const [s, p] = await Promise.all([api.listTriage(), api.listChwPatients()])
      setSessions(s.sessions)
      setPatients(p.patients)
      setLoadError('')
    } catch (err) {
      setLoadError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function open(next) {
    setActive(next)
    setChecked(null)
    setSave({ state: 'idle' })
  }

  function update(fields) {
    setActive((a) => ({ ...a, ...fields }))
    setSave({ state: 'idle' })
  }

  function onResult(result, text) {
    setChecked(result ? { result, text } : null)
    setSave({ state: 'idle' })
  }

  async function saveCheck() {
    setSave({ state: 'saving' })
    const payload = { symptomText: checked.text, result: checked.result, readings: active.readings }
    try {
      const { session } = active.sessionId
        ? await api.updateTriage(active.sessionId, payload)
        : await api.createTriage({ ...payload, patientId: active.patientId, consent: active.consent })
      setActive((a) => ({
        ...a,
        sessionId: session.id,
        reviewed: true,
        sentToClinicAt: session.sentToClinicAt,
        clinicName: session.clinicName,
      }))
      setSave({ state: 'saved' })
      load()
    } catch (err) {
      setSave({ state: 'error', message: err.message })
    }
  }

  const waiting = sessions.filter((s) => s.status === 'shared')
  const reviewed = sessions.filter((s) => s.status === 'reviewed')
  const ready = Boolean(active.patientId && active.consent)

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Shared with you</h2>
          <Button variant="outline" onClick={() => open(newCheck())}>
            New check
          </Button>
        </div>
        {loadError && (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {loadError}
          </p>
        )}
        <SessionList
          sessions={waiting}
          activeId={active.sessionId}
          onOpen={(s) => open(fromSession(s))}
          empty="No checks waiting. When a patient shares a check, it appears here."
        />
        {reviewed.length > 0 && (
          <>
            <h3 className="mt-5 text-sm font-medium text-slate-700">Reviewed</h3>
            <SessionList
              sessions={reviewed}
              activeId={active.sessionId}
              onOpen={(s) => open(fromSession(s))}
            />
          </>
        )}
      </Card>

      <div className="space-y-3 lg:col-span-3">
        <Card>
          <h2 className="font-semibold text-slate-900">
            {active.sessionId ? `Check for ${active.patientName}` : 'New check'}
          </h2>

          <label className="mt-3 block text-sm">
            <span className="font-medium text-slate-700">Patient</span>
            {active.sessionId ? (
              <span className="mt-1 block text-slate-900">{active.patientName}</span>
            ) : (
              <select
                value={active.patientId}
                onChange={(e) => {
                  const p = patients.find((x) => x.id === e.target.value)
                  update({ patientId: e.target.value, patientName: p?.name ?? '', consent: false })
                  setChecked(null)
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Choose a patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.location}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={active.consent}
              disabled={!active.patientId || Boolean(active.sessionId)}
              onChange={(e) => {
                update({ consent: e.target.checked })
                setChecked(null)
              }}
            />
            <span>
              {active.fromPatient
                ? `${active.patientName} shared this check, so their consent is recorded.`
                : 'The patient agrees to this check and to it being saved to their record.'}
            </span>
          </label>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-slate-700">Readings (optional)</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {READING_FIELDS.map((f) => (
                <label key={f.key} className="block text-sm">
                  <span className="text-slate-600">{f.label}</span>
                  <input
                    value={active.readings[f.key] ?? ''}
                    placeholder={f.placeholder}
                    maxLength={20}
                    onChange={(e) =>
                      update({ readings: { ...active.readings, [f.key]: e.target.value } })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Readings go to the clinician exactly as entered. The app doesn’t interpret them.
            </p>
          </fieldset>
        </Card>

        {ready ? (
          <SymptomChecker
            key={active.key}
            title="What is the patient feeling?"
            initialText={active.symptomText}
            onResult={onResult}
          />
        ) : (
          <p className="text-sm text-slate-500">
            Choose a patient and record their consent to start the check.
          </p>
        )}

        {/* Hand the saved check to the patient's clinic (O7) */}
        {active.sessionId && active.reviewed && (
          <SendToClinic
            active={active}
            onSent={(session) => {
              setActive((a) => ({ ...a, sentToClinicAt: session.sentToClinicAt, clinicName: session.clinicName }))
              load()
            }}
          />
        )}

        {ready && checked && (
          <Card>
            <Button onClick={saveCheck}>
              {save.state === 'saving'
                ? 'Saving…'
                : active.sessionId
                  ? 'Save changes'
                  : 'Save check'}
            </Button>
            {save.state === 'saved' && (
              <p className="mt-2 text-sm text-green-700" role="status">
                Saved to {active.patientName}’s record.
              </p>
            )}
            {save.state === 'error' && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {save.message}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

/** Sends a saved check to the patient's own clinic, where a clinician decides on a referral. */
function SendToClinic({ active, onSent }) {
  const [state, setState] = useState({ state: 'idle' })

  if (active.sentToClinicAt) {
    return (
      <Card>
        <p className="text-sm text-green-700" role="status">
          ✓ Sent to {active.clinicName ?? 'the clinic'} on {formatWhen(active.sentToClinicAt)}. The
          clinician will decide whether to refer, and you’ll see the referral and findings on the
          Coordinate page.
        </p>
      </Card>
    )
  }

  async function send() {
    setState({ state: 'sending' })
    try {
      const { session } = await api.sendTriageToClinic(active.sessionId)
      setState({ state: 'idle' })
      onSent(session)
    } catch (err) {
      setState({ state: 'error', message: err.message })
    }
  }

  return (
    <Card>
      <p className="text-sm text-slate-600">
        Send this check, with the readings, to {active.patientName}’s clinic. The clinician decides
        whether a specialist is needed.
      </p>
      <div className="mt-2">
        <Button onClick={send}>{state.state === 'sending' ? 'Sending…' : 'Send to clinic'}</Button>
      </div>
      {state.state === 'error' && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}
    </Card>
  )
}

function SessionList({ sessions, activeId, onOpen, empty }) {
  if (sessions.length === 0) {
    return empty ? <p className="mt-3 text-sm text-slate-500">{empty}</p> : null
  }
  return (
    <ul className="mt-3 space-y-2">
      {sessions.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onOpen(s)}
            className={[
              'w-full rounded-lg border p-3 text-left text-sm',
              s.id === activeId ? 'border-care bg-care/10' : 'border-slate-200 hover:bg-slate-50',
            ].join(' ')}
          >
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-slate-900">{s.patientName}</span>
              {s.result.kind === 'emergency' ? (
                <Badge tone="red">Emergency signs</Badge>
              ) : s.sentToClinicAt ? (
                <Badge tone="blue">Sent to clinic</Badge>
              ) : s.status === 'shared' ? (
                <Badge tone="amber">Needs review</Badge>
              ) : (
                <Badge tone="green">Reviewed</Badge>
              )}
            </span>
            <span className="mt-1 block italic text-slate-600">“{s.symptomText}”</span>
            <span className="mt-1 block text-xs text-slate-500">
              {s.result.careType || s.result.headline} · {formatWhen(s.updatedAt)}
            </span>
            {Object.keys(s.readings).length > 0 && (
              <span className="mt-1 block text-xs text-slate-500">{formatReadings(s.readings)}</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}

function SignInPrompt({ user }) {
  return (
    <Card>
      <h2 className="font-semibold text-slate-900">Health-worker mode</h2>
      <p className="mt-2 text-sm text-slate-600">
        Check symptoms with a patient, record readings, and pick up checks that patients
        shared with you. This needs a health-worker account.
      </p>
      {user ? (
        <p className="mt-2 text-sm text-slate-600">
          You’re signed in as {user.name} ({USER_ROLE_LABELS[user.role]}). Sign out, then sign
          in with a health-worker account.
        </p>
      ) : (
        <Link
          to="/signin"
          state={{ from: { pathname: '/care' } }}
          className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Sign in
        </Link>
      )}
      <p className="mt-3 text-xs text-slate-500">Demo account: chw@example.com · password demo1234</p>
    </Card>
  )
}

function formatWhen(iso) {
  return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function formatReadings(readings) {
  return READING_FIELDS.filter((f) => readings[f.key])
    .map((f) => `${f.label} ${readings[f.key]}`)
    .join(' · ')
}
