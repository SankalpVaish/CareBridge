# Product: CareBridge — Rural Specialty Care Navigator

CareBridge gets rural patients to the right specialist, helps them afford the
visit, and brings the specialist's answer back to their own clinic.

## Who uses it
- **Patient** (demo: Maria Alvarez, 54, Cedar Falls, Iowa; Medicaid; English and
  Spanish; ~$400/month budget; chest tightness when walking uphill).
- **Community health worker (CHW)** — Ana Torres, looks after Maria.
- **Primary-care clinician (PCP)** — Hometown Family Practice.
- **Specialist** — County Cardiology Clinic.

Demo accounts: `maria@`, `chw@`, `pcp@`, `specialist@example.com`, password `demo1234`.

## The three sections
| Route | Section | Answers |
|---|---|---|
| `/care` | Care & Cost — symptom check, full cost, coverage, help paying | O1, O5, O6, O10 |
| `/find` | Find & Trust — search, ranking, trust checks, trips, provider pages | O2, O3, O4 |
| `/coordinate` | Coordinate — clinic inbox, referrals, findings back | O7, O8, O9, O10 |

The ten observations (O1–O10) and research questions live in `docs/research.md`.
The README's "How we answer each problem" table must stay accurate: update it
whenever a feature changes what the app answers.

## Headline metric
**Referral loop closed** = share of referred patients whose findings went back
to the referring clinic. It is computed from real referrals by
`/api/loop-stats` and feeds Find & Trust ranking. Never hard-code it.

## Story continuity
Maria must work end to end in every section. Keep her demo rows in
`src/data/mockData.js` intact; add new rows instead of changing hers.
