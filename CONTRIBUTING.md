# Contributing — team guide

This is the base project for our hackathon build. It runs end-to-end today with
mock data. Three people extend it in parallel, one per workstream.

## Run it

1. Get the database address (one-time). The data lives in a free hosted
   Postgres database on [Neon](https://neon.tech). Ask whoever set it up for
   the **connection string**, or create your own Neon project. Put it in a file
   named `.env.local` in the project folder (git ignores this file; never
   commit the string, it contains the password):

   ```bash
   DATABASE_URL=postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require
   GROQ_API_KEY=...   # optional: AI suggestions in the symptom checker
   ```

   Tip: in Neon, create a `dev` branch and use its connection string locally,
   so testing doesn't change the data judges see on the live site.

2. Install, create the tables, and run:

   ```bash
   npm install
   npm run db:setup   # creates tables + demo data (safe to run again)
   npm run dev:all    # API (port 4000) + web app (port 5173)
   ```

Other commands:

```bash
npm run dev        # frontend only (Vite, port 5173)
npm run server     # backend only (Express, port 4000)
npm run db:reset   # wipe the database back to the clean demo
npm run build      # production build into dist/
```

Requires Node 18+. The frontend proxies `/api/*` to the backend in dev, so use
the Vite URL (http://localhost:5173) in your browser.

## Auth & backend

- Backend is Express (`server/app.js`) + Neon Postgres (`server/db.js`).
  Tables and demo data come from `server/setup.js` (`npm run db:setup`).
- To reset the demo to a clean state, run `npm run db:reset`.
- Seeded demo accounts (password `demo1234`): `maria@example.com` (patient),
  `pcp@example.com` (PCP), `specialist@example.com` (specialist),
  `chw@example.com` (community health worker Ana Torres, who looks after Maria).
- Roles live in the shared contract (`src/shared/models.js`): `patient`, `pcp`,
  `specialist`, `chw`. Coordinate and Care's health-worker mode are
  role-filtered via the API (`/api/referrals`, `/api/triage`).
- `JWT_SECRET` has a dev-only fallback for local runs. On Vercel the API
  refuses to start without it.

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

## Deploy (for judging) — Vercel + Neon

Vercel serves the built frontend and runs the API as a serverless function
(`api/index.js`, which wraps `server/app.js`). `vercel.json` sends `/api/*` to
the function and everything else to the app.

1. On [vercel.com](https://vercel.com), sign in with GitHub and **import this
   repo**. Framework: Vite (detected). Build: `npm run build`. Output: `dist`.
2. **Database:** in the Vercel project, open **Storage → Create → Neon**. This
   creates the database and sets `DATABASE_URL` for you. (Or paste the
   connection string of an existing Neon project under **Settings →
   Environment Variables**.)
3. **Environment variables** (Settings → Environment Variables):
   - `DATABASE_URL` — set by step 2
   - `JWT_SECRET` — any long random string, e.g. from
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `GROQ_API_KEY` — optional, for AI suggestions
4. **Create the tables once:** put the same `DATABASE_URL` in your `.env.local`
   and run `npm run db:setup`.
5. **Redeploy** (Deployments → ⋯ → Redeploy) so the new variables apply.

Every push to `main` deploys again. Run `npm run db:reset` against the
production database before judging for a clean demo.

## Guardrails from the README

- Clinical decisions (diagnosis, treatment, prescribing) stay with professionals (X-1).
- Never silently triage emergencies (X-2).
- Respect privacy/consent and language/literacy differences (X-3, A-14, X-5).
