# Design: Medicine-change notes (O9)

Implements `requirements.md`. Follows steering: `safety.md` (record, never
suggest), `data-contract.md` (keys not labels, no dropped columns),
`ui-copy.md` (plain words).

## Overview

Change notes live **inside the existing findings JSON** on a referral
(`referrals.findings`), so no new table or migration is needed (Req 4.2) and
they're saved by the same "Approve and send back" action (Req 1.5).

One shared module, `src/features/coordinate/medicationChanges.js`, holds the
pure logic used by **both** the server and the UI:
- `cleanMedicationChanges(input)` — validates and normalises notes, or throws a
  message naming what's missing (Req 1.2–1.4).
- `visibleChanges(changes, role)` — removes the clinical reason for patients and
  health workers (Req 2.1, 2.2, 3.3).
- `CHANGE_TYPES` — the fixed list of change keys and their plain labels.

Keeping both rules in one pure module means the role filter can't drift between
the referral view and the history view, and it can be property-tested.

## Data shape

```js
// findings (existing): { forClinician, forPatient, by, at }
// new optional field:
medicationChanges: [
  {
    medicine: 'Metoprolol',          // as typed by the specialist (Req 2.4)
    change: 'switched',              // key from CHANGE_TYPES
    from: 'Atenolol',                // only for 'switched' (Req 1.2)
    reasonClinical: '…',             // clinicians only
    reasonPlain: '…',                // everyone with access
  },
]
```

`CHANGE_TYPES`: `started`, `stopped`, `dose_changed`, `switched`, `continued`.
Labels in plain words, e.g. `switched` → "Switched from {from} to {medicine}".

## Server

`server/routes/referralRoutes.js`
- `returnFindings` accepts `medicationChanges` (optional, default `[]`) and runs
  `cleanMedicationChanges`. A thrown message becomes a 400 (Req 1.3). The action
  is already specialist-only (Req 1.6).
- `toReferral(row, user)` passes `findings.medicationChanges` through
  `visibleChanges(…, user.role)`.

New: `GET /api/referrals/patient/:patientId/medication-history`
- Access (Req 3.2): the patient themself; a CHW linked in `chw_patients`; a PCP
  whose provider is `patients.pcp_provider_id`; a specialist with any
  non-history referral for the patient. Otherwise 404.
- Reads every non-history referral for the patient with findings
  (Req 3.4), flattens their `medicationChanges` with `at`, `by`, and the
  provider name, sorts newest first, and applies `visibleChanges`.
- Route order: defined before `/:id` so it isn't captured by it.

## UI (`src/features/coordinate/CoordinatePage.jsx`)

- **Findings form** (specialist): an optional "Medicine changes" list. "Add a
  change" adds a row: medicine, type (select), "from" (shown only for
  switched), reason for the clinic, reason in plain words. Rows can be removed.
- **Findings view**: lists changes under the findings. Patients and CHWs see the
  plain reason and the fixed advice (Req 2.3).
- **Medicine history card**: loads the history endpoint for the selected
  referral's patient; hidden when empty.

The fixed advice text reuses `selfMedicationNote()` from
`src/features/care/symptomChecker.js` so wording matches the symptom checker.

## Testing

- Property-based (`tests/medication.pbt.mjs`):
  - Cleaning never returns more than 10 notes, every note has a valid change key
    and non-empty required fields, and no field exceeds 300 characters.
  - Any note missing a required field makes cleaning throw, and the message
    names the field.
  - For every role and every input, `visibleChanges` never returns
    `reasonClinical` to `patient` or `chw`, and always returns it to `pcp` and
    `specialist`.
- End-to-end against the API: specialist sends findings with a switch; patient
  and CHW see only plain reasons; a second specialist with no referral gets 404
  on the history; the history lists the change.

## Out of scope
- Prescribing, pharmacy integration, drug-interaction checks.
- AI drafting of reasons (would need its own approval spec).
