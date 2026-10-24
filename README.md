# Rural Specialty-Care Access: Problem Discovery

The open problems that keep rural patients from getting timely specialty care, and that existing products leave unsolved.

| | |
|---|---|
| **Stage** | Problem discovery |
| **Team** | 3 members, one per workstream |
| **Last updated** | 2026-10-24 |

---

## Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
   - [Key Facts](#key-facts)
3. [Scope](#3-scope)
4. [Observations](#4-observations)
5. [Stakeholders](#5-stakeholders)
6. [Research Questions](#6-research-questions)
   - [6.1 Workstream A: Assess and Afford](#61-workstream-a-assess-and-afford)
   - [6.2 Workstream B: Match and Get There](#62-workstream-b-match-and-get-there)
   - [6.3 Workstream C: Refer and Close the Loop](#63-workstream-c-refer-and-close-the-loop)
   - [6.4 Cross-Cutting Questions](#64-cross-cutting-questions)
7. [Coverage Matrix](#7-coverage-matrix)
8. [Related Documents](#8-related-documents)

---

## 1. Overview

This document lists the problems we need to understand before we design anything. It contains no solutions. It covers only the problems that existing products don't solve (see [Section 3](#3-scope)). Each question:

- has a unique ID, so the team can refer to it in discussion and in later documents;
- belongs to one workstream, which has a single owner;
- is linked to the observations it investigates (Section 7).

## 2. Problem Statement

A rural patient who needs a specialist faces a chain of gaps. Any one of them can delay or stop care:

1. **Recognition.** The patient may not know how serious a symptom is, or what kind of doctor to see.
2. **Availability.** The treatment needed may not be offered locally, so the patient must travel far to centres they don't know.
3. **Trust.** Patients can't tell which providers are legitimate, and online platforms sell the top search spots.
4. **Affordability.** The full cost is unclear, budgets are limited, and schemes and financial aid are hard to find and claim.
5. **Coordination.** Referrals get lost, and the specialist's findings rarely make it back to the clinic, the community health worker, or the patient.
6. **Continuity.** Conflicting prescriptions for the same condition erode trust, so patients switch doctors and restart care.

The result is delayed diagnosis and treatment, wasted trips and money, exposure to fraud, and patients giving up on care altogether.

### Key Facts

These figures from official reports show that these problems occur around the world:

| Problem | Region | Fact | Source |
|---|---|---|---|
| Too few specialists | United Kingdom | English coastal communities have 15% fewer consultants (senior specialists) per patient. | [Chief Medical Officer's Annual Report 2021: Health in Coastal Communities, DHSC (p. 15)](https://assets.publishing.service.gov.uk/media/60f98769e90e0703ba3c9f25/cmo-annual_report-2021-health-in-coastal-communities-summary-and-recommendations-accessible.pdf) |
| Too few doctors | Canada | Rural areas have 0.9 doctors per 1,000 people, against 2.6 in urban areas. | [WHO Guideline on Health Workforce Development in Rural and Remote Areas, 2021 (p. 2)](https://iris.who.int/server/api/core/bitstreams/70210010-a0e0-4386-970c-11f342d6e01c/content) |
| Distance | United States | When rural hospitals closed, the median distance to general inpatient care rose from 3.4 to 23.9 miles. | [GAO, Rural Hospital Closures (GAO-21-93), 2020](https://www.gao.gov/assets/gao-21-93.pdf) |
| Distance and cost | Kenya | 31% of rural women say distance to a health facility is a serious problem in getting care (13% in urban areas), and 52% say getting money for treatment is (37% in urban areas). | [KNBS, Kenya Demographic and Health Survey 2022 (Table 9.19)](https://dhsprogram.com/pubs/pdf/FR380/FR380.pdf) |
| Delays reaching a specialist | Australia | 32.3% of people in outer regional or remote areas waited longer than they felt was acceptable for a specialist appointment, against 25.7% in major cities. | [Australian Bureau of Statistics, Patient Experiences 2024-25](https://www.abs.gov.au/statistics/health/health-services/patient-experiences/2024-25) |
| Cost | India | Households pay 39.4% of the country's total health spending out of their own pockets, about ₹2,600 per person (2021-22). | [MoHFW / NHSRC, National Health Accounts Estimates for India 2021-22 (p. 3)](https://nhsrcindia.org/sites/default/files/2024-09/NHA%202021-22.pdf) |
| Cost | Global | More than 1 billion people, about 14% of the world's population, faced catastrophic out-of-pocket health costs. | [WHO and World Bank, Tracking Universal Health Coverage: 2023 Global Monitoring Report](https://www.who.int/news/item/18-09-2023-billions-left-behind-on-the-path-to-universal-health-coverage) |
| Existing telehealth reaches rural people less | United States | 27.5% of adults in the most rural counties used telemedicine in 2021, against 40.3% in large city centres. | [CDC / NCHS, Data Brief No. 445, 2022 (p. 4)](https://www.cdc.gov/nchs/data/databriefs/db445.pdf) |

*Notes:* The India and global cost figures cover whole populations, not only rural areas. The UK figure is for coastal communities, not rural areas specifically.

## 3. Scope

**Focus areas.** These are problems that existing products leave unsolved for rural patients:
- Knowing how urgent a symptom is and where to go first
- Specialist care that isn't available locally
- Transportation to distant centres
- Trust in providers, and fraud
- Full cost, insurance coverage constraints, and financial aid
- Referral coordination between primary care and specialists
- Communication of findings back to the clinic, the CHW, and the patient
- Different prescriptions for the same condition
- Administrative burden of referrals and claims

**Already addressed by existing products (out of focus)**

| Problem | Already addressed by |
|---|---|
| Finding doctors, clinics, and hospitals nearby | Practo and similar directories |
| Comparing doctors through patient reviews | Practo patient feedback |
| Booking appointments and managing queues | Practo, Qikwell by Practo |
| Video consultations | Practo, national telemedicine services (e.g. eSanjeevani in India) |
| Storing personal medical records | Practo Drive |
| Booking lab tests | Practo |

These products work mainly for city patients who have a smartphone. The gaps they leave for rural patients are listed under focus areas above.

**Out of scope**
- **Clinical decisions.** Diagnosis, treatment choice, and prescribing remain with qualified professionals.
- **Solution design.** Covered in [PLAN.md](PLAN.md).

## 4. Observations

Each observation states who is affected, what the problem is, and what it leads to.

| ID | Observation | Workstream |
|---|---|---|
| O1 | Patients can't tell how serious a symptom is or what kind of care it needs, so they delay care, self-medicate, or see the wrong provider first. | A |
| O2 | Many specialist services don't exist locally, so patients must travel to distant centres they know nothing about. | B |
| O3 | Seeing a specialist can take several trips and a full day of travel, and every follow-up repeats it. | B |
| O4 | Unlicensed practitioners, middlemen (touts), and "guaranteed cure" clinics take advantage of patients who don't know where to go. Patients can't check who is legitimate, and online platforms sell the top search spots. | B |
| O5 | The full cost of care, including travel, lodging, and lost wages, isn't known up front and often exceeds what families can pay. | A |
| O6 | Insurance, government schemes, and financial aid exist, but patients can't easily find out what they qualify for or how to apply. | A |
| O7 | Referrals often stall: specialists receive incomplete information, and primary-care clinicians rarely learn whether the patient was seen. | C |
| O8 | Patients often leave a specialist visit without understanding what was said or what to do next, and their clinic and CHW never hear the findings. | C |
| O9 | Different doctors prescribe different medicines for the same condition, so patients lose trust and keep switching doctors. | C |
| O10 | Paperwork such as referral letters, pre-authorization, and scheme claims takes up clinic time and delays care. | A, C |

## 5. Stakeholders

| Stakeholder | How the problem affects them |
|---|---|
| Patients and families | Delayed care, wasted trips, unexpected costs, exposure to fraud |
| Community health workers (CHWs) | Often the first point of contact, but have no reliable way to judge urgency or to learn what happened after a referral |
| Primary-care clinicians and rural clinics | Refer patients out, then lose visibility of what happened |
| Specialists and specialist centres | Receive incomplete referrals, no-shows, and patients who come too late |
| Insurers and government schemes | Coverage rules and paperwork that patients often don't understand |
| NGOs, charities, and scholarship funders | Aid goes unclaimed because eligible people never learn it exists |

---

## 6. Research Questions

| Workstream | Focus | Owner | Observations |
|---|---|---|---|
| A | Assess and Afford | Person 1 | O1, O5, O6, O10 |
| B | Match and Get There | Person 2 | O2, O3, O4 |
| C | Refer and Close the Loop | Person 3 | O7, O8, O9, O10 |
| X | Cross-cutting | Shared | All |

### 6.1 Workstream A: Assess and Afford

**A.1 Recognizing the need**

| ID | Question |
|---|---|
| A-1 | How do rural patients decide that a symptom needs a doctor, and what makes them wait? |
| A-2 | Who do they ask first (family, CHW, pharmacist, traditional healer, internet), and how reliable is that advice? |
| A-3 | How do people tell an emergency from something that can wait? What happens when they get it wrong? |
| A-4 | How often do patients go to the wrong kind of doctor first, and what does that cost them in time and money? |
| A-5 | What words do people use to describe their symptoms, and how far is that from medical language? |
| A-6 | Where is the line between general health guidance and a clinical judgment that only a professional should make? |

**A.2 The CHW and the patient**

| ID | Question |
|---|---|
| A-7 | What role do CHWs play today in getting someone to specialist care, and where do they get stuck? |
| A-8 | Which health concerns would patients rather raise privately than through a CHW from their own village? |
| A-9 | Which languages, literacy levels, and digital skills must be accounted for? |
| A-10 | What phones and internet access do patients and CHWs have? Are phones shared within a household? |

**A.3 Cost, coverage, and financial aid**

| ID | Question |
|---|---|
| A-11 | What does specialist care cost a rural family from start to finish (consultation, tests, treatment, medicines, travel, lodging, lost wages)? |
| A-12 | How much of that cost is known before care starts? How often are families surprised by bills? |
| A-13 | Which insurance or government schemes do rural patients hold, and do they know what is covered? |
| A-14 | Which coverage rules block or delay care (approved-hospital lists, pre-authorization, claim paperwork)? |
| A-15 | What scholarships, charity programs, or NGO aid exist for treatment, travel, or lodging, and why do they go unclaimed? |
| A-16 | What documents and proof of eligibility do these programs require? Which are hardest for rural families to produce? |
| A-17 | How do budget limits change patients' decisions (delaying care, picking cheaper but less suitable providers, stopping treatment partway)? |

### 6.2 Workstream B: Match and Get There

**B.1 Treatment not available locally**

| ID | Question |
|---|---|
| B-1 | Which specialties and treatments are most often missing in rural areas? |
| B-2 | When a treatment isn't available locally, how do patients and clinics find the nearest place that offers it? |
| B-3 | How far are people willing and able to travel to see a specialist, and what limits that? |

**B.2 Getting there**

| ID | Question |
|---|---|
| B-4 | How do rural patients get to specialist care, and what does the trip cost in money and time? |
| B-5 | Which transport options exist (public bus, shared rides, community transport, government ambulance or non-emergency transport), and do people know about them? |
| B-6 | How often is travel the main reason care is delayed or abandoned? |
| B-7 | What extra burdens come with the trip (a companion, lodging, lost wages, childcare)? |
| B-8 | How common are wasted trips (the doctor is unavailable, documents are missing, the wrong centre), and what causes them? |

**B.3 Trust and fraud**

| ID | Question |
|---|---|
| B-9 | What kinds of healthcare fraud target rural patients (fake doctors, "guaranteed cure" clinics, middlemen, upfront-payment schemes)? |
| B-10 | Can patients check whether a doctor is licensed or a hospital is accredited? How do they check today? |
| B-11 | Which official registries and accreditation bodies exist, and how easy is it to get their data? |
| B-12 | What makes a scam convincing, and which warning signs do victims miss? |
| B-13 | How do online health platforms decide who appears first, and can patients tell paid placements from genuine recommendations? |
| B-14 | Beyond star ratings, what would show that a specialist centre serves rural patients who are referred to it well? |

### 6.3 Workstream C: Refer and Close the Loop

**C.1 Referral coordination**

| ID | Question |
|---|---|
| C-1 | Step by step, how does a referral from primary care to a specialist work today, and where does it break down? |
| C-2 | What share of referrals never lead to a specialist visit, and why? |
| C-3 | What information does a specialist need from the referring clinician, and what is usually missing when the referral arrives? |
| C-4 | When a referral stalls, who is responsible for following up: the patient, the CHW, the clinician, or the specialist? |

**C.2 Getting findings back**

| ID | Question |
|---|---|
| C-5 | After a specialist visit, do the referring clinician and the CHW find out what happened? How? |
| C-6 | Do patients understand what the specialist told them? What gets lost (jargon, language, rushed visits)? |
| C-7 | How do patients ask follow-up questions once they are back home? |
| C-8 | Who holds the patient's records, and can the patient take them from one provider to another? |
| C-9 | When an appointment changes, how do patients without smartphones find out? |

**C.3 Different prescriptions for the same condition**

| ID | Question |
|---|---|
| C-10 | How often do patients get different medicines from different doctors for the same condition? |
| C-11 | Why do prescriptions for the same condition differ (clinical judgment, patient history, which medicines are available locally, brand vs. generic, cost, commercial incentives)? Which of these reasons are explained to patients? |
| C-12 | How does this affect patients' trust in their treatment, and how often does it lead them to switch doctors? |
| C-13 | What does switching doctors cost patients (money, time, repeated tests, treatment restarted from scratch)? Does the new doctor know what was prescribed before? |

**C.4 Administrative burden**

| ID | Question |
|---|---|
| C-14 | Which paperwork steps take the most time for clinics and patients (referral letters, pre-authorization, scheme claims, registration forms)? |
| C-15 | Which of these steps make people enter the same information again and again? |
| C-16 | Where do administrative delays directly delay care? |

### 6.4 Cross-Cutting Questions

| ID | Theme | Question |
|---|---|---|
| X-1 | Clinical boundaries | Which decisions must always stay with a qualified clinician? |
| X-2 | Clinical boundaries | Which emergency warning signs must never be delayed by any administrative or navigation step? |
| X-3 | Privacy and consent | What health information are patients willing to share, with whom (CHW, clinic, specialist), and with what kind of consent? |
| X-4 | Privacy and consent | Which health-data regulations apply, and how do they differ by country (e.g. HIPAA in the US; DPDP Act 2023 and ABDM in India)? |
| X-5 | Equity | Who is most likely to be left out: older adults, women, people with low literacy, people without phones, people with disabilities, speakers of minority languages? |
| X-6 | Equity | How might existing quality signals, such as ratings and reputation, unfairly disadvantage rural or government providers? |
| X-7 | Problem sizing | How big is each problem today? Candidate baselines: days from first symptom to specialist visit, referral completion rate, share of referrals whose findings return to the clinic, trips per completed visit, out-of-pocket cost compared with household budget. |
| X-8 | Problem sizing | Which problem is the biggest bottleneck, the one whose resolution would matter most? |
| X-9 | Context | Which parts of the problem differ by country (schemes, registries, CHW roles, emergency numbers, facility levels), and which are the same everywhere? |

---

## 7. Coverage Matrix

### 7.1 Observations → questions

| Observation | Questions |
|---|---|
| O1: Can't judge urgency or where to go | A-1 to A-8, X-1, X-2 |
| O2: Specialist services not available locally | B-1, B-2, B-3 |
| O3: Repeated, long trips | B-3 to B-8 |
| O4: Fraud, no way to verify providers, paid rankings | B-9 to B-14, X-6 |
| O5: Full cost unknown and unaffordable | A-11, A-12, A-17, B-7 |
| O6: Coverage and aid hard to find and use | A-13 to A-16 |
| O7: Referrals stall | C-1 to C-5, C-8 |
| O8: Findings not understood or not returned | A-9, C-5 to C-7, C-9 |
| O9: Different prescriptions for the same condition | C-10 to C-13 |
| O10: Paperwork delays care | A-16, C-14 to C-16 |

### 7.2 Focus areas → questions

| Focus area | Questions |
|---|---|
| Knowing how urgent a symptom is and where to go first | A-1 to A-8 |
| Specialist care not available locally | B-1 to B-3 |
| Transportation | B-3 to B-8 |
| Trust and fraud | B-9 to B-14 |
| Full cost, insurance coverage, and financial aid | A-11 to A-17 |
| Referral coordination | C-1 to C-4 |
| Communication of findings back to the clinic, CHW, and patient | C-5 to C-9 |
| Different prescriptions for the same condition | C-10 to C-13 |
| Administrative burden | A-16, C-14 to C-16 |
| Language and digital access (applies to all) | A-9, A-10 |

---

## 8. Related Documents

| Document | Purpose |
|---|---|
| [PLAN.md](PLAN.md) | Proposed solution and build plan, split across the three workstreams |
