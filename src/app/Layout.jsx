import { NavLink, Link } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/care', label: 'Care & Cost', accent: 'care' },
  { to: '/find', label: 'Find & Trust', accent: 'find' },
  { to: '/coordinate', label: 'Coordinate', accent: 'coordinate' },
]

function navClass({ isActive }) {
  return [
    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white font-bold">
              +
            </span>
            <span className="font-semibold">Rural Specialty-Care Navigator</span>
          </Link>
          <nav aria-label="Main" className="flex gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-slate-500">
          Problem-discovery demo. Clinical decisions stay with qualified
          professionals. See README.md for the research behind each section.
        </div>
      </footer>
    </div>
  )
}
