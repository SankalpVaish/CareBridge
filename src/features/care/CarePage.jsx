/**
 * Care & Cost — reads the shared demo patient and renders a triage +
 * cost/coverage view from mock data. See TODO.md for what's left to build
 * (research questions A-1..A-17 in README.md).
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../shared/ui.jsx'
import { demoPatient, schemes, byId } from '../../data/mockData.js'
import { useAuth } from '../../app/AuthContext.jsx'
import { estimateCost, visitCostItems } from './costEstimator.js'
import { matchAid } from './aid.js'
import CostEstimator from './CostEstimator.jsx'
import CoverageCheck from './CoverageCheck.jsx'
import AidPanel from './AidPanel.jsx'
import PatientTriage from './PatientTriage.jsx'
import ChwTriage from './ChwTriage.jsx'
import { CarePreferencesProvider, useCarePrefs } from './carePreferences.jsx'
import CarePreferencesBar from './CarePreferencesBar.jsx'

const MODES = [
  { id: 'patient', labelKey: 'mode.patient' },
  { id: 'chw', labelKey: 'mode.chw' },
]

export default function CarePage() {
  return (
    <CarePreferencesProvider patient={demoPatient}>
      <CarePageInner />
    </CarePreferencesProvider>
  )
}

function CarePageInner() {
  const { user } = useAuth()
  const { t, lowLiteracy } = useCarePrefs()
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
  const addedPlan = patient === demoPatient ? null : checkedPlan.scheme

  // The aid panel's savings use the default (unedited) estimate.
  const estimate = estimateCost(patient, provider)
  const aid = matchAid(schemes, patient, provider)

  // Easy-read mode: larger base text across the care section (A-14).
  const scaleClass = lowLiteracy ? 'text-[1.08rem] leading-relaxed' : ''

  return (
    <div className={scaleClass}>
      <PageHeader title="Care & Cost" subtitle={t('page.subtitle')} accent="care" />

      <CarePreferencesBar />
      <ModeSwitch mode={mode} onChange={setMode} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Symptom recognition, patient or CHW mode (ties to O1, A-1..A-8) */}
        {mode === 'chw' ? (
          <div className="lg:col-span-2">
            <ChwTriage />
          </div>
        ) : (
          <PatientTriage initialText={demoPatient.primarySymptom} patientAge={demoPatient.age} />
        )}

        {/* Cost estimate: editable, with a range and what each scheme pays (O5, O6, A-7, A-8) */}
        <div>
          {addedPlan && (
            <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
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
          <CostEstimator patient={patient} provider={provider} />
        </div>

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
  const { t } = useCarePrefs()
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
            {t(m.labelKey)}
          </button>
        ))}
      </div>
    </div>
  )
}
