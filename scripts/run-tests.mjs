#!/usr/bin/env node
/**
 * Runs every unit test (*.test.mjs) and property-based test (*.pbt.mjs) under
 * src/ and tests/, each in its own Node process. No test framework needed.
 *
 * Usage: node scripts/run-tests.mjs [filter]
 * Exit code 0 = all passed. Used by the "Run tests on logic change" hook.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const filter = process.argv[2] ?? ''

function* testFiles(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* testFiles(path)
    else if (/\.(test|pbt)\.mjs$/.test(name) && path.includes(filter)) yield path
  }
}

let failed = 0
let ran = 0
for (const dir of ['src', 'tests']) {
  let entries
  try {
    entries = [...testFiles(dir)]
  } catch {
    continue
  }
  for (const file of entries) {
    ran++
    const r = spawnSync(process.execPath, [file], { encoding: 'utf8' })
    const ok = r.status === 0
    if (!ok) failed++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${file}`)
    if (!ok) console.log((r.stdout + r.stderr).trim().split('\n').slice(-25).join('\n'))
  }
}
console.log(`\n${ran - failed}/${ran} test files passed`)
process.exit(failed === 0 ? 0 : 1)
