import { Link } from 'react-router-dom'
import { Card, Badge, money } from '../shared/ui.jsx'
import { demoPatient, REGION } from '../data/mockData.js'
import { useCarePrefs, CARE_LANGUAGES } from '../features/care/carePreferences.jsx'

const sections = [
  { to: '/care', key: 'care', accent: 'text-care', bar: 'bg-care' },
  { to: '/find', key: 'find', accent: 'text-find', bar: 'bg-find' },
  { to: '/coordinate', key: 'coordinate', accent: 'text-coordinate', bar: 'bg-coordinate' },
]

export default function Home() {
  const { t } = useCarePrefs()
  return (
    <div>
      <section className="mb-10">
        <Badge tone="blue">
          {t('home.region')} {REGION.name}
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{t('home.title')}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">{t('home.intro')}</p>
      </section>

      {/* The shared demo patient — proves all three sections are one system. */}
      <Card className="mb-10 border-brand-100 bg-brand-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-700">{t('home.demoPatient')}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {demoPatient.name}, {demoPatient.age}
            </p>
            <p className="text-sm text-slate-600">
              {demoPatient.location} · {demoPatient.distanceToSpecialistMiles} {t('home.toSpecialist')} ·{' '}
              {t('home.budget')} {money(demoPatient.monthlyBudgetUsd)}
              {t('home.perMonth')}
            </p>
            <p className="mt-1 text-sm italic text-slate-500">“{demoPatient.primarySymptom}”</p>
          </div>
          <LanguageSwitch />
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
            <h2 className={`text-xl font-bold ${s.accent}`}>{t(`home.${s.key}.title`)}</h2>
            <p className="mt-2 text-sm text-slate-600">{t(`home.${s.key}.blurb`)}</p>
            <span className="mt-4 inline-block text-sm font-medium text-brand-600 group-hover:underline">
              {t('home.open')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** Maria's languages as a real switch (app-wide, remembered on this device). */
function LanguageSwitch() {
  const { t, lang, setLang, available, stopSpeaking } = useCarePrefs()
  if (available.length < 2) return null
  return (
    <div className="text-right">
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
      <p className="mt-1 max-w-[16rem] text-xs text-slate-500">{t('home.languageHint')}</p>
    </div>
  )
}
