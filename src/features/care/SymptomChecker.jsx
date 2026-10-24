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
import { EXAMPLE_SYMPTOMS } from './symptomChecker.js'
import { suggestCareTypeLLM, hasLlmKey } from './llmSymptomChecker.js'

/**
 * @param {Object} props
 * @param {string} [props.initialText]  Seed text (e.g. the demo patient's words).
 */
export default function SymptomChecker({ initialText = '' }) {
  const [text, setText] = useState(initialText)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  // Run once on mount if seeded with the demo patient's words.
  useEffect(() => {
    if (initialText) check(initialText)
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      const r = await suggestCareTypeLLM(query, { signal: controller.signal })
      setResult(r)
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setResult({
          kind: 'unclear',
          careType: '',
          headline: 'Something went wrong. A general doctor is a safe first step.',
          notes: [],
          matchedWords: [],
          source: 'offline',
        })
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
        <h2 className="font-semibold text-slate-900">What are you feeling?</h2>
        <Badge tone="slate">A-1..A-5</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Describe it in your own words. We’ll point you to the kind of care to
        ask for first — this is guidance, not a diagnosis.
      </p>

      {/* Input */}
      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault()
          check()
        }}
      >
        <label htmlFor="symptom-input" className="sr-only">
          Describe your symptom
        </label>
        <textarea
          id="symptom-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="e.g. chest feels tight when I walk uphill"
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-care focus:outline-none focus:ring-1 focus:ring-care"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button type="submit">{loading ? 'Checking…' : 'Check'}</Button>
          {text && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                abortRef.current?.abort()
                setText('')
                setResult(null)
                setLoading(false)
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Example chips (A-5: everyday wording) */}
      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500">Try an example:</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {EXAMPLE_SYMPTOMS.map((ex) => (
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
          Thinking about the best kind of care to suggest…
        </div>
      )}
      {!loading && result && <ResultPanel result={result} />}

      {!hasLlmKey() && (
        <p className="mt-3 text-xs text-amber-600">
          No LLM key found — using the offline keyword helper. Add
          VITE_GROQ_API_KEY to .env.local for AI suggestions.
        </p>
      )}
    </Card>
  )
}

function SourceBadge({ source }) {
  if (source === 'llm') return <Badge tone="violet">AI</Badge>
  if (source === 'offline') return <Badge tone="slate">Offline</Badge>
  return null
}

function ResultPanel({ result }) {
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
            Flagged because you mentioned: {result.matchedWords.join(', ')}
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
          Suggested care type:{' '}
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
          Matched your words: {result.matchedWords.join(', ')}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Guidance only — not a diagnosis. Clinical decisions stay with a
        qualified clinician (X-1).
      </p>
    </div>
  )
}
