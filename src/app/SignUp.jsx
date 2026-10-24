/**
 * Sign-up page. Collects name, email, password, and a ROLE (Patient / PCP /
 * Specialist). The role shapes what the user sees once signed in.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { Card, Button } from '../shared/ui.jsx'
import { USER_ROLES, USER_ROLE_LABELS } from '../shared/models.js'

const ROLE_HINTS = {
  patient: 'You are receiving care and want to track your referral.',
  pcp: 'You refer patients to specialists and want to see outcomes.',
  specialist: 'You receive referrals and need the patient’s information.',
}

export default function SignUp() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(field) {
    return (value) => setForm((f) => ({ ...f, [field]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signup(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
      <p className="mt-1 text-slate-600">Pick the role that matches how you use the Navigator.</p>

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Full name" value={form.name} onChange={set('name')} autoComplete="name" />
          <Field label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            hint="At least 6 characters."
          />

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">I am a…</legend>
            <div className="mt-2 space-y-2">
              {USER_ROLES.map((role) => (
                <label
                  key={role}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                    form.role === role
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={form.role === role}
                    onChange={() => set('role')(role)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">
                      {USER_ROLE_LABELS[role]}
                    </span>
                    <span className="block text-xs text-slate-500">{ROLE_HINTS[role]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <Button type="submit">{busy ? 'Creating…' : 'Create account'}</Button>
        </form>
      </Card>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/signin" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, autoComplete, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}
