/**
 * Minimal property-based testing helper (no dependencies).
 *
 * A property is a function that must hold for every generated input. `check`
 * runs it on many random inputs from a seeded generator, and when one fails it
 * shrinks the input (fewer words, smaller numbers, shorter lists) to the
 * simplest case that still fails, then prints it with the seed so the failure
 * can be replayed exactly:  PBT_SEED=1234 node tests/x.pbt.mjs
 *
 * Generators are objects { gen(rng), shrink(value) -> candidates[] }.
 */

/** Small, fast, seedable random number generator (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    bool: (p = 0.5) => next() < p,
  }
}

// --- Generators ---------------------------------------------------------------

export const gen = {
  int(lo, hi) {
    return {
      gen: (r) => r.int(lo, hi),
      shrink: (v) => {
        const target = lo <= 0 && hi >= 0 ? 0 : lo
        if (v === target) return []
        const out = [target, Math.trunc((v + target) / 2)]
        if (v > target) out.push(v - 1)
        else out.push(v + 1)
        return [...new Set(out)].filter((x) => x !== v && x >= lo && x <= hi)
      },
    }
  },
  pick(list) {
    return {
      gen: (r) => r.pick(list),
      shrink: (v) => (list.indexOf(v) > 0 ? [list[0]] : []),
    }
  },
  bool(p = 0.5) {
    return { gen: (r) => r.bool(p), shrink: (v) => (v ? [false] : []) }
  },
  constant(value) {
    return { gen: () => value, shrink: () => [] }
  },
  nullable(g, p = 0.25) {
    return {
      gen: (r) => (r.bool(p) ? null : g.gen(r)),
      shrink: (v) => (v === null ? [] : [null, ...g.shrink(v)]),
    }
  },
  array(g, min = 0, max = 6) {
    return {
      gen: (r) => Array.from({ length: r.int(min, max) }, () => g.gen(r)),
      shrink: (v) => {
        const out = []
        if (v.length > min) {
          out.push(v.slice(0, min)) // shortest allowed
          for (let i = 0; i < v.length; i++) out.push([...v.slice(0, i), ...v.slice(i + 1)])
        }
        v.forEach((x, i) => {
          for (const s of g.shrink(x).slice(0, 2)) out.push([...v.slice(0, i), s, ...v.slice(i + 1)])
        })
        return out
      },
    }
  },
  /** A random subset of `list`, in list order. */
  subset(list) {
    return {
      gen: (r) => list.filter(() => r.bool()),
      shrink: (v) => v.map((_, i) => [...v.slice(0, i), ...v.slice(i + 1)]),
    }
  },
  record(shape) {
    const keys = Object.keys(shape)
    return {
      gen: (r) => Object.fromEntries(keys.map((k) => [k, shape[k].gen(r)])),
      shrink: (v) => {
        const out = []
        for (const k of keys) {
          for (const s of shape[k].shrink(v[k]).slice(0, 3)) out.push({ ...v, [k]: s })
        }
        return out
      },
    }
  },
  /** Words joined with spaces; shrinks by dropping words. */
  sentence(wordGen, min = 0, max = 8) {
    const arr = gen.array(wordGen, min, max)
    return {
      gen: (r) => arr.gen(r).join(' '),
      shrink: (v) => arr.shrink(v ? v.split(' ') : []).map((ws) => ws.join(' ')),
    }
  },
  /** Map a generator's output; shrinking works on the original value. */
  map(g, fn) {
    return {
      gen: (r) => {
        const raw = g.gen(r)
        return { raw, value: fn(raw) }
      },
      shrink: (v) => g.shrink(v.raw).map((raw) => ({ raw, value: fn(raw) })),
      unwrap: true,
    }
  },
}

// --- Runner -----------------------------------------------------------------

const unwrap = (g, v) => (g.unwrap ? v.value : v)

/** Runs the property; returns a message string on failure, or null. */
function attempt(prop, value) {
  try {
    const r = prop(value)
    if (r === false) return 'property returned false'
    return null
  } catch (e) {
    return e?.message ?? String(e)
  }
}

let failures = 0
let passes = 0

/**
 * @param {string} name
 * @param {{gen: Function, shrink: Function}} generator
 * @param {(value: any) => (boolean|void)} prop  Throw or return false to fail.
 * @param {{ runs?: number }} [opts]
 */
export function check(name, generator, prop, { runs = 300 } = {}) {
  const seed = Number(process.env.PBT_SEED ?? Math.floor(Math.random() * 2 ** 31))
  const r = rng(seed)
  for (let i = 0; i < runs; i++) {
    let value = generator.gen(r)
    let error = attempt(prop, unwrap(generator, value))
    if (!error) continue

    // Shrink: keep taking the first simpler candidate that still fails.
    let steps = 0
    let improved = true
    while (improved && steps < 500) {
      improved = false
      for (const candidate of generator.shrink(value)) {
        steps++
        const e = attempt(prop, unwrap(generator, candidate))
        if (e) {
          value = candidate
          error = e
          improved = true
          break
        }
      }
    }
    failures++
    console.log(`  FAIL - ${name}`)
    console.log(`         after ${i + 1} runs (seed ${seed}, ${steps} shrink steps)`)
    console.log(`         smallest failing input: ${JSON.stringify(unwrap(generator, value))}`)
    console.log(`         ${error}`)
    return false
  }
  passes++
  console.log(`  ok   - ${name} (${runs} runs)`)
  return true
}

/** Throws with a message when `cond` is false (use inside properties). */
export function expect(cond, message) {
  if (!cond) throw new Error(message)
}

/** Call at the end of a test file: prints a summary and sets the exit code. */
export function done() {
  console.log(`\n${passes} properties held, ${failures} failed`)
  process.exitCode = failures > 0 ? 1 : 0
}
