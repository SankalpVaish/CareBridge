# Tasks: Medicine-change notes (O9)

Implements `design.md`. Each task names the requirements it covers.

- [x] 1. Shared logic module
  - [x] 1.1 Create `src/features/coordinate/medicationChanges.js` with
        `CHANGE_TYPES`, `cleanMedicationChanges`, `visibleChanges`,
        `describeChange` (plain-language line). _Req 1.1–1.4, 2.1, 2.2_
  - [x] 1.2 Property-based tests in `tests/medication.pbt.mjs` for cleaning
        limits, required-field errors, and the role filter. _Req 1.3, 1.4, 2.1, 2.2_

- [x] 2. Server
  - [x] 2.1 `returnFindings` accepts and cleans `medicationChanges`; errors
        become 400. _Req 1.3, 1.5, 1.6, 4.1_
  - [x] 2.2 `toReferral` filters changes by role. _Req 2.1, 2.2_
  - [x] 2.3 `GET /api/referrals/patient/:patientId/medication-history` with the
        access rule and role filter, newest first, no history rows.
        _Req 3.1–3.4_
  - [x] 2.4 API client: `api.medicationHistory(patientId)`.

- [x] 3. UI
  - [x] 3.1 Findings form: add/remove change rows ("from" only for switched).
        _Req 1.1, 1.2_
  - [x] 3.2 Findings view: list changes by role, with the fixed advice for
        patients and CHWs. _Req 2.1–2.3_
  - [x] 3.3 Medicine history card on Coordinate. _Req 3.1_

- [x] 4. Verify
  - [x] 4.1 `node scripts/run-tests.mjs` (6/6 files), `node scripts/check-bundle.mjs`
        (0 errors).
  - [x] 4.2 End-to-end against a test API: 14/14 requirement checks passed,
        test data removed. _Req 1–4_
  - [x] 4.3 Update README "How we answer each problem" (O9) and TODO.md.

## Verification log
| Check | Result |
|---|---|
| `tests/medication.pbt.mjs` | 4 properties held (300 runs each) |
| End-to-end, Req 1.2/1.3 | Switch without "from" rejected: "Medicine change 1: add what it was switched from" |
| End-to-end, Req 1.4 | 11 changes rejected: "Add at most 10 medicine changes" |
| End-to-end, Req 1.6 | Referring clinic gets 403 |
| End-to-end, Req 2.1/2.2 | Patient and CHW get no clinical reason; clinic gets both |
| End-to-end, Req 3.2 | Unlinked specialist and unlinked patient get 404 |
| End-to-end, Req 4.3 | Loop figures 7/11 → 8/12 (one referral, counted once) |
