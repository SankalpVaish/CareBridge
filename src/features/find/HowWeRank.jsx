/**
 * "How we rank" modal: publishes the exact weights used by ranking.js (B-13).
 */
import { useEffect } from 'react'
import { Button } from '../../shared/ui.jsx'
import {
  WEIGHTS,
  FACTOR_LABELS,
  MAX_TRAVEL_MILES,
  MAX_WAIT_DAYS,
} from './ranking.js'

export default function HowWeRank({ open, onClose }) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-we-rank-title"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="how-we-rank-title" className="text-lg font-semibold text-slate-900">
          How we rank
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          No provider can pay for a higher place, and we don’t use star ratings.
          Only verified providers are ranked. Each one gets a score from these
          factors:
        </p>

        <table className="mt-4 w-full text-sm">
          <tbody>
            {Object.entries(WEIGHTS).map(([key, w]) => (
              <tr key={key} className="border-t border-slate-100">
                <td className="py-2 text-slate-700">{FACTOR_LABELS[key]}</td>
                <td className="py-2 text-right font-medium text-slate-900">
                  {Math.round(w * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-500">
          <li>
            Providers {MAX_TRAVEL_MILES}+ mi away get no travel points, and a wait of{' '}
            {MAX_WAIT_DAYS}+ days gets no wait points.
          </li>
          <li>
            A provider with no referral history yet gets half the loop-closure
            points, so new centres aren’t buried.
          </li>
          <li>When care is needed within days, wait and travel time count for more.</li>
        </ul>

        <div className="mt-5 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
