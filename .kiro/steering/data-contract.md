---
inclusion: fileMatch
fileMatchPattern: ['src/shared/models.js', 'src/data/mockData.js', 'server/db.js', 'server/routes/*.js']
---

# Shared data contract

`src/shared/models.js` defines every shared shape (Patient, Provider, Doctor,
Scheme, InsurancePlan, Referral, CostEstimate, …) with JSDoc and a `make*()`
factory. `src/data/mockData.js` holds the one connected demo scenario.

## Rules
- **New field on a shared shape:** add it to the JSDoc typedef *and* give it a
  default in the factory, so existing rows keep working. Then tell the user
  which teammates are affected (shared files are used by all three sections).
- **Explicit `null` vs missing:** factories must keep an explicit `null`
  (e.g. `distanceMiles: null` = unknown address). Use
  `p.x === undefined ? default : p.x`, not `p.x ?? default`, for fields where
  `null` means something.
- **Keys, not labels.** Specialties, urgencies, cost items, and warning signs
  are stored as keys (`'cardiology'`, `'within_days'`, `'upfront_payment'`) and
  turned into words only in the UI.
- **Order of `schemes` matters:** insurance first, then Medicaid, then aid. The
  cost estimator pays in list order.
- **Providers are copied into the database** from `mockData.js` by
  `npm run db:setup` (`server/setup.js`). After adding providers, run it again;
  it only inserts what's missing.
- **New columns go in `server/setup.js`.** Add them to the `CREATE TABLE`
  statement, plus an `ALTER TABLE … ADD COLUMN IF NOT EXISTS` line so existing
  databases get them too.
- **Referral status order** is `PIPELINE` (in both `referralWorkflow.js` and
  `server/routes/referralRoutes.js`); keep them identical.
