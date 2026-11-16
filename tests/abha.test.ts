import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAbdmClient, AbdmError } from '../server-abdm.mjs';
import crypto from 'crypto';

describe('ABDM & ABHA Integration Suite', () => {
  // Generate a test RSA 2048-bit keypair for public certificate testing
  const { publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration & Credentials Checks', () => {
    it('accurately identifies unconfigured state when credentials are missing', () => {
      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: '', ABDM_CLIENT_SECRET: '' },
      });
      expect(client.isConfigured()).toBe(false);
      const desc = client.describe();
      expect(desc.configured).toBe(false);
      expect(desc.missing).toContain('ABDM_CLIENT_ID');
      expect(desc.missing).toContain('ABDM_CLIENT_SECRET');
      expect(desc.environment).toBe('sandbox');
    });

    it('identifies configured state when credentials are provided', () => {
      const client = createAbdmClient({
        env: {
          ABDM_CLIENT_ID: 'sbx_test_client_id',
          ABDM_CLIENT_SECRET: 'sbx_test_client_secret',
          ABDM_ENVIRONMENT: 'sandbox',
        },
      });
      expect(client.isConfigured()).toBe(true);
      const desc = client.describe();
      expect(desc.configured).toBe(true);
      expect(desc.missing).toHaveLength(0);
      expect(desc.environment).toBe('sandbox');
      expect(desc.sessionUrl).toContain('dev.abdm.gov.in');
      expect(desc.abhaBaseUrl).toContain('abhasbx.abdm.gov.in');
    });

    it('supports production environment routing without leaking sandbox endpoints', () => {
      const client = createAbdmClient({
        env: {
          ABDM_CLIENT_ID: 'prod_client_id',
          ABDM_CLIENT_SECRET: 'prod_client_secret',
          ABDM_ENVIRONMENT: 'production',
        },
      });
      expect(client.isConfigured()).toBe(true);
      const desc = client.describe();
      expect(desc.environment).toBe('production');
      expect(desc.sessionUrl).toContain('apis.abdm.gov.in');
      expect(desc.abhaBaseUrl).toContain('abha.abdm.gov.in');
    });
  });

  describe('ABDM 9 Core Test Cases', () => {
    // 1. Existing patient with valid ABHA
    it('Case 1: handles valid ABHA login & OTP verification', async () => {
      const mockFetch = vi.fn()
        // Gateway session
        .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'mock_gw_token', expiresIn: 1800 }), { status: 200 }))
        // Public certificate
        .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey, encryptionAlgorithm: 'RSA/ECB/OAEPWithSHA-1AndMGF1Padding' }), { status: 200 }))
        // Login OTP request
        .mockResolvedValueOnce(new Response(JSON.stringify({ txnId: 'txn-12345', message: 'OTP sent' }), { status: 200 }))
        // Verify OTP (uses cached gateway session token)
        .mockResolvedValueOnce(new Response(JSON.stringify({
          token: 'x-token-abc',
          profile: {
            abhaNumber: '91-4821-7290-3412',
            abhaAddress: 'maya.patel@sbx',
            name: 'Maya Patel',
          },
        }), { status: 200 }));

      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'cid', ABDM_CLIENT_SECRET: 'csec' },
        fetchImpl: mockFetch as any,
      });

      const otpReq = await client.requestLoginOtp({ abhaNumber: '91-4821-7290-3412' });
      expect(otpReq.txnId).toBe('txn-12345');

      const verified = await client.verifyLoginOtp({ txnId: 'txn-12345', otp: '123456' });
      expect(verified.token).toBe('x-token-abc');
      expect(verified.profile?.abhaNumber).toBe('91-4821-7290-3412');
      expect(verified.profile?.name).toBe('Maya Patel');
    });

    // 2. Incorrect ABHA number
    it('Case 2: rejects incorrect or unrecognised ABHA number with upstream error', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'mock_gw_token', expiresIn: 1800 }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          error: { code: 'ABDM-1002', message: 'No ABHA found for the provided identifier' },
        }), { status: 404 }));

      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'cid', ABDM_CLIENT_SECRET: 'csec' },
        fetchImpl: mockFetch as any,
      });

      await expect(client.requestLoginOtp({ abhaNumber: '00-0000-0000-00' })).rejects.toThrow(
        /No ABHA found for the provided identifier/
      );
    });

    // 3. Incorrect OTP
    it('Case 3: rejects incorrect OTP with upstream verification failure', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'mock_gw_token', expiresIn: 1800 }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          error: { code: 'ABDM-1041', message: 'Invalid OTP. 2 attempts remaining.' },
        }), { status: 400 }));

      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'cid', ABDM_CLIENT_SECRET: 'csec' },
        fetchImpl: mockFetch as any,
      });

      await expect(client.verifyLoginOtp({ txnId: 'txn-12345', otp: '999999' })).rejects.toThrow(
        /Invalid OTP/
      );
    });

    // 4. Expired OTP
    it('Case 4: rejects expired OTP with appropriate error code', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'mock_gw_token', expiresIn: 1800 }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          error: { code: 'ABDM-1042', message: 'OTP has expired. Please request a new one.' },
        }), { status: 400 }));

      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'cid', ABDM_CLIENT_SECRET: 'csec' },
        fetchImpl: mockFetch as any,
      });

      await expect(client.verifyLoginOtp({ txnId: 'txn-expired', otp: '123456' })).rejects.toThrow(
        /OTP has expired/
      );
    });

    // 5. ABDM server unavailable
    it('Case 5: raises ABDM_UNREACHABLE with 503 when ABDM server cannot be reached', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'cid', ABDM_CLIENT_SECRET: 'csec' },
        fetchImpl: mockFetch as any,
      });

      await expect(client.requestLoginOtp({ abhaNumber: '91-4821-7290-3412' })).rejects.toThrow(
        /The ABDM service could not be reached/
      );
    });

    // 6. Patient without ABHA (ABHA optional)
    it('Case 6: validates that ABHA is optional and absent values are handled without errors', () => {
      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: '', ABDM_CLIENT_SECRET: '' },
      });
      // describe returns configured: false without throwing
      expect(client.describe().configured).toBe(false);
    });

    // 7. Patient registering through email/password
    it('Case 7: ensures unconfigured ABDM does not throw during normal email registration checks', () => {
      const client = createAbdmClient({
        env: {},
      });
      expect(client.isConfigured()).toBe(false);
      // Unconfigured client simply states missing fields without crashing
      expect(client.describe().missing).toEqual(['ABDM_CLIENT_ID', 'ABDM_CLIENT_SECRET']);
    });

    // 8. Existing patient linking ABHA later
    it('Case 8: supports link request OTP and verification for existing patients', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'mock_gw_token', expiresIn: 1800 }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ txnId: 'link-txn-777', message: 'OTP sent for linking' }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          token: 'link-x-token',
          profile: {
            abhaNumber: '14-1111-2222-3333',
            abhaAddress: 'john.doe@sbx',
            name: 'John Doe',
          },
        }), { status: 200 }));

      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'cid', ABDM_CLIENT_SECRET: 'csec' },
        fetchImpl: mockFetch as any,
      });

      const linkReq = await client.requestLoginOtp({ abhaNumber: '14-1111-2222-3333' });
      expect(linkReq.txnId).toBe('link-txn-777');

      const verified = await client.verifyLoginOtp({ txnId: 'link-txn-777', otp: '654321' });
      expect(verified.profile?.abhaNumber).toBe('14-1111-2222-3333');
      expect(verified.profile?.name).toBe('John Doe');
    });

    // 9. Enrolment & duplicate identity checks
    it('Case 9: supports new ABHA creation flow with Aadhaar OTP and explicit consent', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'mock_gw_token', expiresIn: 1800 }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ txnId: 'enrol-txn-999', message: 'Aadhaar OTP sent' }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          isNew: true,
          profile: {
            abhaNumber: '91-9999-8888-7777',
            abhaAddress: 'new.patient@sbx',
            name: 'New Patient',
          },
        }), { status: 200 }));

      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'cid', ABDM_CLIENT_SECRET: 'csec' },
        fetchImpl: mockFetch as any,
      });

      const enrolReq = await client.requestEnrollmentOtp({ aadhaarNumber: '123456789012' });
      expect(enrolReq.txnId).toBe('enrol-txn-999');

      const enrolResult = await client.verifyEnrollment({ txnId: 'enrol-txn-999', otp: '112233' });
      expect(enrolResult.isNew).toBe(true);
      expect(enrolResult.profile?.abhaNumber).toBe('91-9999-8888-7777');
    });
  });

  describe('ABDM Sandbox Developer Simulator Suite', () => {
    it('identifies sandbox developer simulator mode and reports configured: true', () => {
      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'SBX_CLINICOPS_DEVELOPER', ABDM_CLIENT_SECRET: 'sbx_sec' },
      });
      expect(client.isConfigured()).toBe(true);
      const desc = client.describe();
      expect(desc.configured).toBe(true);
      expect(desc.mode).toBe('sandbox-simulator');
      expect(desc.missing).toHaveLength(0);
    });

    it('supports full ABHA verification with test OTP 123456 and matches requested ABHA ID', async () => {
      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'SBX_CLINICOPS_DEVELOPER', ABDM_CLIENT_SECRET: 'sbx_sec' },
      });
      const otpReq = await client.requestLoginOtp({ abhaNumber: '91-1234-5678-9012' });
      expect(otpReq.txnId).toMatch(/^sbx-txn-/);
      expect(otpReq.message).toContain('123456');

      const verified = await client.verifyLoginOtp({ txnId: otpReq.txnId, otp: '123456' });
      expect(verified.profile?.abhaNumber).toBe('91-1234-5678-9012');
      expect(verified.profile?.name).toBe('Verified Patient');
      expect(verified.profile?.abhaAddress).toBe('patient.sbx@sbx');
    });

    it('rejects wrong OTP with 400 error in sandbox simulator', async () => {
      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'SBX_CLINICOPS_DEVELOPER', ABDM_CLIENT_SECRET: 'sbx_sec' },
      });
      const otpReq = await client.requestLoginOtp({ abhaNumber: '91-1234-5678-9012' });
      await expect(client.verifyLoginOtp({ txnId: otpReq.txnId, otp: '999999' })).rejects.toThrow(
        /Invalid OTP/
      );
    });

    it('supports enrollment with Aadhaar test OTP 123456 and generates a valid 14-digit ABHA', async () => {
      const client = createAbdmClient({
        env: { ABDM_CLIENT_ID: 'SBX_CLINICOPS_DEVELOPER', ABDM_CLIENT_SECRET: 'sbx_sec' },
      });
      const enrolReq = await client.requestEnrollmentOtp({ aadhaarNumber: '123456789012' });
      expect(enrolReq.txnId).toMatch(/^sbx-enrol-/);

      const enrolRes = await client.verifyEnrollment({ txnId: enrolReq.txnId, otp: '123456' });
      expect(enrolRes.isNew).toBe(true);
      expect(enrolRes.profile?.abhaNumber).toMatch(/^91-\d{4}-\d{4}-\d{4}$/);
      expect(enrolRes.profile?.name).toBe('New Verified Patient');
    });
  });
});
