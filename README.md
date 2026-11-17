# ClinicOpsAgent

A unified, multi-role clinic management platform engineered for Indian clinics, featuring official ABDM/ABHA identity integration, Sarvam AI multilingual voice announcements, atomic sequential tokens, and synchronized real-time patient queues.

Mentor: Dr. Sanjan

---

## 1. System Architecture

ClinicOpsAgent operates with a single authoritative API server and a high-performance modern React client:

- **Frontend:** React 18, TypeScript 5, Vite 5, Tailwind CSS 4 (`@tailwindcss/postcss`), React Router 6, Headless UI, Heroicons, Leaflet.
- **Backend API:** Node.js + Express 5, providing strict role-based access control (RBAC), rate-limiting, and AES-256-GCM PII encryption.
- **Database:** PostgreSQL (staging & production) via versioned SQL migrations; SQLite supported for local offline development.
- **Identity & Health Records:** Official ABDM / ABHA M1 integration (Aadhaar OTP enrolment, ABHA address creation, verified linking).
- **Multilingual Voice:** Sarvam AI neural TTS (`en-IN`, `hi-IN`, `mr-IN`, `bn-IN`) with female voices, player controls (Play, Pause, Resume, Stop, Speed, Volume), and privacy-preserving token announcements.

---

## 2. User Roles & Capabilities

| Role | Workspace Route | Capabilities |
|---|---|---|
| **Patient** | `/patient/dashboard` | View personal queue token, appointment booking, medical records, research summaries with voice read-aloud, health arcade. |
| **Front Desk** | `/frontdesk/dashboard` | Patient registration, appointment scheduling, check-in, sequential token generation, queue management, voice calling. |
| **Doctor** | `/doctor/dashboard` | Doctor queue, patient vitals, diagnosis recording, electronic prescriptions, consultation completion. |
| **Admin** | `/admin` | Clinic configuration, doctor directory verification, audit log inspection, aggregate reporting. |

---

## 3. Getting Started

### Prerequisites
- Node.js 20.12+ (or Node 22+)
- npm 10+
- (Optional for Python TTS microservice) Python 3.10+

### Installation
```bash
# 1. Clone the repository
git clone <repo-url>
cd ClinicOpsAgent

# 2. Install dependencies
npm ci

# 3. Configure environment
cp .env.example .env
```

### Development
```bash
# Start frontend (Vite :5173) and backend API (Express :3001) concurrently:
npm run dev

# Or run components independently:
node server.mjs      # Starts backend API on http://localhost:3001
npx vite             # Starts Vite development server on http://localhost:5173
```

### Verification & Testing
```bash
# Type check TypeScript codebase
npm run typecheck

# Run test suite
npm test

# Build production bundle
npm run build
```

---

## 4. Environment Variables

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend API port | `3001` |
| `NODE_ENV` | Environment mode (`development`, `production`) | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/clinicops` |
| `DB_FILE` | Local SQLite fallback database path | `./clinicops.db` |
| `JWT_SECRET` | 64+ char secret key for JWT session signing | Configured via env |
| `PII_ENCRYPTION_KEY` | 32+ char key for AES-256-GCM PII encryption | Configured via env |
| `SARVAM_API_KEY` | Sarvam AI API subscription key for neural TTS | Configured via env |
| `ABDM_ENVIRONMENT` | ABDM environment (`sandbox`, `production`) | `sandbox` |
| `ABDM_CLIENT_ID` | ABDM developer portal client ID | Configured via env |
| `ABDM_CLIENT_SECRET` | ABDM developer portal client secret | Configured via env |

---

## 5. Design Guidelines

ClinicOpsAgent preserves an elegant, natural green-and-cream aesthetic:
- **Forest Green:** `#1B3E2F` (primary buttons, headings, accents)
- **Pale Sage:** `#E8F0EA` (borders, subtle badges)
- **Warm Cream:** `#FAF9F5` (page backgrounds)
- **Typography:** Newsreader/Georgia serif for titles, Plus Jakarta Sans/Inter for interface controls.
