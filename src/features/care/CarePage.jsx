/**
 * Care & Cost — reads the shared demo patient and walks through three steps:
 *   1. What's wrong?      symptom check, patient or CHW mode (O1, A-1..A-8)
 *   2. What will it cost? full cost and "Check my coverage" (O5, A-7, A-8, A-13, A-14)
 *   3. Help paying        programmes she has or can apply for (O6, A-13..A-16)
 * One step is shown at a time; a summary strip keeps the others in view.
 * See TODO.md for what's left to build (research questions in README.md).
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, Card, Button, money } from '../../shared/ui.jsx'
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

const STEPS = [
  { id: 'check', labelKey: 'step.check', hintKey: 'step.checkHint' },
  { id: 'cost', labelKey: 'step.cost', hintKey: 'step.costHint' },
  { id: 'help', labelKey: 'step.help', hintKey: 'step.helpHint' },
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
  const [step, setStep] = useState('check')
  const [lastResult, setLastResult] = useState(null) // latest symptom-check result

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

  // The summary and aid savings use the default (unedited) estimate.
  const estimate = estimateCost(patient, provider)
  const aid = matchAid(schemes, patient, provider)

  // Easy-read mode: larger base text across the care section (A-14).
  const scaleClass = lowLiteracy ? 'text-[1.08rem] leading-relaxed' : ''
  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const next = STEPS[stepIndex + 1]

  return (
    <div className={scaleClass}>
      <PageHeader title="Care & Cost" subtitle={t('page.subtitle')} accent="care" />

      {/* Who is using it, language, and easy-read, on one line */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ModeSwitch mode={mode} onChange={setMode} />
        <CarePreferencesBar />
      </div>

      <StepNav step={step} onChange={setStep} />
      <Summary
        result={mode === 'patient' ? lastResult : null}
        estimate={estimate}
        onOpen={setStep}
      />

      {/* Every step stays mounted (only hidden) so a check, edited costs, or a
          coverage lookup aren't lost, and the symptom check isn't re-run. */}
      <section hidden={step !== 'check'} aria-label={t('step.check')}>
        {mode === 'chw' ? (
          <ChwTriage />
        ) : (
          <div className="max-w-2xl">
            <PatientTriage
              initialText={demoPatient.primarySymptom}
              patientAge={demoPatient.age}
              onResult={setLastResult}
            />
          </div>
        )}
      </section>

      <section hidden={step !== 'cost'} aria-label={t('step.cost')}>
        <div className="grid gap-5 lg:grid-cols-2">
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
          <CoverageCheck
            provider={provider}
            items={visitCostItems(patient, provider)}
            onFound={setCheckedPlan}
          />
        </div>
      </section>

      <section hidden={step !== 'help'} aria-label={t('step.help')}>
        <AidPanel matches={aid} estimate={estimate} provider={provider} />
      </section>

      {next && (
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setStep(next.id)}>
            {t('step.next')}: {t(next.labelKey)} →
          </Button>
        </div>
      )}
    </div>
  )
}

/** Numbered step tabs. */
function StepNav({ step, onChange }) {
  const { t } = useCarePrefs()
  return (
    <nav aria-label="Care steps" className="mb-3">
      <ol className="grid gap-2 sm:grid-cols-3">
        {STEPS.map((s, i) => {
          const active = s.id === step
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => onChange(s.id)}
                className={[
                  'flex h-full w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-care bg-care/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                    active ? 'bg-care text-white' : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    {t(s.labelKey)}
                  </span>
                  <span className="block text-xs text-slate-500">{t(s.hintKey)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** One line with the key results so far, so switching steps never loses context. */
function Summary({ result, estimate, onOpen }) {
  const { t } = useCarePrefs()
  const checkText = !result
    ? t('summary.notYet')
    : result.kind === 'emergency'
      ? t('urg.emergency')
      : [result.careType, result.urgency ? t(`urg.${result.urgency}`) : '']
          .filter(Boolean)
          .join(' · ') || result.headline
  const withHelp =
    estimate.outOfPocketIfAppliedUsd < estimate.outOfPocketUsd
      ? ` (${t('summary.withHelp').replace('{amt}', money(estimate.outOfPocketIfAppliedUsd))})`
      : ''

  return (
    <Card className="mb-5 py-3">
      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <SummaryItem label={t('summary.check')} onClick={() => onOpen('check')}>
          <span className={result?.kind === 'emergency' ? 'font-semibold text-red-700' : ''}>
            {checkText}
          </span>
        </SummaryItem>
        <SummaryItem label={t('summary.cost')} onClick={() => onOpen('cost')}>
          {money(estimate.outOfPocketUsd)}
          <span className="text-slate-500">{withHelp}</span>
        </SummaryItem>
      </dl>
    </Card>
  )
}

function SummaryItem({ label, onClick, children }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd>
        <button type="button" onClick={onClick} className="text-left text-slate-900 hover:underline">
          {children}
        </button>
      </dd>
    </div>
  )
}

function ModeSwitch({ mode, onChange }) {
  const { t } = useCarePrefs()
  return (
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
  )
}
