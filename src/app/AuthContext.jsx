/**
 * Auth context — holds the signed-in user and exposes login/signup/logout.
 *
 * On first load it restores the session from a stored token by calling
 * /api/auth/me, so a refresh keeps you logged in.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../shared/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount if a token exists.
  useEffect(() => {
    let active = true
    async function restore() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const { user } = await api.me()
        if (active) setUser(user)
      } catch {
        setToken(null) // token invalid/expired — clear it
      } finally {
        if (active) setLoading(false)
      }
    }
    restore()
    return () => {
      active = false
    }
  }, [])

  async function login(email, password) {
    const { token, user } = await api.login({ email, password })
    setToken(token)
    setUser(user)
    return user
  }

  async function signup(payload) {
    const { token, user } = await api.signup(payload)
    setToken(token)
    setUser(user)
    return user
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
