/**
 * SymptomChecker — interactive symptom-to-care-type helper (A-1..A-5).
 *
 * Lets a patient type what they feel in their own words (A-5). An emergency
 * danger-sign check runs FIRST and locally (A-3, X-2); otherwise an LLM (Groq)
 * suggests the *type* of care to seek first (A-4) with plain-language next
 * steps so people don't wait (A-1). If there's no API key or the call fails,
 * it falls back to the offline keyword helper so the demo always works.
 *
 * It never diagnoses and never names a disease or medicine (X-1).
 *
 * Self-contained to the care feature. Only shared UI primitives are imported
 * (not modified). No shared models or mock data are changed.
 */
import { useEffect, useRef, useState } from 'react'
import { Card, Badge, Button } from '../../shared/ui.jsx'
import { getExampleSymptoms } from './symptomChecker.js'
import { suggestCareTypeLLM, hasLlmKey } from './llmSymptomChecker.js'
import { useCarePrefs } from './carePreferences.jsx'

/**
 * @param {Object} props
 * @param {string} [props.initialText]  Seed text (e.g. the demo patient's words).
 * @param {string} [props.title]        Explicit title (overrides the default).
 * @param {boolean} [props.patientMode] If true and no title given, use the "patient" title.
 * @param {(result: object|null, text: string) => void} [props.onResult]  Called after each check, and with null on Clear.
 */
export default function SymptomChecker({
  initialText = '',
  title,
  patientMode = false,
  onResult,
}) {
  const { t, code } = useCarePrefs()
  const [text, setText] = useState(initialText)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  const heading =
    title ?? (patientMode ? t('sym.titlePatient') : t('sym.title'))

  // Run once on mount if seeded with the demo patient's words.
  useEffect(() => {
    if (initialText) check(initialText)
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-run the last check when the language changes, so the AI guidance and
  // the offline copy come back in the new language.
  useEffect(() => {
    if (text.trim()) check(text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  async function check(value) {
    const query = value ?? text
    if (!query.trim()) {
      setResult(null)
      return
    }
    // Cancel any in-flight request.
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const r = await suggestCareTypeLLM(query, { signal: controller.signal, lang: code })
      setResult(r)
      onResult?.(r, query)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        const fallback = {
          kind: 'unclear',
          careType: '',
          headline: t('sym.errFallback'),
          notes: [],
          matchedWords: [],
          source: 'offline',
        }
        setResult(fallback)
        onResult?.(fallback, query)
      }
    } finally {
      setLoading(false)
    }
  }

  function useExample(example) {
    setText(example)
    check(example)
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">{heading}</h2>
        <Badge tone="slate">A-1..A-5</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-600">{t('sym.intro')}</p>

      {/* Input */}
      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault()
          check()
        }}
      >
        <label htmlFor="symptom-input" className="sr-only">
          {t('sym.inputLabel')}
        </label>
        <textarea
          id="symptom-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={t('sym.placeholder')}
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-care focus:outline-none focus:ring-1 focus:ring-care"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button type="submit">{loading ? t('sym.checking') : t('sym.check')}</Button>
          {text && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                abortRef.current?.abort()
                setText('')
                setResult(null)
                setLoading(false)
                onResult?.(null, '')
              }}
            >
              {t('sym.clear')}
            </Button>
          )}
        </div>
      </form>

      {/* Example chips (A-5: everyday wording) */}
      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500">{t('sym.tryExample')}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {getExampleSymptoms(code).map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => useExample(ex)}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-care hover:text-care"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <span className="h-3 w-3 animate-pulse rounded-full bg-care" />
          {t('sym.thinking')}
        </div>
      )}
      {!loading && result && <ResultPanel result={result} />}

      {!hasLlmKey() && (
        <p className="mt-3 text-xs text-amber-600">{t('sym.noKey')}</p>
      )}
    </Card>
  )
}

function SourceBadge({ source }) {
  const { t } = useCarePrefs()
  if (source === 'llm') return <Badge tone="violet">{t('badge.ai')}</Badge>
  if (source === 'offline') return <Badge tone="slate">{t('badge.offline')}</Badge>
  return null
}

function ResultPanel({ result }) {
  const { t } = useCarePrefs()
  if (result.kind === 'emergency') {
    return (
      <div
        role="alert"
        className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-lg">🚨</span>
          <p className="font-semibold text-red-800">{result.headline}</p>
        </div>
        <ul className="mt-2 list-disc pl-6 text-sm text-red-800">
          {result.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        {result.matchedWords?.length > 0 && (
          <p className="mt-2 text-xs text-red-700">
            {t('sym.flagged')} {result.matchedWords.join(', ')}
          </p>
        )}
      </div>
    )
  }

  const tone =
    result.kind === 'suggestion'
      ? 'border-care/40 bg-care/10 text-slate-700'
      : 'border-slate-200 bg-slate-50 text-slate-700'

  return (
    <div className={`mt-4 rounded-lg border p-3 ${tone}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-slate-900">{result.headline}</p>
        <SourceBadge source={result.source} />
      </div>
      {result.careType && (
        <p className="mt-1 text-sm">
          {t('sym.careType')}{' '}
          <span className="font-semibold text-slate-900">
            {result.careType}
          </span>
        </p>
      )}
      {result.notes?.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-sm">
          {result.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {result.matchedWords?.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          {t('sym.matched')} {result.matchedWords.join(', ')}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500">{t('sym.notDiagnosis')}</p>
    </div>
  )
}
