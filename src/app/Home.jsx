import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Badge, Button, Input, Stat, IconChip, money } from '../shared/ui.jsx'
import { demoPatient } from '../data/mockData.js'
import { useCarePrefs, CARE_LANGUAGES } from '../features/care/carePreferences.jsx'

const SEARCH_CHIPS = ['Cardiology', 'Oncology', 'Neurology', 'Near me', 'Accepts Medicaid', 'Travel support']

const sections = [
  {
    to: '/care',
    key: 'care',
    accent: 'care',
    icon: '🩺',
    points: ['Estimated costs & insurance coverage', 'Financial assistance programs', 'Compare treatment options'],
  },
  {
    to: '/find',
    key: 'find',
    accent: 'find',
    icon: '🔎',
    points: ['Search verified specialists', 'Compare providers fairly', 'Check credentials & spot fraud'],
  },
  {
    to: '/coordinate',
    key: 'coordinate',
    accent: 'coordinate',
    icon: '📋',
    points: ['Schedule appointments', 'Plan travel and lodging', 'Stay connected with your care team'],
  },
]

const HERO_ACTIONS = [
  { label: 'Find specialist', icon: '❤', to: '/find' },
  { label: 'Schedule', icon: '📅', to: '/coordinate' },
  { label: 'Plan travel', icon: '🚐', to: '/coordinate' },
  { label: 'Check coverage', icon: '✓', to: '/care' },
  { label: 'Stay connected', icon: '💬', to: '/coordinate' },
]

const JOURNEY = [
  { label: 'Symptoms', icon: '🩺', state: 'done' },
  { label: 'Find Care', icon: '🔎', state: 'done' },
  { label: 'Schedule', icon: '📅', state: 'current' },
  { label: 'Plan Travel', icon: '🚐', state: 'todo' },
  { label: 'Ongoing Care', icon: '❤', state: 'todo' },
]

const NEXT_STEPS = [
  { to: '/coordinate', icon: '📅', title: 'Schedule cardiology appointment', sub: '2 recommended specialists nearby' },
  { to: '/care', icon: '🛡', title: 'Check insurance coverage', sub: 'Medicaid plan verified' },
  { to: '/coordinate', icon: '🚐', title: 'Plan travel & lodging', sub: 'Options within 60 miles' },
]

export default function Home() {
  const { t } = useCarePrefs()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function onSearch(e) {
    e.preventDefault()
    navigate('/find') // Find owns real search; hand off there.
  }

  return (
    <div className="space-y-6">
      <Hero t={t} query={query} setQuery={setQuery} onSearch={onSearch} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PatientCard t={t} />
          <div className="grid gap-5 sm:grid-cols-3">
            {sections.map((s) => (
              <SectionCard key={s.to} section={s} t={t} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <CareJourney t={t} />
          <NextSteps t={t} />
          <HelpCard t={t} />
        </div>
      </div>

      <StatStrip />
    </div>
  )
}

function Hero({ t, query, setQuery, onSearch }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Scenic backdrop on the right */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-cover bg-center opacity-90"
        style={{ backgroundImage: 'url(/hero-scene.svg)' }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent" aria-hidden="true" />

      <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {t('home.heroTitlePre')} <span className="text-brand-600">{t('home.heroTitleEm')}</span>
          </h1>
          <p className="mt-3 max-w-lg text-slate-600">{t('home.heroSubtitle')}</p>

          <form onSubmit={onSearch} className="mt-6 flex max-w-lg gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
                🔍
              </span>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="py-2.5 pl-9"
                aria-label={t('home.searchPlaceholder')}
              />
            </div>
            <Button type="submit" size="lg">{t('home.search')}</Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">{t('home.try')}</span>
            {SEARCH_CHIPS.map((chip) => (
              <Link
                key={chip}
                to="/find"
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
              >
                {chip}
              </Link>
            ))}
          </div>
        </div>

        {/* Quote + floating action pills (reference) */}
        <div className="relative hidden lg:block">
          <div className="ml-auto max-w-[13rem] rotate-1 rounded-2xl bg-white/85 p-3 text-sm italic text-slate-600 shadow-card">
            {t('home.quote')}
            <span className="mt-1 block text-right text-xs font-medium not-italic text-slate-500">
              — {demoPatient.name.split(' ')[0]}, {demoPatient.age} · {demoPatient.location}
            </span>
          </div>
          <div className="mt-6 flex flex-col items-end gap-2">
            {HERO_ACTIONS.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span aria-hidden="true">{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PatientCard({ t }) {
  const { lang, setLang, available, stopSpeaking } = useCarePrefs()
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-base font-semibold text-brand-700">
            {demoPatient.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-slate-900">
                {demoPatient.name}, {demoPatient.age}
              </p>
              <Badge tone="blue">{t('home.demoPatient')}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              {demoPatient.location} · {demoPatient.distanceToSpecialistMiles} {t('home.toSpecialist')} ·{' '}
              {t('home.budget')} {money(demoPatient.monthlyBudgetUsd)}{t('home.perMonth')}
            </p>
            <p className="mt-1 text-sm italic text-slate-500">“{demoPatient.primarySymptom}”</p>
          </div>
        </div>
        {/* Preserve the working language switch (A-14) */}
        {available.length >= 2 && (
          <div
            role="group"
            aria-label={t('home.language')}
            className="inline-flex rounded-lg border border-brand-100 bg-white p-0.5"
          >
            {available.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={lang === name}
                onClick={() => {
                  stopSpeaking()
                  setLang(name)
                }}
                className={[
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  lang === name ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                {CARE_LANGUAGES[name]?.label ?? name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function SectionCard({ section, t }) {
  const { to, key, accent, icon, points } = section
  return (
    <Link to={to} className="group block">
      <Card hover className="h-full">
        <IconChip accent={accent}>{icon}</IconChip>
        <h2 className="mt-3 flex items-center gap-1 text-lg font-bold text-slate-900">
          {t(`home.${key}.title`)}
          <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500">→</span>
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t(`home.${key}.blurb`)}</p>
        <ul className="mt-3 space-y-1.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-xs text-slate-600">
              <span className="mt-0.5 text-green-600" aria-hidden="true">✓</span>
              {p}
            </li>
          ))}
        </ul>
      </Card>
    </Link>
  )
}

function CareJourney({ t }) {
  const doneCount = JOURNEY.filter((s) => s.state !== 'todo').length
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="text-brand-600" aria-hidden="true">◆</span> {t('home.journey')}
        </h2>
        <span className="text-xs text-slate-500">
          {doneCount} {t('home.stepsOf')} {JOURNEY.length} {t('home.steps')}
        </span>
      </div>
      <ol className="mt-5 flex items-start justify-between">
        {JOURNEY.map((step) => (
          <li key={step.label} className="flex flex-1 flex-col items-center text-center">
            <span
              className={[
                'grid h-9 w-9 place-items-center rounded-full text-sm',
                step.state === 'done'
                  ? 'bg-care-600 text-white'
                  : step.state === 'current'
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : 'bg-slate-100 text-slate-400',
              ].join(' ')}
            >
              {step.state === 'done' ? '✓' : step.icon}
            </span>
            <span className="mt-1.5 text-[11px] font-medium leading-tight text-slate-600">{step.label}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function NextSteps({ t }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="text-brand-600" aria-hidden="true">🗒</span> {t('home.nextSteps')}
        </h2>
        <Link to="/coordinate" className="text-xs font-medium text-brand-600 hover:underline">
          {t('home.viewAll')}
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {NEXT_STEPS.map((s) => (
          <li key={s.title}>
            <Link
              to={s.to}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                {s.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900">{s.title}</span>
                <span className="block text-xs text-slate-500">{s.sub}</span>
              </span>
              <span className="text-slate-300" aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function HelpCard({ t }) {
  return (
    <Card className="flex items-center justify-between gap-3 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
      <div>
        <p className="font-semibold">{t('home.needHelp')}</p>
        <p className="text-sm text-brand-100">{t('home.needHelpSub')}</p>
      </div>
      <Link
        to="/coordinate"
        className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
      >
        {t('home.chatNavigator')}
      </Link>
    </Card>
  )
}

function StatStrip() {
  return (
    <Card>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon="👥" value="2,500+" label="Verified specialists" />
        <Stat icon="🏥" value="180+" label="Rural-friendly hospitals" tone="care" />
        <Stat icon="🗺" value="50 States" label="Coverage & resources" tone="find" />
        <Stat icon="❤" value="92%" label="Patient satisfaction" tone="coordinate" />
      </div>
    </Card>
  )
}
