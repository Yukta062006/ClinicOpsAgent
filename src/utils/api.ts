// The Vite dev server proxies /api to the Express backend, so a relative base
// works in development, preview and production without hardcoding localhost.
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const API_BASE_URL = env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  /** Machine-readable server error code (e.g. ABDM_NOT_CONFIGURED). */
  code?: string;
  /** Env vars the server is missing when code is ABDM_NOT_CONFIGURED. */
  missing?: string[];
  upstreamCode?: string;
  /** True when the request never reached the server (offline / backend down). */
  networkError?: boolean;
}

// Helper function for API calls with proper error handling
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // The Vite dev proxy answers 500 with an empty body when the Express
    // backend is not running, so treat that as unreachable instead of as a
    // genuine rejection from the API.
    if (response.status >= 500 && data === null) {
      return {
        success: false,
        status: response.status,
        networkError: true,
        error: 'Cannot reach the ClinicOps server. Make sure the backend is running (npm run dev), then try again.',
      };
    }

    return {
      success: false,
      status: response.status,
      error: data?.error || `The server rejected this request (HTTP ${response.status}).`,
      code: typeof data?.code === 'string' ? data.code : undefined,
      missing: Array.isArray(data?.missing) ? data.missing : undefined,
      upstreamCode: typeof data?.upstream_code === 'string' ? data.upstream_code : undefined,
    };
  }

  if (data === null) {
    return {
      success: false,
      status: response.status,
      error: 'The server returned an unexpected response. Please try again.',
    };
  }

  // Auth endpoints put their payload at the top level (`{success, token, user}`),
  // while ABHA endpoints nest it under `data` (`{success, data:{...}}`). Normalise
  // both shapes so callers always read the payload from `response.data`.
  const payload =
    data && typeof data === 'object' && data.success === true && 'data' in data ? data.data : data;

  return { success: true, data: payload as T };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, init);
    return await handleResponse<T>(response);
  } catch {
    return {
      success: false,
      networkError: true,
      error: 'Cannot reach the ClinicOps server. Make sure the backend is running (npm run dev), then try again.',
    };
  }
}

function jsonHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}

function authHeaders(token: string): Record<string, string> {
  return { ...jsonHeaders(), Authorization: `Bearer ${token}` };
}

const post = <T>(path: string, body: unknown, token?: string) =>
  request<T>(path, {
    method: 'POST',
    headers: token ? authHeaders(token) : jsonHeaders(),
    body: JSON.stringify(body),
  });

const put = <T>(path: string, body: unknown, token?: string) =>
  request<T>(path, { method: 'PUT', headers: token ? authHeaders(token) : jsonHeaders(), body: JSON.stringify(body) });

const get = <T>(path: string, token?: string) =>
  request<T>(path, { headers: token ? authHeaders(token) : jsonHeaders() });

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  specialty: string | null;
  department: string | null;
  abhaId: string | null;
  abhaVerified: boolean;
  aadhaar: string | null;
  pan: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyContact: string | null;
  mustChangePassword: boolean;
}

// Auth API
export const apiAuth = {
  login: (email: string, password: string) =>
    post<{ token: string; user: RegisteredUser }>('/auth/login', { email, password }),

  register: (
    data: {
      email: string;
      password: string;
      name: string;
      role: string;
      consent: boolean;
      phone?: string;
      date_of_birth?: string;
      gender?: string;
      address?: string;
      emergency_contact?: string;
      blood_type?: string;
      abha_id?: string;
      abha_verification_token?: string;
      aadhaar?: string;
      pan?: string;
    },
    token?: string
  ) => post<{ token: string; user: RegisteredUser }>('/auth/register', data, token),

  me: (token: string) => get<{ user: RegisteredUser }>('/auth/me', token),

  forgotPassword: (data: {
    identifier: string;
    is_abha?: boolean;
    date_of_birth?: string;
    phone?: string;
  }) =>
    post<{ delivery: 'smtp' | 'sms' | 'console'; message: string; devCode?: string; warning?: string }>(
      '/auth/forgot-password',
      data
    ),

  resetPassword: (code: string, newPassword: string) =>
    post<{ message: string; email: string }>('/auth/reset-password', { code, new_password: newPassword }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    post<{ message: string }>(
      '/auth/change-password',
      { current_password: currentPassword, new_password: newPassword },
      token
    ),

  health: () => request<{ status: string; time: string }>('/health'),
};

// ABDM / ABHA API
export interface AbhaStatus {
  configured: boolean;
  environment: 'sandbox' | 'production';
  missing: string[];
  abhaBaseUrl: string;
  sessionUrl: string;
  note: string;
}

export interface AbhaChallenge {
  challengeId: string;
  maskedAbha?: string;
  expiresInSeconds: number;
  message: string;
}

export interface AbhaEnrollmentResult {
  abhaNumber: string;
  abhaAddress: string | null;
  name: string | null;
  isNew: boolean | null;
  verificationToken: string;
  expiresInSeconds: number;
}

export const apiAbha = {
  status: () => request<AbhaStatus>('/abha/status'),

  requestLoginOtp: (abhaNumber: string) =>
    post<AbhaChallenge>('/abha/login/request-otp', { abha_number: abhaNumber }),

  verifyLoginOtp: (challengeId: string, otp: string) =>
    post<{ token: string; user: RegisteredUser; abha: { verified: boolean; masked: string } }>(
      '/abha/login/verify',
      { challenge_id: challengeId, otp }
    ),

  requestEnrollmentOtp: (aadhaarNumber: string) =>
    post<AbhaChallenge>('/abha/enroll/request-otp', {
      aadhaar_number: aadhaarNumber,
      consent: true,
    }),

  verifyEnrollmentOtp: (challengeId: string, otp: string) =>
    post<AbhaEnrollmentResult>('/abha/enroll/verify', { challenge_id: challengeId, otp }),

  requestVerifyOtp: (abhaNumber: string) =>
    post<AbhaChallenge>('/abha/verify/request-otp', { abha_number: abhaNumber }),

  verifyExistingAbha: (challengeId: string, otp: string) =>
    post<AbhaEnrollmentResult>('/abha/verify/verify', { challenge_id: challengeId, otp }),

  requestLinkOtp: (token?: string, abhaNumber: string = '') => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('clinicops_token') || '' : '');
    return post<AbhaChallenge>('/abha/link/request-otp', { abha_number: abhaNumber }, activeToken);
  },

  verifyLinkOtp: (token: string | undefined, challengeId: string, otp: string) => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('clinicops_token') || '' : '');
    return post<{ user: RegisteredUser; abha: { verified: boolean; masked: string } }>(
      '/abha/link/verify',
      { challenge_id: challengeId, otp },
      activeToken
    );
  },
};

// Patients API
export const apiPatients = {
  getAll: (token: string, search: string = '', limit: number = 50, offset: number = 0) =>
    get<{ patients: any[]; total: number }>(
      `/patients?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`,
      token
    ),

  create: (token: string, data: any) => post<{ patient: any }>('/patients', data, token),
};

// Appointments API
export const apiAppointments = {
  getAll: (
    token: string,
    params?: { status?: string; date?: string; doctor_id?: string; patient_id?: string; type?: string }
  ) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).filter(([, value]) => Boolean(value)) as [string, string][]
    ).toString();
    return get<{ appointments: any[] }>(`/appointments${query ? `?${query}` : ''}`, token);
  },

  create: (token: string, data: any) => post<{ appointment: any; token?: string }>('/appointments', data, token),

  update: (token: string, id: string, data: any) =>
    put<{ appointment: any }>(`/appointments/${encodeURIComponent(id)}`, data, token),

  reschedule: (
    token: string,
    id: string,
    data: { appointment_date: string; appointment_time: string; notes?: string }
  ) => put<{ appointment: any }>(`/appointments/${encodeURIComponent(id)}/reschedule`, data, token),

  cancel: (token: string, id: string, reason?: string) =>
    put<{ message: string }>(`/appointments/${encodeURIComponent(id)}/cancel`, { reason }, token),
};

// Queue API
export const apiQueue = {
  getAll: (token: string, params?: { status?: string; doctor_id?: string; department?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).filter(([, value]) => Boolean(value)) as [string, string][]
    ).toString();
    return get<{ queue: any[] }>(`/queue${query ? `?${query}` : ''}`, token);
  },

  callNext: (token: string, doctor_id?: string) =>
    post<{ patient: any; sound: boolean }>('/queue/call-next', { doctor_id }, token),

  updateStatus: (token: string, id: string, status: string, notes?: string) =>
    put<{ queueItem: any }>(`/queue/${encodeURIComponent(id)}/status`, { status, notes }, token),

  requeue: (token: string, id: string, note?: string) =>
    post<{ success: boolean; queueItem: any; message?: string }>(`/queue/${encodeURIComponent(id)}/requeue`, { note }, token),

  callAgain: (token: string, id: string) =>
    post<{ success: boolean; patient: any; sound: boolean; message?: string }>(`/queue/${encodeURIComponent(id)}/call-again`, {}, token),

  move: (token: string, id: string, direction: 'up' | 'down' | 'top' | 'end') =>
    post<{ success: boolean; message?: string }>(`/queue/${encodeURIComponent(id)}/move`, { direction }, token),

  getAuditHistory: (token: string, queueId?: string) =>
    get<{ history: any[] }>(`/queue/audit-history${queueId ? `?queue_id=${encodeURIComponent(queueId)}` : ''}`, token),

  checkIn: (
    token: string,
    data: { patient_id: string; doctor_id?: string; appointment_id?: string; department?: string }
  ) => post<{ queueItem: any; token: string }>('/queue/check-in', data, token),
};

// Sequential Tokens API (Backed by atomic token_sequences and token_history)
export const apiTokens = {
  getNext: (token: string, department?: string, clinicId?: string) => {
    const q = new URLSearchParams();
    if (department) q.set('department', department);
    if (clinicId) q.set('clinic_id', clinicId);
    return get<{ token: string; number: number; prefix: string; department: string; clinic_id: string }>(
      `/tokens/next${q.toString() ? `?${q.toString()}` : ''}`,
      token
    );
  },

  getHistory: (token: string, date?: string) => {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    return get<{ history: any[] }>(`/tokens/history${q}`, token);
  },
};

// Consultations API
export const apiConsultations = {
  create: (token: string, data: any) => post<{ consultationId: string }>('/consultations', data, token),

  getByPatient: (token: string, patientId: string) =>
    get<{ consultations: any[] }>(`/consultations/patient/${encodeURIComponent(patientId)}`, token),
};

// Dashboard API
export const apiDashboard = {
  getStats: (token: string) => get<{ stats: any }>('/dashboard/stats', token),
};

// Research API
export const apiResearch = {
  getSaved: (token: string) => get<{ articles: any[] }>('/articles/saved', token),

  save: (token: string, data: any) => post<{ saved: boolean }>('/articles/save', data, token),
};

// Games API
export const apiGames = {
  getScores: (token: string, game_id?: string) =>
    get<{ scores: any[]; highScores: Record<string, number> }>(
      `/games/scores${game_id ? `?game_id=${encodeURIComponent(game_id)}` : ''}`,
      token
    ),

  saveScore: (token: string, data: any) => post<{ pointsEarned: number }>('/games/save-score', data, token),
};

// Learning API
export const apiLearning = {
  getProgress: (token: string) => get<{ progress: any[]; points: any }>('/learning/progress', token),

  completeLesson: (token: string, data: any) =>
    post<{ score: number; pointsEarned: number }>('/learning/complete-lesson', data, token),
};

// Text-to-Speech API (Project Vaani & Fallbacks)
export interface TtsStatusData {
  activeEngine: string;
  vaani: {
    model: string;
    architecture: string;
    samplingRate: number;
    languages: string[];
    isOnline: boolean;
    isModelLoaded: boolean;
    serviceUrl: string;
    requiresHfToken: boolean;
  };
  sarvam: {
    isConfigured: boolean;
    model: string;
  };
  webSpeechFallback: {
    available: boolean;
    voices: string[];
  };
  cacheStats: {
    entries: number;
    hits: number;
    misses: number;
  };
}

export interface TtsSynthesizeParams {
  text: string;
  language: 'en' | 'hi' | 'mr';
  speed?: number;
  voiceGender?: 'female' | 'male';
}

export interface TtsSynthesizeResult {
  audioBase64?: string;
  format?: string;
  engine: string;
  fromCache?: boolean;
  language?: string;
  useWebSpeech?: boolean;
  message?: string;
}

export const apiTts = {
  getStatus: () => get<TtsStatusData>('/tts/status'),
  synthesize: (data: TtsSynthesizeParams) => post<TtsSynthesizeResult>('/tts/synthesize', data),
};

