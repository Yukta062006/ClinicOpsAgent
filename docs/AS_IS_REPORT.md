# ClinicOpsAgent — As-Is Verification Report (Phase 0)

- **Date:** 2026-11-16
- **Git Commit / Branch:** `1c71423` on branch `feat/clinicops-production`
- **Audit Target:** Verification of all architecture claims (Section 2.2) and reported defects (Section 2.4) against ground-truth source code and database state.

---

## 1. Architecture State Verification (Section 2.2)

| Component / Area | Status | Evidence / Verification Findings |
|---|---|---|
| **Frontend Stack** | **VERIFIED** | React 18.2.0, TypeScript 5.3.0, Vite 5.4.21, React Router 6.22.0, Tailwind CSS 4.3.3 (`@tailwindcss/postcss`). Bundle size: ~1,062 kB JS, ~116 kB CSS. |
| **Backend Implementation** | **VERIFIED** | Single monolithic `server.mjs` (3,187 lines) using Express 5.3.0 and `better-sqlite3` 13.0.3. Express handles auth, RBAC, patients, appointments, queue, consultations, research articles, game scores, and TTS proxy. Dev server proxies `/api` to port 3001. |
| **Database (`clinicops.db`)** | **VERIFIED** | SQLite database file present at root (204,800 bytes). Verified row counts via script: `users`: 27, `patients`: 16, `appointments`: 2, `queue`: 2, `consultations`: 2, `audit_log`: 100, `saved_articles`: 2, `game_scores`: 1, `learning_progress`: 2, `user_points`: 16, `password_reset_tokens`: 6, `abha_otp_challenges`: 2, `token_sequences`: 0, `token_history`: 0. |
| **Authentication & RBAC** | **VERIFIED** | bcryptjs hashing, jsonwebtoken signing, `authenticateToken` and `requireRole` middlewares. Roles present: `patient`, `frontdesk`, `doctor`. JWT currently read from Authorization header; local session storage used on frontend. Needs httpOnly cookie migration in Phase 1. |
| **PII Encryption** | **VERIFIED** | AES-256-GCM encryption implemented in `server.mjs` using `PII_KEY` (derived from `PII_ENCRYPTION_KEY` or `.pii-key`). Encrypted columns: `aadhaar`, `pan`, and `policy_number` in `patients`. |
| **ABDM / ABHA Integration** | **VERIFIED** | `server-abdm.mjs` (400 lines) implements gateway session token generation, public certificate retrieval, RSA-OAEP encryption, Aadhaar OTP request/enrolment, and ABHA login/verify. Returns `503 ABDM_NOT_CONFIGURED` when credentials are missing. Not tested with live sandbox credentials. |
| **Sequential Token Issuance** | **CHANGED / UNEXERCISED** | `token_sequences` and `token_history` tables exist in `clinicops.db`, along with `generateNextToken()` in `server.mjs`. However, row counts in both tables are 0. Sequential issuance has never been executed against live DB. |
| **Duplicate Queue Implementations** | **STILL PRESENT $\to$ QUARANTINED** | Duplicate, unauthenticated queue endpoints existed in `backend/main.py`. These have now been quarantined to `backend/quarantine_queue.py` and deactivated in `backend/main.py`. |
| **Real-time Synchronization** | **VERIFIED ABSENT** | No WebSocket or Server-Sent Events (SSE) exists in the codebase. Polling is minimal; queue updates across separate browser sessions require manual page refresh. To be added in Phase 2 via SSE. |
| **Voice / Text-to-Speech** | **VERIFIED / PARTIALLY IMPLEMENTED** | `server.mjs` provides `/api/tts/status` and `/api/tts/synthesize`. Checks `VAANI_TTS_URL` (default localhost:8000), falls back to Sarvam AI (`SARVAM_API_KEY`), then Web Speech. `speechAnnouncer.ts` only supported `en`, `hi`, `mr`; Bengali `bn` was missing. Controls (Pause/Resume/Volume/Speed) exist in UI but need full integration on all 4 surfaces. |
| **Frontend Data Layer** | **STILL PRESENT** | `src/context/DataContext.tsx` is 2,150 lines with ~64 `localStorage` operations. Several pages still read or write directly to `localStorage`. Will be reduced to auth/session and UI preferences in Phase 1-2. |
| **Routes and Pages** | **VERIFIED** | Workspaces exist for `frontdesk`, `doctor`, `patient`. Pages: Login, Signup, ForgotPassword, FrontDesk, PatientDashboard, DoctorDashboard, QueueManagement, WaitingRoom, TravelPlanner, MedicalResearch, ResearchSummary, MedicalVideos, HealthGames, DailyZipChallenge, LearningProgress. No dedicated Patient Profile, Doctor Directory, Medical Records, Reports, or Admin pages yet. |
| **Type Health** | **RESOLVED** | Initial `npx tsc --noEmit` yielded 17 errors. All 17 errors have been resolved. `tsc --noEmit` now passes with 0 errors. |

---

## 2. Defects Verification & Status (Section 2.4)

| # | Reported Defect | Status in Codebase | Verification Evidence |
|---|---|---|---|
| 1 | Research Summary blank page (`HeartIcon` missing) | **FIXED** | Verified `ResearchSummary.tsx`: `HeartIcon` has been replaced with `BookmarkIcon` and `BookmarkSolidIcon`. No import error exists. |
| 2 | Health Games shuffle loop crash (`j` before init) | **FIXED** | Verified `JigsawPuzzleGame.tsx:82` and `MedicalMemoryMatchGame.tsx:82`: both use `const j = Math.floor(Math.random() * (i + 1))` cleanly. |
| 3 | Sorting game type/state mismatches | **FIXED** | `FoodSortingGame.tsx` types and handlers compile cleanly with 0 TypeScript errors. |
| 4 | Medical Research modal missing `ExclamationTriangleIcon` | **FIXED** | Verified `MedicalResearch.tsx`: `ExclamationTriangleIcon` is not unimported; file compiles cleanly. |
| 5 | "Download PDF" writes plain text into a Blob | **STILL PRESENT** | In `ResearchSummary.tsx`, "Download PDF" generates a raw text Blob with MIME type `application/pdf`. Must be replaced with real PDF generator or direct article link in Phase 6. |
| 6 | Medical Videos uses `example.com`, placeholder thumbnails, blanket verified badge | **STILL PRESENT** | `MedicalVideos.tsx` contains static placeholder videos with hard-coded verified badges. To be replaced with admin-curated DB table in Phase 6. |
| 7 | Travel Planner fictional hospital & fixed transit times | **STILL PRESENT** | `TravelPlanner.tsx` still contains hard-coded hospital addresses and static transit durations. To be connected to clinic settings in Phase 6. |
| 8 | Research articles hard-coded with placeholder authors/DOIs | **STILL PRESENT** | Static article list exists in `MedicalResearch.tsx` and `DataContext.tsx`. To be migrated to NCBI PubMed E-utilities in Phase 6. |
| 9 | Learning Progress fabricated defaults (2850 pts, 14 streak, 92 avg) | **STILL PRESENT** | `LearningProgress.tsx` initializes state with hardcoded point totals and streak counts. To be migrated to server-persisted user stats in Phase 6. |
| 10 | Patient Dashboard hard-coded "Alice Johnson", fake health tiles | **STILL PRESENT** | `PatientDashboard.tsx` displays hard-coded "Alice Johnson" and synthetic sleep/water metrics. Will be wired to real patient record in Phase 2. |
| 11 | Front Desk Schedule Appointment alert without saving | **STILL PRESENT** | Front Desk scheduling modal shows alert in certain paths without making an API call. Will be wired to Phase 2 appointments endpoint. |
| 12 | Doctor Dashboard hard-coded "Dr. John Doe", unimplemented buttons | **STILL PRESENT** | `DoctorDashboard.tsx` has dead buttons ("Feature not implemented") for Prescription, Lab, and Consultations. Will be implemented in Phase 3. |
| 13 | Waiting Room displays patient names publicly | **STILL PRESENT** | `WaitingRoom.tsx` table renders patient names. Must be strictly token-only per Privacy Rule 7 in Phase 2. |
| 14 | Queue Call Next ignores priority, auto-advances by timer | **STILL PRESENT** | Frontend timer automatically moves called patients to `in-progress`. Must be explicit staff action in Phase 2. |
| 15 | Tailwind v3/v4 token mismatch | **FIXED** | Custom tokens (`--shadow-card`, `--shadow-card-hover`, `--spacing-128`, `--spacing-144`, `--radius-4xl`) were missing from `@theme` in `src/index.css`. Added to `@theme`; verified that `dist/assets/*.css` built and loaded classes correctly. |

---

## 3. Hygiene and Security Rectifications (Phase 0)

1. **`clinicops.db` Untracked:** Removed from git index (`git rm --cached clinicops.db`) and added to `.gitignore`. Database preserved on disk.
2. **`VITE_DEMO_PASSWORD` Removed:** Removed all usage from `src/pages/Login.tsx`, `.env.example`, and `.env.local`. Login password is never pre-filled in bundles.
3. **Quarantine of Duplicate Queue:** Removed duplicate queue code from `backend/main.py` and quarantined it in `backend/quarantine_queue.py`.
4. **Secret Rotation Plan:** Proposed safe rotation protocol for `JWT_SECRET` and `PII_ENCRYPTION_KEY` in `docs/SECURITY.md`.
5. **Testing Harness Established:** Vitest 2.1.9, `@testing-library/react`, `jsdom`, and `supertest` installed and verified with green smoke tests.
