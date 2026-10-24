/**
 * Sign-in page. On success, redirects to where the user was headed (or home).
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { Card, Button } from '../shared/ui.jsx'

export default function SignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-1 text-slate-600">Welcome back to the Navigator.</p>

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <Button type="submit">{busy ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </Card>

      <p className="mt-4 text-sm text-slate-600">
        No account?{' '}
        <Link to="/signup" className="font-medium text-brand-600 hover:underline">
          Create one
        </Link>
      </p>

      <DemoHint />
    </div>
  )
}

function Field({ label, type, value, onChange, autoComplete }) {
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
    </label>
  )
}

/** Convenience for judges/teammates: the seeded demo accounts. */
function DemoHint() {
  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <p className="font-medium text-slate-700">Demo accounts (password: demo1234)</p>
      <ul className="mt-1 space-y-0.5">
        <li>maria@example.com — Patient</li>
        <li>pcp@example.com — Primary-care provider</li>
        <li>specialist@example.com — Specialist</li>
      </ul>
    </div>
  )
}
