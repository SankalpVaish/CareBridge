import { Link } from 'react-router-dom'
import { Card, Badge, money } from '../shared/ui.jsx'
import { demoPatient, REGION } from '../data/mockData.js'

const sections = [
  {
    to: '/care',
    title: 'Care & Cost',
    accent: 'text-care',
    bar: 'bg-care',
    blurb:
      'Help patients recognize what care they need and understand the full cost, coverage, and financial aid.',
    observations: ['O1', 'O8', 'O9', 'O15'],
  },
  {
    to: '/find',
    title: 'Find & Trust',
    accent: 'text-find',
    bar: 'bg-find',
    blurb:
      'Discover which providers and specialties exist nearby, compare them fairly, and verify they are legitimate.',
    observations: ['O2', 'O3', 'O4', 'O5', 'O6', 'O7'],
  },
  {
    to: '/coordinate',
    title: 'Coordinate',
    accent: 'text-coordinate',
    bar: 'bg-coordinate',
    blurb:
      'Track referrals, schedule appointments, plan travel and telehealth, and keep care teams in sync.',
    observations: ['O10', 'O11', 'O12', 'O13', 'O14', 'O15'],
  },
]

export default function Home() {
  return (
    <div>
      <section className="mb-10">
        <Badge tone="blue">Region: {REGION.name}</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Getting rural patients to the right specialty care
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          A rural patient who needs a specialist faces a chain of gaps —
          recognition, discovery, availability, affordability, coordination, and
          continuity. This demo walks one patient through all of them.
        </p>
      </section>

      {/* The shared demo patient — proves all three sections are one system. */}
      <Card className="mb-10 border-brand-100 bg-brand-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-700">
              Demo patient (shared across all sections)
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {demoPatient.name}, {demoPatient.age}
            </p>
            <p className="text-sm text-slate-600">
              {demoPatient.location} ·{' '}
              {demoPatient.distanceToSpecialistMiles} mi to nearest specialist ·
              Budget {money(demoPatient.monthlyBudgetUsd)}/mo
            </p>
            <p className="mt-1 text-sm italic text-slate-500">
              “{demoPatient.primarySymptom}”
            </p>
          </div>
          <div className="flex gap-2">
            {demoPatient.languages.map((l) => (
              <Badge key={l}>{l}</Badge>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className={`h-1 w-12 rounded ${s.bar} mb-3`} aria-hidden="true" />
            <h2 className={`text-xl font-bold ${s.accent}`}>{s.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{s.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {s.observations.map((o) => (
                <Badge key={o}>{o}</Badge>
              ))}
            </div>
            <span className="mt-4 inline-block text-sm font-medium text-brand-600 group-hover:underline">
              Open section →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
