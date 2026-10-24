#!/usr/bin/env node
/**
 * Fails if merge-conflict markers are left anywhere in tracked source files.
 * With --codes, also lists research codes (O1, A-4, X-1, …) that appear in
 * visible UI text instead of only in comments.
 *
 * Usage: node scripts/check-conflicts.mjs [--codes]
 * Exit code 0 = clean, 1 = problems found.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOTS = ['src', 'server', 'scripts', 'tests', '.kiro', 'index.html', 'README.md']
const SKIP = new Set(['node_modules', 'dist', 'data'])
const EXTS = new Set(['.js', '.jsx', '.mjs', '.json', '.md', '.html', '.css'])
const MARKER = /^(<{7}( |$)|={7}$|>{7}( |$))/
const CODE = /\b(O\d{1,2}|[ABCX]-\d{1,2})\b/
const checkCodes = process.argv.includes('--codes')

function* files(path) {
  let st
  try {
    st = statSync(path)
  } catch {
    return
  }
  if (st.isFile()) {
    if (EXTS.has(extname(path))) yield path
    return
  }
  for (const name of readdirSync(path)) {
    if (!SKIP.has(name)) yield* files(join(path, name))
  }
}

let problems = 0
for (const root of ROOTS) {
  for (const file of files(root)) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    lines.forEach((line, i) => {
      if (MARKER.test(line)) {
        problems++
        console.log(`conflict marker: ${file}:${i + 1}: ${line.slice(0, 40)}`)
      }
      if (checkCodes && /\.(jsx?|mjs)$/.test(file) && file.startsWith('src')) {
        const t = line.trim()
        if (/^(\*|\/\/|\/\*|\{\/\*)/.test(t) || file.endsWith('.test.mjs')) return
        const code = line.replace(/\/\/.*$/, '').replace(/\{\/\*.*?\*\/\}/g, '')
        if (CODE.test(code)) {
          problems++
          console.log(`research code in UI text: ${file}:${i + 1}: ${t.slice(0, 80)}`)
        }
      }
    })
  }
}
console.log(problems === 0 ? 'conflict check: clean' : `conflict check: ${problems} problem(s)`)
process.exit(problems === 0 ? 0 : 1)
