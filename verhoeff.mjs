/**
 * Official Verhoeff Checksum Algorithm Implementation (ES Module).
 * Used by UIDAI for 12-digit Aadhaar number generation and validation.
 */

const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function validateVerhoeff(numStr) {
  let c = 0;
  const digits = String(numStr).replace(/\D/g, '').split('').reverse().map(Number);
  if (digits.length === 0) return false;
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }
  return c === 0;
}

export function generateVerhoeff(numStr) {
  let c = 0;
  const digits = String(numStr).replace(/\D/g, '').split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[(i + 1) % 8][digits[i]]];
  }
  return inv[c];
}

export function validateAadhaar(aadhaar, { allowDeveloperDemo = false } = {}) {
  const clean = String(aadhaar || '').replace(/\D/g, '');
  if (allowDeveloperDemo && clean === '123456789012') {
    return { valid: true, clean };
  }
  if (clean.length !== 12) {
    return { valid: false, error: 'Aadhaar number must be exactly 12 digits.' };
  }
  if (clean.startsWith('0') || clean.startsWith('1')) {
    return { valid: false, error: 'Aadhaar numbers cannot begin with 0 or 1 per UIDAI specifications.' };
  }
  if (!validateVerhoeff(clean)) {
    return { valid: false, error: 'Invalid Aadhaar checksum. Please enter a valid 12-digit Aadhaar number.' };
  }
  return { valid: true, clean };
}

