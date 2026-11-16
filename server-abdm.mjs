import crypto from 'crypto';

/**
 * ABDM ABHA V3 client (Milestone 1).
 *
 * Endpoints and payload shapes follow the official ABDM developer
 * documentation:
 *   - POST {gateway}/v3/sessions                       (client credentials)
 *   - GET  {abhaBase}/v3/profile/public/certificate    (RSA public key)
 *   - POST {abhaBase}/v3/profile/login/request/otp
 *   - POST {abhaBase}/v3/profile/login/verify
 *   - POST {abhaBase}/v3/enrollment/request/otp
 *   - POST {abhaBase}/v3/enrollment/enrol/byAadhaar
 *
 * Sensitive values (ABHA number, Aadhaar, OTP) are RSA-encrypted with
 * RSA/ECB/OAEPWithSHA-1AndMGF1Padding using the public key ABDM publishes.
 * Nothing in this module invents an OTP or fakes a verification result: when
 * credentials are absent every call fails with ABDM_NOT_CONFIGURED.
 */

const ENVIRONMENTS = {
  sandbox: {
    sessionUrl: 'https://dev.abdm.gov.in/gateway/v3/sessions',
    abhaBaseUrl: 'https://abhasbx.abdm.gov.in/abha/api',
  },
  production: {
    sessionUrl: 'https://apis.abdm.gov.in/gateway/v3/sessions',
    abhaBaseUrl: 'https://abha.abdm.gov.in/abha/api',
  },
};

const CERTIFICATE_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;
const DEFAULT_TIMEOUT_MS = 20_000;

export class AbdmError extends Error {
  constructor(message, { status = 502, code = 'ABDM_ERROR', upstreamStatus = null, upstreamCode = null, missing = null, retryable = false } = {}) {
    super(message);
    this.name = 'AbdmError';
    this.status = status;
    this.code = code;
    this.upstreamStatus = upstreamStatus;
    this.upstreamCode = upstreamCode;
    this.missing = missing;
    this.retryable = retryable;
  }
}

function digits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function formatAbhaNumber(value) {
  const valueDigits = digits(value);
  if (valueDigits.length !== 14) return null;
  return `${valueDigits.slice(0, 2)}-${valueDigits.slice(2, 6)}-${valueDigits.slice(6, 10)}-${valueDigits.slice(10, 14)}`;
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function upstreamMessage(payload, status) {
  if (!payload) return `ABDM rejected the request (HTTP ${status}).`;
  const candidates = [
    payload?.error?.message,
    payload?.error?.details?.[0]?.message,
    payload?.message,
    typeof payload?.error === 'string' ? payload.error : null,
  ];
  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim()) || `ABDM rejected the request (HTTP ${status}).`;
}

function upstreamCode(payload) {
  if (!payload) return null;
  const code = payload?.error?.code ?? payload?.code ?? payload?.error?.details?.[0]?.code ?? null;
  return code == null ? null : String(code);
}

/**
 * @param {{
 *   env?: Record<string, string | undefined>,
 *   fetchImpl?: typeof fetch,
 *   logger?: Pick<Console, 'warn'>,
 * }} options
 */
export function createAbdmClient({ env = process.env, fetchImpl = globalThis.fetch, logger = console } = {}) {
  const requestedEnvironment = String(env.ABDM_ENVIRONMENT || 'sandbox').trim().toLowerCase();
  const environment = requestedEnvironment === 'production' ? 'production' : 'sandbox';
  const urls = {
    ...ENVIRONMENTS[environment],
    abhaBaseUrl: (env.ABDM_ABHA_BASE_URL || ENVIRONMENTS[environment].abhaBaseUrl).replace(/\/$/, ''),
    sessionUrl: (env.ABDM_SESSION_URL || ENVIRONMENTS[environment].sessionUrl).replace(/\/$/, ''),
  };

  const clientId = String(env.ABDM_CLIENT_ID || '').trim();
  const clientSecret = String(env.ABDM_CLIENT_SECRET || '').trim();
  const configuredTimeout = Number(env.ABDM_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : DEFAULT_TIMEOUT_MS;

  const missing = [];
  if (!clientId) missing.push('ABDM_CLIENT_ID');
  if (!clientSecret) missing.push('ABDM_CLIENT_SECRET');
  const configured = missing.length === 0;

  let tokenCache = null;
  let certificateCache = null;

  async function httpJson(url, { method = 'GET', headers = {}, body } = {}) {
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new AbdmError(
        'The ABDM service could not be reached. Check the server network connection and try again.',
        { code: 'ABDM_UNREACHABLE', status: 503, retryable: true }
      );
    }

    const text = await response.text();
    const payload = parseJson(text);

    if (!response.ok) {
      const status = response.status;
      const mappedStatus =
        status === 429 ? 429 : status >= 400 && status < 500 ? 400 : 502;
      throw new AbdmError(upstreamMessage(payload, status), {
        status: mappedStatus,
        code: 'ABDM_UPSTREAM_ERROR',
        upstreamStatus: status,
        upstreamCode: upstreamCode(payload),
        retryable: status === 429 || status >= 500,
      });
    }

    if (!payload) {
      throw new AbdmError('ABDM returned an empty or malformed response.', {
        code: 'ABDM_BAD_RESPONSE',
        upstreamStatus: response.status,
      });
    }

    return payload;
  }

  async function getAccessToken({ force = false } = {}) {
    if (!configured) {
      throw new AbdmError(
        `ABHA services are not configured on this server. Missing: ${missing.join(', ')}.`,
        { status: 503, code: 'ABDM_NOT_CONFIGURED', missing }
      );
    }

    if (!force && tokenCache && tokenCache.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
      return tokenCache.value;
    }

    const payload = await httpJson(urls.sessionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'REQUEST-ID': crypto.randomUUID(),
        TIMESTAMP: new Date().toISOString(),
      },
      body: {
        clientId,
        clientSecret,
        grantType: 'client_credentials',
      },
    }).catch((error) => {
      if (error instanceof AbdmError && (error.upstreamStatus === 401 || error.upstreamStatus === 403)) {
        throw new AbdmError(
          'ABDM rejected the server client credentials. Check ABDM_CLIENT_ID and ABDM_CLIENT_SECRET for the selected environment.',
          { status: 502, code: 'ABDM_AUTH_FAILED', upstreamStatus: error.upstreamStatus, upstreamCode: error.upstreamCode }
        );
      }
      throw error;
    });

    const accessToken = payload?.accessToken;
    if (typeof accessToken !== 'string' || !accessToken) {
      throw new AbdmError('ABDM did not return an access token. Check the client credentials and environment.', {
        code: 'ABDM_AUTH_FAILED',
        upstreamStatus: 401,
      });
    }

    const expiresIn = Number(payload?.expiresIn);
    const ttlSeconds = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 1800;
    tokenCache = { value: accessToken, expiresAt: Date.now() + ttlSeconds * 1000 };
    return accessToken;
  }

  async function abhaRequest(path, { method = 'POST', body, extraHeaders = {} } = {}, isRetry = false) {
    const accessToken = await getAccessToken({ force: isRetry });
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'REQUEST-ID': crypto.randomUUID(),
      TIMESTAMP: new Date().toISOString(),
      ...extraHeaders,
    };

    try {
      return await httpJson(`${urls.abhaBaseUrl}${path}`, { method, headers, body });
    } catch (error) {
      // An expired gateway token is reported as 401. Refresh once and retry.
      if (error instanceof AbdmError && error.upstreamStatus === 401 && !isRetry) {
        tokenCache = null;
        return abhaRequest(path, { method, body, extraHeaders }, true);
      }
      throw error;
    }
  }

  async function getPublicKey() {
    if (certificateCache && certificateCache.expiresAt > Date.now()) {
      return certificateCache.key;
    }

    const payload = await abhaRequest('/v3/profile/public/certificate', { method: 'GET' });
    const algorithm = payload?.encryptionAlgorithm;
    if (algorithm && !/RSA\/ECB\/OAEPWithSHA-?1AndMGF1Padding/i.test(String(algorithm))) {
      throw new AbdmError(
        `ABDM returned an unsupported encryption algorithm (${algorithm}). This server supports RSA/ECB/OAEPWithSHA-1AndMGF1Padding.`,
        { code: 'ABDM_UNSUPPORTED_ENCRYPTION' }
      );
    }

    const rawKey = payload?.publicKey;
    if (typeof rawKey !== 'string' || !rawKey.trim()) {
      throw new AbdmError('ABDM did not return a public encryption certificate.', { code: 'ABDM_CERTIFICATE_MISSING' });
    }

    let key;
    try {
      key = rawKey.includes('BEGIN')
        ? crypto.createPublicKey(rawKey)
        : crypto.createPublicKey({ key: Buffer.from(rawKey, 'base64'), format: 'der', type: 'spki' });
    } catch {
      throw new AbdmError('The ABDM public encryption certificate could not be parsed.', { code: 'ABDM_CERTIFICATE_INVALID' });
    }

    certificateCache = { key, expiresAt: Date.now() + CERTIFICATE_TTL_MS };
    return key;
  }

  async function encrypt(value) {
    const key = await getPublicKey();
    const encrypted = crypto.publicEncrypt(
      {
        key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1',
      },
      Buffer.from(String(value), 'utf8')
    );
    return encrypted.toString('base64');
  }

  function extractProfile(payload) {
    if (!payload || typeof payload !== 'object') return null;
    const source = Array.isArray(payload.accounts) && payload.accounts.length > 0
      ? payload.accounts[0]
      : payload.profile || payload.abhaProfile || payload;
    if (!source || typeof source !== 'object') return null;

    const abhaNumber = formatAbhaNumber(
      source.abhaNumber ?? source.ABHANumber ?? source.healthIdNumber ?? source.healthId
    );
    if (!abhaNumber) return null;

    const abhaAddressCandidates = [
      source.abhaAddress,
      source.preferredAbhaAddress,
      ...(Array.isArray(source.phrAddress) ? source.phrAddress : []),
      source.healthId,
    ].filter((value) => typeof value === 'string' && value.includes('@'));

    return {
      abhaNumber,
      abhaAddress: abhaAddressCandidates[0] || null,
      name: source.name ?? source.fullName ?? null,
    };
  }

  return {
    describe() {
      return {
        configured,
        environment,
        missing: [...missing],
        abhaBaseUrl: urls.abhaBaseUrl,
        sessionUrl: urls.sessionUrl,
        note: configured
          ? `ABDM ${environment} credentials are present. Every result still comes from the live ABDM API.`
          : 'Set ABDM_CLIENT_ID and ABDM_CLIENT_SECRET (and optionally ABDM_ENVIRONMENT) to enable live ABHA verification.',
      };
    },

    isConfigured() {
      return configured;
    },

    /** Sends an Aadhaar OTP for ABHA-number login. */
    async requestLoginOtp({ abhaNumber }) {
      const loginId = await encrypt(formatAbhaNumber(abhaNumber) || abhaNumber);
      const payload = await abhaRequest('/v3/profile/login/request/otp', {
        method: 'POST',
        body: {
          scope: ['abha-login', 'aadhaar-verify'],
          loginHint: 'abha-number',
          loginId,
          otpSystem: 'aadhaar',
        },
      });

      if (!payload?.txnId) {
        throw new AbdmError('ABDM did not return an OTP transaction id.', { code: 'ABDM_BAD_RESPONSE' });
      }
      return { txnId: String(payload.txnId), message: payload.message || null };
    },

    /** Verifies the ABHA-number login OTP and returns the ABDM X-token. */
    async verifyLoginOtp({ txnId, otp }) {
      const otpValue = await encrypt(otp);
      const payload = await abhaRequest('/v3/profile/login/verify', {
        method: 'POST',
        body: {
          scope: ['abha-login', 'aadhaar-verify'],
          authData: {
            authMethods: ['otp'],
            otp: { txnId, otpValue },
          },
        },
      });

      return {
        token: payload?.token ?? payload?.accessToken ?? null,
        refreshToken: payload?.refreshToken ?? null,
        profile: extractProfile(payload),
        raw: payload,
      };
    },

    /** Sends an Aadhaar OTP for creating a new ABHA. */
    async requestEnrollmentOtp({ aadhaarNumber }) {
      const loginId = await encrypt(String(aadhaarNumber).replace(/\D/g, ''));
      const clientTxnId = crypto.randomUUID();
      const payload = await abhaRequest('/v3/enrollment/request/otp', {
        method: 'POST',
        body: {
          txnId: clientTxnId,
          scope: ['abha-enrol'],
          loginHint: 'aadhaar',
          loginId,
          otpSystem: 'aadhaar',
        },
      });

      return {
        txnId: String(payload?.txnId || clientTxnId),
        message: payload?.message || null,
      };
    },

    /** Creates (or returns) an ABHA after Aadhaar OTP verification. */
    async verifyEnrollment({ txnId, otp }) {
      const otpValue = await encrypt(otp);
      const payload = await abhaRequest('/v3/enrollment/enrol/byAadhaar', {
        method: 'POST',
        body: {
          authData: {
            authMethods: ['otp'],
            otp: { txnId, otpValue },
          },
          consent: { code: 'abha-enrollment', version: '1.4' },
        },
      });

      return {
        profile: extractProfile(payload),
        isNew: payload?.isNew ?? null,
        message: payload?.message || null,
        raw: payload,
      };
    },
  };
}
