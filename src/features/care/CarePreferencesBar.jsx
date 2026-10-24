/**
 * CarePreferencesBar — language toggle + easy-read (low-literacy) mode
 * (Workstream A, A-14..A-16).
 *
 * - Language toggle seeded from the patient's own languages (A-14). Maria
 *   speaks English and Spanish, so both appear.
 * - Easy-read mode: bigger text and simpler words (applied by CarePage), with
 *   a read-aloud option so a CHW or family member can voice it for someone who
 *   can't read it (A-15, A-16).
 *
 * Self-contained to the care feature. Uses only the local preferences context
 * and shared UI primitives (not modified).
 */
import { CARE_LANGUAGES, useCarePrefs } from './carePreferences.jsx'

export default function CarePreferencesBar() {
  const { lang, setLang, available, lowLiteracy, setLowLiteracy, t, stopSpeaking } =
    useCarePrefs()

  function changeLang(next) {
    stopSpeaking()
    setLang(next)
  }

  // Only show the language toggle if there's a real choice to make.
  const showLang = available.length > 1

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {showLang && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {t('prefs.language')}
          </span>
          <div
            role="group"
            aria-label={t('prefs.language')}
            className="inline-flex rounded-md border border-slate-200 p-0.5"
          >
            {available.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={lang === name}
                onClick={() => changeLang(name)}
                className={[
                  'rounded px-3 py-1 text-sm font-medium transition-colors',
                  lang === name
                    ? 'bg-care text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                {CARE_LANGUAGES[name]?.label ?? name}
              </button>
            ))}
          </div>
        </div>
      )}

      <label
        className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
        title={t('prefs.easyReadHint')}
      >
        <input
          type="checkbox"
          checked={lowLiteracy}
          onChange={(e) => setLowLiteracy(e.target.checked)}
          className="h-4 w-4 accent-care"
        />
        <span className="font-medium">{t('prefs.easyRead')}</span>
      </label>
    </div>
  )
}
