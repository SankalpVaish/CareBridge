# Requirements: Medicine-change notes (O9)

## Introduction

Observation **O9** (docs/research.md): different doctors prescribe different
medicines for the same condition, so patients lose trust and keep switching
doctors, restarting care each time. Research questions C-10 to C-13 ask why
prescriptions differ, whether the reasons are explained, and whether a new
doctor knows what was tried before.

This feature lets the **specialist record each medicine change they made, and
why**, as part of the findings they already send back. The referring clinic
sees the clinical reason, and the patient and health worker get a
plain-language version. Every clinician involved with the patient can see the
history of changes, so a new doctor knows what was tried.

**Hard boundary (steering: safety.md):** the app records what a clinician
decided. It never suggests, ranks, or questions a medicine change, and never
generates medicine names itself.

## Glossary
- **Change note** — one record: the medicine, what changed, a clinical reason,
  and a plain-language reason.
- **Findings** — what the specialist sends back after a visit (clinic version
  and plain-language version). Change notes are part of findings.
- **Medicine history** — every change note for one patient, across referrals.

## Requirements

### Requirement 1: Record changes with the findings
**User story:** As a specialist, I want to record each medicine I started,
stopped, or changed and why, so the patient's clinic and the patient don't have
to guess.

**Acceptance criteria**
1.1 WHEN a specialist sends or edits findings THEN the system SHALL let them add
    zero or more change notes, each with: medicine name, type of change
    (started, stopped, dose changed, switched, kept the same), a reason for the
    clinic, and a reason in plain words for the patient.
1.2 WHEN the type of change is "switched" THEN the system SHALL also ask what
    the patient was switched from.
1.3 IF a change note is missing the medicine name, the type of change, or
    either reason THEN the system SHALL reject the findings with a message
    naming what is missing, and SHALL NOT save a partial note.
1.4 The system SHALL accept at most 10 change notes per referral and SHALL limit
    each text field to 300 characters.
1.5 The system SHALL save change notes only when the specialist approves the
    findings (the existing "Approve and send back" step). There is no separate
    send.
1.6 WHERE the user is not the referral's specialist THE system SHALL NOT allow
    adding or editing change notes.

### Requirement 2: Explain changes to each person in the right words
**User story:** As a patient, I want to understand why my medicine changed, so
I trust the plan and don't switch doctors to "start over".

**Acceptance criteria**
2.1 WHEN a patient or health worker views a referral THEN the system SHALL show
    each change with the medicine, the type of change in plain words, and the
    plain-language reason, and SHALL NOT include the clinical reason.
2.2 WHEN a clinician (the referring clinician or the specialist) views a
    referral THEN the system SHALL show both reasons.
2.3 Every place that shows change notes to a patient or health worker SHALL
    also show the fixed advice: "Don't start, stop, or change any medicine on
    your own. Ask your doctor or pharmacist first."
2.4 The system SHALL NOT generate, suggest, or rank medicines. Medicine names
    appear only as typed by the specialist.

### Requirement 3: Medicine history across doctors
**User story:** As a new doctor seeing a referred patient, I want to see which
medicines were changed before and why, so I don't restart care from scratch.

**Acceptance criteria**
3.1 WHEN a clinician, the patient's health worker, or the patient opens a
    referral THEN the system SHALL show the patient's medicine history: every
    change note from every referral for that patient, newest first, with the
    date and the doctor who made it.
3.2 The system SHALL show the history only to: the patient, health workers who
    look after the patient, the patient's own clinic, and specialists who have
    a referral for that patient. Anyone else SHALL get "not found".
3.3 The same role rule as 2.1 and 2.2 SHALL apply: patients and health workers
    see plain-language reasons only.
3.4 Past "demo history" referrals SHALL NOT appear in a patient's history.

### Requirement 4: Keep everything else working
4.1 Findings without change notes SHALL work exactly as before.
4.2 Existing local databases SHALL keep their data (no table or column is
    dropped).
4.3 The loop-closure figures SHALL NOT change because of this feature.
