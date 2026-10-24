/**
 * Care & Cost — reads the shared demo patient and renders a triage +
 * cost/coverage view from mock data. See TODO.md for what's left to build
 * (research questions A-1..A-16 in README.md).
 */
import { PageHeader, Card, Badge, money } from '../../shared/ui.jsx'
import { demoPatient, providers, schemes, byId } from '../../data/mockData.js'
import { estimateCost } from './costEstimator.js'
import SymptomChecker from './SymptomChecker.jsx'

export default function CarePage() {
  // Use the cheapest verified cardiology provider for the demo estimate.
  const provider = byId.provider('prov-cardio-county')
  const estimate = estimateCost(demoPatient, provider)
  const patientSchemes = demoPatient.schemeIds.map(byId.scheme)

  return (
    <div>
      <PageHeader
        title="Care & Cost"
        subtitle="Recognize the need, then understand the true cost and what help is available."
        accent="care"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Symptom recognition (ties to O1, A-1..A-5) */}
        <SymptomChecker initialText={demoPatient.primarySymptom} />

        {/* Cost estimate (ties to O8, A-7, A-8) */}
        <Card>
          <h2 className="font-semibold text-slate-900">
            Estimated cost at {provider.name}
          </h2>
          <dl className="mt-3 space-y-1 text-sm">
            <Row label="Consultation" value={money(estimate.consultUsd)} />
            <Row label="Tests" value={money(estimate.testsUsd)} />
            <Row label="Travel" value={money(estimate.travelUsd)} />
            <Row label="Lodging" value={money(estimate.lodgingUsd)} />
            <Row label="Lost wages" value={money(estimate.lostWagesUsd)} />
            <div className="my-2 border-t border-slate-200" />
            <Row label="Covered by schemes" value={`– ${money(estimate.coveredUsd)}`} tone="green" />
            <Row
              label="Out of pocket"
              value={money(estimate.outOfPocketUsd)}
              strong
            />
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Monthly budget is {money(demoPatient.monthlyBudgetUsd)} —{' '}
            {estimate.outOfPocketUsd > demoPatient.monthlyBudgetUsd ? (
              <span className="text-red-600">over budget (O8, A-13)</span>
            ) : (
              <span className="text-green-600">within budget</span>
            )}
          </p>
        </Card>

        {/* Coverage & aid (ties to O9, A-9..A-12) */}
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Coverage & financial aid</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {schemes.map((s) => {
              const held = demoPatient.schemeIds.includes(s.id)
              return (
                <div key={s.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <Badge tone={held ? 'green' : 'slate'}>
                      {held ? 'Enrolled' : 'May qualify'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{s.notes}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Covers up to {s.coveragePct}% · Needs:{' '}
                    {s.requiredDocs.join(', ')}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

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
