# TODO

Everything left to build, by section. Each item references the research
questions from [README.md](README.md). These were moved here out of the live UI
so the site stays clean for judging.

| Section | Route | Folder | Questions |
|---|---|---|---|
| Care & Cost | `/care` | `src/features/care/` | A-1..A-16 |
| Find & Trust | `/find` | `src/features/find/` | B-1..B-15 |
| Coordinate | `/coordinate` | `src/features/coordinate/` | C-1..C-25 |

---

## Care & Cost (`/care`)

- [ ] **A-1..A-5** — Build a real symptom-to-care-type helper (keyword or guided questions).
- [ ] **A-7 / A-8** — Let users edit cost inputs; show best vs. worst case.
- [ ] **A-9..A-12** — Add a scheme-eligibility checker with required-document guidance.
- [ ] **A-14..A-16** — Add a language toggle (Maria speaks Spanish) and a low-literacy mode.
- [ ] **X-1 / X-2** — Keep clinical boundaries — never diagnose or triage emergencies silently.

## Find & Trust (`/find`)

- [ ] **B-1 / B-2** — Pull in a wider provider directory (more specialties, more towns).
- [ ] **B-4 / B-5 / B-6** — Let users browse by condition and surface "nearest place that offers X".
- [ ] **B-8..B-11** — Build a fair comparison view; explain what ratings do and don't mean.
- [ ] **B-13 / B-14** — Wire the verified flag to a real/mock licensing registry lookup.
- [ ] **B-12 / B-15** — Expand the fraud-signal explanation into a reusable "trust check".

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
