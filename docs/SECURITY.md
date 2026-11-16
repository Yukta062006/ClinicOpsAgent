# ClinicOpsAgent — Security & Secret Rotation Plan

## 1. Secret Inventory & Risk Assessment

In commit `1c71423` and prior commits, the following sensitive artifacts were identified:
- `.jwt-secret`: Local file containing the symmetric key used for JWT signing.
- `.pii-key`: Local file containing the master secret used to derive the AES-256-GCM key for encrypting patient identifiers (`aadhaar`, `pan`, `policy_number`).
- `clinicops.db`: SQLite database file that was tracked in git, containing user password hashes (bcrypt), demo patient records, and session tokens.
- `VITE_DEMO_PASSWORD`: Previously exposed via `.env.local` to the client-side bundle.

## 2. Safe Secret Rotation Protocol

### A. JWT Secret (`JWT_SECRET`)
1. **Action:** Generate a new 64-byte cryptographically secure random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. **Deployment:** Set the new value in the server environment variable `JWT_SECRET`.
3. **Session Invalidation:** Rotating `JWT_SECRET` immediately invalidates all active JWT tokens issued under the old key. Users will be prompted to log in again.
4. **Local Dev:** Delete `.jwt-secret` so `server.mjs` regenerates a fresh local secret if running without explicit environment variables.

### B. PII Encryption Key (`PII_ENCRYPTION_KEY`)
1. **Challenge:** Patient identifiers in the database (`patients.aadhaar`, `patients.pan`, `patients.policy_number`) were encrypted using AES-256-GCM derived from the old key.
2. **Two-Key Migration Script (`scripts/rotate-pii-key.mjs`):**
   - Provide `OLD_PII_KEY` and `NEW_PII_KEY`.
   - Read all rows from `patients` where encrypted columns begin with the PII prefix (`enc:gcm:`).
   - Decrypt each value using `OLD_PII_KEY`.
   - Re-encrypt each value using `NEW_PII_KEY`.
   - Commit the updated records in a single database transaction.
3. **Key Activation:** Update `PII_ENCRYPTION_KEY` in production environment variables and archive the old key securely.

### C. Seed Password Rotation
1. Update `SEED_PASSWORD` in `.env.local` to a newly chosen development passphrase.
2. Ensure no seed password is ever embedded in `VITE_*` variables or production Docker containers.

---

## 3. Git History Cleanup Proposal (Awaiting User Approval)

> **Important:** As per operating rule 10, no destructive git history rewrite will be performed without explicit user confirmation.

Because `clinicops.db`, `.jwt-secret`, and `.pii-key` were committed in earlier git history (or tracked in HEAD), untracking them via `git rm --cached` removes them from current and future commits, but their history remains in old git objects.

### Recommended Tool: `git-filter-repo` (or BFG Repo-Cleaner)
The exact non-destructive preparation commands are:
```bash
# 1. Ensure a full offline backup of the repository directory is saved
Copy-Item -Recurse . c:\backup\ClinicOpsAgent-pre-filter-repo

# 2. Command to purge the sensitive files from git history across all commits:
git filter-repo --invert-paths --path clinicops.db --path .jwt-secret --path .pii-key --path .env.local

# 3. Force garbage collection of pruned commits
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

*Note: This command rewrites commit hashes and requires all collaborators to re-clone the repository. We will not run this without your explicit approval.*
