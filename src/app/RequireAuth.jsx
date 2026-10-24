/**
 * Route guard. Wrap any route that needs a signed-in user. If not signed in,
 * redirects to /signin and remembers where the user was headed.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="py-16 text-center text-slate-500">Loading…</p>
  }
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }
  return children
}
