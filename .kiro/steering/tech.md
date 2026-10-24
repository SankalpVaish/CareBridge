# Tech stack, running, and verifying changes

## Stack
- Front end: React 18, Vite 5, Tailwind 3, React Router 6. Plain JS with JSDoc
  types (no TypeScript).
- API: Express 5 + better-sqlite3 (`server/`), database `server/data/app.db`
  (created and seeded on first boot; delete it to reset).
- AI: Groq, called **only from the server** (`/api/ai/suggest`). Calling Groq
  from the browser broke with CORS whenever the Vite port changed, and exposed
  the key.

## Node version: 22 or newer
better-sqlite3 13 needs Node ≥ 22. On Node 20 it crashes with Windows exit code
`-1073741819` and **no error message** — nodemon only says "app crashed". If the
API dies silently, check `node -v` first.

## Running
- `npm run dev:all` — API on :4000 and web on :5173 (Vite proxies `/api`).
- If Vite says "Port 5173 is in use", an old dev server is still running.

## Verifying changes (do this before saying a task is done)
`npm` commands may be blocked by workspace permissions. Use these instead:
- `node scripts/check-bundle.mjs` — bundles the whole front end with esbuild and
  reports broken imports or exports (what `npm run build` would catch).
- `node scripts/check-conflicts.mjs` — fails if any merge-conflict markers are
  left in the repo.
- `node scripts/run-tests.mjs` — runs every `*.test.mjs` and `*.pbt.mjs` file
  (unit tests and property-based tests).
- For server behaviour, start the API on a spare port
  (`$env:PORT='4999'; node server/index.js`) as a background process and call
  it; delete any test rows afterwards so the demo data stays clean.

## Windows / PowerShell
- The shell is PowerShell. Long `node -e "..."` one-liners with nested quotes,
  `*`, or `2>&1` often break; write a small `.mjs` script instead and delete it
  afterwards.
- `git show file > out` through PowerShell re-encodes UTF-8 and garbles symbols
  like "→". Use `cmd /c "git show ... > file"` for byte-exact copies.
