# ClinicOpsAgent — Architectural Assumptions and Product Decisions

Approved on: 2026-11-16  
Mentor: Dr. Sanjan  
Role: Senior Healthcare Software Architect & Tech Lead

---

## 1. Backend Stack & Architecture
- **Decision:** **Option A (Modular Express 5 API)** is the single authoritative backend.
- **Implementation:** `server.mjs` will be refactored into `server/` with dedicated `routes/`, `services/`, `middleware/`, and `db/` directories.
- **Quarantine:** The duplicate, unauthenticated queue endpoints in `backend/main.py` are quarantined into `backend/quarantine_queue.py` and deactivated.

## 2. Production Database & Relational Storage
- **Decision:** PostgreSQL for staging and production environments.
- **Connection Configuration:** Flexible environment variables (`DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).
- **Development Fallback:** SQLite (`clinicops.db`) remains untracked and supported for local offline development.

## 3. Clinic Scope & Multi-Tenancy Readiness
- **Decision:** Initial deployment operates as a single clinic.
- **Schema Rule:** Every relational table (`users`, `patients`, `appointments`, `queue`, `tokens`, `consultations`, `audit_log`) includes a mandatory `clinic_id` (foreign key to `clinics` table) to guarantee zero-effort multi-clinic scaling in the future.

## 4. Sequential Token Generation
- **Decision:** Strict sequential zero-padded tokens (`001`, `002`, ... expanding to four digits `1000+` after 999).
- **Reset Policy:** Daily reset at midnight IST (`Asia/Kolkata`), maintained independently per `(clinic_id, department, sequence_date)`.
- **Constraint:** Strictly enforced via database unique constraints and atomic increments. No pseudo-random or timestamp-based tokens.

## 5. Requeue Behavior & Patient Fairness
- **Decision:** A requeued patient preserves their original assigned token number.
- **Queue Placement:** The patient is placed at the end of their existing priority group (urgent requeues go to the end of the urgent group; normal requeues go to the end of the normal group).

## 6. Urgent Priority Elevation
- **Decision:** Front Desk and Doctor roles are permitted to elevate a patient's priority to `urgent`.
- **Audit Mandate:** Every priority change generates an immutable entry in `audit_log` with the operator ID, timestamp, and clinical/operational rationale.

## 7. Voice Announcement Privacy
- **Decision:** In public areas (waiting room and overhead speakers), announcements announce **only** the token number, counter/room, and doctor's room.
- **Privacy Rule:** Patient names, diagnoses, and personal identifiers are **never** announced publicly.

## 8. Announcement Language Policy
- **Decision:** Voice announcements are broadcast first in the patient's recorded preferred language (English `en`, Hindi `hi`, Marathi `mr`, or Bengali `bn`).
- **Follow-up:** If the preferred language is not English, the announcement is followed by an English announcement.

## 9. ABDM Registries (HFR & HPR) Readiness
- **Decision:** Health Facility Registry (HFR) Facility ID and Healthcare Professionals Registry (HPR) IDs are maintained as nullable fields.
- **Verification Rule:** No mock or simulated verification badges. Doctors without verified credentials are shown as `Not verified`.

## 10. Patient Onboarding & Authentication
- **Decision:** Front-desk generated secure, time-limited activation links are used for patient portal onboarding.
- **SMS & OTP:** No fake SMS OTP flows. Official SMS gateway integration (e.g., MSG91/Twilio with TRAI DLT template registration) will be enabled when production credentials are configured.

## 11. Clinic Location & Travel Planner
- **Decision:** Clinic address and geographic coordinates are loaded dynamically from the `clinics` table / Admin Settings.
- **Transit Guidance:** Fictional hospital references ("Metropolis NY") and hard-coded transit times are removed. Transit estimates are displayed only when backed by a verified routing engine.
