/**
 * Shared UI building blocks. Use these in every workstream so the three
 * sections look like one product. Keep styling decisions here, not scattered
 * across feature folders.
 */

// Explicit map — Tailwind can only generate classes it sees as complete
// strings, so never build these with string interpolation.
const ACCENT_BAR = {
  'brand-600': 'bg-brand-600',
  care: 'bg-care',
  find: 'bg-find',
  coordinate: 'bg-coordinate',
}

/** Page wrapper with a title, optional subtitle, and an accent color. */
export function PageHeader({ title, subtitle, accent = 'brand-600' }) {
  const bar = ACCENT_BAR[accent] ?? ACCENT_BAR['brand-600']
  return (
    <header className="mb-6">
      <div className={`h-1 w-16 rounded ${bar} mb-3`} aria-hidden="true" />
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
    </header>
  )
}

/** Simple card container. */
export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

/** Colored status / category pill. */
export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-brand-100 text-brand-700',
    violet: 'bg-violet-100 text-violet-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone] ?? tones.slate}`}
    >
      {children}
    </span>
  )
}

/** Primary button. */
export function Button({ children, onClick, type = 'button', variant = 'primary' }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

/** Formats a USD amount using the shared region currency. */
export function money(amountUsd) {
  return `$${Number(amountUsd).toLocaleString('en-US')}`
}
