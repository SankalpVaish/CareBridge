# CareBridge: Rural Specialty Care Navigator

CareBridge helps people in rural areas get to the right specialist, afford the visit, and get the specialist's answer back to their own clinic.

> **Demo software.** All patients, providers, doctors, insurance plans, and programmes in this app are made up. It gives guidance on where to go and what help exists. It never diagnoses, never recommends treatment, and never suggests changing medicines. Clinical decisions stay with qualified professionals.

---

## Contents

1. [The problem](#the-problem)
2. [What the app does](#what-the-app-does)
3. [A walk-through](#a-walk-through)
4. [How we answer each problem](#how-we-answer-each-problem)
5. [Safety and privacy](#safety-and-privacy)
6. [Getting started](#getting-started)
7. [Project structure](#project-structure)
8. [Limitations and next steps](#limitations-and-next-steps)
9. [Related documents](#related-documents)

---

## The problem

A rural patient who needs a specialist faces a chain of gaps. Any one of them can delay or stop care:

- **Recognition.** They may not know how serious a symptom is, or what kind of doctor to see.
- **Availability.** The treatment they need may not be offered locally.
- **Trust.** They can't tell which providers are legitimate, and online platforms sell the top search spots.
- **Affordability.** The full cost is unclear, and help paying for it is hard to find.
- **Coordination.** Referrals get lost, and the specialist's findings rarely make it back to the clinic or the patient.

The result is late diagnosis, wasted trips and money, exposure to fraud, and people giving up on care. Official reports show this happens around the world:

| Region | Fact | Source |
|---|---|---|
| Canada | Rural areas have 0.9 doctors per 1,000 people, against 2.6 in urban areas. | [WHO, 2021 (p. 2)](https://iris.who.int/server/api/core/bitstreams/70210010-a0e0-4386-970c-11f342d6e01c/content) |
| United States | When rural hospitals closed, the median distance to inpatient care rose from 3.4 to 23.9 miles. | [GAO-21-93, 2020](https://www.gao.gov/assets/gao-21-93.pdf) |
| Australia | 32.3% of people in outer regional or remote areas waited longer than acceptable for a specialist, against 25.7% in major cities. | [ABS, Patient Experiences 2024-25](https://www.abs.gov.au/statistics/health/health-services/patient-experiences/2024-25) |
| Kenya | 31% of rural women say distance to a health facility is a serious problem (13% in urban areas). | [KNBS, DHS 2022 (Table 9.19)](https://dhsprogram.com/pubs/pdf/FR380/FR380.pdf) |
| Global | More than 1 billion people faced catastrophic out-of-pocket health costs. | [WHO and World Bank, 2023](https://www.who.int/news/item/18-09-2023-billions-left-behind-on-the-path-to-universal-health-coverage) |

Existing products such as doctor directories and video-consultation services work well for city patients with smartphones. They don't help with these rural gaps. The full research, including all observations and research questions, is in [docs/research.md](docs/research.md).

---

## What the app does

The app has three sections. People can use it as a **patient**, a **community health worker**, a **primary-care clinician**, or a **specialist**.

### Care & Cost: what's wrong, what will it cost, and who can help pay

- **Symptom check** in the patient's own words, in English or Spanish. Danger signs are checked first, before any AI is used. If one is found, the app shows a **Call 911** button and the nearest emergency department.
- **What kind of care and how soon,** for example "Heart specialist · Be seen within 1–2 weeks". Two optional questions ("How long?", "Getting worse?") make the timing more accurate.
- **Find this care near you,** a button that opens Find & Trust with the right search. It shows the nearest verified family doctor as the first step.
- **Private by default.** A patient can share a check with their community health worker, who continues it without asking the same questions again. The health worker records consent and readings, and can **send the check to the patient's clinic**.
- **Full cost of the visit:** consultation, tests, treatment, medicines, travel, lodging, and lost wages. Every amount can be edited, and the estimate shows a best-to-worst range and how much is known up front.
- **Check my coverage:** enter a member number to see what an insurance plan or Medicaid pays for this visit, including the deductible, copay, network, and which items need approval first.
- **Help paying:** programmes the patient already has, ones they can apply for (with the reason, the steps, and a document checklist), and what each would save.
- **Easy-read mode** with larger text and read-aloud.

### Find & Trust: the right place, one you can trust, and how to get there

- **Search by treatment or test,** for example "echocardiogram", not only by specialty.
- **Verified providers only by default.** Unverified listings are hidden unless you ask to see them, and then they come with warnings.
- **Ranking nobody can buy.** Results are ranked on evidence (findings sent back to clinics, travel, cost, wait, language) with the reasons shown on each result. The weights are published in a "How we rank" window. There are no star ratings and no paid placements.
- **When nothing is nearby,** the search widens to the nearest verified centres further away and says so.
- **Trip plan** for each provider: ways to get there, round-trip fare, when to leave, and whether an overnight stay is likely.
- **Provider pages** list the doctors who do the searched treatment. Each doctor's record shows a checked license, board certification, patients treated last year, findings sent back, and feedback only from patients whose referral was completed.
- **Stay safe** page: warning signs of fake clinics, a license lookup, flagged listings, and a "report this listing" button.

### Coordinate: no referral gets lost

- **Clinic inbox:** checks sent by health workers arrive here. The clinician decides whether to refer, and picks a specialist ranked the same way as Find & Trust.
- **Referral tracker:** every stage from *requested* to *followed up*, a list of information the specialist is still waiting for, and a "mark stalled" option that records who the referral is waiting on and why.
- **Findings back:** after the visit, the specialist writes a version for the clinic and a plain-language version for the patient, and approves both. The clinic and health worker receive them, and the patient sees the plain version.
- **Medicine changes explained:** the specialist can record each medicine they changed and why. A **medicine history** shows every change across doctors, so a new doctor knows what was tried and the patient understands why.
- **Loop-closure numbers are live.** Each completed findings return updates the "findings sent back" figure that Find & Trust uses in its ranking.

---

## A walk-through

**Maria, 54,** lives in Cedar Falls. She has Medicaid, speaks English and Spanish, and can spend about $400 a month. Her chest feels tight when she walks uphill.

1. **Care & Cost → What's wrong?** Maria describes the symptom. The app suggests a heart specialist and a check-up within 1–2 weeks, and tells her not to start or change medicine on her own.
2. **Find this care near you** opens Find & Trust. The nearest verified family doctor is shown as the first step. Two verified heart centres are ranked with reasons, and a "miracle cure" clinic is hidden. Its warnings are visible if she asks to see it.
3. **The provider page** for County Cardiology Clinic shows the doctors who do echocardiograms and their records. The trip plan shows a free Medicaid ride, or the $12 community shuttle.
4. **What will it cost?** About $154 out of pocket today, and about $62 after applying for medical transport and a lost-wages fund. The **Help paying** step shows how to apply.
5. **Her health worker,** Ana, saves the check with Maria's readings and **sends it to her clinic**.
6. **Her family doctor** refers her from the **Clinic inbox** to a ranked, verified specialist.
7. **The specialist** sees her, then sends findings back in two versions. Maria, Ana, and her clinic all receive them, and County Cardiology Clinic's "findings sent back" figure in Find & Trust goes up by one.

---

## How we answer each problem

These are the ten observations from our research ([docs/research.md](docs/research.md#4-observations)).

| # | Problem | How the app answers it | Status |
|---|---|---|---|
| **O1** | People can't tell how serious a symptom is or what care it needs, so they delay, self-medicate, or see the wrong provider. | Symptom check in plain words (English and Spanish); danger signs checked first with Call 911 and the nearest emergency department; care type and "how soon"; a link to the right care with the nearest family doctor as the first step; a fixed "don't start or change medicine on your own" note. | ✅ Answered |
| **O2** | The specialist care they need isn't available locally. | Search by treatment or test; a travel-distance limit; a widened search to the nearest verified centres when nothing is close; provider pages showing what each place offers. | ✅ Answered |
| **O3** | Seeing a specialist takes long, repeated trips. | Trip plan with fares, leave-by time, and overnight-stay warning (shared by Find & Trust, Coordinate, and the cost estimate); video follow-up shown for providers and doctors; travel help (medical transport, travel grant) under Help paying. | ✅ Answered |
| **O4** | Fake practitioners and "guaranteed cure" clinics; no way to check who is legitimate; paid search rankings. | Verified-only by default; each warning sign explained; license lookup for providers and doctors; Stay safe page with reporting; published ranking with no paid placement and no star ratings; doctors' records built from evidence. | ✅ Answered |
| **O5** | The full cost isn't known up front and often exceeds what families can pay. | Editable cost estimate covering travel, lodging, and lost wages, with a best-to-worst range, "% known up front", what each programme pays, and a budget check. | ✅ Answered |
| **O6** | Insurance, schemes, and aid exist, but people can't tell what they qualify for or how to apply. | Help paying (have / can apply / other) with reasons, steps, and document checklists; Check my coverage for deductible, copay, network, and approvals. | ✅ Answered |
| **O7** | Referrals stall, and clinics rarely learn whether the patient was seen. | Health worker sends the check to the clinic; clinic inbox; referral to a ranked, verified specialist; referral stages, missing-information list, who a stalled referral is waiting on and why, and a timeline visible to everyone involved. | ✅ Answered |
| **O8** | Patients don't understand the findings, and the clinic and health worker never hear them. | Specialist sends findings back in a clinic version and a plain-language version, approved before sending; the clinic and health worker receive them; live "findings sent back" figures. | ✅ Answered |
| **O9** | Different doctors prescribe different medicines, so patients lose trust and switch doctors. | With the findings, the specialist records each medicine they started, stopped, or changed, and why: a reason for the clinic and a plain-language reason for the patient. A medicine history shows every change across doctors, so a new doctor knows what was tried. Patients and health workers see the plain reasons with "don't change medicine on your own". The app only records what clinicians decide; it never suggests medicines. | ✅ Answered |
| **O10** | Paperwork (referral letters, approvals, claims) takes clinic time and delays care. | The health worker's check carries over so no one asks twice; the referral reason is filled in from the check; missing-information list; document checklists; approval warnings in Check my coverage. Referral letters and claim forms aren't generated yet. | ⚠️ Partly |

---

## Safety and privacy

- **No diagnosis, no treatment advice.** The app suggests a *type* of care only. AI answers must choose from a fixed list of care types and timings, and are checked in code for disease names, medicine names, doses, and diagnostic phrasing (English and Spanish). Any match is discarded in favour of the offline rules.
- **Emergencies first.** Danger-sign rules run locally before any AI call, so emergency advice never depends on the network.
- **Clinicians decide.** Only the patient's clinician can make a referral. Only the specialist can send findings, and they approve the plain-language version before it goes out.
- **Private by default.** Nothing from a patient's own check is saved unless they share it. Health workers record consent before starting. Patients and health workers see only the plain-language findings.
- **Fair ranking.** No paid placement, no star ratings, published weights, and unverified providers hidden by default.
- **Synthetic data only.** A real deployment would need to meet local health-privacy law (for example HIPAA in the US).

---

## Getting started

**Requirements:** Node.js 18 or later, and a free [Neon](https://neon.tech) Postgres database.

1. Create a file called `.env.local` in the project folder with your Neon connection string (this file is never committed):

   ```
   DATABASE_URL=postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require
   ```

2. Install, create the tables and demo data, and start:

   ```bash
   npm install
   npm run db:setup
   npm run dev:all
   ```

Then open **http://localhost:5173**. This starts the web app and the API (port 4000) together. You can also run them separately with `npm run dev` (web app) and `npm run server` (API).

The Find & Trust search, the symptom check, and the cost estimate also work without the API. Signing in, health-worker mode, Coordinate, and live loop-closure figures need it.

### Demo accounts

All accounts use the password **`demo1234`**.

| Account | Role | Use it to |
|---|---|---|
| `maria@example.com` | Patient | Share a check with your health worker, follow your referral |
| `chw@example.com` | Community health worker (Ana Torres) | Run checks with Maria, send them to her clinic |
| `pcp@example.com` | Family doctor (Hometown Family Practice) | Review the clinic inbox, make referrals |
| `specialist@example.com` | Specialist (County Cardiology Clinic) | Update referrals, send findings back |

### Optional: AI suggestions

The symptom check works offline with built-in rules. For AI suggestions, create a free key at [console.groq.com](https://console.groq.com) and add it to `.env.local`:

```
GROQ_API_KEY=your-key-here
```

Restart the API afterwards. The key stays on the server and is never sent to the browser.

### Resetting the demo data

Run `npm run db:reset` to wipe the database and restore the original demo data.

### Deploying

The live demo runs on Vercel with the database on Neon. See [CONTRIBUTING.md](CONTRIBUTING.md#deploy-for-judging--vercel--neon) for the steps.

---

## Project structure

```
src/
  app/            Pages shared by all sections (home, sign-in, layout)
  features/
    care/         Care & Cost: symptom check, costs, coverage, help paying
    find/         Find & Trust: search, ranking, trust checks, trips, provider pages
    coordinate/   Coordinate: clinic inbox, referrals, findings
  shared/         Data shapes, shared UI parts, API client
  data/           Demo data (patients, providers, doctors, programmes, transport)
server/           API: sign-in, symptom checks, referrals, loop-closure figures, AI proxy
tests/            Property-based tests (safety, ranking, costs, travel, medicine changes)
scripts/          Checks: bundle, conflict markers, test runner, hook scripts
docs/             Research
.kiro/            Kiro steering docs, agent hooks, and specs
```

### Checks and tests

```bash
node scripts/run-tests.mjs        # unit and property-based tests
node scripts/check-bundle.mjs     # does the front end build?
node scripts/check-conflicts.mjs  # any merge-conflict markers left?
```

Built with React, Vite, Tailwind CSS, Express, and Postgres (Neon), deployed on Vercel.

---

## Limitations and next steps

- **Demo data only.** Providers, doctors, insurance plans, programmes, fares, and license records are made up. Eligibility rules are simplified.
- **One demo region** (United States). Most of what changes by country is kept in the demo data so other regions can be added.
- **Spanish** covers the home page and Care & Cost. Find & Trust and Coordinate are in English for now.
- **Travel times** use straight-line distance and a fixed speed for each type of transport.
- **Coming next:** drafted referral letters and claim forms (O10), an AI draft of the plain-language findings for the specialist to edit, a flag for referrals with no response after a few days, and moving the AI call to the server.

---

## Related documents

| Document | What's in it |
|---|---|
| [docs/research.md](docs/research.md) | The full problem research: key facts, scope, observations, stakeholders, and research questions |
| [.kiro/KIRO_USAGE.md](.kiro/KIRO_USAGE.md) | How we used Kiro: specs, steering, hooks, and property-based tests |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to work on the code |
| [TODO.md](TODO.md) | Open tasks |
