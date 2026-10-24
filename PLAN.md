# CareBridge: Build Plan

> **Pitch:** Practo helps city patients find a doctor. CareBridge gets rural patients to the right specialist and brings the answer back home.
>
> **Hard rule:** CareBridge helps people *move through* the health system. It never diagnoses, never recommends treatment, and never suggests changing medicines. Clinical decisions stay with qualified professionals.

The problems, key facts, and research questions are in [README.md](README.md). This file covers **what we build**.

---

## 0. How to read this plan

| Section | Owner | Workstream | Gaps it closes |
|---|---|---|---|
| **A** | Person 1 | Assess and Afford: dual-mode triage chatbot, schemes, financial aid, full cost | G2, G3 |
| **B** | Person 2 | Match and Get There: verified centres, fair ranking, travel plan | G4, G5 |
| **C** | Person 3 | Refer and Close the Loop: referrals, specialist inbox, findings sent back, patient updates | G1 (+ G6 stretch) |

All three people work through §1–4 together in the first hour. After that, each person mostly works in their own section and the team syncs at the checkpoints in §8.

---

## 1. Positioning: build what others don't

### 1.1 What already exists
| Product | What it does | What it misses for rural specialty care |
|---|---|---|
| **Practo** (and similar city marketplaces) | Doctor search, booking, video consultations, reviews, patient record storage, clinic and hospital software | Patients must pick a specialty themselves. Records go only from provider to patient, never doctor to doctor. No help with scheme or aid eligibility. Nothing on travel or on centres outside the city. Top search slots are sold (Practo Reach). |
| **National telemedicine services** (e.g. eSanjeevani in India) | Video consultations between rural clinics and specialists | No in-person referral to a specialty hospital, no help with cost or aid, no travel planning, no findings sent back after an in-person visit |
| **Symptom checkers** (e.g. Ada) | Symptom chat on a smartphone | Mostly English, suggests possible diseases, and stops there. Nothing connects to a referral or a CHW. |

### 1.2 The gaps we build on
| Gap | README observations | Priority |
|---|---|---|
| **G1** Referral loop: clinic → specialist → findings back to the clinic | O11, O14 | **Must-have** |
| **G2** Patients find out which schemes and aid they qualify for, and the full cost | O8, O9 | **Must-have** |
| **G3** Dual-mode triage chatbot: how urgent it is and where to go first | O1 | **Must-have** |
| **G4** Rural logistics: service not available locally, travel, language, poor connectivity | O6, O12, O13 | **Must-have** |
| **G5** Trust: verified providers, rankings nobody can buy | O4, O7 | **Must-have** |
| **G6** Medicine changes explained across doctors | O10 | Stretch |

### 1.3 What we deliberately do NOT build
Practo and similar products already do these well, so they stay minimal or mocked:
- detailed doctor search, star reviews, lab-test booking, payments, a records app;
- video-call infrastructure (a video follow-up is just a hand-off link);
- open booking for patients (slots are offered by the specialist centre when it accepts a referral).

### 1.4 Headline metric
**Referral loop closed** = the % of sent referrals where the specialist's findings made it back to the referring clinic. It's shown on the dashboard (C6) and used as a ranking signal (B). No competitor shows this number.

---

## 2. Users, region packs, and design principles

### 2.1 Users
| User | Device | Role in CareBridge |
|---|---|---|
| **CHW** (community health worker, e.g. ASHA in India) | Smartphone, web app | Runs the triage chat with the patient and sends the result to the clinic. Later follows up with the patient. |
| **Patient** | Any phone: chat that looks like WhatsApp, or voice | Can run the triage chat privately. Receives appointment, travel, cost, and findings in their own language. |
| **Primary-care clinician** (PHC doctor / PCP) | Web | Reviews the triage result, **decides** whether to refer, approves the referral letter, receives findings |
| **Specialist centre coordinator / specialist** | Web | Accepts the referral, offers a slot, sends findings back |

### 2.2 Works in any country: region packs
Everything that changes by country lives in one config file per region, `data/regions/<code>.json`. The code itself never hard-codes a country.

| Field | Example (India) | Example (United States) |
|---|---|---|
| `emergencyNumber` | 108 | 911 |
| `currency` | INR | USD |
| `languages` | hi, en, … | en, es |
| `chwTitle` | ASHA worker | Community health worker |
| `primaryCareTitle` | PHC doctor | Primary care provider |
| `facilityLevels` | Sub-centre → PHC → CHC → district hospital → specialty hospital | Clinic → critical access hospital → regional / academic medical centre |
| `schemes` | PM-JAY, state schemes | Medicaid, Medicare |
| `registries` | National Medical Commission / state councils, NABH | NPI Registry, Joint Commission |
| `transportModes` | bus, shared auto, 108 ambulance (emergencies only) | car, community transport, non-emergency medical transport |
| `distanceUnit` | km | mi |

The demo runs on one main region pack. Switching to a second pack live (stretch) shows the app works anywhere.

### 2.3 Rural design principles (apply to every screen)
- Runs on low-end phones over slow 3G. The list view works even if the map tiles fail to load.
- Speaks first, reads second: voice input and read-aloud, local language, icons with simple words.
- Patients receive everything by SMS or WhatsApp (simulated in the demo). They don't need to install an app.
- Costs are shown as ranges in local currency, together with what is covered.

---

## 3. The core loop and demo storyline

### 3.1 The loop (backbone of the product and the demo)
```
 ┌──────────── A ────────────┐   ┌──────── C ────────┐   ┌──────── B ───────┐   ┌──────────────── C ────────────────┐
 Triage chat ─► Result ─► Clinician reviews ─► Match centres ─► Referral sent ─► Accepted + slot ─► Seen ─► Findings back
 (patient or CHW)   │                                      │ travel plan            │                       │
                    └──► Afford (A): schemes, aid, full cost ◄─┘   patient + CHW notified (C) ◄───────────────┘
```

1. **Assess (A):** the patient or CHW chats. Danger-sign rules run first. The result gives how urgent it is, the type of specialist, and a summary.
2. **Review (C):** the primary-care clinician reads the summary and **decides**: manage at the clinic, refer, or emergency.
3. **Match (B):** list verified centres that offer the needed specialty, can be reached, and accept the patient's scheme, ranked with reasons.
4. **Afford (A):** scheme eligibility, matching aid, and the full cost including travel and lodging.
5. **Refer (C):** an AI-drafted letter that the clinician approves. The centre accepts and offers a slot.
6. **Go (B + C):** the patient and the CHW get the date, travel plan, and documents to bring, in their language.
7. **Close the loop (C):** the specialist's findings go back to the clinician and the CHW, and a plain-language version goes to the patient. The follow-up can be a video call from the clinic.

### 3.2 Demo storyline (India region pack)
**Persona: Meena, 52,** lives in a village about 90 km from the district city. Meena has a basic phone, no car, and a PM-JAY card, and can afford at most ₹3,000 out of pocket. Meena has noticed a breast lump for 3 weeks.

1. **(A, patient mode)** Meena starts the chat privately, by voice in Hindi, then taps **"Share with my ASHA"**.
2. **(A, CHW mode)** The ASHA worker picks up the shared summary and adds age and readings, without asking anything twice. Result: *"Be seen within 1–2 weeks. Specialist type: breast surgeon / surgical oncology."* It goes to the PHC doctor.
3. **(C)** The PHC doctor reviews the result and decides to refer.
4. **(B)** Nothing local offers this specialty, so the search widens. It finds 3 verified cancer centres; a "guaranteed cure" clinic appears flagged. The top centre accepts PM-JAY and *"sent findings back for 9 of 10 referrals"*.
5. **(A)** PM-JAY covers the consultation, and an NGO grant covers the bus and lodging. Meena's out-of-pocket cost is about ₹200.
6. **(C)** The AI drafts the referral letter, the doctor approves it, and the centre accepts with a slot on Tuesday.
7. **(B + C)** Meena gets an SMS and a voice note in Hindi: date, "leave by 6:10 am, bus from the main road", and which documents to bring.
8. **(C)** After the visit, the findings go back to the PHC doctor and the ASHA, and Meena gets a plain-language voice note. The follow-up is booked as a video call from the PHC. The dashboard shows **referral loop closed ✅**.

**Second path to test:** a danger sign (e.g. sudden face drooping or slurred speech) goes straight to the emergency screen with the region's emergency number, and **no AI call is made**.

---

## 4. Architecture and shared contracts (agree in hour 1, then freeze)

### 4.1 Stack
- Next.js (App Router), TypeScript, Tailwind, shadcn/ui
- Leaflet with OpenStreetMap (no API key needed)
- Seed data in JSON, served by Next.js route handlers
- Web Speech API for voice input and read-aloud
- Claude API for the chatbot, letters, and plain-language summaries (§4.5)

### 4.2 Folder ownership (avoids merge conflicts)
```
app/
  page.tsx                      A   mode select: "I need help" / "I'm a health worker"
  chat/                         A   patient-mode triage (looks like WhatsApp)
  chw/                          A   CHW home, CHW-mode triage, shared sessions
  emergency/                    A
  afford/[sessionId]/           A   schemes, aid, full cost
  match/[sessionId]/            B   ranked centres, list + map
  facility/[id]/                B
  travel/[referralId]/          B
  safety/                       B   fraud warning signs, flagged listings
  clinic/                       C   clinician inbox, review, create referral
  specialist/                   C   centre inbox, accept, offer slot, findings
  updates/[patientId]/          C   patient / CHW message previews (SMS, voice)
  loop/                         C   referral-loop dashboard
  api/triage/                   A
  api/aid/                      A
  api/match/                    B
  api/travel/                   B
  api/referrals/                C
  api/notify/                   C
  api/ai/letter/, api/ai/findings/   C
lib/
  types.ts                      SHARED: change only with all 3 agreeing
  region.ts                     A   loads the region pack (useRegion())
  ai/claude.ts                  A   shared Claude wrapper (C uses it too)
  redFlags.ts, triage.ts, affordability.ts, aid.ts    A
  ranking.ts, geo.ts, travel.ts                       B
  referrals.ts, notify.ts, loopStats.ts               C
components/ui/                  SHARED (shadcn)
components/triage/ (A)   components/match/ (B)   components/referral/ (C)
data/
  regions/*.json                A   region packs
  red-flags.json, schemes.json, aid-programs.json     A
  facilities.json, specialists.json, transport.json   B
  clinicians.json, referrals.json                     C
  demo-ai/*.json                A + C   canned AI responses for demo mode
```

### 4.3 Shared types (`lib/types.ts`)
```ts
export type Specialty =
  | 'primary_care' | 'neurology' | 'oncology' | 'surgical_oncology' | 'cardiology'
  | 'orthopedics' | 'nephrology' | 'endocrinology' | 'pulmonology' | 'gastroenterology'
  | 'obgyn' | 'pediatrics' | 'psychiatry' | 'dermatology' | 'ophthalmology' | 'ent';

export type Urgency = 'emergency' | 'within_days' | 'within_weeks' | 'routine';
export type GeoPoint = { lat: number; lng: number; label: string };

export interface RegionPack {
  code: string;                           // 'IN', 'US', 'KE', ...
  emergencyNumber: string;
  currency: string;
  languages: string[];
  chwTitle: string;
  primaryCareTitle: string;
  facilityLevels: string[];
  schemeIds: string[];
  registries: string[];
  transportModes: string[];
  distanceUnit: 'km' | 'mi';
}

export interface Patient {
  id: string; regionCode: string; language: string;
  age?: number; sex?: 'female' | 'male' | 'other';
  location: GeoPoint;
  schemeIds: string[];                    // insurance / government schemes held
  budgetMax?: number;
  transport: string[];                    // from region pack transportModes
  chwId?: string;
  phone?: string;
}

/** One triage chat. Patient mode and CHW mode share this shape. */
export interface TriageSession {
  id: string; patientId: string;
  mode: 'patient' | 'chw';
  chwId?: string;
  language: string;
  consentRecorded: boolean;               // required in CHW mode
  sharedWithChw: boolean;                 // patient mode: opt-in
  messages: { role: 'user' | 'bot'; text: string; at: string }[];
  readings?: { temperatureC?: number; bpSystolic?: number; bpDiastolic?: number; weightKg?: number };
  result?: TriageResult;
}

/** Output of the triage engine (A). Input to review (C), match (B), and afford (A). */
export interface TriageResult {
  urgency: Urgency;
  specialties: Specialty[];               // TYPES of specialist, never a diagnosis
  concernCategory: string;                // taxonomy key, e.g. 'breast_concern'
  summaryForClinician: string;
  summaryForPatient: string;              // in the patient's language
  qa: { q: string; a: string }[];
  redFlagTriggered: boolean;
}

export interface Verification {
  status: 'verified' | 'pending' | 'unverified' | 'flagged';
  source: string;                         // from region pack registries
  checkedAt: string;
}

export interface Facility {
  id: string; name: string; regionCode: string;
  level: string;                          // from region pack facilityLevels
  specialties: Specialty[];
  services: string[];                     // 'mammography', 'radiotherapy', ...
  location: GeoPoint;
  verification: Verification;
  acceptedSchemeIds: string[];
  languages: string[];
  typicalWaitDays?: number;
  videoFollowUp: boolean;
}

export interface RankedFacility {
  facility: Facility;
  score: number;
  reasons: string[];                      // "Accepts your scheme", "Sent findings back for 9 of 10 referrals"
  distance: number;
  travel?: TravelPlan;
  loopClosureRate?: number;               // from C's loopStats
}

export interface TravelPlan {
  legs: { mode: string; from: string; to: string; minutes: number; cost: number }[];
  totalMinutes: number; totalCost: number;
  leaveBy: string;                        // ISO time
  overnightNeeded: boolean;
}

export interface CostEstimate {
  consult: [number, number]; travel: number; lodging: number;
  covered: number; outOfPocket: number;
  coveredBy: string[];                    // scheme / aid names
  withinBudget: boolean;
}

export interface AidProgram {
  id: string; regionCode: string; name: string;
  kind: 'insurance' | 'govt_scheme' | 'hospital_charity' | 'ngo_grant';
  covers: string[];                       // 'consultation', 'surgery', 'travel', 'lodging'
  eligibility: { field: string; op: 'eq' | 'in' | 'lte' | 'gte'; value: unknown }[];
  documents: string[];
  howToApply: string;
  verification: Verification;
}

export type ReferralStatus =
  | 'draft' | 'sent' | 'accepted' | 'declined' | 'scheduled'
  | 'seen' | 'findings_returned' | 'closed';

export interface Referral {
  id: string; patientId: string; triageSessionId: string;
  fromClinicianId: string; chwId?: string;
  toFacilityId: string; toSpecialty: Specialty;
  reason: string;
  letterDraft?: string;
  letterApprovedBy?: string;              // required before status 'sent'
  status: ReferralStatus;
  history: { status: ReferralStatus; at: string }[];
  appointment?: { start: string; mode: 'in_person' | 'video' };
  findings?: {
    forClinician: string;
    forPatient: string;                   // plain language, patient's language
    approvedBy: string;                   // specialist must approve
    medicationChanges?: { medicine: string; change: string; reason: string }[];  // G6 stretch
  };
}

export interface Notification {
  to: 'patient' | 'chw' | 'clinician';
  channel: 'sms' | 'whatsapp' | 'voice';
  language: string; text: string; sentAt: string;
}
```

### 4.4 The dual-mode triage engine (heart of workstream A)
```
Patient mode ─┐                                                  
              ├─► 1. Danger-sign rules (no AI) ──► emergency screen
CHW mode ─────┘   2. AI conversation, one question per turn
                  3. TriageResult (urgency, specialist type, summaries)
```

| | Patient mode | CHW mode |
|---|---|---|
| Entry | `app/chat` (looks like WhatsApp), voice first | `app/chw`, chat plus structured fields |
| Questions | Short, simple, mostly yes/no, tap a body picture | More detailed. Readings can be entered (temperature, blood pressure, weight). |
| Privacy | Private by default. "Share with my CHW" is opt-in. | Consent recorded before starting |
| Result shown | "What to do next" in plain words | Summary for the clinician, urgency, checklist (scheme card, documents) |
| Emergency | Call button with the region's number; the CHW is alerted if the patient agreed | Call button, nearest emergency facility (from B), transport options |
| Handoff | **Share with my CHW:** the CHW continues the same session, nothing is asked twice | Sends the result to the clinician inbox (C); the patient gets an SMS or voice note |

Sensitive topics (sexual or mental health) can stay in patient mode and go straight to the clinician or a video consultation, without the CHW.

### 4.5 AI usage (Claude API, server-side only)
| Use | Owner | Input → Output | Guardrail |
|---|---|---|---|
| Triage chatbot | A | Conversation, mode, language, age and sex → one `TriageTurn` per call | Danger-sign rules run **first**. The schema has no diagnosis or medicine field. On refusal or error, show "Please see your clinic". |
| Referral letter draft | C | `TriageResult`, clinician notes, patient → letter | Stays **Draft** until the clinician clicks Approve |
| Plain-language findings | C | Specialist findings → patient-language version | The specialist approves it before it's sent |
| Translating notifications | C | Message templates → patient's language | Only templates; nothing clinical without approval |

```ts
// One chat turn. The model either asks the next question or finishes with a result.
const TriageTurn = z.object({
  reply: z.string(),                        // next question, or the closing message
  quickReplies: z.array(z.string()).optional(),
  done: z.boolean(),
  result: TriageResultSchema.optional(),    // present only when done === true
});
```

Implementation notes:
- Use `@anthropic-ai/sdk` in route handlers (`app/api/...`). Keep the API key in `.env.local`, never in the browser.
- Model `claude-opus-5-5` with `effort: "low"` so the chat feels fast.
- Get structured output with `client.messages.parse()` and `output_config: { format: zodOutputFormat(TriageTurn) }` (from `@anthropic-ai/sdk/helpers/zod`).
- Always check `stop_reason` (`refusal`, `max_tokens`) before using a response. If anything is unexpected, show the safe fallback.
- With `DEMO_MODE=true` or no API key, routes return canned turns from `data/demo-ai/`, so the demo works offline.

### 4.6 Team rules
1. **Mock first:** every section runs on seed data alone.
2. **`lib/types.ts` is frozen** after hour 1. Changes need an announcement and agreement from all three.
3. Each person works on their own branch and merges to `main` at each checkpoint.
4. Use the shared UI in `components/ui`; don't make copies.
5. Each `data/*.json` file has one owner, so ask before editing someone else's.
6. **Never hard-code a country:** read it from `useRegion()`.

---

## 5. Workstream A, Person 1: Assess and Afford

**Mission:** turn "something is wrong" into a safe, clear next step in the person's own language, and show what it will really cost and who can help pay.
**Gaps:** G3 (dual-mode chatbot) and G2 (schemes, aid, full cost). **README:** O1, O8, O9.

### Screens
| ID | Screen | Key elements |
|---|---|---|
| A1 | Start | Two big buttons, **"I need help"** and **"I'm a health worker"**, plus a language picker with voice prompts. The region pack picker shows in demo mode only. |
| A2 | Patient chat | Looks like WhatsApp. Voice in and out, quick-reply chips, a body picture to tap, one question at a time. |
| A3 | CHW triage | Same chat, plus a patient picker, consent checkbox, and reading fields. Shared sessions from patients appear at the top. |
| A4 | Emergency | The region's emergency number as one large button, the nearest emergency facility (from B), transport options, "alert my CHW" |
| A5 | Result | *Patient version:* what to do next, and **Share with my CHW**. *CHW version:* urgency, specialist type, clinician summary, checklist, and **Send to clinic** (→ C). Banner: "This is not a diagnosis." |
| A6 | Afford | Schemes the patient qualifies for, with reasons; matching aid programs; the full cost broken down (consultation, travel and lodging from B, covered amount, out-of-pocket); document checklist; how to apply |

### Build list
**MVP (by Checkpoint 1)**
- [ ] Phase 0: scaffold the repo, `lib/types.ts`, `lib/region.ts`, `data/regions/IN.json`, `lib/ai/claude.ts`
- [ ] `data/red-flags.json` and `lib/redFlags.ts`: fixed danger-sign rules, checked before any AI call
- [ ] `lib/triage.ts` with canned turns, and screens A1–A5 working end to end in both modes
- [ ] Session store (localStorage) with the **Share with my CHW** handoff

**Phase 2 (by Checkpoint 2)**
- [ ] `POST /api/triage`: Claude returns `TriageTurn`, with demo-mode fallback
- [ ] Voice in and out (Web Speech API) in 2 languages
- [ ] `data/schemes.json` and `data/aid-programs.json` (8–12 for the demo region), with `matchAid(patient, result)` returning reasons
- [ ] `lib/affordability.ts`: `estimateCost(facility, patient, travel)`, which B's cards use
- [ ] Screen A6

**Stretch**
- [ ] Second region pack (`US.json` or another), switched live in the demo
- [ ] CHW mode works offline and syncs when back online
- [ ] Understanding local symptom terms (e.g. "sugar", "BP", "body heat") through a glossary in each region pack

### Interfaces
- **Gives others:** `TriageResult`, `useRegion()`, `estimateCost()`, `matchAid()`, `lib/ai/claude.ts`
- **Needs from others:** facilities and travel cost (B); the clinician inbox endpoint (C)

### Done when
- [ ] Every danger-sign test input reaches A4 with **zero** AI calls
- [ ] 10 test chats (5 per mode) each produce an urgency level and a specialist type, and **none** gives a diagnosis or a medicine name
- [ ] Share with my CHW hands the session over without repeating any question
- [ ] The persona matches at least 1 scheme and at least 1 aid program, with readable reasons
- [ ] Works in 2 languages and at 360 px width

---

## 6. Workstream B, Person 2: Match and Get There

**Mission:** find centres that *actually* offer what's needed, can be trusted, and can be reached, then plan the trip.
**Gaps:** G4 (logistics, service not local) and G5 (trust, rankings nobody can buy). **README:** O2–O7, O12.

### Screens
| ID | Screen | Key elements |
|---|---|---|
| B1 | Match results | For the clinician or CHW. Ranked centres with 2–3 plain-language reasons each. List and map. Filters: verified only (**on by default**), accepts the patient's scheme, maximum travel time. |
| B2 | Facility profile | Level, specialties and services offered, **verified badge (source and date)**, schemes accepted, typical wait, **"sent findings back for X of Y referrals"**, video follow-up available |
| B3 | Not available nearby | Explains that nothing within X offers this specialty, then widens the search to the nearest verified centres further away |
| B4 | Travel plan | Each leg (walk, bus, shared ride), "leave by" time, cost, whether an overnight stay is needed, the return trip |
| B5 | Safety | Fraud warning signs ("guaranteed cure", asking for payment outside hospital billing, no license number), flagged listings, report a listing |

### Ranking (`lib/ranking.ts`)
- **Hard filters:** offers the needed specialty; verified (default); within maximum travel, unless the search has been widened.
- **Score (0–1):** 0.25 × loop-closure rate + 0.25 × travel time + 0.20 × affordability (scheme accepted, within budget) + 0.20 × typical wait + 0.10 × language match.
- **Urgency shifts the weights:** for `within_days`, wait and travel time count for more.
- **No paid placement, and no star ratings.** Ranking uses evidence that a centre serves rural referrals well. The weights are published in a "How we rank" modal.

### Build list
**MVP (by Checkpoint 1)**
- [ ] Phase 0 seed data: `data/facilities.json`, about 30 facilities across every level in the demo region (sub-centres, PHCs, district hospital, 2 specialty cancer centres, 1 neuro centre, 2–3 flagged or unverified listings), plus `data/transport.json` with fares
- [ ] `lib/geo.ts` (distance) and `lib/ranking.ts` v1 with reasons
- [ ] `POST /api/match` (TriageResult + patient → `RankedFacility[]`)
- [ ] Screens B1 (list) and B2

**Phase 2 (by Checkpoint 2)**
- [ ] `lib/travel.ts` and screen B4 (straight-line distance × a road factor, with fares from the region's transport modes)
- [ ] B3: widen the search
- [ ] Map view with a travel-time ring
- [ ] Wire in `loopStats` (C) and `estimateCost` (A)
- [ ] B5: safety page

**Stretch**
- [ ] Patient feedback per condition, **only from closed referrals** (verified visits only, so no fake reviews)
- [ ] Live license lookup against a public registry (e.g. the US NPI Registry API)
- [ ] Facility data for a second region pack

### Interfaces
- **Gives others:** `matchFacilities()`, `planTravel()`, the facility seed data, `<FacilityCard/>`, `<VerifiedBadge/>`
- **Needs from others:** `TriageResult` and `estimateCost()` (A); `loopStats()` (C)

### Done when
- [ ] For the persona, flagged clinics are hidden by default and shown only with a warning
- [ ] Every result shows at least 2 reasons, including its loop-closure rate
- [ ] When nothing local offers the specialty, B3 shows the nearest verified centres
- [ ] The travel plan shows a "leave by" time, the cost, and whether an overnight stay is needed

---

## 7. Workstream C, Person 3: Refer and Close the Loop

**Mission:** make sure no referral gets lost, and that the specialist's findings return to the clinic, the CHW, and the patient.
**Gaps:** G1 (referral loop), with G6 (explaining medicine changes) as a stretch. **README:** O10, O11, O14, O15.

### Screens
| ID | Screen | Key elements |
|---|---|---|
| C1 | Clinician inbox | Triage results arriving from CHWs and patients, sorted by urgency. The clinician **decides**: manage at the clinic, refer, or send to emergency. |
| C2 | Create referral | Choose a centre from B1. An AI-drafted letter is built from the triage summary and the clinician's notes, then edited, then **Approve & send**. |
| C3 | Specialist centre inbox | Incoming referrals with the full summary. Accept or decline. Offer a slot, in person or by video. |
| C4 | Patient and CHW updates | Preview of the SMS, WhatsApp, or voice notes in the patient's language: appointment, travel plan (B), documents to bring, reminders |
| C5 | Findings back | The specialist enters findings. AI writes a plain-language version, the specialist approves it, and it goes to the clinician, the CHW, and the patient. Includes the follow-up plan (e.g. a video follow-up from the clinic). |
| C6 | Loop dashboard | Referrals by status, **% of referral loops closed**, stalled referrals (e.g. no response within 3 days) flagged for follow-up |
| C7 | *(Stretch)* Medicine change note | The specialist records "changed X to Y because…". The clinician and CHW see the reason, and the patient gets a plain-language version. |

**Referral lifecycle:** `draft → sent → accepted | declined → scheduled → seen → findings_returned → closed`. Every step is timestamped and appears on C1, C3, C4, and C6.

### Build list
**MVP (by Checkpoint 1)**
- [ ] Phase 0: app shell (mobile layout, navigation, theme, i18n), `data/clinicians.json`, and `data/referrals.json` with 6 demo referrals at different stages, including 1 stalled
- [ ] `lib/referrals.ts` (state machine) and `/api/referrals`
- [ ] C1, C2 (canned letter), C3, and a basic C6

**Phase 2 (by Checkpoint 2)**
- [ ] `POST /api/ai/letter` with the approval gate
- [ ] C5 findings back, through `POST /api/ai/findings`, with the approval gate
- [ ] C4 notifications in the patient's language (`lib/notify.ts`, simulated)
- [ ] `loopStats()` for B's ranking, and stalled-referral alerts on C6

**Stretch**
- [ ] C7 medicine change notes (G6)
- [ ] Real SMS or WhatsApp messages
- [ ] Prompt the CHW to follow up when a patient misses an appointment
- [ ] Hand-off link to the national telemedicine service for video follow-ups

### Interfaces
- **Gives others:** `Referral` APIs, `loopStats()`, `<ReferralTimeline/>`, the clinician inbox endpoint
- **Needs from others:** `TriageResult` (A); `RankedFacility` and `TravelPlan` (B)

### Done when
- [ ] One referral goes through every status in the demo
- [ ] The findings reach the clinician, the CHW, and the patient (in the patient's language)
- [ ] AI letters and findings **cannot** be sent without an approve click
- [ ] The dashboard shows the % of loops closed and flags the stalled referral

---

## 8. Timeline (about 8 hours; stretch if you have longer)

| Phase | Time | Person 1 (A) | Person 2 (B) | Person 3 (C) |
|---|---|---|---|---|
| **0. Kickoff (together)** | 0:00–1:00 | Agree §1–4 together. Then: scaffold, `types.ts`, region pack, Claude wrapper | Facility and transport seed data (including flagged listings) | App shell and i18n; clinician and referral seed data |
| **1. Core MVP** | 1:00–4:00 | Danger-sign rules, both chat modes with canned turns, result screens, CHW handoff | Ranking v1, match list, facility profile | Clinician inbox, create referral, specialist inbox, basic dashboard |
| ✅ **Checkpoint 1** | 4:00 | **The loop clicks through end to end on canned data: chat → result → referral → accepted. Merge to `main`.** | | |
| **2. Depth** | 4:00–6:30 | Live Claude triage, voice, 2 languages, schemes and aid, cost | Travel plan, widened search, map, loop-closure in ranking, safety page | AI letter and findings with approval gates, notifications, loop stats, stalled alerts |
| ✅ **Checkpoint 2** | 6:30 | **Feature freeze. The full Meena storyline (§3.2) runs.** | | |
| **3. Polish and demo** | 6:30–8:00 | Guardrail tests (§5 "Done when"); "Practo vs CareBridge" slide | "How we rank" modal; data that looks real | Demo-mode fallback; demo script; rehearsal (all three) |

---

## 9. Safety, privacy, and ethics (everyone signs off before the demo)

- [ ] **No diagnosis.** The triage schema has no diagnosis or medicine field. The prompt forbids both. Every result shows "This is not a diagnosis".
- [ ] **Emergencies first.** Danger-sign rules run before any AI call and show the region's emergency number.
- [ ] **Clinicians decide.** Only the primary-care clinician can create a referral. Only the specialist can approve findings.
- [ ] **Human approval.** Every AI-drafted clinical text (letters, findings) is labelled **Draft** until approved.
- [ ] **Consent in both modes.** Patient mode is private by default, and sharing with the CHW is opt-in. CHW mode records consent before starting. The patient can withdraw consent.
- [ ] **Sensitive topics** can skip the CHW entirely.
- [ ] **Fair ranking.** No paid placement. The weights are published. Unverified providers are hidden by default.
- [ ] **Privacy.** Synthetic data only in the demo. A real deployment must follow local law (e.g. HIPAA in the US; DPDP Act and ABDM consent in India).
- [ ] **Accessibility.** Voice first, local languages, large tap targets, low-end phones on 3G.

---

## 10. Open questions for the team

1. **Region packs for the demo:** India as the main story, plus which second pack to prove "any country" (US, Kenya, …)?
2. **Messaging:** simulated SMS and WhatsApp (the default), or real messages through a provider such as Twilio?
3. **Build length:** is it about one day? If not, stretch §8.
4. **Pitch:** who presents, and do we open with the Key Facts from the README?
