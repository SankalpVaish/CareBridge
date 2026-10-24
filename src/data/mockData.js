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
  emergencyNumber: '911',
}

// --- Schemes (Workstream A owns, shared by B for "accepted schemes") ---------
// Demo programmes with simplified rules. Real eligibility rules, amounts, and
// contacts differ by state and change every year; don't rely on these.
// Eligibility fields are explained in src/features/care/aid.js.
// Order matters: earlier schemes pay first, later ones cover what's left.
// Private plans come first because insurance pays before Medicaid.
// Private plans are only listed for patients who hold them (see "Check my
// coverage" on /care and src/features/care/coverageLookup.js).
export const schemes = [
  makeScheme({
    id: 'prairie-ppo',
    name: 'Prairie Health PPO',
    kind: 'insurance',
    covers: ['consult', 'tests', 'treatment'],
    billedByProvider: true,
    plan: {
      deductibleUsd: 1500,
      consultCopayUsd: 40,
      coinsurancePct: 20,
      outOfNetworkCoveragePct: 50,
      inNetworkProviderIds: [
        'prov-pcp-hometown',
        'prov-cardio-county',
        'prov-cardio-regional',
        'prov-er-cedar-falls',
        'prov-onc-university',
      ],
      preauthItems: ['tests'],
    },
    requiredDocs: ['Insurance card', 'State ID'],
    howToApply: {
      steps: ['Show your insurance card when you book and at the visit.'],
      where: 'Through your employer',
      contact: 'Member services (demo): 1-800-555-0201',
      typicalWait: '',
    },
    notes: 'Work health plan. A fixed copay for specialist visits; tests count toward your deductible.',
  }),
  makeScheme({
    id: 'heartland-bronze',
    name: 'Heartland Basic Choice (Bronze)',
    kind: 'insurance',
    covers: ['consult', 'tests', 'treatment'],
    billedByProvider: true,
    plan: {
      deductibleUsd: 6000,
      consultCopayUsd: null,
      coinsurancePct: 40,
      outOfNetworkCoveragePct: 0,
      inNetworkProviderIds: ['prov-cardio-regional', 'prov-onc-university', 'prov-er-cedar-falls'],
      preauthItems: ['tests'],
    },
    requiredDocs: ['Insurance card', 'State ID'],
    howToApply: {
      steps: ['Show your insurance card when you book and at the visit.'],
      where: 'Bought on the Health Insurance Marketplace',
      contact: 'Member services (demo): 1-800-555-0202',
      typicalWait: '',
    },
    notes: 'Marketplace plan with a high deductible and a small network. Nothing is covered out of network.',
  }),
  makeScheme({
    id: 'medicaid',
    name: 'Medicaid',
    kind: 'government',
    covers: ['consult', 'tests', 'treatment', 'medicines'],
    coveragePct: 80,
    billedByProvider: true,
    eligibility: [
      { field: 'state', op: 'in', value: ['IA'], label: 'Lives in Iowa' },
      { field: 'incomePctOfPoverty', op: 'lte', value: 138, label: 'Household income at or below 138% of the poverty line' },
    ],
    requiredDocs: ['Proof of income', 'State ID', 'Residency proof'],
    howToApply: {
      steps: [
        'Apply online, by phone, or at your county human services office.',
        'Send proof of income, ID, and where you live.',
        'You get a letter with your decision and your member card.',
      ],
      where: 'State Medicaid office or county human services office',
      contact: 'State Medicaid helpline (demo): 1-800-555-0101',
      typicalWait: 'Up to 45 days',
    },
    notes: 'Covers most specialty visits at providers that accept Medicaid.',
  }),
  makeScheme({
    id: 'medicare',
    name: 'Medicare',
    kind: 'insurance',
    covers: ['consult', 'tests', 'treatment'],
    coveragePct: 80,
    billedByProvider: true,
    eligibility: [{ field: 'age', op: 'gte', value: 65, label: 'Age 65 or older' }],
    requiredDocs: ['State ID', 'Proof of age'],
    howToApply: {
      steps: [
        'Sign up in the 3 months before you turn 65.',
        'Apply online or at your local Social Security office.',
      ],
      where: 'Social Security office',
      contact: 'Social Security (demo): 1-800-555-0102',
      typicalWait: 'About 1 month',
    },
    notes: 'Federal health insurance for people 65 and older.',
  }),
  makeScheme({
    id: 'regional-heart-charity',
    name: 'Regional Heart Center Financial Assistance',
    kind: 'charity',
    covers: ['consult', 'tests'],
    coveragePct: 100,
    eligibility: [
      { field: 'providerId', op: 'eq', value: 'prov-cardio-regional', label: 'Care at Regional Heart Center' },
      { field: 'incomePctOfPoverty', op: 'lte', value: 250, label: 'Household income at or below 250% of the poverty line' },
    ],
    requiredDocs: ['Proof of income', 'State ID'],
    howToApply: {
      steps: [
        'Ask the hospital billing office for a financial assistance form, before or after your visit.',
        'Send it with proof of income.',
        'The hospital takes the amount off your bill.',
      ],
      where: 'Regional Heart Center billing office',
      contact: 'Billing office (demo): 1-800-555-0103',
      typicalWait: 'About 2 weeks',
    },
    notes: 'Pays what insurance doesn’t, for care at this hospital only.',
  }),
  makeScheme({
    id: 'sliding-fee',
    name: 'Community Health Center Sliding Fee',
    kind: 'government',
    covers: ['consult', 'tests'],
    coveragePct: 50,
    eligibility: [
      { field: 'providerSpecialties', op: 'has', value: 'primary care', label: 'Care at a community health center (primary care)' },
      { field: 'incomePctOfPoverty', op: 'lte', value: 200, label: 'Household income at or below 200% of the poverty line' },
    ],
    requiredDocs: ['Proof of income'],
    howToApply: {
      steps: ['Ask the front desk for the sliding fee discount when you book.', 'Show proof of income at your visit.'],
      where: 'Your community health center front desk',
      contact: 'Ask at the clinic',
      typicalWait: 'Same day',
    },
    notes: 'Lower fees at community health centers, based on income.',
  }),
  makeScheme({
    id: 'medicaid-nemt',
    name: 'Medicaid Non-Emergency Medical Transport',
    kind: 'government',
    covers: ['travel'],
    coveragePct: 100,
    eligibility: [{ field: 'heldSchemeIds', op: 'has', value: 'medicaid', label: 'Enrolled in Medicaid' }],
    requiredDocs: ['Medicaid card', 'Appointment details'],
    howToApply: {
      steps: [
        'Call at least 2 working days before your appointment.',
        'Give your Medicaid number, the address, and the time.',
        'A ride picks you up, or you’re paid back for gas.',
      ],
      where: 'Medicaid transport line',
      contact: 'Ride booking (demo): 1-800-555-0104',
      typicalWait: '2 working days’ notice',
    },
    notes: 'Free rides, or gas paid back, for medical visits.',
  }),
  makeScheme({
    id: 'rural-health-grant',
    name: 'Rural Health Travel Grant',
    kind: 'charity',
    covers: ['travel', 'lodging'],
    coveragePct: 40,
    eligibility: [
      { field: 'travelMiles', op: 'gte', value: 30, label: 'Specialist is 30 miles or more away' },
      { field: 'hasReferral', op: 'eq', value: true, label: 'Referred by your doctor' },
    ],
    requiredDocs: ['Referral letter', 'Travel receipts'],
    howToApply: {
      steps: ['Keep your receipts for travel and lodging.', 'Send them with your referral letter after the visit.'],
      where: 'Rural Health Travel Grant (online form)',
      contact: 'Grant office (demo): 1-800-555-0105',
      typicalWait: 'Paid back in about 3 weeks',
    },
    notes: 'Pays back part of travel and lodging for distant specialty care.',
  }),
  makeScheme({
    id: 'rural-wage-fund',
    name: 'Rural Workers’ Medical Leave Fund',
    kind: 'charity',
    covers: ['lostWages'],
    coveragePct: 100,
    maxAmountUsd: 150,
    eligibility: [
      { field: 'employed', op: 'eq', value: true, label: 'Working and losing pay for the visit' },
      { field: 'travelMiles', op: 'gte', value: 30, label: 'Specialist is 30 miles or more away' },
    ],
    requiredDocs: ['Proof of employment', 'Appointment details'],
    howToApply: {
      steps: ['Ask your employer for a short note saying you missed work.', 'Send it with your appointment details.'],
      where: 'Rural Workers’ Medical Leave Fund (online form)',
      contact: 'Fund office (demo): 1-800-555-0106',
      typicalWait: 'About 2 weeks',
    },
    notes: 'Replaces up to $150 of lost pay per specialist visit.',
  }),
  makeScheme({
    id: 'cancer-travel-fund',
    name: 'Cancer Patient Travel & Lodging Fund',
    kind: 'charity',
    covers: ['travel', 'lodging'],
    coveragePct: 100,
    maxAmountUsd: 500,
    eligibility: [
      { field: 'referralSpecialties', op: 'has', value: 'oncology', label: 'Referred for cancer care' },
    ],
    requiredDocs: ['Referral letter', 'Appointment details'],
    howToApply: {
      steps: ['Your cancer centre’s social worker applies for you.', 'Ask them at your first visit.'],
      where: 'Cancer centre social work office',
      contact: 'Ask your cancer centre',
      typicalWait: 'About 1 week',
    },
    notes: 'Free travel and lodging for people getting cancer care far from home.',
  }),
]

// --- Providers (Workstream B owns, referenced by A for fees and C for referrals)
export const providers = [
  makeProvider({
    id: 'prov-cardio-regional',
    name: 'Regional Heart Center',
    type: 'hospital',
    specialties: ['cardiology'],
    services: ['ECG', 'Echocardiogram', 'Stress test', 'Cardiac catheterization', 'Angioplasty'],
    location: 'Springfield',
    distanceMiles: 62,
    verification: {
      status: 'verified',
      registry: 'State hospital license registry',
      licenseId: 'H-004218',
      checkedOn: '2026-10-01',
    },
    languages: ['English', 'Spanish'],
    loopClosureRate: 0.82,
    rating: 4.6,
    reviewCount: 212,
    waitDays: 18,
    offersTelehealth: true,
    acceptedSchemeIds: ['medicaid'],
    consultFeeUsd: 180,
    hasEmergencyDepartment: true,
  }),
  makeProvider({
    id: 'prov-cardio-county',
    name: 'County Cardiology Clinic',
    type: 'clinic',
    specialties: ['cardiology'],
    services: ['ECG', 'Echocardiogram', 'Stress test', 'Holter monitor'],
    location: 'Milburn',
    distanceMiles: 34,
    verification: {
      status: 'verified',
      registry: 'State Medical Board',
      licenseId: 'MD-118734',
      checkedOn: '2026-09-15',
    },
    languages: ['English'],
    loopClosureRate: 0.64,
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
    services: ['"Heart detox" therapy', 'Chelation therapy'],
    location: 'Online / Unknown',
    distanceMiles: null, // no physical address, so distance is unknown
    // Fraud example for Workstream B (O4, B-9, B-12)
    verification: {
      status: 'not_found',
      registry: 'State Medical Board',
      licenseId: null,
      checkedOn: '2026-10-01',
    },
    // Codes explained in src/features/find/trust.js. "Not in registry" and
    // "no address" are derived from verification and distanceMiles.
    fraudSignals: [
      'guaranteed_cure',
      'upfront_payment',
      'review_burst',
      'price_outlier',
      'unproven_treatment',
    ],
    languages: ['English'],
    loopClosureRate: null,
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
    services: ['Primary care', 'Basic ECG', 'Blood tests'],
    location: 'Cedar Falls',
    distanceMiles: 4,
    verification: {
      status: 'verified',
      registry: 'State Medical Board',
      licenseId: 'MD-093321',
      checkedOn: '2026-09-15',
    },
    languages: ['English', 'Spanish'],
    rating: 4.4,
    reviewCount: 90,
    waitDays: 2,
    offersTelehealth: true,
    acceptedSchemeIds: ['medicaid'],
    consultFeeUsd: 60,
  }),
  // --- Nearest emergency department to Maria (A-3, X-2)
  makeProvider({
    id: 'prov-er-cedar-falls',
    name: 'Cedar Falls Community Hospital',
    type: 'hospital',
    specialties: ['emergency care'],
    services: ['Emergency department', 'X-ray', 'Blood tests', 'Ambulance base'],
    location: 'Cedar Falls',
    distanceMiles: 6,
    verification: {
      status: 'verified',
      registry: 'State hospital license registry',
      licenseId: 'H-003377',
      checkedOn: '2026-10-01',
    },
    languages: ['English', 'Spanish'],
    loopClosureRate: 0.58,
    rating: 4.0,
    reviewCount: 130,
    waitDays: 0,
    offersTelehealth: false,
    acceptedSchemeIds: ['medicaid'],
    consultFeeUsd: 250,
    hasEmergencyDepartment: true,
  }),
  // --- Oncology: nothing verified near Maria, so the search must widen (B-1..B-3)
  makeProvider({
    id: 'prov-onc-university',
    name: 'University Cancer Institute',
    type: 'hospital',
    specialties: ['oncology', 'surgical oncology'],
    services: ['Mammography', 'Breast ultrasound', 'Biopsy', 'Chemotherapy', 'Radiotherapy', 'Cancer surgery'],
    location: 'Capital City',
    distanceMiles: 140,
    verification: {
      status: 'verified',
      registry: 'State hospital license registry',
      licenseId: 'H-005902',
      checkedOn: '2026-10-05',
    },
    languages: ['English', 'Spanish'],
    loopClosureRate: 0.9,
    rating: 4.5,
    reviewCount: 340,
    waitDays: 12,
    offersTelehealth: true,
    acceptedSchemeIds: ['medicaid', 'rural-health-grant'],
    consultFeeUsd: 220,
  }),
  makeProvider({
    id: 'prov-onc-lakeside',
    name: 'Lakeside Oncology Associates',
    type: 'specialist',
    specialties: ['oncology'],
    services: ['Mammography', 'Biopsy', 'Chemotherapy'],
    location: 'Lakeside',
    distanceMiles: 185,
    verification: {
      status: 'verified',
      registry: 'State Medical Board',
      licenseId: 'MD-121456',
      checkedOn: '2026-09-28',
    },
    languages: ['English'],
    loopClosureRate: 0.71,
    rating: 4.2,
    reviewCount: 75,
    waitDays: 21,
    offersTelehealth: false,
    acceptedSchemeIds: ['medicaid'],
    consultFeeUsd: 200,
  }),
  makeProvider({
    id: 'prov-onc-hope-natural',
    name: 'Hope Natural Cancer Clinic',
    type: 'clinic',
    specialties: ['oncology'],
    services: ['“Natural” cancer cure', 'Herbal infusion therapy'],
    location: 'Milburn',
    distanceMiles: 22,
    // Fraud example close to home: nearer than any real cancer centre (O4).
    verification: {
      status: 'expired',
      registry: 'State Medical Board',
      licenseId: 'MD-077120',
      checkedOn: '2026-10-01',
    },
    fraudSignals: ['guaranteed_cure', 'upfront_payment', 'unproven_treatment'],
    languages: ['English', 'Spanish'],
    loopClosureRate: null,
    rating: 4.8,
    reviewCount: 14,
    waitDays: 1,
    offersTelehealth: false,
    acceptedSchemeIds: [],
    consultFeeUsd: 90,
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
  transport: ['community shuttle', 'shared ride'],
  maxTravelMiles: 75,
  state: 'IA',
  householdSize: 3,
  monthlyIncomeUsd: 2100,
  employed: true,
  documentsHeld: ['State ID', 'Proof of income', 'Residency proof', 'Medicaid card'],
  memberCoverage: { medicaid: { memberId: 'MCD-IA-448812', deductibleMetUsd: 0 } },
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
