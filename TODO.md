# TODO

Everything left to build, by section. Each item references the research
questions from [README.md](README.md). These were moved here out of the live UI
so the site stays clean for judging.

| Section | Route | Folder | Questions |
|---|---|---|---|
| Care & Cost | `/care` | `src/features/care/` | A-1..A-17 |
| Find & Trust | `/find` | `src/features/find/` | B-1..B-14 |
| Coordinate | `/coordinate` | `src/features/coordinate/` | C-1..C-16 |

---

## Care & Cost (`/care`)

- [ ] **A-1..A-5** — Build a real symptom-to-care-type helper (keyword or guided questions).
- [ ] **A-7 / A-8** — Let users edit cost inputs; show best vs. worst case.
- [ ] **A-9..A-12** — Add a scheme-eligibility checker with required-document guidance.
- [ ] **A-14..A-16** — Add a language toggle (Maria speaks Spanish) and a low-literacy mode.
- [ ] **X-1 / X-2** — Keep clinical boundaries — never diagnose or triage emergencies silently.

## Find & Trust (`/find`)

- [ ] **B-1 / B-2** — Search by treatment or test (`services`), not just specialty, and show "nearest place that offers X".
- [ ] **B-3** — Let the patient set how far they can travel; show distance for each result.
- [ ] **B-4..B-8** — Getting there: transport options, trip cost and time. Agree with the Coordinate owner who owns the travel plan.
- [ ] **B-9 / B-12** — Turn `fraudSignals` into a reusable "trust check" that explains each warning sign.
- [ ] **B-10 / B-11** — Back `verification` with a mock licensing-registry lookup (registry, license number, date checked).
- [ ] **B-13** — Ranking nobody can buy: show why each result is ranked where it is, with no sponsored slots.
- [ ] **B-14 / X-6** — Rank by `loopClosureRate`, travel, cost, wait, and language instead of star ratings.

## Coordinate (`/coordinate`)

- [ ] **C-1..C-4** — Make the referral pipeline editable and record who is responsible at each stall.
- [ ] **C-5..C-7** — Add appointment booking + no-show / reschedule notifications.
- [ ] **C-8..C-11** — Turn the travel list into a real planner with cost + time.
- [ ] **C-15..C-18** — Add a shared visit summary the PCP and patient both see.
- [ ] **C-19..C-22** — Show prescription history so switching doctors doesn't restart care.

---

## Shared / cross-cutting

- [ ] Keep the demo patient **Maria Alvarez** consistent across all three sections.
- [ ] Add new shared fields in `src/shared/models.js` (not in a feature folder) and tell the team.
- [ ] Respect privacy, consent, language, and literacy differences (X-3, X-5).

---

## Future work

- [ ] **O9 / C-10..C-13 — Different prescriptions for the same condition.** When a
  specialist changes a medicine, record "changed X to Y because…" with the
  findings, show the reason to the clinic and the health worker, and give the
  patient a plain-language version, so a new doctor knows what was tried before.
  Needs a medication-change field on the findings and the same approve-before-send
  step. Never suggest changes ourselves (X-1). (PLAN.md screen C7, gap G6.)
- [ ] AI draft of the plain-language findings, for the specialist to edit and approve.
- [ ] Flag referrals with no response after a set time (e.g. 3 days) on Coordinate.
