# Clinical safety and trust rules (non-negotiable)

These rules come from README "Safety and privacy" and PLAN.md §9. Any change
that would break one of them must be refused or redesigned, and the user told.

## Never diagnose, never prescribe
- The app suggests a **type of care** and **how soon** only. It never names a
  disease or condition as the patient's, never names a medicine to take, never
  gives doses, and never suggests changing a medicine.
- AI output must pick `specialty` and `urgency` from fixed lists
  (`SPECIALTY_LABELS`, `URGENCY_LABELS` in `src/shared/models.js`). Values
  outside the lists are replaced, never shown.
- Every AI-written string is checked by `findUnsafeTerms()`
  (`src/features/care/outputSafety.js`, English and Spanish). An unsafe headline
  discards the whole answer; an unsafe tip is dropped on its own. Add new
  languages' terms there before enabling that language for AI.
- Fixed advice we write ourselves (e.g. the "don't start or change medicine on
  your own" note) is added **after** the safety check.

## Emergencies first
- Danger-sign rules (`EMERGENCY_SIGNS` in `src/features/care/symptomChecker.js`)
  run locally **before** any AI call. Emergency advice must never depend on the
  network. Matching changes may only ever catch *more* emergencies.
- Every language the symptom checker supports needs its own danger phrases.

## Clinicians decide; humans approve
- Only the patient's own clinician (PCP) creates a referral.
- Only the specialist sends findings, and approves both the clinic version and
  the plain-language version before they go out.
- Medicine-change notes (O9) record what a clinician changed and why. The app
  never proposes changes.

## Fair ranking
- No paid placement and **no star ratings** anywhere (they are easy to fake;
  the scam clinic in the demo has the best rating). Ranking weights are
  published in the "How we rank" modal and must match `ranking.js`.
- Unverified providers are hidden by default, never scored, and never get a
  trip plan or doctor list.
- Doctor feedback counts only patients whose referral was completed.

## Privacy
- Patient mode saves nothing unless the patient shares. CHWs record consent.
- Patients and CHWs see only the plain-language findings.
- Synthetic data only. Never add real names, member numbers, or license IDs.
- API keys live on the server (`.env.local`, read by `server/routes/aiRoutes.js`).
  Never read a secret through `import.meta.env` in browser code.
