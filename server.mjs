import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { createAbdmClient, AbdmError } from './server-abdm.mjs';

// Optional .env and .env.local support (Node 20.12+).
try {
  process.loadEnvFile?.('.env.local');
} catch { }
try {
  process.loadEnvFile?.();
} catch {
  // No .env file present.
}

// Enable ABDM Sandbox Mode for development if no custom credentials are set
if (!process.env.ABDM_CLIENT_ID && process.env.NODE_ENV !== 'production') {
  process.env.ABDM_CLIENT_ID = 'SBX_CLINICOPS_DEVELOPER';
  process.env.ABDM_CLIENT_SECRET = 'sbx_sec_developer_sandbox_2026';
  process.env.ABDM_ENVIRONMENT = 'sandbox';
}

const app = express();

// ============ CONFIGURATION ============
const PORT = Number(process.env.PORT) || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const DB_FILE = process.env.DB_FILE || './clinicops.db';
const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const PASSWORD_MIN_LENGTH = 8;

/**
 * Secrets are read from the environment first. Outside production a local,
 * git-ignored key file is generated so sessions survive restarts without a
 * hardcoded secret in source control.
 */
function resolveSecret(envVar, fileName, label) {
  const fromEnv = process.env[envVar];
  if (fromEnv && fromEnv.trim().length >= 32) return fromEnv.trim();
  if (fromEnv) throw new Error(`${envVar} must be at least 32 characters`);

  const secretPath = path.resolve(process.cwd(), fileName);
  try {
    const existing = fs.readFileSync(secretPath, 'utf8').trim();
    if (existing.length >= 32) return existing;
  } catch {
    // fall through to generation
  }

  if (isProduction) {
    throw new Error(`${envVar} must be provided in production (${fileName} is not used)`);
  }

  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretPath, generated, { mode: 0o600 });
  console.warn(`[clinicops] generated a local ${label} and stored it in ${fileName} (git-ignored). Set ${envVar} to override.`);
  return generated;
}

const JWT_SECRET = resolveSecret('JWT_SECRET', '.jwt-secret', 'JWT signing key');
const PII_KEY = crypto
  .createHash('sha256')
  .update(resolveSecret('PII_ENCRYPTION_KEY', '.pii-key', 'PII encryption key'))
  .digest();

const RESET_DELIVERY = process.env.SMTP_HOST ? 'smtp' : process.env.SMS_PROVIDER ? 'sms' : 'console';

// Live ABDM/ABHA client. It reports itself as unconfigured when credentials
// are absent and every ABHA route then fails with 503 instead of simulating a
// successful verification.
const abdm = createAbdmClient({ env: process.env });
const ABHA_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const ABHA_MAX_OTP_ATTEMPTS = 5;
const ABHA_PROOF_TTL = '10m';
const ABHA_PROOF_AUDIENCE = 'abha-registration';


const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  })
);
app.use(express.json({ limit: '256kb' }));

// Database setup. Statement text is only traced with DB_DEBUG=1 and bound
// parameters are never logged, so patient identifiers cannot leak into logs.
const db = new Database(
  DB_FILE,
  process.env.DB_DEBUG === '1' ? { verbose: (sql) => console.log('[sql]', sql) } : {}
);
db.pragma('busy_timeout = 5000');

// ============ ERROR + VALIDATION HELPERS ============
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function handleError(res, error, context) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message });
  }
  const reference = crypto.randomBytes(4).toString('hex');
  console.error(`[clinicops] ${context} failed (reference ${reference}):`, error);
  return res.status(500).json({
    error: 'Something went wrong while processing this request. Please try again.',
    reference,
  });
}

function requireString(value, field, { max = 200 } = {}) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new ApiError(400, `${field} must be ${max} characters or fewer`);
  }
  return trimmed;
}

function optionalString(value, field, { max = 500 } = {}) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new ApiError(400, `${field} must be text`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new ApiError(400, `${field} must be ${max} characters or fewer`);
  }
  return trimmed;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function requireEmail(value, field = 'Email') {
  const email = requireString(value, field, { max: 160 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, `${field} must be a valid email address`);
  }
  return email;
}

function requirePassword(value) {
  if (typeof value !== 'string' || value.length < PASSWORD_MIN_LENGTH) {
    throw new ApiError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (value.length > 128) {
    throw new ApiError(400, 'Password must be 128 characters or fewer');
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    throw new ApiError(400, 'Password must contain at least one letter and one number');
  }
  return value;
}

function requireInteger(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ApiError(400, `${field} must be a whole number between ${min} and ${max}`);
  }
  return parsed;
}

function requireOneOf(value, allowed, field) {
  const chosen = requireString(value, field, { max: 60 });
  if (!allowed.includes(chosen)) {
    throw new ApiError(400, `${field} must be one of: ${allowed.join(', ')}`);
  }
  return chosen;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

function requireDate(value, field = 'Date') {
  const date = requireString(value, field, { max: 20 });
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) {
    throw new ApiError(400, `${field} must use the YYYY-MM-DD format`);
  }
  return date;
}

function requireTime(value, field = 'Time') {
  const time = requireString(value, field, { max: 10 });
  if (!TIME_PATTERN.test(time)) {
    throw new ApiError(400, `${field} must use the HH:MM format`);
  }
  return time;
}

const ABHA_NUMBER_PATTERN = /^\d{2}-\d{4}-\d{4}-\d{4}$/;
const ABHA_ADDRESS_PATTERN = /^[\w.\-]{3,64}@(abha|sbx|ndhm)$/i;
const AADHAAR_PATTERN = /^\d{4}\s?\d{4}\s?\d{4}$|^XXXX[-\s]?XXXX[-\s]?\d{4}$/i;
const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;

function normalizeAbha(value, field = 'ABHA number') {
  const raw = requireString(value, field, { max: 80 });
  if (ABHA_ADDRESS_PATTERN.test(raw)) return raw.toLowerCase();
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 14) {
    throw new ApiError(400, `${field} must be a 14-digit ABHA number or an ABHA address`);
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
}

function normalizeAadhaar(value, field = 'Aadhaar number') {
  const raw = requireString(value, field, { max: 32 });
  if (!AADHAAR_PATTERN.test(raw.replace(/-/g, ' ').trim())) {
    throw new ApiError(400, `${field} must be 12 digits`);
  }
  return raw.replace(/[^\dXx-]/g, '');
}

function normalizePan(value, field = 'PAN') {
  const raw = requireString(value, field, { max: 20 }).toUpperCase();
  if (!PAN_PATTERN.test(raw)) {
    throw new ApiError(400, `${field} must match the ABCDE1234F format`);
  }
  return raw;
}

// ============ PII PROTECTION ============
const PII_PREFIX = 'enc:v1:';

function encryptPii(value) {
  if (value === null || value === undefined || value === '') return value ?? null;
  const text = String(value);
  if (text.startsWith(PII_PREFIX)) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', PII_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${PII_PREFIX}${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`;
}

function decryptPii(value) {
  if (value === null || value === undefined || value === '') return value ?? null;
  const text = String(value);
  if (!text.startsWith(PII_PREFIX)) return text;
  try {
    const [iv, tag, data] = text.slice(PII_PREFIX.length).split('.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', PII_KEY, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

function maskAadhaar(value) {
  const plain = decryptPii(value);
  if (!plain) return null;
  const digits = String(plain).replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function maskPan(value) {
  const plain = decryptPii(value);
  if (!plain) return null;
  const pan = String(plain).trim().toUpperCase();
  if (pan.length < 4) return null;
  return `${'X'.repeat(pan.length - 4)}${pan.slice(-4)}`;
}

function maskAbha(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (text.includes('@')) {
    const [local, domain] = text.split('@');
    const visible = local.slice(-2);
    return `${'*'.repeat(Math.max(1, local.length - 2))}${visible}@${domain}`;
  }
  if (ABHA_NUMBER_PATTERN.test(text)) {
    return `XX-XXXX-XXXX-${text.slice(-4)}`;
  }
  if (text.length < 4) return text;
  return `${'X'.repeat(text.length - 4)}${text.slice(-4)}`;
}

function maskTrailing(value, visible = 4) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value);
  if (text.length <= visible) return 'X'.repeat(text.length);
  return `${'X'.repeat(text.length - visible)}${text.slice(-visible)}`;
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const body = Array.from(crypto.randomBytes(9))
    .map((byte) => alphabet[byte % alphabet.length])
    .join('');
  return `Clinic@${body}`;
}

function generateResetCode() {
  return String(crypto.randomInt(10_000_000, 100_000_000));
}

function hashResetCode(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

/**
 * Password recovery requires knowledge of the identifier plus one stored
 * recovery factor (date of birth or phone). Accounts with no recovery data on
 * file fall back to identifier knowledge alone.
 */
function recoveryDetailsMatch(user, body) {
  const digits = (value) => (typeof value === 'string' ? value.replace(/\D/g, '') : '');
  const patient = db.prepare('SELECT date_of_birth FROM patients WHERE user_id = ?').get(user.id);

  const storedDob = patient?.date_of_birth || null;
  const suppliedDob = typeof body.date_of_birth === 'string' ? body.date_of_birth.trim() : '';
  if (storedDob && suppliedDob && suppliedDob === storedDob) return true;

  const storedPhone = digits(user.phone);
  const suppliedPhone = digits(body.phone);
  if (storedPhone && suppliedPhone && storedPhone === suppliedPhone) return true;

  return !storedDob && !storedPhone;
}

// ============ RATE LIMITING ============
const rateBuckets = new Map();

function rateLimit({ label, windowMs, max }) {
  return (req, res, next) => {
    const ip = clientIp(req) || 'unknown';
    const key = `${label}:${ip}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);

    if (!bucket || now - bucket.start >= windowMs) {
      rateBuckets.set(key, { start: now, count: 1 });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retrySeconds = Math.max(1, Math.ceil((bucket.start + windowMs - now) / 1000));
      res.set('Retry-After', String(retrySeconds));
      return res.status(429).json({ error: `Too many attempts. Please try again in ${retrySeconds} second(s).` });
    }
    return next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.start > 30 * 60 * 1000) rateBuckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

// ============ AUDIT LOGGING ============
function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const value = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.ip || '';
  return String(value).split(',')[0].trim().slice(0, 64) || null;
}

function logAudit(req, action, { entity = null, entityId = null, detail = null } = {}) {
  try {
    db.prepare(`
      INSERT INTO audit_log (id, actor_id, actor_role, action, entity, entity_id, detail, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      req.user?.id ?? null,
      req.user?.role ?? null,
      action,
      entity,
      entityId,
      detail ? String(detail).slice(0, 500) : null,
      clientIp(req)
    );
  } catch (error) {
    console.error('[clinicops] audit log write failed:', error.message);
  }
}

// Initialize database tables
function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      specialty TEXT,
      department TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Patients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id),
      abha_id TEXT,
      aadhaar TEXT,
      pan TEXT,
      date_of_birth TEXT,
      gender TEXT,
      address TEXT,
      emergency_contact TEXT,
      blood_type TEXT,
      allergies TEXT,
      medical_history TEXT,
      insurance_provider TEXT,
      policy_number TEXT,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    )
  `);

  // Migrations for existing patients table
  try { db.exec(`ALTER TABLE patients ADD COLUMN abha_id TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE patients ADD COLUMN aadhaar TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE patients ADD COLUMN pan TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE patients ADD COLUMN abha_verified INTEGER DEFAULT 0`); } catch (e) { }
  try { db.exec(`ALTER TABLE patients ADD COLUMN abha_verified_at DATETIME`); } catch (e) { }
  try { db.exec(`ALTER TABLE patients ADD COLUMN consent_recorded_at DATETIME`); } catch (e) { }
  try { db.exec(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`); } catch (e) { }

  // One-time password recovery codes. Only the SHA-256 hash is stored, codes
  // are short lived and single use.
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON password_reset_tokens(token_hash)`);

  // Short-lived ABDM OTP challenges. Only the ABDM transaction id is stored;
  // Aadhaar numbers and OTP values are never written to the database.
  db.exec(`
    CREATE TABLE IF NOT EXISTS abha_otp_challenges (
      id TEXT PRIMARY KEY,
      purpose TEXT NOT NULL,
      abha_id TEXT,
      user_id TEXT,
      txn_id TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_abha_challenge_expiry ON abha_otp_challenges(expires_at)`);

  // Audit trail for clinically significant actions
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      detail TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)`);

  // Appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES users(id),
      doctor_id TEXT NOT NULL REFERENCES users(id),
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'scheduled',
      token_number INTEGER,
      checked_in BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Queue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY,
      appointment_id TEXT UNIQUE REFERENCES appointments(id),
      token TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL REFERENCES users(id),
      doctor_id TEXT REFERENCES users(id),
      department TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'waiting',
      arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      called_time DATETIME,
      started_time DATETIME,
      completed_time DATETIME,
      estimated_wait INTEGER
    )
  `);

  // Persistent Token Sequences table (atomic counters per clinic, department, and date)
  db.exec(`
    CREATE TABLE IF NOT EXISTS token_sequences (
      id TEXT PRIMARY KEY,
      clinic_id TEXT DEFAULT 'willow-main',
      department TEXT NOT NULL,
      sequence_date TEXT NOT NULL,
      last_token_number INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(clinic_id, department, sequence_date)
    )
  `);

  // Persistent Token History table (complete audit and traceability of every issued token)
  db.exec(`
    CREATE TABLE IF NOT EXISTS token_history (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      token_number INTEGER NOT NULL,
      prefix TEXT,
      clinic_id TEXT DEFAULT 'willow-main',
      department TEXT NOT NULL,
      patient_id TEXT,
      issued_date TEXT NOT NULL,
      status TEXT DEFAULT 'issued',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Persistent Queue Audit Log table (tracks state changes, requeues, call-again actions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS queue_audit_log (
      id TEXT PRIMARY KEY,
      queue_id TEXT NOT NULL,
      token TEXT NOT NULL,
      action TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT,
      user_id TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration for call_count and queue_order columns on queue table if needed
  try { db.exec(`ALTER TABLE queue ADD COLUMN call_count INTEGER DEFAULT 0`); } catch (_) { }
  try { db.exec(`ALTER TABLE queue ADD COLUMN queue_order INTEGER DEFAULT 0`); } catch (_) { }

  // Consultations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      appointment_id TEXT,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      chief_complaint TEXT,
      diagnosis TEXT,
      observations TEXT,
      prescription TEXT,
      vitals TEXT,
      notes TEXT,
      follow_up_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Saved research articles
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_articles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      article_id TEXT NOT NULL,
      title TEXT NOT NULL,
      authors TEXT,
      journal TEXT,
      year TEXT,
      category TEXT,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, article_id)
    )
  `);

  // Game scores
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      game_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      moves INTEGER,
      time_taken INTEGER,
      completed BOOLEAN DEFAULT TRUE,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Learning progress
  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      lesson_id TEXT NOT NULL,
      lesson_title TEXT NOT NULL,
      category TEXT,
      completed BOOLEAN DEFAULT FALSE,
      score INTEGER,
      points_earned INTEGER,
      completed_at DATETIME,
      UNIQUE(user_id, lesson_id)
    )
  `);

  // User points
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_points (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id),
      total_points INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      last_activity_date TEXT
    )
  `);

  // Seed demo accounts only when they do not exist yet. Every newly created
  // account receives its own random password, printed once to the server
  // console; no shared hardcoded password is ever used.
  const seedUsers = [
    { id: 'u-admin', email: 'admin@clinicops.com', name: 'Admin User', role: 'doctor', specialty: 'Administration', department: 'Management' },
    { id: 'u-yukta', email: 'yukta@clinicops.com', name: 'Yukta Ravindra Thakur', role: 'patient', phone: '+91 98201 45892' },
    { id: 'u-patient', email: 'patient@clinicops.com', name: 'Yukta Ravindra Thakur', role: 'patient', phone: '+91 98201 45892' },
    { id: 'u-frontdesk', email: 'frontdesk@clinicops.com', name: 'Olivia Martin', role: 'frontdesk', phone: '+91 98211 22334', department: 'Reception' },
    { id: 'u-cooper', email: 'doctor@clinicops.com', name: 'Dr. Elena Cooper', role: 'doctor', phone: '+91 98222 33445', specialty: 'Family Medicine', department: 'Room 02' },
    { id: 'u-rajesh', email: 'rajesh.patil@clinicops.com', name: 'Dr. Rajesh Patil', role: 'doctor', phone: '+91 98233 44556', specialty: 'Cardiology', department: 'Room 04' },
    { id: 'u-sarah', email: 'sarah.sharma@clinicops.com', name: 'Dr. Sarah Sharma', role: 'doctor', phone: '+91 98244 55667', specialty: 'General Medicine', department: 'Room 01' },
    { id: 'u-amit', email: 'amit.deshmukh@clinicops.com', name: 'Dr. Amit Deshmukh', role: 'doctor', phone: '+91 98255 66778', specialty: 'Pediatrics', department: 'Room 02' },
    { id: 'u-neha', email: 'neha.kulkarni@clinicops.com', name: 'Dr. Neha Kulkarni', role: 'doctor', phone: '+91 98266 77889', specialty: 'Specialist Consultation', department: 'Room 03' },
  ];

  const createdAccounts = [];

  const demoPassword = process.env.SEED_PASSWORD || process.env.VITE_DEMO_PASSWORD;

  for (const u of seedUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
    if (!existing) {
      const plainPassword = demoPassword || generateTemporaryPassword();
      db.prepare(`
        INSERT INTO users (id, email, password, name, role, phone, specialty, department, must_change_password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        u.id,
        u.email,
        bcrypt.hashSync(plainPassword, 10),
        u.name,
        u.role,
        u.phone || null,
        u.specialty || null,
        u.department || null,
        demoPassword ? 0 : 1
      );
      createdAccounts.push({ email: u.email, role: u.role, password: plainPassword });

      if (u.role === 'patient') {
        const patientId = `p-${u.id}`;
        try {
          db.prepare(`
            INSERT INTO patients (id, user_id, abha_id, aadhaar, pan, date_of_birth, gender, blood_type, address, emergency_contact)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(patientId, u.id, '91-4821-7290-3412', encryptPii('XXXX-XXXX-4912'), encryptPii('AAAPT4912K'), '1998-07-14', 'Female', 'O+', '123 Marine Drive, Mumbai 400020', '+91 98201 99887');

          db.prepare(`INSERT INTO user_points (id, user_id, total_points, streak_days) VALUES (?, ?, ?, ?)`).run(uuidv4(), u.id, 840, 5);
        } catch (e) { }
      }
    } else if (demoPassword) {
      // Keep demo accounts in sync with configured seed/demo password
      db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?')
        .run(bcrypt.hashSync(demoPassword, 10), existing.id);
    }
  }

  if (createdAccounts.length > 0) {
    console.warn('[clinicops] created demo accounts. Save these credentials now, they are not shown again:');
    for (const account of createdAccounts) {
      console.warn(`  ${account.role.padEnd(9)} ${account.email.padEnd(32)} ${account.password}`);
    }
  }

  encryptLegacyPii();
}

/** One-off migration: encrypt Aadhaar / PAN / policy values stored as plaintext. */
function encryptLegacyPii() {
  const rows = db.prepare('SELECT id, aadhaar, pan, policy_number FROM patients').all();
  const update = db.prepare('UPDATE patients SET aadhaar = ?, pan = ?, policy_number = ? WHERE id = ?');
  let migrated = 0;

  const migrate = db.transaction(() => {
    for (const row of rows) {
      const aadhaar = encryptPii(row.aadhaar);
      const pan = encryptPii(row.pan);
      const policy = encryptPii(row.policy_number);
      if (aadhaar !== row.aadhaar || pan !== row.pan || policy !== row.policy_number) {
        update.run(aadhaar, pan, policy, row.id);
        migrated += 1;
      }
    }
  });
  migrate();

  if (migrated > 0) {
    console.warn(`[clinicops] encrypted sensitive identifiers for ${migrated} existing patient record(s)`);
  }
}

// Sequential token generator helper (strictly sequential, department/date-aware, atomic transaction)
function generateNextToken(department = 'General Medicine', clinicId = 'willow-main', patientId = null) {
  const today = new Date().toISOString().split('T')[0];
  const dept = department || 'General Medicine';
  const deptLower = dept.toLowerCase();

  // Determine prefix based on department/physician
  let prefix = 'GM-';
  if (deptLower.includes('room 02') || deptLower.includes('cooper') || deptLower.includes('family')) prefix = 'A-';
  else if (deptLower.includes('room 03') || deptLower.includes('kim')) prefix = 'B-';
  else if (deptLower.includes('cardio') || deptLower.includes('patil')) prefix = 'CD-';
  else if (deptLower.includes('pediatric') || deptLower.includes('deshmukh')) prefix = 'PD-';
  else if (deptLower.includes('general') || deptLower.includes('gm')) prefix = 'GM-';

  // Atomic database sequence transaction
  const executeSequence = db.transaction(() => {
    // 1. Ensure sequence record exists for today
    const seqId = `${clinicId}:${prefix}:${today}`;
    db.prepare(`
      INSERT INTO token_sequences (id, clinic_id, department, sequence_date, last_token_number)
      VALUES (?, ?, ?, ?, 0)
      ON CONFLICT(clinic_id, department, sequence_date) DO NOTHING
    `).run(seqId, clinicId, prefix, today);

    // 2. Also check if queue or token_history already has higher token for this prefix/date (safe recovery)
    const existingMax = db.prepare(`
      SELECT MAX(token_number) as max_num 
      FROM token_history 
      WHERE clinic_id = ? AND prefix = ? AND issued_date = ?
    `).get(clinicId, prefix, today);

    let baseCount = existingMax?.max_num || 0;

    // Also check current active queue in case of legacy tokens
    const queueRows = db.prepare(`SELECT token FROM queue`).all();
    for (const r of queueRows) {
      if (r.token && r.token.startsWith(prefix)) {
        const numPart = r.token.replace(prefix, '').match(/\d+/);
        if (numPart) {
          const n = parseInt(numPart[0], 10);
          if (n > baseCount) baseCount = n;
        }
      }
    }

    const currentSeq = db.prepare(`
      SELECT last_token_number FROM token_sequences 
      WHERE clinic_id = ? AND department = ? AND sequence_date = ?
    `).get(clinicId, prefix, today);

    const nextNum = Math.max(currentSeq ? currentSeq.last_token_number : 0, baseCount) + 1;

    // 3. Update persistent sequence counter
    db.prepare(`
      UPDATE token_sequences 
      SET last_token_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE clinic_id = ? AND department = ? AND sequence_date = ?
    `).run(nextNum, clinicId, prefix, today);

    const padded = String(nextNum).padStart(3, '0');
    const fullToken = `${prefix}${padded}`;

    // 4. Log to immutable token history
    const historyId = uuidv4();
    db.prepare(`
      INSERT INTO token_history (id, token, token_number, prefix, clinic_id, department, patient_id, issued_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(historyId, fullToken, nextNum, prefix, clinicId, dept, patientId, today);

    return {
      number: nextNum,
      token: fullToken,
      tokenPadded: padded,
      prefix,
      sequenceDate: today
    };
  });

  return executeSequence();
}

// Initialize database
initDatabase();

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) return res.status(401).json({ error: 'Please sign in to continue' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired or is invalid. Please sign in again.' });
  }

  // The role is always re-read from the database so a revoked or downgraded
  // account cannot keep using a previously issued token.
  const user = db
    .prepare('SELECT id, email, name, role, status, must_change_password FROM users WHERE id = ?')
    .get(payload.id);

  if (!user) {
    return res.status(401).json({ error: 'This session belongs to an account that no longer exists. Please sign in again.' });
  }
  if (user.status && user.status !== 'active') {
    return res.status(403).json({ error: 'This account has been deactivated. Please contact the clinic administrator.' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: !!user.must_change_password,
  };
  next();
}

// Role-based middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Your role does not have access to this action' });
    }
    next();
  };
}

function assertAppointmentAccess(user, appointment) {
  if (user.role === 'patient' && appointment.patient_id !== user.id) {
    throw new ApiError(403, 'You can only manage your own appointments');
  }
  if (user.role === 'doctor' && appointment.doctor_id !== user.id) {
    throw new ApiError(403, 'You can only manage appointments assigned to you');
  }
}

// ============ AUTHENTICATION ROUTES ============
const SELF_SERVICE_ROLES = ['patient'];
const STAFF_ROLES = ['doctor', 'frontdesk'];

function normalizeRoleInput(value) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s_-]/g, '') : '';
  if (raw === 'reception' || raw === 'receptionist') return 'frontdesk';
  return raw;
}

function findAccountByIdentifier(identifier, isAbha) {
  const profileColumns = `
    u.*, p.abha_id, p.aadhaar, p.pan, p.date_of_birth, p.gender, p.address,
    p.emergency_contact, p.abha_verified
  `;

  if (isAbha) {
    let normalized;
    try {
      normalized = normalizeAbha(identifier);
    } catch {
      normalized = String(identifier || '').trim();
    }
    const digits = normalized.replace(/\D/g, '');
    return db.prepare(`
      SELECT ${profileColumns}
      FROM users u
      JOIN patients p ON u.id = p.user_id
      WHERE p.abha_id = ? OR REPLACE(REPLACE(p.abha_id, '-', ''), ' ', '') = ?
    `).get(normalized, digits);
  }

  const email = String(identifier || '').trim().toLowerCase();
  if (!email) return undefined;
  return db.prepare(`
    SELECT ${profileColumns}
    FROM users u
    LEFT JOIN patients p ON u.id = p.user_id
    WHERE LOWER(u.email) = ?
  `).get(email);
}

/** Builds the public user payload. National identifiers are always masked. */
function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    specialty: user.specialty ?? null,
    department: user.department ?? null,
    abhaId: maskAbha(user.abha_id),
    abhaVerified: !!user.abha_verified,
    aadhaar: maskAadhaar(user.aadhaar),
    pan: maskPan(user.pan),
    dateOfBirth: user.date_of_birth ?? null,
    gender: user.gender ?? null,
    address: user.address ?? null,
    emergencyContact: user.emergency_contact ?? null,
    mustChangePassword: !!user.must_change_password,
  };
}

function signSessionToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Short-lived proof that a person completed the ABDM enrolment flow. It is
 * only issued after ABDM returns an ABHA profile, and is consumed by the
 * registration endpoint to mark the number as verified.
 */
function signAbhaProof(profile) {
  return jwt.sign(
    {
      purpose: 'abha_verified',
      abhaNumber: profile.abhaNumber,
      verifiedAt: new Date().toISOString(),
    },
    JWT_SECRET,
    { expiresIn: ABHA_PROOF_TTL, audience: ABHA_PROOF_AUDIENCE }
  );
}

function readAbhaProof(token) {
  try {
    const proof = jwt.verify(token, JWT_SECRET, { audience: ABHA_PROOF_AUDIENCE });
    if (proof?.purpose !== 'abha_verified' || typeof proof?.abhaNumber !== 'string') return null;
    return proof;
  } catch {
    return null;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

app.post('/api/auth/register', rateLimit({ label: 'register', windowMs: 15 * 60 * 1000, max: 10 }), async (req, res) => {
  try {
    const body = req.body ?? {};
    const name = requireString(body.name, 'Full name', { max: 120 });
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);
    const role = normalizeRoleInput(body.role);

    if (!SELF_SERVICE_ROLES.includes(role)) {
      throw new ApiError(
        403,
        'Self-registration is open to patients only. Doctor and front desk accounts are created by a clinic administrator.'
      );
    }

    if (body.consent !== true) {
      throw new ApiError(400, 'Please confirm the health data consent declaration before registering');
    }

    const phone = optionalString(body.phone, 'Phone number', { max: 24 });
    const dateOfBirth = body.date_of_birth ? requireDate(body.date_of_birth, 'Date of birth') : null;
    const gender = optionalString(body.gender, 'Gender', { max: 40 }) || 'Other';
    const address = optionalString(body.address, 'Address', { max: 300 });
    const emergencyContact = optionalString(body.emergency_contact, 'Emergency contact', { max: 24 });
    const bloodType = optionalString(body.blood_type, 'Blood group', { max: 8 });
    let abhaId = body.abha_id ? normalizeAbha(body.abha_id) : null;
    let abhaVerifiedAt = null;

    if (body.abha_verification_token) {
      const proof = readAbhaProof(body.abha_verification_token);
      if (!proof) {
        throw new ApiError(400, 'The ABHA verification has expired or is invalid. Please verify your ABHA again.');
      }
      const provenAbha = normalizeAbha(proof.abhaNumber);
      if (abhaId && abhaId !== provenAbha) {
        throw new ApiError(400, 'The ABHA number does not match the identity that ABDM verified.');
      }
      abhaId = provenAbha;
      abhaVerifiedAt = proof.verifiedAt || new Date().toISOString();
    }

    const aadhaar = body.aadhaar ? normalizeAadhaar(body.aadhaar) : null;
    const pan = body.pan ? normalizePan(body.pan) : null;

    if (db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email)) {
      throw new ApiError(409, 'An account with this email address already exists');
    }
    if (abhaId && db.prepare('SELECT id FROM patients WHERE abha_id = ?').get(abhaId)) {
      throw new ApiError(409, 'An account with this ABHA number is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const patientId = uuidv4();

    const createAccount = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, email, password, name, role, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, email, hashedPassword, name, role, phone);

      db.prepare(`
        INSERT INTO patients (
          id, user_id, date_of_birth, gender, address, emergency_contact,
          blood_type, abha_id, aadhaar, pan, insurance_provider, consent_recorded_at,
          abha_verified, abha_verified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `).run(
        patientId,
        userId,
        dateOfBirth,
        gender,
        address,
        emergencyContact,
        bloodType,
        abhaId,
        encryptPii(aadhaar),
        encryptPii(pan),
        abhaId ? 'Ayushman Bharat / ABHA' : null,
        abhaVerifiedAt ? 1 : 0,
        abhaVerifiedAt
      );

      db.prepare(`INSERT INTO user_points (id, user_id, total_points, streak_days) VALUES (?, ?, 0, 0)`)
        .run(uuidv4(), userId);
    });
    createAccount();

    const created = {
      id: userId,
      email,
      name,
      role,
      phone,
      abha_id: abhaId,
      abha_verified: abhaVerifiedAt ? 1 : 0,
      abha_verified_at: abhaVerifiedAt,
      aadhaar: encryptPii(aadhaar),
      pan: encryptPii(pan),
      date_of_birth: dateOfBirth,
      gender,
      address,
      emergency_contact: emergencyContact,
    };

    logAudit(req, 'auth.register', { entity: 'user', entityId: userId, detail: `role=${role}` });

    res.json({
      success: true,
      token: signSessionToken(created),
      user: serializeUser(created),
    });
  } catch (error) {
    handleError(res, error, 'auth/register');
  }
});

app.post('/api/auth/login', rateLimit({ label: 'login', windowMs: 15 * 60 * 1000, max: 20 }), async (req, res) => {
  try {
    const body = req.body ?? {};
    const password = requireString(body.password, 'Password', { max: 128 });

    if (body.abha_id) {
      // A password can never stand in for ABDM ownership of an ABHA number.
      return res.status(400).json({
        error: 'ABHA sign-in must be completed through the ABDM OTP flow. Use "Login with ABHA" to verify your ABHA number.',
        code: 'ABHA_LOGIN_REQUIRES_OTP',
      });
    }

    if (!body.email) {
      throw new ApiError(400, 'Please provide your email address');
    }

    const user = findAccountByIdentifier(body.email, false);

    if (!user) {
      logAudit(req, 'auth.login_failed', { detail: 'email' });
      return res.status(401).json({ error: 'Invalid credentials. Please check your details and try again.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logAudit(req, 'auth.login_failed', { entity: 'user', entityId: user.id, detail: 'password' });
      return res.status(401).json({ error: 'Invalid credentials. Please check your details and try again.' });
    }

    if (user.status && user.status !== 'active') {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact the clinic administrator.' });
    }

    logAudit(req, 'auth.login', { entity: 'user', entityId: user.id, detail: 'email' });

    res.json({
      success: true,
      token: signSessionToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    handleError(res, error, 'auth/login');
  }
});

// ============ ABHA / ABDM ROUTES ============
function abhaDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function requireAbhaNumber(value) {
  const normalized = normalizeAbha(value, 'ABHA number');
  if (!ABHA_NUMBER_PATTERN.test(normalized)) {
    throw new ApiError(400, 'Enter your 14-digit ABHA number (format XX-XXXX-XXXX-XXXX). ABHA address sign-in is not part of the ABDM OTP flow.');
  }
  return normalized;
}

function requireAadhaarDigits(value) {
  const digitsOnly = abhaDigits(value);
  if (digitsOnly.length !== 12) {
    throw new ApiError(400, 'Aadhaar number must be exactly 12 digits.');
  }
  if (digitsOnly.startsWith('0') || digitsOnly.startsWith('1')) {
    throw new ApiError(400, 'That does not look like a valid Aadhaar number.');
  }
  return digitsOnly;
}

function requireOtp(value) {
  const otp = requireString(value, 'OTP', { max: 12 }).trim();
  if (!/^\d{6}$/.test(otp)) {
    throw new ApiError(400, 'The OTP must be the 6-digit code sent by ABDM.');
  }
  return otp;
}

function createAbhaChallenge({ purpose, txnId, abhaId = null, userId = null }) {
  db.prepare('DELETE FROM abha_otp_challenges WHERE expires_at < ?').run(Date.now() - 60_000);
  const id = uuidv4();
  const now = Date.now();
  db.prepare(`
    INSERT INTO abha_otp_challenges (id, purpose, abha_id, user_id, txn_id, attempts, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, purpose, abhaId, userId, txnId, now, now + ABHA_CHALLENGE_TTL_MS);
  return id;
}

function loadAbhaChallenge(id, purpose, userId = null) {
  const row = userId
    ? db.prepare('SELECT * FROM abha_otp_challenges WHERE id = ? AND purpose = ? AND user_id = ?').get(id, purpose, userId)
    : db.prepare('SELECT * FROM abha_otp_challenges WHERE id = ? AND purpose = ?').get(id, purpose);

  if (!row) {
    throw new ApiError(400, 'This verification request is no longer valid. Please request a new OTP.');
  }
  if (row.consumed_at) {
    throw new ApiError(409, 'This verification has already been completed. Please request a new OTP.');
  }
  if (row.expires_at < Date.now()) {
    throw new ApiError(400, 'The OTP has expired. Please request a new one.');
  }
  return row;
}

function recordAbhaAttempt(req, challenge, error) {
  const attempts = Number(challenge.attempts || 0) + 1;
  const consumedAt = attempts >= ABHA_MAX_OTP_ATTEMPTS ? Date.now() : null;
  db.prepare('UPDATE abha_otp_challenges SET attempts = ?, consumed_at = ? WHERE id = ?')
    .run(attempts, consumedAt, challenge.id);
  logAudit(req, 'abha.otp_failed', {
    detail: `purpose=${challenge.purpose} attempt=${attempts} code=${error?.upstreamCode || error?.code || 'unknown'}`,
  });
  return attempts;
}

function consumeAbhaChallenge(id) {
  db.prepare('UPDATE abha_otp_challenges SET consumed_at = ? WHERE id = ?').run(Date.now(), id);
}

function sendAbhaError(res, error, context) {
  if (error instanceof AbdmError) {
    return res.status(error.status || 502).json({
      error: error.message,
      code: error.code,
      ...(error.missing ? { missing: error.missing } : {}),
      ...(error.upstreamCode ? { upstream_code: error.upstreamCode } : {}),
    });
  }
  return handleError(res, error, context);
}

function findPatientByUserId(userId) {
  return db.prepare(`
    SELECT u.*, p.abha_id, p.aadhaar, p.pan, p.date_of_birth, p.gender, p.address,
           p.emergency_contact, p.abha_verified
    FROM users u
    JOIN patients p ON u.id = p.user_id
    WHERE u.id = ?
  `).get(userId);
}

app.get('/api/abha/status', (req, res) => {
  res.json({ success: true, data: abdm.describe() });
});

app.post(
  '/api/abha/login/request-otp',
  rateLimit({ label: 'abha-login-otp', windowMs: 15 * 60 * 1000, max: 5 }),
  async (req, res) => {
    try {
      const abhaNumber = requireAbhaNumber(req.body?.abha_number);
      const { txnId, message } = await abdm.requestLoginOtp({ abhaNumber });
      const challengeId = createAbhaChallenge({ purpose: 'login', txnId, abhaId: abhaNumber });

      logAudit(req, 'abha.login_otp_requested', { detail: maskAbha(abhaNumber) });

      res.json({
        success: true,
        data: {
          challengeId,
          maskedAbha: maskAbha(abhaNumber),
          expiresInSeconds: Math.floor(ABHA_CHALLENGE_TTL_MS / 1000),
          message: message || 'An OTP was requested from ABDM for the Aadhaar linked to this ABHA number.',
        },
      });
    } catch (error) {
      sendAbhaError(res, error, 'abha/login/request-otp');
    }
  }
);

app.post(
  '/api/abha/login/verify',
  rateLimit({ label: 'abha-login-verify', windowMs: 15 * 60 * 1000, max: 10 }),
  async (req, res) => {
    try {
      const challengeId = requireString(req.body?.challenge_id, 'Verification request', { max: 80 });
      const otp = requireOtp(req.body?.otp);
      const challenge = loadAbhaChallenge(challengeId, 'login');

      let verified;
      try {
        verified = await abdm.verifyLoginOtp({ txnId: challenge.txn_id, otp });
      } catch (error) {
        if (error instanceof AbdmError) {
          const attempts = recordAbhaAttempt(req, challenge, error);
          logAudit(req, 'abha.login_failed', {
            detail: `attempt=${attempts} code=${error.upstreamCode || error.code}`,
          });
        }
        throw error;
      }

      if (verified.profile?.abhaNumber && abhaDigits(verified.profile.abhaNumber) !== abhaDigits(challenge.abha_id)) {
        consumeAbhaChallenge(challenge.id);
        throw new ApiError(502, 'ABDM verified a different ABHA identity than the one requested, so the sign-in was rejected.');
      }

      consumeAbhaChallenge(challenge.id);

      const patient = findAccountByIdentifier(challenge.abha_id, true);
      if (!patient) {
        logAudit(req, 'abha.login_unlinked', { detail: maskAbha(challenge.abha_id) });
        return res.status(404).json({
          error: 'ABDM verified this ABHA number, but no ClinicOps patient account is linked to it. Create a patient account and link the ABHA, or ask the front desk for help.',
          code: 'ABHA_NOT_LINKED',
          verified_abha: maskAbha(challenge.abha_id),
        });
      }

      if (patient.status && patient.status !== 'active') {
        return res.status(403).json({ error: 'This account has been deactivated. Please contact the clinic administrator.' });
      }

      db.prepare('UPDATE patients SET abha_verified = 1, abha_verified_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .run(patient.id);
      const updated = findAccountByIdentifier(challenge.abha_id, true);

      logAudit(req, 'abha.login', { entity: 'user', entityId: patient.id, detail: `abdm environment=${abdm.describe().environment}` });

      res.json({
        success: true,
        token: signSessionToken(updated),
        user: serializeUser(updated),
        abha: { verified: true, masked: maskAbha(challenge.abha_id) },
      });
    } catch (error) {
      sendAbhaError(res, error, 'abha/login/verify');
    }
  }
);

app.post(
  '/api/abha/verify/request-otp',
  rateLimit({ label: 'abha-verify-otp', windowMs: 15 * 60 * 1000, max: 5 }),
  async (req, res) => {
    try {
      const abhaNumber = requireAbhaNumber(req.body?.abha_number);
      const existing = db.prepare('SELECT id FROM patients WHERE abha_id = ?').get(abhaNumber);
      if (existing) {
        return res.status(409).json({
          error: 'This ABHA number is already linked to a ClinicOps account. Sign in with ABHA instead.',
          code: 'ABHA_ALREADY_LINKED',
        });
      }

      const { txnId, message } = await abdm.requestLoginOtp({ abhaNumber });
      const challengeId = createAbhaChallenge({ purpose: 'verify', txnId, abhaId: abhaNumber });

      logAudit(req, 'abha.verify_otp_requested', { detail: maskAbha(abhaNumber) });

      res.json({
        success: true,
        data: {
          challengeId,
          maskedAbha: maskAbha(abhaNumber),
          expiresInSeconds: Math.floor(ABHA_CHALLENGE_TTL_MS / 1000),
          message: message || 'An OTP was requested from ABDM for the Aadhaar linked to this ABHA number.',
        },
      });
    } catch (error) {
      sendAbhaError(res, error, 'abha/verify/request-otp');
    }
  }
);

app.post(
  '/api/abha/verify/verify',
  rateLimit({ label: 'abha-verify-otp-check', windowMs: 15 * 60 * 1000, max: 10 }),
  async (req, res) => {
    try {
      const challengeId = requireString(req.body?.challenge_id, 'Verification request', { max: 80 });
      const otp = requireOtp(req.body?.otp);
      const challenge = loadAbhaChallenge(challengeId, 'verify');

      let verified;
      try {
        verified = await abdm.verifyLoginOtp({ txnId: challenge.txn_id, otp });
      } catch (error) {
        if (error instanceof AbdmError) recordAbhaAttempt(req, challenge, error);
        throw error;
      }

      if (verified.profile?.abhaNumber && abhaDigits(verified.profile.abhaNumber) !== abhaDigits(challenge.abha_id)) {
        consumeAbhaChallenge(challenge.id);
        throw new ApiError(502, 'ABDM verified a different ABHA identity than the one requested, so the verification was rejected.');
      }

      consumeAbhaChallenge(challenge.id);

      if (db.prepare('SELECT id FROM patients WHERE abha_id = ?').get(challenge.abha_id)) {
        return res.status(409).json({
          error: 'This ABHA number is already linked to a ClinicOps account. Sign in with ABHA instead.',
          code: 'ABHA_ALREADY_LINKED',
        });
      }

      logAudit(req, 'abha.verified', { detail: maskAbha(challenge.abha_id) });

      res.json({
        success: true,
        data: {
          abhaNumber: challenge.abha_id,
          abhaAddress: verified.profile?.abhaAddress || null,
          name: verified.profile?.name || null,
          isNew: false,
          verificationToken: signAbhaProof({ abhaNumber: challenge.abha_id }),
          expiresInSeconds: 10 * 60,
        },
      });
    } catch (error) {
      sendAbhaError(res, error, 'abha/verify/verify');
    }
  }
);

app.post(
  '/api/abha/enroll/request-otp',
  rateLimit({ label: 'abha-enroll-otp', windowMs: 15 * 60 * 1000, max: 5 }),
  async (req, res) => {
    try {
      if (req.body?.consent !== true) {
        throw new ApiError(400, 'ABHA creation requires explicit consent to share Aadhaar details with ABDM.');
      }
      const aadhaarNumber = requireAadhaarDigits(req.body?.aadhaar_number);
      const { txnId, message } = await abdm.requestEnrollmentOtp({ aadhaarNumber });
      const challengeId = createAbhaChallenge({ purpose: 'enroll', txnId });

      logAudit(req, 'abha.enroll_otp_requested', { detail: 'aadhaar' });

      res.json({
        success: true,
        data: {
          challengeId,
          expiresInSeconds: Math.floor(ABHA_CHALLENGE_TTL_MS / 1000),
          message: message || 'ABDM requested an Aadhaar OTP from UIDAI.',
        },
      });
    } catch (error) {
      sendAbhaError(res, error, 'abha/enroll/request-otp');
    }
  }
);

app.post(
  '/api/abha/enroll/verify',
  rateLimit({ label: 'abha-enroll-verify', windowMs: 15 * 60 * 1000, max: 10 }),
  async (req, res) => {
    try {
      const challengeId = requireString(req.body?.challenge_id, 'Verification request', { max: 80 });
      const otp = requireOtp(req.body?.otp);
      const challenge = loadAbhaChallenge(challengeId, 'enroll');

      let verified;
      try {
        verified = await abdm.verifyEnrollment({ txnId: challenge.txn_id, otp });
      } catch (error) {
        if (error instanceof AbdmError) recordAbhaAttempt(req, challenge, error);
        throw error;
      }

      consumeAbhaChallenge(challenge.id);

      if (!verified.profile?.abhaNumber) {
        throw new ApiError(502, 'ABDM did not return an ABHA number, so the enrolment cannot be confirmed.');
      }

      const abhaNumber = verified.profile.abhaNumber;
      if (db.prepare('SELECT id FROM patients WHERE abha_id = ?').get(abhaNumber)) {
        return res.status(409).json({
          error: 'This ABHA number is already linked to a ClinicOps account. Sign in with ABHA instead.',
          code: 'ABHA_ALREADY_LINKED',
        });
      }

      logAudit(req, 'abha.enroll_verified', {
        detail: `abha=${maskAbha(abhaNumber)} new=${verified.isNew === true}`,
      });

      res.json({
        success: true,
        data: {
          abhaNumber,
          abhaAddress: verified.profile.abhaAddress,
          name: verified.profile.name,
          isNew: verified.isNew,
          verificationToken: signAbhaProof(verified.profile),
          expiresInSeconds: 10 * 60,
        },
      });
    } catch (error) {
      sendAbhaError(res, error, 'abha/enroll/verify');
    }
  }
);

app.post(
  '/api/abha/link/request-otp',
  authenticateToken,
  requireRole(['patient']),
  rateLimit({ label: 'abha-link-otp', windowMs: 15 * 60 * 1000, max: 5 }),
  async (req, res) => {
    try {
      const abhaNumber = requireAbhaNumber(req.body?.abha_number);
      const patient = findPatientByUserId(req.user.id);
      if (!patient) throw new ApiError(404, 'Patient profile not found for this account.');

      if (patient.abha_id && patient.abha_id !== abhaNumber && patient.abha_verified) {
        throw new ApiError(409, 'A different ABHA number is already verified on this account. Contact the clinic administrator to change it.');
      }

      const owner = db.prepare('SELECT user_id FROM patients WHERE abha_id = ?').get(abhaNumber);
      if (owner && owner.user_id !== req.user.id) {
        throw new ApiError(409, 'This ABHA number is already linked to another ClinicOps account.');
      }

      const { txnId, message } = await abdm.requestLoginOtp({ abhaNumber });
      const challengeId = createAbhaChallenge({ purpose: 'link', txnId, abhaId: abhaNumber, userId: req.user.id });

      logAudit(req, 'abha.link_otp_requested', { entity: 'user', entityId: req.user.id, detail: maskAbha(abhaNumber) });

      res.json({
        success: true,
        data: {
          challengeId,
          maskedAbha: maskAbha(abhaNumber),
          expiresInSeconds: Math.floor(ABHA_CHALLENGE_TTL_MS / 1000),
          message: message || 'An OTP was requested from ABDM for the Aadhaar linked to this ABHA number.',
        },
      });
    } catch (error) {
      sendAbhaError(res, error, 'abha/link/request-otp');
    }
  }
);

app.post(
  '/api/abha/link/verify',
  authenticateToken,
  requireRole(['patient']),
  rateLimit({ label: 'abha-link-verify', windowMs: 15 * 60 * 1000, max: 10 }),
  async (req, res) => {
    try {
      const challengeId = requireString(req.body?.challenge_id, 'Verification request', { max: 80 });
      const otp = requireOtp(req.body?.otp);
      const challenge = loadAbhaChallenge(challengeId, 'link', req.user.id);

      let verified;
      try {
        verified = await abdm.verifyLoginOtp({ txnId: challenge.txn_id, otp });
      } catch (error) {
        if (error instanceof AbdmError) recordAbhaAttempt(req, challenge, error);
        throw error;
      }

      if (verified.profile?.abhaNumber && abhaDigits(verified.profile.abhaNumber) !== abhaDigits(challenge.abha_id)) {
        consumeAbhaChallenge(challenge.id);
        throw new ApiError(502, 'ABDM verified a different ABHA identity than the one requested, so the link was rejected.');
      }

      consumeAbhaChallenge(challenge.id);

      const owner = db.prepare('SELECT user_id FROM patients WHERE abha_id = ?').get(challenge.abha_id);
      if (owner && owner.user_id !== req.user.id) {
        throw new ApiError(409, 'This ABHA number is already linked to another ClinicOps account.');
      }

      db.prepare(`
        UPDATE patients
        SET abha_id = ?,
            abha_verified = 1,
            abha_verified_at = CURRENT_TIMESTAMP,
            insurance_provider = COALESCE(insurance_provider, 'Ayushman Bharat / ABHA')
        WHERE user_id = ?
      `).run(challenge.abha_id, req.user.id);

      const updated = findPatientByUserId(req.user.id);
      logAudit(req, 'abha.linked', { entity: 'user', entityId: req.user.id, detail: maskAbha(challenge.abha_id) });

      res.json({
        success: true,
        user: serializeUser(updated),
        abha: { verified: true, masked: maskAbha(challenge.abha_id) },
      });
    } catch (error) {
      sendAbhaError(res, error, 'abha/link/verify');
    }
  }
);

/**
 * Issues a single-use reset code. The response is deliberately identical whether
 * or not the account exists, so the endpoint cannot be used to enumerate users.
 * Without an email/SMS provider configured the code is only available from the
 * server console (and, outside production, in the response for local testing).
 */app.post('/api/auth/forgot-password', rateLimit({ label: 'forgot', windowMs: 15 * 60 * 1000, max: 5 }), (req, res) => {
  try {
    const body = req.body ?? {};
    const identifier = requireString(body.identifier, 'Email or ABHA number', { max: 160 });
    const isAbha = Boolean(body.is_abha);

    const baseResponse = {
      success: true,
      delivery: RESET_DELIVERY,
      message: 'If those details match a registered account, a reset code has been issued. It expires in 15 minutes.',
    };

    const user = findAccountByIdentifier(identifier, isAbha);

    if (user && !recoveryDetailsMatch(user, body)) {
      logAudit(req, 'password_reset.rejected', { entity: 'user', entityId: user.id, detail: 'recovery details did not match' });
      return res.json(baseResponse);
    }

    if (!user) {
      logAudit(req, 'password_reset.rejected', { detail: 'no matching account' });
      return res.json(baseResponse);
    }

    const code = generateResetCode();
    const tokenHash = hashResetCode(code);

    const issueCode = db.transaction(() => {
      db.prepare(`UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL`)
        .run(user.id);
      db.prepare(`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`)
        .run(uuidv4(), user.id, tokenHash, Date.now() + RESET_CODE_TTL_MS);
    });
    issueCode();

    if (RESET_DELIVERY === 'console') {
      console.warn(`[clinicops] password reset code for ${user.email} (expires in 15 minutes): ${code}`);
      if (!isProduction) {
        baseResponse.devCode = code;
        baseResponse.warning = 'No email or SMS provider is configured on this server, so the reset code is returned directly. This is development behaviour only.';
      }
    }

    logAudit(req, 'password_reset.requested', { entity: 'user', entityId: user.id, detail: `delivery=${RESET_DELIVERY}` });
    res.json(baseResponse);
  } catch (error) {
    handleError(res, error, 'auth/forgot-password');
  }
});

app.post('/api/auth/reset-password', rateLimit({ label: 'reset', windowMs: 15 * 60 * 1000, max: 10 }), async (req, res) => {
  try {
    const body = req.body ?? {};
    const supplied = requireString(body.code ?? body.token, 'Reset code', { max: 64 });
    const password = requirePassword(body.new_password);

    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ?').get(hashResetCode(supplied));
    const account = row ? db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(row.user_id) : null;

    if (!row || !account || row.used_at || row.expires_at < Date.now()) {
      logAudit(req, 'password_reset.rejected', { detail: 'invalid or expired code' });
      throw new ApiError(400, 'This reset code is invalid or has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const applyReset = db.transaction(() => {
      db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?').run(hashedPassword, account.id);
      db.prepare('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL')
        .run(account.id);
    });
    applyReset();

    logAudit(req, 'password_reset.completed', { entity: 'user', entityId: account.id });

    res.json({
      success: true,
      message: `Password reset successfully for ${account.name}. You may now sign in.`,
      email: account.email,
    });
  } catch (error) {
    handleError(res, error, 'auth/reset-password');
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const body = req.body ?? {};
    const currentPassword = requireString(body.current_password, 'Current password', { max: 128 });
    const password = requirePassword(body.new_password);

    const user = db.prepare('SELECT id, password FROM users WHERE id = ?').get(req.user.id);
    if (!user) throw new ApiError(404, 'Account not found');

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new ApiError(401, 'Your current password is incorrect');
    }

    db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?')
      .run(await bcrypt.hash(password, 10), user.id);

    logAudit(req, 'password.changed', { entity: 'user', entityId: user.id });
    res.json({ success: true, message: 'Your password has been updated' });
  } catch (error) {
    handleError(res, error, 'auth/change-password');
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.email, u.name, u.role, u.phone, u.specialty, u.department, u.must_change_password,
             p.abha_id, p.aadhaar, p.pan, p.date_of_birth, p.gender, p.address, p.emergency_contact, p.abha_verified
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    handleError(res, error, 'auth/me');
  }
});

// ============ STAFF ACCOUNT ROUTES ============
app.post('/api/staff', authenticateToken, requireRole(['doctor']), rateLimit({ label: 'staff', windowMs: 60 * 60 * 1000, max: 25 }), async (req, res) => {
  try {
    const body = req.body ?? {};
    const name = requireString(body.name, 'Full name', { max: 120 });
    const email = requireEmail(body.email);
    const role = normalizeRoleInput(body.role);
    if (!STAFF_ROLES.includes(role)) {
      throw new ApiError(400, 'Staff role must be either doctor or frontdesk');
    }

    const phone = optionalString(body.phone, 'Phone number', { max: 24 });
    const specialty = optionalString(body.specialty, 'Specialty', { max: 120 });
    const department = optionalString(body.department, 'Department', { max: 120 });
    const password = body.password ? requirePassword(body.password) : generateTemporaryPassword();

    if (db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email)) {
      throw new ApiError(409, 'An account with this email address already exists');
    }

    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, password, name, role, phone, specialty, department, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(userId, email, await bcrypt.hash(password, 10), name, role, phone, specialty, department);

    logAudit(req, 'staff.created', { entity: 'user', entityId: userId, detail: `role=${role}` });

    res.json({
      success: true,
      user: { id: userId, email, name, role, phone, specialty, department },
      temporaryPassword: body.password ? undefined : password,
    });
  } catch (error) {
    handleError(res, error, 'staff/create');
  }
});

// ============ PATIENT ROUTES ============
app.get('/api/patients', authenticateToken, requireRole(['frontdesk', 'doctor']), (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, 
             p.date_of_birth, p.gender, p.address, p.emergency_contact,
             p.blood_type, p.allergies, p.registration_date,
             p.abha_id, p.abha_verified, p.aadhaar, p.pan
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      WHERE u.role = 'patient'
    `;

    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR p.abha_id LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const patients = db.prepare(query).all(...params).map((patient) => ({
      ...patient,
      abha_id: maskAbha(patient.abha_id),
      abha_verified: !!patient.abha_verified,
      aadhaar: maskAadhaar(patient.aadhaar),
      pan: maskPan(patient.pan),
    }));

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users u LEFT JOIN patients p ON u.id = p.user_id WHERE u.role = 'patient'`;
    if (search) {
      countQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR p.abha_id LIKE ?)`;
    }

    const countParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : [];
    const countResult = db.prepare(countQuery).get(...countParams);

    res.json({
      success: true,
      patients,
      total: countResult.total
    });
  } catch (error) {
    handleError(res, error, 'patients/list');
  }
});

app.post('/api/patients', authenticateToken, requireRole(['frontdesk', 'doctor']), rateLimit({ label: 'patients', windowMs: 15 * 60 * 1000, max: 60 }), async (req, res) => {
  try {
    const body = req.body ?? {};
    const name = requireString(body.name, 'Patient name', { max: 120 });
    const phone = requireString(body.phone, 'Phone number', { max: 24 });
    const email = body.email ? requireEmail(body.email) : null;
    const dateOfBirth = body.date_of_birth ? requireDate(body.date_of_birth, 'Date of birth') : null;
    const gender = optionalString(body.gender, 'Gender', { max: 40 }) || 'Other';
    const address = optionalString(body.address, 'Address', { max: 300 });
    const emergencyContact = optionalString(body.emergency_contact, 'Emergency contact', { max: 24 });
    const bloodType = optionalString(body.blood_type, 'Blood group', { max: 8 });
    const allergies = optionalString(body.allergies, 'Allergies', { max: 500 });
    const medicalHistory = optionalString(body.medical_history, 'Medical history', { max: 2000 });
    const insuranceProvider = optionalString(body.insurance_provider, 'Insurance provider', { max: 120 }) || 'ABHA / PMJAY';
    const policyNumber = optionalString(body.policy_number, 'Policy number', { max: 60 });
    const abhaId = body.abha_id ? normalizeAbha(body.abha_id) : null;
    const aadhaar = body.aadhaar ? normalizeAadhaar(body.aadhaar) : null;
    const pan = body.pan ? normalizePan(body.pan) : null;

    const patientEmail = email
      || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString().slice(-4)}@clinicops.local`;

    if (db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(patientEmail.toLowerCase())) {
      throw new ApiError(409, 'An account with this email already exists. Use a different address or leave it blank to auto-generate one.');
    }
    if (abhaId && db.prepare('SELECT id FROM patients WHERE abha_id = ?').get(abhaId)) {
      throw new ApiError(409, 'A patient with this ABHA number is already registered');
    }

    const userId = uuidv4();
    const patientId = uuidv4();
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const createPatient = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, email, password, name, role, phone, must_change_password)
        VALUES (?, ?, ?, ?, 'patient', ?, 1)
      `).run(userId, patientEmail.toLowerCase(), hashedPassword, name, phone);

      db.prepare(`
        INSERT INTO patients (
          id, user_id, date_of_birth, gender, address, emergency_contact,
          blood_type, allergies, medical_history, insurance_provider, policy_number,
          abha_id, aadhaar, pan, consent_recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        patientId, userId, dateOfBirth, gender, address, emergencyContact,
        bloodType, allergies, medicalHistory, insuranceProvider, encryptPii(policyNumber),
        abhaId, encryptPii(aadhaar), encryptPii(pan)
      );

      db.prepare(`INSERT INTO user_points (id, user_id) VALUES (?, ?)`).run(uuidv4(), userId);
    });
    createPatient();

    logAudit(req, 'patient.created', { entity: 'patient', entityId: userId, detail: 'registered by staff' });

    res.json({
      success: true,
      patient: {
        id: userId,
        patient_record_id: patientId,
        name,
        email: patientEmail,
        phone,
        date_of_birth: dateOfBirth,
        gender,
        address,
        emergency_contact: emergencyContact,
        blood_type: bloodType,
        allergies,
        medical_history: medicalHistory,
        insurance_provider: insuranceProvider,
        policy_number: maskTrailing(policyNumber),
        abha_id: maskAbha(abhaId),
        abha_verified: false,
        aadhaar: maskAadhaar(encryptPii(aadhaar)),
        pan: maskPan(encryptPii(pan)),
        // Shown once so the front desk can hand it to the patient. Never logged.
        tempPassword,
        must_change_password: true,
      },
    });
  } catch (error) {
    handleError(res, error, 'patients/create');
  }
});

// ============ APPOINTMENT ROUTES ============
app.get('/api/appointments', authenticateToken, (req, res) => {
  try {
    const { status, date, doctor_id, patient_id, type } = req.query;
    const user = req.user;

    let query = `
      SELECT a.*, 
             p.name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE 1=1
    `;

    const params = [];

    // Role-based filtering
    if (user.role === 'doctor') {
      query += ` AND a.doctor_id = ?`;
      params.push(user.id);
    } else if (user.role === 'patient') {
      query += ` AND a.patient_id = ?`;
      params.push(user.id);
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND a.appointment_date = ?`;
      params.push(date);
    }

    if (doctor_id) {
      query += ` AND a.doctor_id = ?`;
      params.push(doctor_id);
    }

    if (patient_id) {
      query += ` AND a.patient_id = ?`;
      params.push(patient_id);
    }

    if (type) {
      query += ` AND a.type = ?`;
      params.push(type);
    }

    query += ` ORDER BY a.appointment_date, a.appointment_time`;

    const appointments = db.prepare(query).all(...params);
    res.json({ success: true, appointments });
  } catch (error) {
    handleError(res, error, 'appointments/list');
  }
});

app.post('/api/appointments', authenticateToken, requireRole(['frontdesk', 'patient']), (req, res) => {
  try {
    const body = req.body ?? {};
    const user = req.user;

    const patientId = requireString(body.patient_id, 'Patient', { max: 64 });
    const doctorId = requireString(body.doctor_id, 'Doctor', { max: 64 });
    const appointmentDate = requireDate(body.appointment_date, 'Appointment date');
    const appointmentTime = requireTime(body.appointment_time, 'Appointment time');
    const type = requireString(body.type, 'Appointment type', { max: 80 });
    const reason = optionalString(body.reason, 'Reason', { max: 500 });

    if (user.role === 'patient' && user.id !== patientId) {
      throw new ApiError(403, 'Patients can only schedule appointments for themselves');
    }

    const patient = db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'patient'`).get(patientId);
    if (!patient) throw new ApiError(404, 'The selected patient does not exist');

    const doctor = db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'doctor'`).get(doctorId);
    if (!doctor) throw new ApiError(404, 'The selected doctor does not exist');

    const tokenInfo = generateNextToken(type);
    const appointmentId = uuidv4();

    const createAppointment = db.transaction(() => {
      db.prepare(`
        INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, type, reason, token_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(appointmentId, patientId, doctorId, appointmentDate, appointmentTime, type, reason, tokenInfo.number);

      if (body.check_in_immediately) {
        db.prepare(`
          INSERT INTO queue (id, appointment_id, token, patient_id, doctor_id, department, status)
          VALUES (?, ?, ?, ?, ?, ?, 'waiting')
        `).run(uuidv4(), appointmentId, tokenInfo.token, patientId, doctorId, type);
      }
    });
    createAppointment();

    const newAppointment = db.prepare(`
      SELECT a.*, p.name as patient_name, d.name as doctor_name
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE a.id = ?
    `).get(appointmentId);

    logAudit(req, 'appointment.created', { entity: 'appointment', entityId: appointmentId, detail: `token=${tokenInfo.token}` });

    res.json({ success: true, appointment: newAppointment, token: tokenInfo.token });
  } catch (error) {
    handleError(res, error, 'appointments/create');
  }
});

// Reschedule appointment
app.put('/api/appointments/:id/reschedule', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};
    const appointmentDate = requireDate(body.appointment_date, 'Appointment date');
    const appointmentTime = requireTime(body.appointment_time, 'Appointment time');
    const notes = optionalString(body.notes, 'Notes', { max: 500 });

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appt) throw new ApiError(404, 'Appointment not found');
    assertAppointmentAccess(req.user, appt);

    db.prepare(`
      UPDATE appointments 
      SET appointment_date = ?, appointment_time = ?, status = 'scheduled', notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(appointmentDate, appointmentTime, notes, id);

    const updated = db.prepare(`
      SELECT a.*, p.name as patient_name, d.name as doctor_name
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE a.id = ?
    `).get(id);

    logAudit(req, 'appointment.rescheduled', { entity: 'appointment', entityId: id, detail: `${appointmentDate} ${appointmentTime}` });

    res.json({ success: true, appointment: updated });
  } catch (error) {
    handleError(res, error, 'appointments/reschedule');
  }
});

// Cancel appointment
app.put('/api/appointments/:id/cancel', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const reason = optionalString(req.body?.reason, 'Reason', { max: 300 });

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appt) throw new ApiError(404, 'Appointment not found');
    assertAppointmentAccess(req.user, appt);

    const cancel = db.transaction(() => {
      db.prepare(`UPDATE appointments SET status = 'cancelled', notes = COALESCE(?, notes) WHERE id = ?`)
        .run(reason || 'Cancelled by user', id);
      db.prepare(`UPDATE queue SET status = 'cancelled' WHERE appointment_id = ?`).run(id);
    });
    cancel();

    logAudit(req, 'appointment.cancelled', { entity: 'appointment', entityId: id, detail: reason || undefined });

    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    handleError(res, error, 'appointments/cancel');
  }
});

// Generate strictly sequential token endpoint (backed by atomic token_sequences table)
app.get('/api/tokens/next', authenticateToken, (req, res) => {
  try {
    const department = req.query.department || 'General Medicine';
    const clinicId = req.query.clinic_id || 'willow-main';
    const tokenInfo = generateNextToken(department, clinicId, req.user?.id || null);
    res.json({
      success: true,
      data: tokenInfo
    });
  } catch (err) {
    handleError(res, err, 'tokens/next');
  }
});

// Get persistent token history / audit log
app.get('/api/tokens/history', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const date = req.query.date || today;
    const history = db.prepare(`
      SELECT th.*, u.name as patient_name 
      FROM token_history th
      LEFT JOIN users u ON th.patient_id = u.id
      WHERE th.issued_date = ?
      ORDER BY th.created_at DESC
    `).all(date);
    res.json({ success: true, history });
  } catch (err) {
    handleError(res, err, 'tokens/history');
  }
});

// Check-in route to generate sequential token and enter queue
app.post('/api/queue/check-in', authenticateToken, (req, res) => {
  try {
    const body = req.body ?? {};
    const patientId = requireString(body.patient_id, 'Patient', { max: 64 });

    if (req.user.role === 'patient' && req.user.id !== patientId) {
      throw new ApiError(403, 'You can only check yourself in');
    }

    const patient = db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'patient'`).get(patientId);
    if (!patient) throw new ApiError(404, 'The selected patient does not exist');

    const appointmentId = optionalString(body.appointment_id, 'Appointment', { max: 64 });
    if (appointmentId) {
      const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
      if (!appt) throw new ApiError(404, 'Appointment not found');
      if (appt.patient_id !== patientId) throw new ApiError(400, 'That appointment belongs to a different patient');
    }

    const department = optionalString(body.department, 'Department', { max: 80 }) || 'General Practice';
    const doctorId = optionalString(body.doctor_id, 'Doctor', { max: 64 });

    const existing = db.prepare(
      `SELECT * FROM queue WHERE patient_id = ? AND status IN ('waiting', 'called', 'in-progress')`
    ).get(patientId);

    if (existing) {
      return res.json({ success: true, queueItem: existing, token: existing.token, message: 'Patient already has an active token in the queue' });
    }

    const queueId = uuidv4();
    let tokenInfo;

    const checkIn = db.transaction(() => {
      tokenInfo = generateNextToken(department, 'willow-main', patientId);
      db.prepare(`
        INSERT INTO queue (id, appointment_id, token, patient_id, doctor_id, department, status, priority, estimated_wait)
        VALUES (?, ?, ?, ?, ?, ?, 'waiting', 'normal', 15)
      `).run(queueId, appointmentId, tokenInfo.token, patientId, doctorId, department);

      if (appointmentId) {
        db.prepare(`UPDATE appointments SET checked_in = TRUE, status = 'checked-in' WHERE id = ?`).run(appointmentId);
      }
    });
    checkIn();

    const queueItem = db.prepare(`
      SELECT q.*, p.name as patient_name, p.phone as patient_phone, d.name as doctor_name
      FROM queue q
      JOIN users p ON q.patient_id = p.id
      LEFT JOIN users d ON q.doctor_id = d.id
      WHERE q.id = ?
    `).get(queueId);

    logAudit(req, 'queue.check_in', { entity: 'queue', entityId: queueId, detail: `token=${tokenInfo.token}` });

    res.json({ success: true, queueItem, token: tokenInfo.token });
  } catch (error) {
    handleError(res, error, 'queue/check-in');
  }
});

// Doctor consultation routes
app.post('/api/consultations', authenticateToken, requireRole(['doctor']), (req, res) => {
  try {
    const body = req.body ?? {};
    const patientId = requireString(body.patient_id, 'Patient', { max: 64 });
    const appointmentId = optionalString(body.appointment_id, 'Appointment', { max: 64 });
    const diagnosis = optionalString(body.diagnosis, 'Diagnosis', { max: 2000 }) || '';
    const observations = optionalString(body.observations, 'Observations', { max: 2000 }) || '';
    const prescription = optionalString(body.prescription, 'Prescription', { max: 2000 }) || '';
    const vitals = optionalString(body.vitals, 'Vitals', { max: 500 }) || '';
    const notes = optionalString(body.notes, 'Notes', { max: 2000 }) || '';
    const followUpDate = body.follow_up_date ? requireDate(body.follow_up_date, 'Follow-up date') : null;

    const doctorId = req.user.id;

    if (appointmentId) {
      const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
      if (!appt) throw new ApiError(404, 'Appointment not found');
      if (appt.doctor_id !== doctorId) throw new ApiError(403, 'That appointment is assigned to another doctor');
      if (appt.patient_id !== patientId) throw new ApiError(400, 'That appointment belongs to a different patient');
    }

    const consultationId = uuidv4();

    const saveConsultation = db.transaction(() => {
      db.prepare(`
        INSERT INTO consultations (id, appointment_id, patient_id, doctor_id, diagnosis, observations, prescription, vitals, notes, follow_up_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(consultationId, appointmentId, patientId, doctorId, diagnosis, observations, prescription, vitals, notes, followUpDate);

      if (appointmentId) {
        db.prepare(`UPDATE appointments SET status = 'completed', notes = ? WHERE id = ?`).run(diagnosis || 'Consultation completed', appointmentId);
        db.prepare(`UPDATE queue SET status = 'completed', completed_time = CURRENT_TIMESTAMP WHERE appointment_id = ?`).run(appointmentId);
      }
    });
    saveConsultation();

    logAudit(req, 'consultation.completed', { entity: 'consultation', entityId: consultationId, detail: `patient=${patientId}` });

    res.json({ success: true, consultationId });
  } catch (error) {
    handleError(res, error, 'consultations/create');
  }
});

app.get('/api/consultations/patient/:patientId', authenticateToken, (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'patient' && req.user.id !== patientId) {
      throw new ApiError(403, 'You can only view your own medical records');
    }

    const consultations = db.prepare(`
      SELECT c.*, d.name as doctor_name, d.specialty as doctor_specialty
      FROM consultations c
      JOIN users d ON c.doctor_id = d.id
      WHERE c.patient_id = ?
      ORDER BY c.created_at DESC
    `).all(patientId);

    if (req.user.role !== 'patient') {
      logAudit(req, 'records.viewed', { entity: 'patient', entityId: patientId, detail: `count=${consultations.length}` });
    }

    res.json({ success: true, consultations });
  } catch (error) {
    handleError(res, error, 'consultations/by-patient');
  }
});

app.put('/api/appointments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};
    const user = req.user;

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }
    assertAppointmentAccess(user, appointment);

    const status = body.status
      ? requireOneOf(body.status, ['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled'], 'Status')
      : null;
    const notes = body.notes !== undefined ? optionalString(body.notes, 'Notes', { max: 1000 }) : undefined;

    const updateFields = [];
    const params = [];

    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }

    if (updateFields.length === 0) {
      throw new ApiError(400, 'No fields to update');
    }

    params.push(id);

    const applyUpdate = db.transaction(() => {
      db.prepare(`
        UPDATE appointments 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...params);

      if (status === 'completed' || status === 'cancelled') {
        db.prepare(`
          UPDATE queue 
          SET status = ?,
              completed_time = CURRENT_TIMESTAMP
          WHERE appointment_id = ?
        `).run(status === 'completed' ? 'completed' : 'cancelled', id);
      }
    });
    applyUpdate();

    logAudit(req, 'appointment.updated', { entity: 'appointment', entityId: id, detail: status ? `status=${status}` : 'notes' });

    const updatedAppointment = db.prepare(`
      SELECT a.*, p.name as patient_name, d.name as doctor_name
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE a.id = ?
    `).get(id);

    res.json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    handleError(res, error, 'appointments/update');
  }
});

// ============ QUEUE ROUTES ============
app.get('/api/queue', authenticateToken, (req, res) => {
  try {
    const { status, doctor_id, department } = req.query;
    const user = req.user;

    let query = `
      SELECT q.*, 
             p.name as patient_name, p.phone as patient_phone,
             d.name as doctor_name,
             a.appointment_date, a.appointment_time, a.type as appointment_type
      FROM queue q
      JOIN users p ON q.patient_id = p.id
      LEFT JOIN users d ON q.doctor_id = d.id
      LEFT JOIN appointments a ON q.appointment_id = a.id
      WHERE 1=1
    `;

    const params = [];

    // Role-based filtering
    if (user.role === 'doctor') {
      query += ` AND q.doctor_id = ?`;
      params.push(user.id);
    } else if (user.role === 'patient') {
      query += ` AND q.patient_id = ?`;
      params.push(user.id);
    }

    if (status) {
      query += ` AND q.status = ?`;
      params.push(String(status));
    }

    if (doctor_id && user.role !== 'patient') {
      query += ` AND q.doctor_id = ?`;
      params.push(String(doctor_id));
    }

    if (department) {
      query += ` AND q.department = ?`;
      params.push(String(department));
    }

    query += ` ORDER BY q.arrival_time`;

    const queue = db.prepare(query).all(...params);
    res.json({ success: true, queue });
  } catch (error) {
    handleError(res, error, 'queue/list');
  }
});

app.post('/api/queue/call-next', authenticateToken, requireRole(['doctor', 'frontdesk']), (req, res) => {
  try {
    const user = req.user;
    const requestedDoctor = optionalString(req.body?.doctor_id, 'Doctor', { max: 64 });
    const doctorToUse = requestedDoctor || user.id;

    if (user.role === 'doctor' && doctorToUse !== user.id) {
      throw new ApiError(403, 'A doctor can only call patients from their own queue');
    }

    let nextPatient = null;

    const callNext = db.transaction(() => {
      nextPatient = db.prepare(`
        SELECT * FROM queue 
        WHERE doctor_id = ? AND status = 'waiting'
        ORDER BY arrival_time 
        LIMIT 1
      `).get(doctorToUse);

      if (!nextPatient) return;

      db.prepare(`
        UPDATE queue 
        SET status = 'called', called_time = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(nextPatient.id);

      if (nextPatient.appointment_id) {
        db.prepare(`UPDATE appointments SET status = 'in-progress' WHERE id = ?`).run(nextPatient.appointment_id);
      }
    });
    callNext();

    if (!nextPatient) {
      return res.status(404).json({ error: 'No patients waiting' });
    }

    const updatedPatient = db.prepare(`
      SELECT q.*, p.name as patient_name, p.phone as patient_phone,
             d.name as doctor_name
      FROM queue q
      JOIN users p ON q.patient_id = p.id
      LEFT JOIN users d ON q.doctor_id = d.id
      WHERE q.id = ?
    `).get(nextPatient.id);

    logAudit(req, 'queue.called_next', { entity: 'queue', entityId: nextPatient.id, detail: `token=${updatedPatient.token}` });

    res.json({
      success: true,
      patient: updatedPatient,
      sound: true
    });
  } catch (error) {
    handleError(res, error, 'queue/call-next');
  }
});

app.put('/api/queue/:id/status', authenticateToken, requireRole(['doctor', 'frontdesk']), (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const status = requireOneOf(req.body?.status, ['waiting', 'called', 'in-progress', 'completed', 'cancelled', 'paused'], 'Status');

    const queueItem = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);
    if (!queueItem) {
      throw new ApiError(404, 'Queue item not found');
    }

    if (user.role === 'doctor' && queueItem.doctor_id !== user.id) {
      throw new ApiError(403, 'You can only update patients in your own queue');
    }

    const timestampColumn =
      status === 'called' ? 'called_time' :
        status === 'in-progress' ? 'started_time' :
          status === 'completed' ? 'completed_time' : null;

    const applyStatus = db.transaction(() => {
      let updateQuery = `UPDATE queue SET status = ?`;
      const params = [status];

      if (timestampColumn) {
        updateQuery += `, ${timestampColumn} = CURRENT_TIMESTAMP`;
      }

      updateQuery += ` WHERE id = ?`;
      params.push(id);

      db.prepare(updateQuery).run(...params);

      if (queueItem.appointment_id) {
        const appointmentStatus =
          status === 'in-progress' ? 'in-progress' :
            status === 'completed' ? 'completed' :
              status === 'cancelled' ? 'cancelled' : 'scheduled';

        db.prepare(`UPDATE appointments SET status = ? WHERE id = ?`).run(appointmentStatus, queueItem.appointment_id);
      }

      // Record in immutable queue audit log
      db.prepare(`
        INSERT INTO queue_audit_log (id, queue_id, token, action, previous_status, new_status, user_id, notes)
        VALUES (?, ?, ?, 'status_change', ?, ?, ?, ?)
      `).run(uuidv4(), id, queueItem.token, queueItem.status, status, user.id, req.body?.notes || `Status changed to ${status}`);
    });
    applyStatus();

    logAudit(req, 'queue.status_changed', { entity: 'queue', entityId: id, detail: `status=${status}` });

    const updatedQueueItem = db.prepare(`
      SELECT q.*, p.name as patient_name, d.name as doctor_name
      FROM queue q
      JOIN users p ON q.patient_id = p.id
      LEFT JOIN users d ON q.doctor_id = d.id
      WHERE q.id = ?
    `).get(id);

    res.json({ success: true, queueItem: updatedQueueItem });
  } catch (error) {
    handleError(res, error, 'queue/status');
  }
});

// Requeue patient: restores status to 'waiting', preserves original token and patient record, places at end by default
app.post('/api/queue/:id/requeue', authenticateToken, requireRole(['doctor', 'frontdesk']), (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const note = optionalString(req.body?.note, 'Note', { max: 255 }) || 'Requeued to active waiting queue';

    const queueItem = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);
    if (!queueItem) {
      throw new ApiError(404, 'Queue item not found');
    }

    const previousStatus = queueItem.status;

    const requeueTx = db.transaction(() => {
      // Update queue item: set status to 'waiting', bump arrival_time to place at end of active waiting queue
      db.prepare(`
        UPDATE queue 
        SET status = 'waiting', 
            arrival_time = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);

      // If associated appointment exists, reactivate it to confirmed/scheduled
      if (queueItem.appointment_id) {
        db.prepare(`UPDATE appointments SET status = 'confirmed' WHERE id = ?`).run(queueItem.appointment_id);
      }

      // Log in queue_audit_log
      db.prepare(`
        INSERT INTO queue_audit_log (id, queue_id, token, action, previous_status, new_status, user_id, notes)
        VALUES (?, ?, ?, 'requeue', ?, 'waiting', ?, ?)
      `).run(uuidv4(), id, queueItem.token, previousStatus, user.id, note);
    });
    requeueTx();

    logAudit(req, 'queue.requeued', { entity: 'queue', entityId: id, detail: `token=${queueItem.token}` });

    const updatedQueueItem = db.prepare(`
      SELECT q.*, p.name as patient_name, d.name as doctor_name
      FROM queue q
      JOIN users p ON q.patient_id = p.id
      LEFT JOIN users d ON q.doctor_id = d.id
      WHERE q.id = ?
    `).get(id);

    res.json({ success: true, queueItem: updatedQueueItem, message: `Token ${queueItem.token} returned to waiting queue.` });
  } catch (error) {
    handleError(res, error, 'queue/requeue');
  }
});

// Call again: repeats call announcement for a called patient without creating a duplicate queue entry
app.post('/api/queue/:id/call-again', authenticateToken, requireRole(['doctor', 'frontdesk']), (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const queueItem = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);
    if (!queueItem) {
      throw new ApiError(404, 'Queue item not found');
    }

    const callAgainTx = db.transaction(() => {
      db.prepare(`
        UPDATE queue 
        SET status = 'called', 
            called_time = CURRENT_TIMESTAMP,
            call_count = COALESCE(call_count, 0) + 1
        WHERE id = ?
      `).run(id);

      db.prepare(`
        INSERT INTO queue_audit_log (id, queue_id, token, action, previous_status, new_status, user_id, notes)
        VALUES (?, ?, ?, 'call_again', ?, 'called', ?, 'Voice announcement repeated')
      `).run(uuidv4(), id, queueItem.token, queueItem.status, user.id);
    });
    callAgainTx();

    const updatedPatient = db.prepare(`
      SELECT q.*, p.name as patient_name, d.name as doctor_name
      FROM queue q
      JOIN users p ON q.patient_id = p.id
      LEFT JOIN users d ON q.doctor_id = d.id
      WHERE q.id = ?
    `).get(id);

    logAudit(req, 'queue.call_again', { entity: 'queue', entityId: id, detail: `token=${queueItem.token}` });

    res.json({
      success: true,
      patient: updatedPatient,
      sound: true,
      message: `Announcement repeated for Token ${queueItem.token}`
    });
  } catch (error) {
    handleError(res, error, 'queue/call-again');
  }
});

// Move queue position (rearrange active waiting queue order without changing token numbers)
app.post('/api/queue/:id/move', authenticateToken, requireRole(['doctor', 'frontdesk']), (req, res) => {
  try {
    const { id } = req.params;
    const direction = requireOneOf(req.body?.direction, ['up', 'down', 'top', 'end'], 'Direction');

    const item = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);
    if (!item) throw new ApiError(404, 'Queue item not found');

    // Fetch active waiting items in order
    const waitingItems = db.prepare(`SELECT id, arrival_time FROM queue WHERE status = 'waiting' ORDER BY arrival_time ASC`).all();
    const idx = waitingItems.findIndex(w => w.id === id);

    if (idx !== -1) {
      if (direction === 'up' && idx > 0) {
        // Swap arrival_time with previous
        const prev = waitingItems[idx - 1];
        db.prepare('UPDATE queue SET arrival_time = ? WHERE id = ?').run(prev.arrival_time, id);
        db.prepare('UPDATE queue SET arrival_time = ? WHERE id = ?').run(item.arrival_time, prev.id);
      } else if (direction === 'down' && idx < waitingItems.length - 1) {
        // Swap arrival_time with next
        const next = waitingItems[idx + 1];
        db.prepare('UPDATE queue SET arrival_time = ? WHERE id = ?').run(next.arrival_time, id);
        db.prepare('UPDATE queue SET arrival_time = ? WHERE id = ?').run(item.arrival_time, next.id);
      } else if (direction === 'top') {
        // Give earliest arrival time
        const earliest = waitingItems[0].arrival_time;
        const newTime = new Date(new Date(earliest).getTime() - 1000).toISOString();
        db.prepare('UPDATE queue SET arrival_time = ? WHERE id = ?').run(newTime, id);
      } else if (direction === 'end') {
        db.prepare('UPDATE queue SET arrival_time = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      }
    }

    res.json({ success: true, message: `Queue position adjusted for Token ${item.token}` });
  } catch (error) {
    handleError(res, error, 'queue/move');
  }
});

// Get queue audit history
app.get('/api/queue/audit-history', authenticateToken, (req, res) => {
  try {
    const queueId = req.query.queue_id;
    let query = `
      SELECT al.*, u.name as staff_name
      FROM queue_audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (queueId) {
      query += ` AND al.queue_id = ?`;
      params.push(queueId);
    }
    query += ` ORDER BY al.created_at DESC LIMIT 100`;

    const history = db.prepare(query).all(...params);
    res.json({ success: true, history });
  } catch (error) {
    handleError(res, error, 'queue/audit-history');
  }
});

// ============ DASHBOARD STATISTICS ============
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    const date = new Date().toISOString().split('T')[0];

    let stats = {};

    if (user.role === 'doctor') {
      const doctorStats = db.prepare(`
        SELECT 
          COUNT(*) as total_patients_today,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_appointments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_consultations
        FROM appointments 
        WHERE doctor_id = ? AND appointment_date = ?
      `).get(user.id, date);

      const queueStats = db.prepare(`
        SELECT 
          COUNT(*) as active_queue,
          SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
          SUM(CASE WHEN status = 'called' THEN 1 ELSE 0 END) as called,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress
        FROM queue 
        WHERE doctor_id = ? AND DATE(arrival_time) = ?
      `).get(user.id, date);

      stats = {
        total_patients_today: doctorStats.total_patients_today || 0,
        appointments_today: doctorStats.scheduled_appointments || 0,
        completed_consultations: doctorStats.completed_consultations || 0,
        active_queue: queueStats.active_queue || 0,
        waiting: queueStats.waiting || 0,
        called: queueStats.called || 0,
        in_progress: queueStats.in_progress || 0
      };
    } else if (user.role === 'patient') {
      const patientStats = db.prepare(`
        SELECT 
          COUNT(*) as total_appointments,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as upcoming_appointments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as past_appointments
        FROM appointments 
        WHERE patient_id = ?
      `).get(user.id);

      const currentQueue = db.prepare(`
        SELECT * FROM queue 
        WHERE patient_id = ? AND status IN ('waiting', 'called', 'in-progress')
        ORDER BY arrival_time DESC LIMIT 1
      `).get(user.id);

      stats = {
        total_appointments: patientStats.total_appointments || 0,
        upcoming_appointments: patientStats.upcoming_appointments || 0,
        past_appointments: patientStats.past_appointments || 0,
        current_token: currentQueue ? currentQueue.token : null,
        current_wait_status: currentQueue ? currentQueue.status : 'none'
      };
    } else {
      const frontDeskStats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'patient') as total_patients,
          (SELECT COUNT(*) FROM appointments WHERE appointment_date = ? AND status = 'scheduled') as appointments_today,
          (SELECT COUNT(*) FROM queue WHERE DATE(arrival_time) = ? AND status = 'waiting') as active_queue,
          (SELECT COUNT(*) FROM appointments WHERE appointment_date = ? AND status = 'completed') as completed_consultations
      `).get(date, date, date);

      stats = {
        total_patients: frontDeskStats.total_patients || 0,
        appointments_today: frontDeskStats.appointments_today || 0,
        active_queue: frontDeskStats.active_queue || 0,
        completed_consultations: frontDeskStats.completed_consultations || 0
      };
    }

    res.json({ success: true, stats });
  } catch (error) {
    handleError(res, error, 'dashboard/stats');
  }
});

// ============ PATIENT ENGAGEMENT MODULES ============
app.get('/api/articles/saved', authenticateToken, (req, res) => {
  try {
    const savedArticles = db.prepare(`
      SELECT * FROM saved_articles WHERE user_id = ? ORDER BY saved_at DESC
    `).all(req.user.id);
    res.json({ success: true, articles: savedArticles });
  } catch (error) {
    handleError(res, error, 'articles/saved');
  }
});

app.post('/api/articles/save', authenticateToken, (req, res) => {
  try {
    const body = req.body ?? {};
    const articleId = requireString(body.article_id, 'Article identifier', { max: 64 });
    const title = requireString(body.title, 'Article title', { max: 400 });
    const authors = optionalString(body.authors, 'Authors', { max: 500 });
    const journal = optionalString(body.journal, 'Journal', { max: 200 });
    const year = optionalString(body.year, 'Year', { max: 10 });
    const category = optionalString(body.category, 'Category', { max: 80 });

    const existing = db.prepare('SELECT * FROM saved_articles WHERE user_id = ? AND article_id = ?')
      .get(req.user.id, articleId);

    if (existing) {
      db.prepare('DELETE FROM saved_articles WHERE id = ?').run(existing.id);
      logAudit(req, 'article.unsaved', { entity: 'article', entityId: articleId });
      res.json({ success: true, saved: false });
    } else {
      const savedId = uuidv4();
      db.prepare(`
        INSERT INTO saved_articles (id, user_id, article_id, title, authors, journal, year, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(savedId, req.user.id, articleId, title, authors, journal, year, category);
      logAudit(req, 'article.saved', { entity: 'article', entityId: articleId });
      res.json({ success: true, saved: true });
    }
  } catch (error) {
    handleError(res, error, 'articles/save');
  }
});

app.get('/api/games/scores', authenticateToken, (req, res) => {
  try {
    const gameId = optionalString(req.query.game_id, 'Game identifier', { max: 64 });

    let query = 'SELECT * FROM game_scores WHERE user_id = ?';
    const params = [req.user.id];

    if (gameId) {
      query += ' AND game_id = ?';
      params.push(gameId);
    }

    query += ' ORDER BY played_at DESC LIMIT 50';

    const scores = db.prepare(query).all(...params);
    const highScores = db.prepare(`
      SELECT game_id, MAX(score) as high_score
      FROM game_scores 
      WHERE user_id = ?
      GROUP BY game_id
    `).all(req.user.id);

    const highScoreMap = {};
    highScores.forEach(score => {
      highScoreMap[score.game_id] = score.high_score;
    });

    res.json({ success: true, scores, highScores: highScoreMap });
  } catch (error) {
    handleError(res, error, 'games/scores');
  }
});

const GAME_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

app.post('/api/games/save-score', authenticateToken, rateLimit({ label: 'game-score', windowMs: 60 * 1000, max: 30 }), (req, res) => {
  try {
    const body = req.body ?? {};
    const gameId = requireString(body.game_id, 'Game identifier', { max: 64 }).toLowerCase();
    if (!GAME_ID_PATTERN.test(gameId)) {
      throw new ApiError(400, 'Game identifier must use lowercase letters, numbers and hyphens');
    }

    const score = requireInteger(body.score, 'Score', { min: 0, max: 10000 });
    const moves = body.moves === undefined || body.moves === null ? null : requireInteger(body.moves, 'Moves', { min: 0, max: 100000 });
    const timeTaken = body.time_taken === undefined || body.time_taken === null ? null : requireInteger(body.time_taken, 'Time taken', { min: 0, max: 100000 });
    const completed = body.completed === undefined ? true : Boolean(body.completed);

    const scoreId = uuidv4();

    const saveScore = db.transaction(() => {
      db.prepare(`
        INSERT INTO game_scores (id, user_id, game_id, score, moves, time_taken, completed)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(scoreId, req.user.id, gameId, score, moves, timeTaken, completed ? 1 : 0);

      const pointsEarned = completed ? Math.floor(score / 10) : 0;
      if (pointsEarned > 0) {
        db.prepare(`
          UPDATE user_points 
          SET total_points = total_points + ?,
              last_activity_date = DATE('now'),
              streak_days = CASE 
                WHEN DATE(last_activity_date) = DATE('now', '-1 day') THEN streak_days + 1
                ELSE 1
              END
          WHERE user_id = ?
        `).run(pointsEarned, req.user.id);
      }
      return pointsEarned;
    });
    const pointsEarned = saveScore();

    logAudit(req, 'game.score_saved', { entity: 'game', entityId: gameId, detail: `score=${score} points=${pointsEarned}` });

    res.json({ success: true, pointsEarned });
  } catch (error) {
    handleError(res, error, 'games/save-score');
  }
});

app.get('/api/learning/progress', authenticateToken, (req, res) => {
  try {
    const progress = db.prepare(`
      SELECT * FROM learning_progress WHERE user_id = ? ORDER BY completed_at DESC
    `).all(req.user.id);

    const points = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.user.id);

    res.json({
      success: true,
      progress,
      points: points || { total_points: 0, streak_days: 0 }
    });
  } catch (error) {
    handleError(res, error, 'learning/progress');
  }
});

app.post('/api/learning/complete-lesson', authenticateToken, rateLimit({ label: 'lesson', windowMs: 60 * 1000, max: 30 }), (req, res) => {
  try {
    const body = req.body ?? {};
    const lessonId = requireString(body.lesson_id, 'Lesson identifier', { max: 64 });
    const lessonTitle = requireString(body.lesson_title, 'Lesson title', { max: 200 });
    const category = optionalString(body.category, 'Category', { max: 80 });
    const score = requireInteger(body.score, 'Score', { min: 0, max: 1000 });

    const existing = db.prepare(`
      SELECT * FROM learning_progress WHERE user_id = ? AND lesson_id = ?
    `).get(req.user.id, lessonId);

    const complete = db.transaction(() => {
      if (existing) {
        db.prepare(`
          UPDATE learning_progress 
          SET score = ?, completed = TRUE, completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(score, existing.id);
        return 0;
      }

      const progressId = uuidv4();
      const pointsEarned = Math.floor(score / 5);

      db.prepare(`
        INSERT INTO learning_progress (id, user_id, lesson_id, lesson_title, category, score, completed, points_earned, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP)
      `).run(progressId, req.user.id, lessonId, lessonTitle, category, score, pointsEarned);

      if (pointsEarned > 0) {
        db.prepare(`
          UPDATE user_points 
          SET total_points = total_points + ?,
              last_activity_date = DATE('now'),
              streak_days = CASE 
                WHEN DATE(last_activity_date) = DATE('now', '-1 day') THEN streak_days + 1
                ELSE 1
              END
          WHERE user_id = ?
        `).run(pointsEarned, req.user.id);
      }
      return pointsEarned;
    });
    const pointsEarned = complete();

    logAudit(req, 'lesson.completed', { entity: 'lesson', entityId: lessonId, detail: `score=${score} points=${pointsEarned}` });

    res.json({ success: true, score, pointsEarned });
  } catch (error) {
    handleError(res, error, 'learning/complete-lesson');
  }
});

// ============ TEXT-TO-SPEECH (PROJECT VAANI & FALLBACKS) ============
const TTS_CACHE_MAX_ENTRIES = 100;
const ttsAudioCache = new Map();
let ttsCacheHits = 0;
let ttsCacheMisses = 0;

function setTtsCache(key, data) {
  if (ttsAudioCache.size >= TTS_CACHE_MAX_ENTRIES) {
    const oldestKey = ttsAudioCache.keys().next().value;
    ttsAudioCache.delete(oldestKey);
  }
  ttsAudioCache.set(key, { ...data, cachedAt: Date.now() });
}

app.get('/api/tts/status', async (req, res) => {
  const vaaniUrl = process.env.VAANI_TTS_URL || 'http://localhost:8000';
  let vaaniOnline = false;
  let vaaniModelLoaded = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const r = await fetch(`${vaaniUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (r.ok) {
      vaaniOnline = true;
      const data = await r.json().catch(() => ({}));
      vaaniModelLoaded = Boolean(data.is_model_loaded);
    }
  } catch {
    vaaniOnline = false;
  }

  const sarvamConfigured = Boolean(process.env.SARVAM_API_KEY && process.env.SARVAM_API_KEY.trim());

  let activeEngine = 'web-speech-api';
  if (vaaniOnline && vaaniModelLoaded) {
    activeEngine = 'project-vaani-dhvaani-0.5';
  } else if (sarvamConfigured) {
    activeEngine = 'sarvam-ai-fallback';
  }

  res.json({
    success: true,
    data: {
      activeEngine,
      vaani: {
        model: 'ARTPARK-IISc/DhVaani-0.5',
        architecture: 'ZipVoice (123M flow-matching) with Indic character tokenizer',
        samplingRate: 24000,
        languages: ['en', 'hi', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur', 'sa'],
        isOnline: vaaniOnline,
        isModelLoaded: vaaniModelLoaded,
        serviceUrl: vaaniUrl,
        requiresHfToken: true,
      },
      sarvam: {
        isConfigured: sarvamConfigured,
        model: 'bulbul:v1',
      },
      webSpeechFallback: {
        available: true,
        voices: ['en-IN (Natural Female)', 'hi-IN (Natural Female)', 'mr-IN (Natural Female)', 'bn-IN (Natural Female)'],
      },
      cacheStats: {
        entries: ttsAudioCache.size,
        hits: ttsCacheHits,
        misses: ttsCacheMisses,
      },
    },
  });
});

app.post('/api/tts/synthesize', async (req, res) => {
  try {
    const { text, language = 'en', speed = 1.0, voiceGender = 'female' } = req.body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Text is required for speech synthesis' });
    }

    const safeLang = ['en', 'hi', 'mr', 'bn'].includes(language) ? language : 'en';
    const safeSpeed = Math.min(Math.max(Number(speed) || 1.0, 0.5), 2.0);

    const cacheKey = crypto
      .createHash('sha256')
      .update(`${safeLang}:${safeSpeed}:${voiceGender}:${text.trim()}`)
      .digest('hex');

    if (ttsAudioCache.has(cacheKey)) {
      ttsCacheHits++;
      const cached = ttsAudioCache.get(cacheKey);
      return res.json({
        success: true,
        data: {
          audioBase64: cached.audioBase64,
          format: cached.format,
          engine: cached.engine,
          fromCache: true,
          language: safeLang,
        },
      });
    }

    ttsCacheMisses++;

    // 1. Try Project Vaani (DhVaani-0.5) service
    const vaaniUrl = process.env.VAANI_TTS_URL || 'http://localhost:8000';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const vaaniResponse = await fetch(`${vaaniUrl}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          language: safeLang,
          speed: safeSpeed,
          reference_gender: voiceGender,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (vaaniResponse.ok) {
        const vaaniData = await vaaniResponse.json();
        if (vaaniData && vaaniData.audioBase64) {
          setTtsCache(cacheKey, {
            audioBase64: vaaniData.audioBase64,
            format: vaaniData.format || 'audio/wav',
            engine: 'project-vaani-dhvaani-0.5',
          });
          return res.json({
            success: true,
            data: {
              audioBase64: vaaniData.audioBase64,
              format: vaaniData.format || 'audio/wav',
              engine: 'project-vaani-dhvaani-0.5',
              fromCache: false,
              language: safeLang,
            },
          });
        }
      }
    } catch {
      // Vaani service offline or timed out; proceed to fallback
    }

    // 2. Try Sarvam AI fallback if configured
    if (process.env.SARVAM_API_KEY && process.env.SARVAM_API_KEY.trim()) {
      try {
        const sarvamLangMap = {
          en: 'en-IN',
          hi: 'hi-IN',
          mr: 'mr-IN',
          bn: 'bn-IN',
        };
        const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': process.env.SARVAM_API_KEY.trim(),
          },
          body: JSON.stringify({
            inputs: [text.trim().slice(0, 500)],
            target_language_code: sarvamLangMap[safeLang] || 'en-IN',
            speaker: 'meera',
            pitch: 0,
            pace: safeSpeed,
            loudness: 1.0,
            speech_sample_rate: 22050,
            enable_preprocessing: true,
            model: 'bulbul:v1',
          }),
        });

        if (sarvamRes.ok) {
          const sarvamData = await sarvamRes.json();
          if (sarvamData?.audios?.[0]) {
            setTtsCache(cacheKey, {
              audioBase64: sarvamData.audios[0],
              format: 'audio/wav',
              engine: 'sarvam-ai-fallback',
            });
            return res.json({
              success: true,
              data: {
                audioBase64: sarvamData.audios[0],
                format: 'audio/wav',
                engine: 'sarvam-ai-fallback',
                fromCache: false,
                language: safeLang,
              },
            });
          }
        }
      } catch {
        // Sarvam fallback failed; proceed to client-side Web Speech API
      }
    }

    // 3. Fallback to client-side Web Speech API
    return res.json({
      success: true,
      data: {
        useWebSpeech: true,
        engine: 'web-speech-api',
        message: 'Project Vaani model server offline. Falling back to browser Speech Synthesis.',
        language: safeLang,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: {
        useWebSpeech: true,
        engine: 'web-speech-api',
      },
      error: error.message || 'TTS synthesis failed',
    });
  }
});

// ============ FALLBACK HANDLERS ============
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'That API endpoint does not exist' });
});

app.use((error, req, res, next) => {
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON' });
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request body is too large' });
  }
  const reference = crypto.randomBytes(4).toString('hex');
  console.error(`[clinicops] unhandled error (reference ${reference}):`, error);
  res.status(500).json({ error: 'Something went wrong while processing this request. Please try again.', reference });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Keep server running
process.stdin.resume();