/**
 * LLM-backed symptom-to-care-type helper (Workstream A, A-1..A-5).
 *
 * Uses Groq's OpenAI-compatible chat API to turn a patient's own words (A-5)
 * into a suggested *type* of care (A-4) with plain-language next steps (A-1).
 *
 * SAFETY (README X-1, X-2) — these are enforced in code, not left to the model:
 *   1. The local emergency red-flag check (suggestCareType) runs FIRST, before
 *      any network call. If it fires, we return the emergency result and never
 *      call the LLM. Danger signs never depend on the network (X-2).
 *   2. The prompt forbids diagnoses and medicine names, and the response is
 *      validated. Anything off-shape falls back to the offline helper (X-1).
 *   3. If there is no API key, or the call fails/times out, we fall back to the
 *      offline keyword helper so the demo always works.
 *
 * The API key is read from import.meta.env.VITE_GROQ_API_KEY (see .env.local).
 * In a frontend-only build this key ships in the browser bundle — acceptable
 * for a local demo only. Use a server proxy before any real deployment.
 */
import { suggestCareType } from './symptomChecker.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-20b'
const API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

export function hasLlmKey() {
  return Boolean(API_KEY)
}

const SYSTEM_PROMPT = `You are a careful triage navigator for rural patients seeking specialty care.
You help people decide WHAT KIND of care to seek first. You are NOT a doctor.

STRICT RULES:
- NEVER give a diagnosis or name any disease, condition, or medicine.
- Only suggest a TYPE of care (e.g. "Heart specialist (cardiology)", "Primary-care / general doctor", "Skin specialist (dermatology)").
- Always recommend seeing a primary-care or general doctor first unless a specialist type is clearly appropriate.
- If the words describe a possible emergency (e.g. severe chest pain, trouble breathing, stroke signs, heavy bleeding, fainting, suicidal thoughts), set kind to "emergency".
- If you cannot tell, set kind to "unclear" and suggest a general doctor.
- Keep language simple and plain. Do not alarm unnecessarily.

Respond with ONLY a JSON object, no markdown, in exactly this shape:
{
  "kind": "emergency" | "suggestion" | "unclear",
  "careType": string,        // plain-language care TYPE; empty string for emergency/unclear
  "headline": string,        // one short "what to do next" sentence
  "notes": string[]          // 1-3 short plain-language tips (first step, why not to wait)
}`

/**
 * Get a care suggestion for the given text. Async.
 * Returns the same CareSuggestion shape as suggestCareType(), plus `source`.
 *
 * @param {string} text
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<import('./symptomChecker.js').CareSuggestion & { source: 'emergency-rules'|'llm'|'offline' }>}
 */
export async function suggestCareTypeLLM(text, opts = {}) {
  const trimmed = String(text || '').trim()

  // 1) EMERGENCY + empty-input gate — always local, always first (X-2).
  const local = suggestCareType(trimmed)
  if (local.kind === 'emergency' || trimmed === '') {
    return { ...local, source: 'emergency-rules' }
  }

  // 2) No key? Use the offline keyword helper.
  if (!API_KEY) {
    return { ...local, source: 'offline' }
  }

  // 3) Ask the LLM.
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        // gpt-oss reasoning models spend tokens before emitting JSON; give
        // enough headroom or the API returns json_validate_failed.
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Patient's words: "${trimmed}"` },
        ],
      }),
      signal: opts.signal,
    })

    if (!res.ok) {
      const detail = await safeErrorText(res)
      throw new Error(`Groq ${res.status}: ${detail}`)
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    const parsed = parseAndValidate(content)

    // Defence in depth: if the model somehow flags an emergency, trust the
    // local emergency copy for consistent, safe wording.
    if (parsed.kind === 'emergency') {
      const emergency = suggestCareType('chest pain') // canonical emergency copy
      return {
        ...emergency,
        headline: 'This may be an emergency. Call emergency services now.',
        matchedWords: [],
        source: 'llm',
      }
    }

    return {
      kind: parsed.kind,
      careType: parsed.careType,
      headline: parsed.headline,
      notes: parsed.notes,
      matchedWords: [],
      source: 'llm',
    }
  } catch (err) {
    // Any failure (network, bad JSON, bad key, retired model) → offline helper.
    if (err?.name === 'AbortError') throw err
    console.warn('[careLLM] falling back to offline helper:', err?.message || err)
    return { ...local, source: 'offline' }
  }
}

/** Parse the model's JSON and coerce it into a safe, known shape. */
function parseAndValidate(content) {
  if (typeof content !== 'string') throw new Error('empty LLM content')

  // Be forgiving if the model wraps JSON in a code fence.
  const cleaned = content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const obj = JSON.parse(cleaned)

  const kind = ['emergency', 'suggestion', 'unclear'].includes(obj.kind)
    ? obj.kind
    : 'unclear'

  const careType = typeof obj.careType === 'string' ? obj.careType.trim() : ''

  const headline =
    typeof obj.headline === 'string' && obj.headline.trim()
      ? obj.headline.trim()
      : 'A primary-care or general doctor is a safe first step.'

  const notes = Array.isArray(obj.notes)
    ? obj.notes.filter((n) => typeof n === 'string' && n.trim()).slice(0, 3)
    : []

  return { kind, careType, headline, notes }
}

async function safeErrorText(res) {
  try {
    const body = await res.json()
    return body?.error?.message || JSON.stringify(body).slice(0, 200)
  } catch {
    return res.statusText
  }
}
