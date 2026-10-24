/**
 * Care preferences: language + low-literacy mode (Workstream A, A-14..A-16).
 *
 * A-14: account for different languages, literacy levels, and digital skills.
 *       → a language toggle (en/es) and a low-literacy mode (bigger text,
 *         simpler words, read-aloud).
 * A-15: patients use basic/shared phones with patchy internet.
 *       → read-aloud and large tap targets work offline via the browser; no
 *         extra install or data needed.
 * A-16: CHWs and family help people get care.
 *       → a "read aloud" affordance so a family member or CHW can voice the
 *         guidance for someone who can't read it.
 *
 * BOUNDARY: lives entirely in the care feature. It reads the patient's
 * `languages` (read-only) but changes no shared data, model, or UI.
 *
 * This is deliberately a small, self-contained i18n layer for the care
 * section's own strings — not an app-wide i18n system (which would be a shared
 * change to coordinate with the team).
 */
import { createContext, useContext, useMemo, useState } from 'react'

/** Supported languages in the care section. Extend as needed. */
export const CARE_LANGUAGES = {
  English: { code: 'en', speechLocale: 'en-US', label: 'English' },
  Spanish: { code: 'es', speechLocale: 'es-ES', label: 'Español' },
}

/**
 * Care-section string dictionary. Keys are stable; values are per language
 * code. Falls back to English, then to the key itself, so a missing string is
 * never fatal.
 */
const STRINGS = {
  en: {
    'page.subtitle':
      'Recognize the need, then understand the true cost and what help is available.',
    'mode.patient': 'I need help',
    'mode.chw': 'I’m a health worker',
    'prefs.language': 'Language',
    'prefs.easyRead': 'Easy-read mode',
    'prefs.easyReadHint':
      'Bigger text and simpler words. Tap the speaker to hear it read aloud.',
    'prefs.readAloud': 'Read aloud',
    'prefs.stop': 'Stop',
    // Symptom checker (A-1..A-5)
    'sym.title': 'What are you feeling?',
    'sym.titlePatient': 'What is the patient feeling?',
    'sym.intro':
      'Describe it in your own words. We’ll point you to the kind of care to ask for first — this is guidance, not a diagnosis.',
    'sym.inputLabel': 'Describe your symptom',
    'sym.placeholder': 'e.g. chest feels tight when I walk uphill',
    'sym.check': 'Check',
    'sym.checking': 'Checking…',
    'sym.clear': 'Clear',
    'sym.tryExample': 'Try an example:',
    'sym.thinking': 'Thinking about the best kind of care to suggest…',
    'sym.careType': 'Suggested care type:',
    'sym.matched': 'Matched your words:',
    'sym.flagged': 'Flagged because you mentioned:',
    'sym.notDiagnosis':
      'Guidance only — not a diagnosis. Clinical decisions stay with a qualified clinician (X-1).',
    'sym.noKey':
      'No LLM key found — using the offline keyword helper. Add VITE_GROQ_API_KEY to .env.local for AI suggestions.',
    'sym.errFallback': 'Something went wrong. A general doctor is a safe first step.',
    'badge.ai': 'AI',
    'badge.offline': 'Offline',
    // Cost (A-7/A-8)
    'cost.title': 'Estimated cost',
    'cost.intro':
      'Change any amount to match your situation. Some costs are known before you go; others only after you are seen.',
    'cost.total': 'Total cost',
    'cost.covered': 'Paid by your scheme',
    'cost.outOfPocket': 'What you pay',
    'cost.bestWorst': 'lowest to highest',
    'cost.knownUpFront': 'How much is known before you go',
    'cost.reset': 'Start over',
    // Coverage / aid (A-9..A-12)
    'aid.title': 'Help paying',
    'aid.intro':
      'Here is what may help pay — what it covers, what could slow it down, and the papers to bring.',
    'aid.schemes': 'Insurance & government schemes',
    'aid.scholarships': 'Scholarships & charity help',
    'aid.bring': 'Bring',
    'aid.howToApply': 'How to get it',
    'aid.watchOut': 'Watch out for',
    'aid.sortEarly': 'Sort these papers out early',
    'aid.hardDocsBody':
      'These documents are often the hardest for rural families to produce, and missing them is a common reason aid goes unclaimed:',
    'aid.scholarshipsHint':
      'Aid most people never hear about — this is why it often goes unclaimed.',
    'aid.noSchemes': 'No matching schemes found for your situation.',
    'aid.noAid': 'No extra aid programs matched right now.',
    'aid.needs': 'Needs',
    'status.enrolled': 'Enrolled',
    'status.may_qualify': 'May qualify',
    'status.unlikely': 'Unlikely',
    'kind.government': 'Government scheme',
    'kind.insurance': 'Insurance',
    'kind.charity': 'Charity',
    'kind.ngo_grant': 'NGO grant',
    'aid.coversUpTo': 'covers up to',
    'aid.alreadyEnrolled': 'You are already enrolled',
    'doc.diff.hard': 'Often hard for rural families to produce',
    'doc.diff.medium': 'Takes some effort to gather',
    'doc.diff.easy': 'Usually easy to provide',
    // Cost line items + misc
    'cost.item': 'Item',
    'cost.yourEstimate': 'Your estimate',
    'cost.knownBadge': 'known up front',
    'cost.variesBadge': 'varies',
    'cost.budgetPrefix': 'Monthly budget is',
    'cost.overBudget': 'expected cost is over budget',
    'cost.withinBudget': 'expected cost is within budget',
    'cost.worstExceeds': 'but the worst case ({amt}) would exceed it.',
    'cost.knownHint':
      'The rest depends on what the specialist finds — ask for a written estimate to avoid a surprise bill.',
  },
  es: {
    'page.subtitle':
      'Reconozca la necesidad y luego entienda el costo real y la ayuda disponible.',
    'mode.patient': 'Necesito ayuda',
    'mode.chw': 'Soy trabajador de salud',
    'prefs.language': 'Idioma',
    'prefs.easyRead': 'Modo de lectura fácil',
    'prefs.easyReadHint':
      'Texto más grande y palabras más simples. Toque el altavoz para escucharlo.',
    'prefs.readAloud': 'Leer en voz alta',
    'prefs.stop': 'Detener',
    'sym.title': '¿Qué está sintiendo?',
    'sym.titlePatient': '¿Qué está sintiendo el paciente?',
    'sym.intro':
      'Descríbalo con sus propias palabras. Le indicaremos qué tipo de atención pedir primero — esto es orientación, no un diagnóstico.',
    'sym.inputLabel': 'Describa su síntoma',
    'sym.placeholder': 'ej. el pecho se siente apretado al subir una cuesta',
    'sym.check': 'Revisar',
    'sym.checking': 'Revisando…',
    'sym.clear': 'Borrar',
    'sym.tryExample': 'Pruebe un ejemplo:',
    'sym.thinking': 'Pensando en el mejor tipo de atención para sugerir…',
    'sym.careType': 'Tipo de atención sugerido:',
    'sym.matched': 'Coincide con sus palabras:',
    'sym.flagged': 'Marcado porque usted mencionó:',
    'sym.notDiagnosis':
      'Solo orientación — no es un diagnóstico. Las decisiones clínicas quedan con un profesional calificado (X-1).',
    'sym.noKey':
      'No se encontró clave de LLM — usando el ayudante sin conexión. Agregue VITE_GROQ_API_KEY a .env.local para sugerencias con IA.',
    'sym.errFallback': 'Algo salió mal. Un médico general es un buen primer paso.',
    'badge.ai': 'IA',
    'badge.offline': 'Sin conexión',
    'cost.title': 'Costo estimado',
    'cost.intro':
      'Cambie cualquier cantidad según su situación. Algunos costos se conocen antes de ir; otros solo después de ser atendido.',
    'cost.total': 'Costo total',
    'cost.covered': 'Pagado por su plan',
    'cost.outOfPocket': 'Lo que usted paga',
    'cost.bestWorst': 'de menor a mayor',
    'cost.knownUpFront': 'Cuánto se sabe antes de ir',
    'cost.reset': 'Empezar de nuevo',
    'aid.title': 'Ayuda para pagar',
    'aid.intro':
      'Esto es lo que puede ayudar a pagar — qué cubre, qué podría retrasarlo y los papeles que debe llevar.',
    'aid.schemes': 'Seguros y programas del gobierno',
    'aid.scholarships': 'Becas y ayuda de caridad',
    'aid.bring': 'Lleve',
    'aid.howToApply': 'Cómo obtenerlo',
    'aid.watchOut': 'Tenga cuidado con',
    'aid.sortEarly': 'Consiga estos papeles con tiempo',
    'aid.hardDocsBody':
      'Estos documentos suelen ser los más difíciles de conseguir para las familias rurales, y no tenerlos es una razón común por la que la ayuda no se reclama:',
    'aid.scholarshipsHint':
      'Ayuda de la que casi nadie se entera — por eso a menudo no se reclama.',
    'aid.noSchemes': 'No se encontraron programas para su situación.',
    'aid.noAid': 'Ningún programa de ayuda adicional coincide por ahora.',
    'aid.needs': 'Necesita',
    'status.enrolled': 'Inscrito',
    'status.may_qualify': 'Puede calificar',
    'status.unlikely': 'Poco probable',
    'kind.government': 'Programa del gobierno',
    'kind.insurance': 'Seguro',
    'kind.charity': 'Caridad',
    'kind.ngo_grant': 'Subvención de ONG',
    'aid.coversUpTo': 'cubre hasta',
    'aid.alreadyEnrolled': 'Ya está inscrito',
    'doc.diff.hard': 'Difícil de conseguir para familias rurales',
    'doc.diff.medium': 'Requiere algo de esfuerzo conseguirlo',
    'doc.diff.easy': 'Normalmente fácil de aportar',
    'cost.item': 'Concepto',
    'cost.yourEstimate': 'Su estimación',
    'cost.knownBadge': 'se sabe antes',
    'cost.variesBadge': 'varía',
    'cost.budgetPrefix': 'El presupuesto mensual es',
    'cost.overBudget': 'el costo esperado supera el presupuesto',
    'cost.withinBudget': 'el costo esperado está dentro del presupuesto',
    'cost.worstExceeds': 'pero el peor caso ({amt}) lo superaría.',
    'cost.knownHint':
      'El resto depende de lo que encuentre el especialista — pida un presupuesto por escrito para evitar una factura sorpresa.',
  },
}

const CarePrefsContext = createContext(null)

/**
 * Provider. Seeds the language list from the patient's own languages (A-14),
 * falling back to English if none are known.
 *
 * @param {{ patient?: import('../../shared/models.js').Patient, children: any }} props
 */
export function CarePreferencesProvider({ patient, children }) {
  const available = useMemo(() => {
    const names = (patient?.languages ?? ['English']).filter(
      (n) => CARE_LANGUAGES[n],
    )
    return names.length > 0 ? names : ['English']
  }, [patient])

  const [lang, setLang] = useState(available[0])
  const [lowLiteracy, setLowLiteracy] = useState(false)

  const value = useMemo(() => {
    const code = CARE_LANGUAGES[lang]?.code ?? 'en'
    const locale = CARE_LANGUAGES[lang]?.speechLocale ?? 'en-US'

    /** Translate a key for the current language, with safe fallbacks. */
    const t = (key) =>
      STRINGS[code]?.[key] ?? STRINGS.en[key] ?? key

    /** Read text aloud in the current language (A-15/A-16). No-op if unsupported. */
    const speak = (text) => {
      try {
        const synth = window.speechSynthesis
        if (!synth || !text) return
        synth.cancel()
        const u = new SpeechSynthesisUtterance(String(text))
        u.lang = locale
        synth.speak(u)
      } catch {
        /* speech not available — silently ignore */
      }
    }

    const stopSpeaking = () => {
      try {
        window.speechSynthesis?.cancel()
      } catch {
        /* ignore */
      }
    }

    const canSpeak =
      typeof window !== 'undefined' && 'speechSynthesis' in window

    return {
      lang,
      setLang,
      available,
      lowLiteracy,
      setLowLiteracy,
      code,
      locale,
      t,
      speak,
      stopSpeaking,
      canSpeak,
    }
  }, [lang, lowLiteracy, available])

  return (
    <CarePrefsContext.Provider value={value}>
      {children}
    </CarePrefsContext.Provider>
  )
}

/**
 * Small "read aloud" button (A-15/A-16). Renders nothing if the browser has no
 * speech support. Pass the text to voice in the current language.
 *
 * @param {{ text: string, className?: string }} props
 */
export function ReadAloudButton({ text, className = '' }) {
  const { speak, canSpeak, t } = useCarePrefs()
  if (!canSpeak || !text) return null
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      title={t('prefs.readAloud')}
      aria-label={t('prefs.readAloud')}
      className={`inline-grid h-7 w-7 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-care ${className}`}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  )
}

/** Hook. Safe default so components work even if used outside the provider. */
export function useCarePrefs() {
  const ctx = useContext(CarePrefsContext)
  if (ctx) return ctx
  // Fallback: English, no low-literacy, speech off. Keeps components robust.
  return {
    lang: 'English',
    setLang: () => {},
    available: ['English'],
    lowLiteracy: false,
    setLowLiteracy: () => {},
    code: 'en',
    locale: 'en-US',
    t: (key) => STRINGS.en[key] ?? key,
    speak: () => {},
    stopSpeaking: () => {},
    canSpeak: false,
  }
}
