/**
 * ONE shared demo scenario that threads through all three workstreams.
 *
 * The same patient (Maria Alvarez) appears in:
 *   - Workstream A: her cost estimate and scheme eligibility
 *   - Workstream B: the providers she can search and verify
 *   - Workstream C: her referral, scheduling, and travel
 *
 * This continuity is what makes judges believe it's a real, connected system.
 * Region: United States (default). Change here to retarget currency/schemes.
 *
 * Each workstream owner MAY add more rows, but should keep these core demo
 * rows intact so the cross-section story still works.
 */
import {
  makePatient,
  makeProvider,
  makeScheme,
  makeReferral,
} from '../shared/models.js'

export const REGION = {
  name: 'United States',
  currency: 'USD',
  currencySymbol: '$',
}

// --- Schemes (Workstream A owns, shared by B for "accepted schemes") ---------
export const schemes = [
  makeScheme({
    id: 'medicaid',
    name: 'Medicaid',
    kind: 'government',
    coveragePct: 80,
    requiredDocs: ['Proof of income', 'State ID', 'Residency proof'],
    notes: 'Covers most specialty visits at approved providers.',
  }),
  makeScheme({
    id: 'rural-health-grant',
    name: 'Rural Health Travel Grant',
    kind: 'charity',
    coveragePct: 40,
    requiredDocs: ['Referral letter', 'Travel receipts'],
    notes: 'Reimburses travel and lodging for distant specialty care.',
  }),
]

// --- Providers (Workstream B owns, referenced by A for fees and C for referrals)
export const providers = [
  makeProvider({
    id: 'prov-cardio-regional',
    name: 'Regional Heart Center',
    type: 'hospital',
    specialties: ['cardiology'],
    location: 'Springfield',
    distanceMiles: 62,
    verified: true,
    rating: 4.6,
    reviewCount: 212,
    waitDays: 18,
    offersTelehealth: true,
    acceptedSchemeIds: ['medicaid'],
    consultFeeUsd: 180,
  }),
  makeProvider({
    id: 'prov-cardio-county',
    name: 'County Cardiology Clinic',
    type: 'clinic',
    specialties: ['cardiology'],
    location: 'Milburn',
    distanceMiles: 34,
    verified: true,
    rating: 4.1,
    reviewCount: 48,
    waitDays: 9,
    offersTelehealth: false,
    acceptedSchemeIds: ['medicaid', 'rural-health-grant'],
    consultFeeUsd: 120,
  }),
  makeProvider({
    id: 'prov-miracle-cure',
    name: 'Miracle Heart Cure Center',
    type: 'clinic',
    specialties: ['cardiology'],
    location: 'Online / Unknown',
    distanceMiles: 0,
    verified: false, // <-- fraud example for Workstream B (O7, B-12)
    rating: 4.9,
    reviewCount: 6,
    waitDays: 0,
    offersTelehealth: true,
    acceptedSchemeIds: [],
    consultFeeUsd: 50,
  }),
  makeProvider({
    id: 'prov-pcp-hometown',
    name: 'Hometown Family Practice',
    type: 'clinic',
    specialties: ['primary care'],
    location: 'Cedar Falls',
    distanceMiles: 4,
    verified: true,
    rating: 4.4,
    reviewCount: 90,
    waitDays: 2,
    offersTelehealth: true,
    acceptedSchemeIds: ['medicaid'],
    consultFeeUsd: 60,
  }),
]

// --- The demo patient, shared across ALL workstreams -------------------------
export const demoPatient = makePatient({
  id: 'patient-maria',
  name: 'Maria Alvarez',
  age: 54,
  location: 'Cedar Falls',
  distanceToSpecialistMiles: 62,
  languages: ['English', 'Spanish'],
  hasSmartphone: true,
  monthlyBudgetUsd: 400,
  schemeIds: ['medicaid'],
  primarySymptom: 'Chest tightness and shortness of breath when walking uphill',
})

export const patients = [demoPatient]

// --- Maria's referral (Workstream C owns, links PCP -> specialist) -----------
export const referrals = [
  makeReferral({
    id: 'ref-maria-cardio',
    patientId: 'patient-maria',
    fromProviderId: 'prov-pcp-hometown',
    toProviderId: 'prov-cardio-county',
    reason: 'Suspected angina — needs cardiology evaluation',
    status: 'info_sent',
    createdDate: '2026-10-20',
    timeline: [
      '2026-10-20 — PCP requested cardiology referral',
      '2026-10-22 — Clinical notes and ECG sent to specialist',
    ],
    missingInfo: ['Recent blood work (lipid panel)'],
  }),
]

// --- Convenience lookups so every workstream resolves IDs the same way -------
export const byId = {
  patient: (id) => patients.find((p) => p.id === id),
  provider: (id) => providers.find((p) => p.id === id),
  scheme: (id) => schemes.find((s) => s.id === id),
  referral: (id) => referrals.find((r) => r.id === id),
}
