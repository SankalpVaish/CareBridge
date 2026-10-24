/**
 * Patient mode: a private symptom check. Nothing is saved unless the patient
 * taps "Share with my CHW", which hands the same words and result to their
 * community health worker so nothing is asked twice (A-7, A-8, X-3).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../../shared/ui.jsx'
import { api } from '../../shared/api.js'
import { useAuth } from '../../app/AuthContext.jsx'
import SymptomChecker from './SymptomChecker.jsx'

export default function PatientTriage({ initialText, patientAge }) {
  const { user } = useAuth()
  const [checked, setChecked] = useState(null) // { result, text }
  const [share, setShare] = useState({ state: 'idle' }) // idle | sharing | shared | error

  function onResult(result, text) {
    setChecked(result ? { result, text } : null)
    setShare({ state: 'idle' })
  }

  async function shareWithChw() {
    setShare({ state: 'sharing' })
    try {
      const { session } = await api.createTriage({
        symptomText: checked.text,
        result: checked.result,
      })
      setShare({ state: 'shared', chwName: session.chwName })
    } catch (err) {
      setShare({ state: 'error', message: err.message })
    }
  }

  const isEmergency = checked?.result.kind === 'emergency'

  return (
    <div className="space-y-3">
      <SymptomChecker initialText={initialText} patientAge={patientAge} onResult={onResult} />

      {checked && (
        <Card>
          {!user && (
            <p className="text-sm text-slate-600">
              This check is private and isn’t saved.{' '}
              <Link
                to="/signin"
                state={{ from: { pathname: '/care' } }}
                className="font-medium text-brand-600 hover:underline"
              >
                Sign in
              </Link>{' '}
              to share it with your community health worker.
            </p>
          )}

          {user && user.role !== 'patient' && (
            <p className="text-sm text-slate-600">
              Sharing with a health worker is for patient accounts. This check isn’t saved.
            </p>
          )}

          {user?.role === 'patient' && share.state !== 'shared' && (
            <>
              <p className="text-sm text-slate-600">
                Private by default. Nothing is saved unless you share it.
              </p>
              <div className="mt-2">
                <Button onClick={shareWithChw}>
                  {share.state === 'sharing'
                    ? 'Sharing…'
                    : isEmergency
                      ? 'Alert my health worker'
                      : 'Share with my health worker'}
                </Button>
              </div>
              {share.state === 'error' && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {share.message}
                </p>
              )}
            </>
          )}

          {share.state === 'shared' && (
            <p className="text-sm text-green-700" role="status">
              Shared with {share.chwName}. They’ll see your words and this result, so you
              won’t be asked the same questions again.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
