# Contributing — team guide

This is the base project for our hackathon build. It runs end-to-end today with
mock data. Three people extend it in parallel, one per workstream.

## Run it

```bash
npm install
npm run dev:all  # run BOTH the API (port 4000) and the web app (port 5173)
# or run them separately:
npm run dev      # frontend only (Vite, port 5173)
npm run server   # backend only (Express + SQLite, port 4000)
npm run build    # production build into dist/
```

Requires Node 18+. The frontend proxies `/api/*` to the backend in dev, so use
the Vite URL (http://localhost:5173) in your browser.

## Auth & backend

- Backend is Express + embedded SQLite (`server/`). The database file
  (`server/data/app.db`) is created and seeded on first boot — it's gitignored.
- To reset the demo to a clean state, delete `server/data/app.db` and restart
  the server; it reseeds automatically.
- Seeded demo accounts (password `demo1234`): `maria@example.com` (patient),
  `pcp@example.com` (PCP), `specialist@example.com` (specialist).
- Roles live in the shared contract (`src/shared/models.js`): `patient`, `pcp`,
  `specialist`. The Coordinate section is role-filtered via the API.
- `JWT_SECRET` has a dev-only fallback; set it as an env var for any real deploy.

## Who owns what

| Workstream | Section | Folder you own | Research questions |
|---|---|---|---|
| A — Care & Cost | `/care` | `src/features/care/` | A-1..A-17 |
| B — Find & Trust | `/find` | `src/features/find/` | B-1..B-14 |
| C — Coordinate | `/coordinate` | `src/features/coordinate/` | C-1..C-16 |

Work almost entirely inside your own `src/features/<x>/` folder. That keeps
merge conflicts near zero.

## The one shared rule: the data contract

All three sections share ONE set of data shapes so the demo feels like one
product, not three disconnected pages.

- Shapes and factory functions: `src/shared/models.js`
- The connected demo scenario (patient **Maria Alvarez**): `src/data/mockData.js`

Maria appears in all three sections — her cost estimate (A), the providers she
searches (B), and her referral and travel (C). Keep her demo rows intact.

**If you need a new field on a shared object** (e.g. `Patient`), add it in
`src/shared/models.js` and tell the other two owners. Anything only your section
uses stays in your own folder.

## Shared UI

Reuse the components in `src/shared/ui.jsx` (`Card`, `Badge`, `Button`,
`PageHeader`, `OwnerTodo`, `money`) so styling stays consistent. Section accent
colors: `care` (teal), `find` (violet), `coordinate` (orange).

## Suggested git flow

- One branch per person: `feat/care`, `feat/find`, `feat/coordinate`.
- Small, frequent commits. Open a PR into `main` when your section hits a milestone.
- Don't commit `node_modules/` or `dist/` (already in `.gitignore`).

## Deploy (for judging)

Static site, deploys in one step:

- **Vercel**: import the repo, framework = Vite, build = `npm run build`,
  output = `dist`. `vercel.json` already handles client-side routing.
- **Netlify**: build `npm run build`, publish `dist`. Add a redirect
  `/* /index.html 200` for routing.

## Guardrails from the README

- Clinical decisions (diagnosis, treatment, prescribing) stay with professionals (X-1).
- Never silently triage emergencies (X-2).
- Respect privacy/consent and language/literacy differences (X-3, A-14, X-5).
