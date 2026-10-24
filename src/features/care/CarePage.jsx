/**
 * Care & Cost — reads the shared demo patient and renders a triage +
 * cost/coverage view from mock data. See TODO.md for what's left to build
 * (research questions A-1..A-17 in README.md).
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, Card, money } from '../../shared/ui.jsx'
import { demoPatient, schemes, byId } from '../../data/mockData.js'
import { useAuth } from '../../app/AuthContext.jsx'
import { estimateCost, visitCostItems } from './costEstimator.js'
import { matchAid } from './aid.js'
import AidPanel from './AidPanel.jsx'
import CoverageCheck from './CoverageCheck.jsx'
import PatientTriage from './PatientTriage.jsx'
import ChwTriage from './ChwTriage.jsx'

const MODES = [
  {
    id: 'patient',
    label: 'I need help',
    hint: 'Private. Nothing is saved unless you share it with your health worker.',
  },
  {
    id: 'chw',
    label: 'I’m a health worker',
    hint: 'Check symptoms with a patient, record readings, and pick up checks patients shared with you.',
  },
]

export default function CarePage() {
  const { user } = useAuth()
  const [mode, setMode] = useState(user?.role === 'chw' ? 'chw' : 'patient')

  // The signed-in user is restored after first render; open CHW mode for CHWs.
  useEffect(() => {
    if (user?.role === 'chw') setMode('chw')
  }, [user])

  // Use the cheapest verified cardiology provider for the demo estimate.
  const provider = byId.provider('prov-cardio-county')

  // A plan found by "Check my coverage" is added to Maria's coverage for the
  // estimate (one checked plan at a time; nothing is saved).
  const [checkedPlan, setCheckedPlan] = useState(null)
  const patient = useMemo(() => {
    if (!checkedPlan || demoPatient.schemeIds.includes(checkedPlan.scheme.id)) return demoPatient
    const { record, scheme } = checkedPlan
    return {
      ...demoPatient,
      schemeIds: [scheme.id, ...demoPatient.schemeIds],
      memberCoverage: {
        ...demoPatient.memberCoverage,
        [scheme.id]: { memberId: record.memberId, deductibleMetUsd: record.deductibleMetUsd },
      },
    }
  }, [checkedPlan])

  const estimate = estimateCost(patient, provider)
  const aid = matchAid(schemes, patient, provider)
  const schemeName = (id) => byId.scheme(id)?.name ?? id
  const addedPlan = patient === demoPatient ? null : checkedPlan.scheme

  return (
    <div>
      <PageHeader
        title="Care & Cost"
        subtitle="Recognize the need, then understand the true cost and what help is available."
        accent="care"
      />

      <ModeSwitch mode={mode} onChange={setMode} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Symptom recognition, patient or CHW mode (ties to O1, A-1..A-8) */}
        {mode === 'chw' ? (
          <div className="lg:col-span-2">
            <ChwTriage />
          </div>
        ) : (
          <PatientTriage
            initialText={demoPatient.primarySymptom}
            patientAge={demoPatient.age}
          />
        )}

        {/* Cost estimate (ties to O5, O6, A-11, A-12) */}
        <Card>
          <h2 className="font-semibold text-slate-900">
            Estimated cost at {provider.name}
          </h2>
          {addedPlan && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              Including {addedPlan.name} from your coverage check.
              <button
                type="button"
                onClick={() => setCheckedPlan(null)}
                className="font-medium text-brand-600 hover:underline"
              >
                Remove
              </button>
            </p>
          )}
          <dl className="mt-3 space-y-1 text-sm">
            <Row label="Consultation" value={money(estimate.consultUsd)} />
            <Row label="Tests" value={money(estimate.testsUsd)} />
            <Row label="Travel" value={money(estimate.travelUsd)} />
            <Row label="Lodging" value={money(estimate.lodgingUsd)} />
            <Row label="Lost wages" value={money(estimate.lostWagesUsd)} />
            <div className="my-2 border-t border-slate-200" />
            <Row label="Total" value={money(estimate.grossUsd)} />
            {estimate.coveredBy.map((c) => (
              <Row
                key={c.schemeId}
                label={`Paid by ${schemeName(c.schemeId)}`}
                value={`– ${money(c.amountUsd)}`}
                tone="green"
              />
            ))}
            <Row label="Out of pocket now" value={money(estimate.outOfPocketUsd)} strong />
          </dl>

          {/* What applying would save (O6) */}
          {estimate.couldSave.length > 0 && (
            <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm">
              <p className="font-medium text-slate-900">
                Apply for {estimate.couldSave.length === 1 ? 'this' : 'these'} and pay about{' '}
                {money(estimate.outOfPocketIfAppliedUsd)}
              </p>
              <ul className="mt-1 space-y-0.5 text-slate-700">
                {estimate.couldSave.map((c) => (
                  <li key={c.schemeId}>
                    {schemeName(c.schemeId)}: saves about {money(c.amountUsd)}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-slate-500">See “How to apply” below.</p>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-500">
            Monthly budget is {money(demoPatient.monthlyBudgetUsd)} —{' '}
            {estimate.outOfPocketUsd > demoPatient.monthlyBudgetUsd ? (
              <span className="text-red-600">over budget (O5, A-17)</span>
            ) : (
              <span className="text-green-600">within budget</span>
            )}
          </p>
        </Card>

        {/* What am I covered for? (ties to A-13, A-14) */}
        <CoverageCheck
          provider={provider}
          items={visitCostItems(patient, provider)}
          onFound={setCheckedPlan}
        />

        {/* Coverage & aid: what she qualifies for and how to apply (ties to O6, A-13..A-16) */}
        <AidPanel matches={aid} estimate={estimate} provider={provider} />
      </div>

    </div>
  )
}

function ModeSwitch({ mode, onChange }) {
  const current = MODES.find((m) => m.id === mode)
  return (
    <div className="mb-5">
      <div
        role="group"
        aria-label="Who is using this?"
        className="inline-flex rounded-lg border border-slate-200 bg-white p-1"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            onClick={() => onChange(m.id)}
            className={[
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              mode === m.id ? 'bg-care text-white' : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-600">{current.hint}</p>
    </div>
  )
}

function Row({ label, value, tone, strong }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-600">{label}</dt>
      <dd
        className={[
          tone === 'green' ? 'text-green-600' : 'text-slate-900',
          strong ? 'font-semibold' : '',
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  )
}
