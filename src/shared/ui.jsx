/**
 * Shared UI building blocks. Use these in every workstream so the three
 * sections look like one product. Keep styling decisions here, not scattered
 * across feature folders.
 *
 * All components are backward-compatible: existing call sites (PageHeader,
 * Card, Badge, Button, money) keep working; new props and primitives are
 * additive.
 */

// Explicit map — Tailwind can only generate classes it sees as complete
// strings, so never build these with string interpolation.
const ACCENT_BAR = {
  'brand-600': 'bg-brand-600',
  care: 'bg-care-600',
  find: 'bg-find-600',
  coordinate: 'bg-coordinate-600',
}

const ACCENT = {
  'brand-600': { bar: 'bg-brand-600', text: 'text-brand-700', soft: 'bg-brand-50' },
  care: { bar: 'bg-care-600', text: 'text-care-700', soft: 'bg-care-50' },
  find: { bar: 'bg-find-600', text: 'text-find-700', soft: 'bg-find-50' },
  coordinate: { bar: 'bg-coordinate-600', text: 'text-coordinate-700', soft: 'bg-coordinate-50' },
}

/** Page wrapper with a title, optional subtitle, and an accent color. */
export function PageHeader({ title, subtitle, accent = 'brand-600' }) {
  const bar = ACCENT_BAR[accent] ?? ACCENT_BAR['brand-600']
  return (
    <header className="mb-6">
      <div className={`h-1 w-16 rounded-full ${bar} mb-3`} aria-hidden="true" />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-slate-600">{subtitle}</p>}
    </header>
  )
}

/** Simple card container. Pass `hover` for an interactive lift. */
export function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={[
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-card',
        hover ? 'transition hover:-translate-y-0.5 hover:shadow-card-hover' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

/** Colored status / category pill. */
export function Badge({ children, tone = 'slate', className = '' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-brand-100 text-brand-700',
    violet: 'bg-violet-100 text-violet-700',
    care: 'bg-care-100 text-care-700',
    find: 'bg-find-100 text-find-700',
    coordinate: 'bg-coordinate-100 text-coordinate-700',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone] ?? tones.slate} ${className}`}
    >
      {children}
    </span>
  )
}

/** Button with variants and sizes. Existing `variant`/default usage unchanged. */
export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    care: 'bg-care-600 text-white hover:bg-care-700 shadow-sm',
    find: 'bg-find-600 text-white hover:bg-find-700 shadow-sm',
    coordinate: 'bg-coordinate-600 text-white hover:bg-coordinate-700 shadow-sm',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Bare input for inline controls. */
export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
      {...props}
    />
  )
}

/** A small stat (big number + label) for footers / headers. */
export function Stat({ value, label, icon, tone = 'brand-600' }) {
  const a = ACCENT[tone] ?? ACCENT['brand-600']
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${a.soft} ${a.text} text-lg`}>
          {icon}
        </span>
      )}
      <div>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

/** A circular icon chip in an accent color (used in headers and section cards). */
export function IconChip({ children, accent = 'brand-600', className = '' }) {
  const a = ACCENT[accent] ?? ACCENT['brand-600']
  return (
    <span className={`grid h-11 w-11 place-items-center rounded-xl ${a.bar} text-white text-lg shadow-sm ${className}`}>
      {children}
    </span>
  )
}

/** Formats a USD amount using the shared region currency. */
export function money(amountUsd) {
  return `$${Number(amountUsd).toLocaleString('en-US')}`
}
