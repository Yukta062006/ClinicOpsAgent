# ADR 0001: Backend Architecture Stack Selection

- **Status:** Approved
- **Date:** 2026-11-16
- **Context:** ClinicOpsAgent Architecture Upgrade
- **Author:** Senior Healthcare Software Architect & Tech Lead

## Context and Problem Statement

The original concept for ClinicOpsAgent envisioned a FastAPI + PostgreSQL backend. However, inspection of the codebase at commit `1c71423` revealed:
1. A monolithic Node.js + Express 5 backend (`server.mjs`, ~3,187 lines) with SQLite (`better-sqlite3`), comprehensive JWT auth, RBAC middleware, rate limiting, patient registry, appointment scheduling, sequential token generation schema, ABDM/ABHA cryptographic client (`server-abdm.mjs`), consultation recording, and TTS proxying.
2. A secondary, incomplete FastAPI service (`backend/main.py`) containing experimental TTS integration with Hugging Face (`ARTPARK-IISc/DhVaani-0.5`) alongside unauthenticated, duplicate queue endpoints accessing `clinicops.db` directly.

The project requires a single, robust, authoritative API server with strict role-based access control, PostgreSQL migration, clean modularization, and no duplicate logic.

## Options Considered

### Option A: Express as the Single Authoritative API (Recommended & Approved)
- **Design:** Keep Node.js + Express as the primary backend API server.
- **Action:**
  - Modularize the 3,187-line `server.mjs` monolith into a clean directory structure:
    - `server/app.mjs`: Express application initialization, middleware pipeline.
    - `server/routes/`: Domain-specific routers (`auth`, `patients`, `appointments`, `queue`, `tokens`, `consultations`, `abha`, `tts`, `reports`).
    - `server/services/`: Core business logic (`tokenService`, `queueService`, `abdmService`, `sarvamService`, `auditService`).
    - `server/middleware/`: Security headers, CORS, JWT auth, RBAC (`requireRole`), rate limiting, request validation.
    - `server/db/`: Database connection pool, migrations runner, seeders.
  - Migrate storage from SQLite to PostgreSQL with versioned SQL migrations (preserving dev SQLite compatibility during transition if needed).
  - Quarantine/remove duplicate queue endpoints from `backend/main.py`.
- **Pros:**
  - Preserves over 3,000 lines of role-guarded, tested endpoints and integrations.
  - Zero risk of regression across complex existing flows (AES-256-GCM PII encryption, ABDM RSA-OAEP encryption, session handling).
  - High frontend-backend symmetry with unified TypeScript/JavaScript ecosystem.
- **Cons:**
  - Requires systematic modularization of `server.mjs`.

### Option B: Complete Rewrite to FastAPI + SQLAlchemy + PostgreSQL
- **Design:** Re-implement the entire backend from scratch in Python with FastAPI, Pydantic, and SQLAlchemy/Alembic.
- **Pros:**
  - Matches the earliest conceptual prototype document.
- **Cons:**
  - High risk of regression; throws away working security and ABDM cryptographic implementations.
  - Massive duplicate effort to rewrite ~3,200 lines of existing Express logic.
  - Slower iteration timeline with no functional advantage over modular Express.

## Decision Outcome

**Chosen Option: Option A.**
Express is established as the sole authoritative API for ClinicOpsAgent.
- `server.mjs` will be cleanly refactored in Phase 1 into modular route handlers and service layers.
- Duplicate queue management in `backend/main.py` is quarantined to `backend/quarantine_queue.py` and deactivated.
- Database layer will be migrated to PostgreSQL via versioned migrations in Phase 1.
