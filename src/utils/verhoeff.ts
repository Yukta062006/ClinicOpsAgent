/**
 * Official Verhoeff Checksum Algorithm Implementation.
 * Used by UIDAI for 12-digit Aadhaar number generation and validation.
 */

// The multiplication table (d)
const d: number[][] = [
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

// The permutation table (p)
const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

// The inverse table (inv)
const inv: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/** Validates whether a number string satisfies the Verhoeff algorithm. */
export function validateVerhoeff(numStr: string): boolean {
  let c = 0;
  const digits = String(numStr).replace(/\D/g, '').split('').reverse().map(Number);
  if (digits.length === 0) return false;
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }
  return c === 0;
}

/** Generates the Verhoeff check digit for an 11-digit or partial prefix. */
export function generateVerhoeff(numStr: string): number {
  let c = 0;
  const digits = String(numStr).replace(/\D/g, '').split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[(i + 1) % 8][digits[i]]];
  }
  return inv[c];
}

export interface AadhaarValidationResult {
  valid: boolean;
  error?: string;
  clean?: string;
}

/**
 * Validates a 12-digit Indian Aadhaar number per UIDAI and ABDM specifications:
 * 1. Exactly 12 numeric digits.
 * 2. Cannot begin with '0' or '1'.
 * 3. Satisfies the Verhoeff dihedral group D5 checksum.
 */
export function validateAadhaar(
  aadhaar: string,
  options: { allowDeveloperDemo?: boolean } = {}
): AadhaarValidationResult {
  const clean = String(aadhaar || '').replace(/\D/g, '');
  if (options.allowDeveloperDemo && clean === '123456789012') {
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

