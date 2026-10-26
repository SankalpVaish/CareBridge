# Tech stack, running, and verifying changes

## Stack
- Front end: React 18, Vite 5, Tailwind 3, React Router 6. Plain JS with JSDoc
  types (no TypeScript).
- API: Express 5 (`server/app.js`) + Neon Postgres via `@neondatabase/serverless`
  (`server/db.js`; every query is async, `$1` placeholders). Connection string in
  `DATABASE_URL` (`.env.local` locally). Tables and demo data:
  `npm run db:setup` (`server/setup.js`); clean demo: `npm run db:reset`.
- Deploy: Vercel. `api/index.js` exports the Express app as a serverless
  function; `vercel.json` routes `/api/*` to it. `JWT_SECRET` is required there.
- AI: Groq, called **only from the server** (`/api/ai/suggest`). Calling Groq
  from the browser broke with CORS whenever the Vite port changed, and exposed
  the key.

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
