/**
 * Trip plan display (O3, B-4..B-8). `compact` shows one summary line with an
 * expandable list (Find & Trust cards); the full view lists every option
 * (Coordinate's "Getting there").
 */
import { money } from '../../shared/ui.jsx'
import { planTrip, formatTime, formatDuration } from './travel.js'

/**
 * @param {Object} props
 * @param {object} props.patient
 * @param {object} props.provider
 * @param {string} [props.appointmentTime]  'HH:MM'
 * @param {boolean} [props.compact]
 */
export default function TripPlan({ patient, provider, appointmentTime, compact = false }) {
  const plan = planTrip(patient, provider, { appointmentTime })
  if (!plan) {
    return <p className="text-sm text-slate-500">No trip plan: this provider has no known address.</p>
  }
  const best = plan.recommended

  const summary = best ? (
    <>
      {best.icon} {best.label}: {best.roundTripCostUsd === 0 ? 'free' : money(best.roundTripCostUsd)} round
      trip · leave by {formatTime(best.leaveBy)} · {formatDuration(best.oneWayMinutes)} each way
    </>
  ) : (
    <>None of your usual ways to travel can make this trip. Ask your clinic about transport.</>
  )

  if (compact) {
    return (
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-slate-700">
          <span className="font-medium">Getting there:</span> {summary}
          {plan.overnightNeeded && <span className="text-amber-700"> · overnight stay likely</span>}
        </summary>
        <OptionList plan={plan} />
      </details>
    )
  }

  return (
    <div className="text-sm">
      <p className="text-slate-600">
        {plan.miles} mi from {patient.location}, for a {formatTime(plan.appointmentTime)} appointment.
      </p>
      {best && (
        <p className="mt-2 rounded-lg bg-coordinate/10 p-2 text-slate-800">
          <span className="font-medium">Cheapest:</span> {summary}
        </p>
      )}
      <p className={`mt-2 ${plan.overnightNeeded ? 'font-medium text-amber-700' : 'text-slate-600'}`}>
        {plan.overnightNeeded
          ? 'Overnight stay likely: the trip is long even by the fastest way. Ask about lodging help.'
          : 'You can go and come back the same day.'}
      </p>
      <OptionList plan={plan} />
    </div>
  )
}

function OptionList({ plan }) {
  return (
    <ul className="mt-2 space-y-2">
      {plan.options.map((o) => (
        <li
          key={o.id}
          className={`rounded-lg border p-2 ${o.available ? 'border-slate-200' : 'border-slate-100 text-slate-400'}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium">
              {o.icon} {o.label}
            </span>
            <span>{o.roundTripCostUsd === 0 ? 'Free' : `${money(o.roundTripCostUsd)} round trip`}</span>
          </div>
          {o.available ? (
            <p className="text-xs text-slate-600">
              Leave by {formatTime(o.leaveBy)} · arrive {formatTime(o.arrive)} ·{' '}
              {formatDuration(o.oneWayMinutes)} each way
            </p>
          ) : (
            <p className="text-xs">{o.whyNot}</p>
          )}
          {o.notes.length > 0 && <p className="text-xs text-slate-500">{o.notes.join(' ')}</p>}
        </li>
      ))}
    </ul>
  )
}
