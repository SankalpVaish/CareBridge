/**
 * Emergency help for the symptom checker's emergency result (A-3, X-2):
 * the region's emergency number as a tap-to-call button, and the nearest
 * verified emergency department. Works from local data only, no network.
 */
import { providers, REGION } from '../../data/mockData.js'
import { nearestEmergency } from './search.js'

export default function EmergencyHelp() {
  const er = nearestEmergency(providers)
  return (
    <div className="mt-3 space-y-2">
      <a
        href={`tel:${REGION.emergencyNumber}`}
        className="block rounded-lg bg-red-600 px-4 py-3 text-center text-lg font-bold text-white hover:bg-red-700"
      >
        Call {REGION.emergencyNumber}
      </a>
      {er && (
        <p className="text-sm text-red-800">
          Nearest emergency department: <span className="font-medium">{er.name}</span>,{' '}
          {er.location} ({er.distanceMiles} mi). Verified with the {er.verification.registry}.
        </p>
      )}
    </div>
  )
}
