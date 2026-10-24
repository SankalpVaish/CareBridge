# How we used Kiro to build CareBridge

CareBridge (a rural specialty-care navigator: React + Vite front end, Express +
SQLite API, Groq for AI) was built in a hackathon day by a team of three, with
Kiro as the main engineering partner for one teammate's work and for
integrating everyone's work.

This document is honest about **what we used, how, and what we didn't**. Every
file it mentions is in this repository.

| Kiro feature | Used? | Where to look |
|---|---|---|
| Kiro IDE (agent chat, autopilot) | ✅ Throughout | The whole codebase |
| Spec-driven development | ✅ For O9 (medicine-change notes) | `.kiro/specs/medication-change-notes/` |
| Steering docs | ✅ 6 docs, 3 inclusion modes | `.kiro/steering/` |
| Agent hooks | ✅ 5 hooks, 3 trigger types | `.kiro/hooks/`, `scripts/hooks/` |
| Property-based testing | ✅ 23 properties, found 4 real bugs | `tests/*.pbt.mjs` |
| Web search (built-in tool) | ✅ | Groq limits, US payer APIs |
| Kiro CLI, Web, Crew | ❌ Not used | — |
| MCP servers | ❌ Not used | See "What we didn't use" |
| Kiro powers | ❌ None installed | See "What we didn't use" |

---

## 1. Kiro IDE: how the build actually went

We used the **Kiro IDE agent in autopilot mode** for the whole build. The
session started as **vibe coding** and moved to **spec-driven development** for
the last feature. We didn't try the CLI, Web, or Crew, so we can't compare them.

What made the IDE agent effective for us:

- **Reading the plan before writing code.** The first request was "read PLAN.md
  and TODO.md and tell me what to improve in Find & Trust." Kiro compared the
  plan with the code and found that the scam clinic was the *top* search result
  (its unknown distance was stored as 0 mi), unverified listings showed by
  default, and star ratings were displayed although the plan forbids them.
- **Checking against our own research.** We repeatedly asked "do we answer
  observation O1? O6? all ten?" Kiro answered with an honest status table
  (answered / partly / no) and a priority list. That's how we discovered that
  nothing in the app produced our headline metric (referral loop closed).
- **Verifying its own work when tools were blocked.** Our workspace blocks
  `npm` commands. Instead of stopping, Kiro bundled the app with esbuild to
  catch broken imports, wrote throwaway Node scripts that ran real logic on the
  demo data, started the API as a **background process** on a spare port, and
  ran end-to-end checks as all four demo users. It then deleted its test rows
  so the demo data stayed clean.
- **Debugging the environment, not just the code:**
  - *Silent API crash.* nodemon said only "app crashed". Kiro loaded the server
    module by module, found Windows exit code `-1073741819` inside
    better-sqlite3, read the library's `engines` field (Node ≥ 22; we had
    20.2.0), installed Node 24 LTS with `winget`, and proved the fix with a
    20-step end-to-end test.
  - *AI showing "Offline".* From the browser's CORS error, Kiro worked out that
    Groq had cached permission for the old dev port, then moved the AI call to
    our server. That fixed the error *and* took the API key out of the browser
    bundle (it checked the built code for `gsk_` and `api.groq.com`).
- **Merging teammates' work by meaning, not by side.** When Guanquan's Spanish
  translations and editable cost estimate collided with our coverage and safety
  work in 5 files, Kiro read both versions and combined them: his i18n
  plus our safety checks, his cost model using our coverage maths. While merging
  it noticed Spanish mode had **no Spanish emergency phrases** ("tengo dolor de
  pecho" wasn't flagged) and added ~30. Later it found that a merge commit had
  been pushed *with conflict markers* in `Layout.jsx` and fixed it.
- **Built-in web search** for facts outside the code, with sources: Groq's free
  tier limits, and which CMS payer APIs (Patient Access, Provider Directory)
  could replace our mock insurance data in future.

**Where vibe coding hurt.** Without written rules, decisions lived only in the
chat. We re-explained the same constraints (no diagnosis, no star ratings,
which files are shared), teammates couldn't see them, and checks were ad hoc
one-liners that broke on PowerShell quoting. Steering, hooks, and specs fixed
exactly these problems.

---

## 2. Spec-driven development: medicine-change notes (O9)

O9 was the only observation the app didn't answer: *"Different doctors prescribe
different medicines for the same condition, so patients lose trust and keep
switching doctors."* It's also the most safety-sensitive feature, because it
touches medicines, so we built it **spec-first**.

### How the spec is structured
`.kiro/specs/medication-change-notes/`
- **`requirements.md`**: 4 requirements and 17 acceptance criteria in EARS
  style ("WHEN… THEN the system SHALL…", "IF… THEN…"), with a glossary and a
  hard boundary at the top: *the app records what a clinician decided; it never
  suggests medicines.* Each criterion is numbered (1.1–4.3) so tests and tasks
  can point at it.
- **`design.md`**: the key decisions *before* code:
  - store notes **inside the existing findings JSON**, so there's no new table
    or migration (Req 4.2) and they're approved with the findings (Req 1.5);
  - one **pure shared module** (`medicationChanges.js`) used by both the server
    and the UI, so validation and the "who sees the clinical reason" rule can't
    drift apart;
  - an explicit **access matrix** for the new history endpoint (Req 3.2);
  - the testing plan, mapped to criteria.
- **`tasks.md`**: 4 groups, 12 tasks, each tagged with requirement IDs, ending
  in a **verification log** with the actual results.

### Implementation and verification
Kiro implemented the tasks in order: shared module → property tests → server →
API client → UI → verification. The end-to-end check was written straight from
the acceptance criteria (one check per criterion) and **passed 14/14 on its
first run**. For example:
- Req 1.2/1.3: a "switched" note without "switched from" is rejected with
  *"Medicine change 1: add what it was switched from"*, and nothing is saved.
- Req 2.1: the patient and health worker never receive the clinical reason.
- Req 3.2: a specialist with no referral for Maria gets 404 on her history.
- Req 4.3: loop-closure figures still count the referral once (7/11 → 8/12).

### Spec vs vibe: what changed for us
| | Vibe coding (most of the build) | Spec (O9) |
|---|---|---|
| Decisions | Made in chat, often rediscovered later | Written once in `design.md`, reviewable by teammates |
| Safety rules | Remembered by the agent, sometimes re-explained | Stated as numbered criteria and tested one by one |
| Rework | Frequent (e.g. the AI safety check had to be relaxed twice after it over-blocked) | None; the first end-to-end run passed |
| Speed | Fastest for exploring and fixing ("why is AI offline?") | Slower to start, faster to finish |

**Our rule now:** vibe for exploration and debugging; spec for anything that
touches clinical safety, permissions, or shared data.

---

## 3. Steering docs: turning lessons into rules

`.kiro/steering/` holds six docs using all three inclusion modes:

| File | Inclusion | What it encodes |
|---|---|---|
| `product.md` | always | Users, demo accounts, sections, headline metric, "keep Maria's story working" |
| `safety.md` | always | No diagnosis or medicine suggestions; fixed lists for AI; emergency rules before AI; no star ratings; clinicians approve; keys server-side only |
| `tech.md` | always | Stack, **Node ≥ 22**, how to verify without npm, PowerShell pitfalls |
| `data-contract.md` | **fileMatch** (`models.js`, `mockData.js`, `server/db.js`, routes) | Add fields with factory defaults, keep explicit `null`, keys not labels, scheme order matters, migrations only add columns |
| `ui-copy.md` | **fileMatch** (`src/**/*.jsx`) | No research codes on screen, plain words, en + es via `t()`, don't fake buttons |
| `git-workflow.md` | **manual** (`#git-workflow`) | Never commit during a conflict, preview with `merge-tree`, agents don't push |

**The strategy that made the biggest difference: write steering from
incidents, not from ideals.** Every rule traces back to something that went
wrong in this build:
- *"better-sqlite3 13 needs Node ≥ 22; on Node 20 it crashes with exit code
  -1073741819 and no message"*: from the silent crash.
- *"Never read a secret through `import.meta.env` in browser code"*: from the
  CORS outage and the exposed key.
- *"Factories must keep an explicit `null`"*: the scam clinic's unknown address
  was being turned into 0 mi and ranked first.
- *"No research codes on screen"*: O1/A-4/X-1 codes leaked into the UI.
- *"Every language needs its own danger phrases"*: the Spanish emergency gap.

**fileMatch** keeps the long data-contract rules out of unrelated work and
brings them in exactly when someone edits a shared file, the moment they
matter. We applied these docs while building the O9 spec. For example, the
design chose a JSON field over a new table because `data-contract.md` says
migrations only add columns, and change types are stored as keys
(`'switched'`), not labels.

---

## 4. Agent hooks: automating the checks we kept forgetting

`.kiro/hooks/` has five hooks over three trigger types. The command hooks call
small scripts in `scripts/` so the same checks also work by hand and in CI.

| Hook | Trigger | What it does | Why |
|---|---|---|---|
| `check-bundle-on-save` | PostFileSave `src/**/*.js(x)` | `node scripts/check-bundle.mjs`: esbuild bundles the app in ~1 s | Catches broken imports without `npm run build` (blocked here) |
| `run-tests-on-logic-change` | PostFileSave on safety, cost, ranking, travel, medicine, server, and test files | `node scripts/run-tests.mjs`: all unit and property tests | Safety logic changes are re-tested immediately |
| `checks-after-turn` | Stop | Conflict markers + UI research codes + bundle | Every agent turn ends with a health check |
| `guard-commit` | PreToolUse on shell tools | **Blocks** `git commit` / `git push` (exit 2) if conflict markers exist or the bundle fails | A merge with conflict markers was pushed once and broke `main` |
| `shared-contract-reminder` | PreToolUse on file writes (agent prompt) | Reminds the agent of the data-contract, safety, and UI-copy rules | The rules we re-explained most often in chat |

We tested the hook scripts directly before registering them: `guard-commit`
lets `git status` and a clean commit through, and exits 2 with the exact file
and line when we planted a conflict marker. Kiro activates new hooks at the
start of the next session, so they guard future work from now on. The checks
they automate are the ones we ran by hand during the build.

---

## 5. Property-based testing: what it caught

We wrote a dependency-free property-based testing helper (`tests/pbt/prop.mjs`:
seeded generators, shrinking to the smallest failing input, and a replayable
seed via `PBT_SEED`), because `npm install` was blocked. Five suites, 23
properties, each named after the requirement it protects:

| Suite | Requirements covered |
|---|---|
| `tests/safety.pbt.mjs` | Every danger phrase, anywhere in a sentence, any casing, either language → emergency; every banned condition or medicine is caught with or without accents; **our own advice is never flagged** |
| `tests/ranking.pbt.mjs` | Weights sum to 100%; unverified providers never outrank verified ones or get a score; scores in [0, 1] and sorted; every result explains itself |
| `tests/cost.pbt.mjs` | Covered ≤ total; applying for help never raises the bill; best ≤ expected ≤ worst; a scheme never pays beyond the bill or its cap; missing information never means "doesn't fit" |
| `tests/travel.pbt.mjs` | You arrive before the appointment; the recommended trip is the cheapest; overnight flagged exactly when the fastest trip is long |
| `tests/medication.pbt.mjs` | Spec Req 1.3, 1.4, 2.1–2.3: bounded, complete notes; missing fields named; patients and health workers never see the clinical reason |

**PBT found 4 real bugs on its first run, all missed by our hand-written
checks:**

1. **Every AI answer for thirst / diabetes symptoms was silently thrown away.**
   The safety check flagged *our own* label "Diabetes / hormone specialist
   (endocrinology)" as a disease name, so the AI answer was discarded and the
   user saw "Offline". Shrunk to one sentence:
   `"This sounds like it may need Diabetes / hormone specialist (endocrinology)."`
   Fix: the check now ignores our exact care-type labels. The same words used
   any other way ("this could be diabetes") are still caught.
2. **The diagnosis pattern blocked everyday English.** "You have…" matched
   *"If you have a community health worker, alert them as well"*, which is our
   own emergency advice. We narrowed it to guesses ("you may have…") and
   diagnosis words ("you have a condition…").
3. **"Leave by 11:58 pm" for a 6 am appointment.** A long trip to an early visit
   wrapped past midnight and showed a same-day time. Shrunk to
   `{"miles":231,"medicaid":true,"apptHour":6}`. Trips now say "the day
   before" and suggest a later appointment.
4. **A reason that ended mid-sentence: "Staff speak ".** With no languages on
   record, the ranking produced an empty language reason. Now it says "Your
   languages aren't recorded yet."

Bugs 1 and 2 are the kind unit tests miss: we had tested that *unsafe* text is
caught, but never that *safe* text, including our own, gets through. Writing
properties as requirements ("our own advice is never flagged") made the gap
obvious.

Run everything: `node scripts/run-tests.mjs` (6/6 files pass, repeated with
fresh random seeds).

---

## 6. What we didn't use, and why

- **MCP.** We didn't connect any MCP servers. The external work we needed was
  covered by the agent's built-in tools: web search for documentation and
  facts, and the shell for git, Node, and process control. Where MCP would help
  next: a **GitHub MCP server** to open pull requests and read teammates'
  branches instead of pasting `git` output into chat, and a **SQLite MCP server**
  so the agent could inspect the demo database without throwaway scripts (we
  wrote several clean-up scripts that a database tool would replace).
- **Kiro powers.** None are installed in our environment, so none were used.
- **Kiro CLI, Web, Crew.** Not tried. All work was in the IDE.
- **Sub-agents.** Not used. The work was sequential and needed one shared
  context (the merges in particular).

## 7. What we'd do differently

1. **Create steering on day one** with product, safety, and tech rules. Most of
   our repeated explanations and several bugs (the Spanish emergency gap, the
   exposed key) would have been prevented.
2. **Spec every safety-critical feature.** The AI safety check was vibe-coded
   and had to be relaxed twice. The spec-built O9 feature needed no rework.
3. **Turn hooks on early.** The commit guard would have stopped the broken merge
   from reaching `main`.
