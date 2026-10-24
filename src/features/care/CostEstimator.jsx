/**
 * CostEstimator — interactive full-journey cost with a best/worst range
 * (Workstream A, A-7/A-8).
 *
 * A-7: every cost from start to finish (consultation, tests, treatment,
 *      medicines, travel, lodging, lost wages), all editable.
 * A-8: shows how much is KNOWN up front vs. uncertain, and gives a best-case /
 *      expected / worst-case out-of-pocket range so a surprise bill is less
 *      likely to blindside a family.
 *
 * Self-contained to the care feature. Imports only shared UI primitives
 * (not modified) and the local cost helper. No shared models/data are changed.
 */
import { useMemo, useState } from 'react'
import { Card, Badge, Button, money } from '../../shared/ui.jsx'
import { byId } from '../../data/mockData.js'
import { buildCostInputs, computeEstimate } from './costEstimator.js'
import { useCarePrefs, ReadAloudButton } from './carePreferences.jsx'

/**
 * @param {Object} props
 * @param {import('../../shared/models.js').Patient} props.patient
 * @param {import('../../shared/models.js').Provider} props.provider
 */
export default function CostEstimator({ patient, provider }) {
  const defaults = useMemo(
    () => buildCostInputs(patient, provider),
    [patient, provider],
  )
  const [lines, setLines] = useState(defaults)

  const { t } = useCarePrefs()

  const estimate = useMemo(
    () => computeEstimate(lines, patient, provider),
    [lines, patient, provider],
  )
  const { range } = estimate

  function setExpected(key, value) {
    const n = value === '' ? 0 : Number(value)
    if (Number.isNaN(n)) return
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        // Keep the best/worst spread proportional around the new expected,
        // but never let best exceed expected or worst fall below it.
        const expected = Math.max(0, Math.round(n))
        return {
          ...l,
          expected,
          best: Math.min(l.best, expected),
          worst: Math.max(l.worst, expected),
        }
      }),
    )
  }

  function reset() {
    setLines(buildCostInputs(patient, provider))
  }

  const overBudget =
    patient?.monthlyBudgetUsd != null &&
    range.oopExpected > patient.monthlyBudgetUsd

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">
          {t('cost.title')} · {provider?.name}
        </h2>
        <Badge tone="slate">A-7 / A-8</Badge>
      </div>
      <div className="mt-1 flex items-start gap-1">
        <p className="text-sm text-slate-600">{t('cost.intro')}</p>
        <ReadAloudButton text={t('cost.intro')} className="shrink-0" />
      </div>

      {/* Editable line items */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-400">
          <span>{t('cost.item')}</span>
          <span>{t('cost.yourEstimate')}</span>
        </div>
        {lines.map((l) => (
          <LineInput
            key={l.key}
            line={l}
            onChange={(v) => setExpected(l.key, v)}
          />
        ))}
      </div>

      {/* Totals + range */}
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <RangeRow
          label={t('cost.total')}
          rangeLabel={t('cost.bestWorst')}
          best={range.grossBest}
          expected={range.grossExpected}
          worst={range.grossWorst}
        />
        {estimate.coveredBy.map((c) => (
          <div
            key={c.schemeId}
            className="mt-1 flex items-center justify-between text-sm text-green-700"
          >
            <span>
              {t('cost.paidBy')} {byId.scheme(c.schemeId)?.name ?? c.schemeId}
            </span>
            <span>– {money(c.amountUsd)}</span>
          </div>
        ))}
        <div className="my-2 border-t border-slate-200" />
        <RangeRow
          label={t('cost.outOfPocket')}
          rangeLabel={t('cost.bestWorst')}
          best={range.oopBest}
          expected={range.oopExpected}
          worst={range.oopWorst}
          strong
        />
      </div>

      {/* What applying for help would save (O6) */}
      {estimate.couldSave.length > 0 && (
        <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm">
          <p className="font-medium text-slate-900">
            {t('cost.applyAndPay').replace('{amt}', money(estimate.outOfPocketIfAppliedUsd))}
          </p>
          <ul className="mt-1 space-y-0.5 text-slate-700">
            {estimate.couldSave.map((c) => (
              <li key={c.schemeId}>
                {byId.scheme(c.schemeId)?.name ?? c.schemeId}:{' '}
                {t('cost.savesAbout').replace('{amt}', money(c.amountUsd))}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-slate-500">{t('cost.seeHowToApply')}</p>
        </div>
      )}

      {/* How much is known up front (A-8) */}
      <KnownUpFront
        pct={estimate.knownUpFrontPct}
        label={t('cost.knownUpFront')}
        hint={t('cost.knownHint')}
      />

      {/* Budget check */}
      {patient?.monthlyBudgetUsd != null && (
        <p className="mt-3 text-xs text-slate-500">
          {t('cost.budgetPrefix')} {money(patient.monthlyBudgetUsd)} —{' '}
          {overBudget ? (
            <span className="text-red-600">{t('cost.overBudget')}</span>
          ) : (
            <span className="text-green-600">{t('cost.withinBudget')}</span>
          )}
          {range.oopWorst > (patient.monthlyBudgetUsd ?? 0) && !overBudget && (
            <span className="text-amber-600">
              {' '}
              —{' '}
              {t('cost.worstExceeds').replace('{amt}', money(range.oopWorst))}
            </span>
          )}
        </p>
      )}

      <div className="mt-3">
        <Button variant="outline" onClick={reset}>
          {t('cost.reset')}
        </Button>
      </div>
    </Card>
  )
}

/** Pick a localized string from a { en, es } object or a plain string. */
function loc(value, code) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return value[code] ?? value.en ?? ''
}

function LineInput({ line, onChange }) {
  const { t, code } = useCarePrefs()
  const label = loc(line.label, code)
  const note = loc(line.note, code)
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-700">{label}</span>
          {line.certain ? (
            <Badge tone="green">{t('cost.knownBadge')}</Badge>
          ) : (
            <Badge tone="amber">{t('cost.variesBadge')}</Badge>
          )}
        </div>
        <p className="truncate text-xs text-slate-400">{note}</p>
      </div>
      <label className="flex items-center gap-1">
        <span className="text-slate-400">$</span>
        <span className="sr-only">{label}</span>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={line.expected}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm focus:border-care focus:outline-none focus:ring-1 focus:ring-care"
        />
      </label>
    </div>
  )
}

function RangeRow({ label, rangeLabel, best, expected, worst, strong }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className={strong ? 'font-semibold text-slate-900' : 'text-slate-700'}>
          {label}
        </span>
        <span className={strong ? 'font-semibold text-slate-900' : 'text-slate-900'}>
          {money(expected)}
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between text-xs text-slate-500">
        <span>{rangeLabel}</span>
        <span>
          {money(best)} – {money(worst)}
        </span>
      </div>
    </div>
  )
}

function KnownUpFront({ pct, label, hint }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Share of cost known up front"
      >
        <div className="h-full bg-care" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  )
}
