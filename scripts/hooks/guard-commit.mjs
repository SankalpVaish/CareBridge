#!/usr/bin/env node
/**
 * PreToolUse hook for shell commands: blocks `git commit` / `git push` while
 * merge-conflict markers are in the repo, or while the front end doesn't build.
 * (A merge commit with markers in src/app/Layout.jsx was once pushed and broke
 * the build for the whole team.)
 *
 * Reads the hook's JSON from stdin. Exit 2 = block (reason on stderr).
 * Any other command passes straight through.
 */
import { spawnSync } from 'node:child_process'

let input = ''
for await (const chunk of process.stdin) input += chunk

let command = ''
try {
  const data = JSON.parse(input || '{}')
  const args = data.tool_input ?? data.toolInput ?? data.input ?? data.arguments ?? data
  command = String(args.command ?? args.cmd ?? JSON.stringify(args))
} catch {
  command = input
}

if (!/\bgit\s+(commit|push)\b/.test(command)) process.exit(0)

const run = (script) => spawnSync(process.execPath, [script], { encoding: 'utf8' })
const conflicts = run('scripts/check-conflicts.mjs')
if (conflicts.status !== 0) {
  process.stderr.write(
    `Blocked: merge-conflict markers are still in the repo. Resolve them first.\n${conflicts.stdout}`,
  )
  process.exit(2)
}
const bundle = run('scripts/check-bundle.mjs')
if (bundle.status !== 0) {
  process.stderr.write(`Blocked: the front end doesn't build. Fix these first.\n${bundle.stdout}`)
  process.exit(2)
}
process.exit(0)
