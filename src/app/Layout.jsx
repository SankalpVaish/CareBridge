import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { USER_ROLE_LABELS } from '../shared/models.js'
import { REGION } from '../data/mockData.js'

const navItems = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/care', label: 'Care & Cost', icon: '🩺' },
  { to: '/find', label: 'Find & Trust', icon: '🔎' },
  { to: '/coordinate', label: 'Coordinate', icon: '📋' },
  { to: '/find/safety', label: 'Resources', icon: '📖' },
]

function navClass({ isActive }) {
  return [
    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'text-brand-700 bg-brand-50'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-sm">
        ✚
      </span>
      <span className="text-[15px] font-bold tracking-tight text-slate-900">CareBridge</span>
    </Link>
  )
}

/** Region pill matching the reference (display-only for now). */
function RegionPill() {
  return (
    <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 lg:inline-flex">
      <span aria-hidden="true">📍</span>
      {REGION.name}
      <span aria-hidden="true" className="text-slate-400">▾</span>
    </span>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <Link
        to="/signin"
        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
      >
        Sign in
      </Link>
    )
  }

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {initials}
      </span>
      <span className="hidden text-left sm:block">
        <span className="block text-sm font-semibold leading-tight text-slate-900">{user.name}</span>
        <span className="block text-xs text-slate-500">{USER_ROLE_LABELS[user.role]}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/')
        }}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Sign out
      </button>
    </div>
  )
}

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                <span aria-hidden="true" className="text-xs opacity-70">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <RegionPill />
            <UserMenu />
          </div>
        </div>

        {/* Compact nav for small screens */}
        <nav
          aria-label="Main (mobile)"
          className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 md:hidden"
        >
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 text-sm text-slate-500">
          CareBridge gets rural patients to the right specialist and brings the
          answer back home. Clinical decisions stay with qualified professionals.
        </div>
      </footer>
    </div>
  )
}
