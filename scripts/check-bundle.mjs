#!/usr/bin/env node
/**
 * Bundles the whole front end with esbuild (in memory, nothing written) and
 * reports broken imports, missing exports, and syntax errors — the problems
 * `npm run build` would catch, in about a second.
 *
 * Usage: node scripts/check-bundle.mjs
 * Exit code 0 = OK, 1 = errors. Used by the "Check bundle on save" hook.
 */
import { build } from 'esbuild'

const result = await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  write: false,
  outdir: 'dist-check',
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.svg': 'file' },
  define: { 'import.meta.env': '{}' },
  logLevel: 'silent',
}).catch((e) => e)

const errors = result.errors ?? []
const warnings = result.warnings ?? []
for (const m of [...errors, ...warnings]) {
  const where = m.location ? `${m.location.file}:${m.location.line}` : ''
  console.log(`${errors.includes(m) ? 'error' : 'warning'}: ${m.text} ${where}`)
}
console.log(`bundle check: ${errors.length} errors, ${warnings.length} warnings`)
process.exit(errors.length > 0 ? 1 : 0)
