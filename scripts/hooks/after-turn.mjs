#!/usr/bin/env node
/**
 * Stop hook: after every agent turn, run the fast checks so problems show up
 * immediately instead of in the next teammate's pull:
 *   - merge-conflict markers, and research codes leaking into UI text
 *   - the front end still bundles
 * Prints a one-line summary; details only when something fails.
 */
import { spawnSync } from 'node:child_process'

const run = (args) => spawnSync(process.execPath, args, { encoding: 'utf8' })
const checks = [
  ['conflicts & UI codes', ['scripts/check-conflicts.mjs', '--codes']],
  ['bundle', ['scripts/check-bundle.mjs']],
]

let failed = 0
const summary = []
for (const [name, args] of checks) {
  const r = run(args)
  if (r.status === 0) summary.push(`${name}: ok`)
  else {
    failed++
    summary.push(`${name}: FAILED`)
    console.log(`--- ${name} ---\n${r.stdout}${r.stderr}`)
  }
}
console.log(`[after-turn] ${summary.join(' · ')}`)
process.exit(failed ? 1 : 0)
