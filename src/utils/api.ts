const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function for API calls with proper error handling
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json();
  
  if (!response.ok) {
    return {
      success: false,
      error: data.error || `Request failed with status ${response.status}`
    };
  }
  
  return {
    success: true,
    data
  };
}

// Helper to get auth headers
function getAuthHeaders(token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Auth API
export const apiAuth = {
  login: async (identifier: string, password: string, isAbha: boolean = false): Promise<ApiResponse<{ token: string; user: any }>> => {
    const payload = isAbha ? { abha_id: identifier, password } : { email: identifier, password };
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
  
  register: async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
    specialty?: string;
    department?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    emergency_contact?: string;
    blood_type?: string;
    abha_id?: string;
    aadhaar?: string;
    pan?: string;
  }): Promise<ApiResponse<{ token: string; user: any }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  
  me: async (token: string): Promise<ApiResponse<{ user: any }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },

  resetPassword: async (identifier: string, newPassword: string, isAbha: boolean = false): Promise<ApiResponse<{ message: string; email: string }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, new_password: newPassword, is_abha: isAbha }),
    });
    return handleResponse(response);
  },
};

// Patients API
export const apiPatients = {
  getAll: async (token: string, search: string = '', limit: number = 50, offset: number = 0): Promise<ApiResponse<{ patients: any[]; total: number }>> => {
    const response = await fetch(`${API_BASE_URL}/patients?search=${search}&limit=${limit}&offset=${offset}`, {
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
  
  create: async (token: string, data: any): Promise<ApiResponse<{ patient: any }>> => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// Appointments API
export const apiAppointments = {
  getAll: async (token: string, params?: {
    status?: string;
    date?: string;
    doctor_id?: string;
    patient_id?: string;
    type?: string;
  }): Promise<ApiResponse<{ appointments: any[] }>> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/appointments?${query}`, {
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
  
  create: async (token: string, data: any): Promise<ApiResponse<{ appointment: any; token?: string }>> => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  
  update: async (token: string, id: string, data: any): Promise<ApiResponse<{ appointment: any }>> => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  reschedule: async (token: string, id: string, data: { appointment_date: string; appointment_time: string; notes?: string }): Promise<ApiResponse<{ appointment: any }>> => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/reschedule`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  cancel: async (token: string, id: string, reason?: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },
};

// Queue API
export const apiQueue = {
  getAll: async (token: string, params?: {
    status?: string;
    doctor_id?: string;
    department?: string;
  }): Promise<ApiResponse<{ queue: any[] }>> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/queue?${query}`, {
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
  
  callNext: async (token: string, doctor_id?: string): Promise<ApiResponse<{ patient: any; sound: boolean }>> => {
    const response = await fetch(`${API_BASE_URL}/queue/call-next`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ doctor_id }),
    });
    return handleResponse(response);
  },
  
  updateStatus: async (token: string, id: string, status: string): Promise<ApiResponse<{ queueItem: any }>> => {
    const response = await fetch(`${API_BASE_URL}/queue/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  checkIn: async (token: string, data: { patient_id: string; doctor_id?: string; appointment_id?: string; department?: string }): Promise<ApiResponse<{ queueItem: any; token: string }>> => {
    const response = await fetch(`${API_BASE_URL}/queue/check-in`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// Consultations API
export const apiConsultations = {
  create: async (token: string, data: any): Promise<ApiResponse<{ consultationId: string }>> => {
    const response = await fetch(`${API_BASE_URL}/consultations`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getByPatient: async (token: string, patientId: string): Promise<ApiResponse<{ consultations: any[] }>> => {
    const response = await fetch(`${API_BASE_URL}/consultations/patient/${patientId}`, {
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
};

// Dashboard API
export const apiDashboard = {
  getStats: async (token: string): Promise<ApiResponse<{ stats: any }>> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
};

// Research API
export const apiResearch = {
  getSaved: async (token: string): Promise<ApiResponse<{ articles: any[] }>> => {
    const response = await fetch(`${API_BASE_URL}/articles/saved`, {
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
  
  save: async (token: string, data: any): Promise<ApiResponse<{ saved: boolean }>> => {
    const response = await fetch(`${API_BASE_URL}/articles/save`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// Games API
export const apiGames = {
  getScores: async (token: string, game_id?: string): Promise<ApiResponse<{ scores: any[]; highScores: any }>> => {
    const query = game_id ? `?game_id=${game_id}` : '';
    const response = await fetch(`${API_BASE_URL}/games/scores${query}`, {
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
  
  saveScore: async (token: string, data: any): Promise<ApiResponse<{ pointsEarned: number }>> => {
    const response = await fetch(`${API_BASE_URL}/games/save-score`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// Learning API
export const apiLearning = {
  getProgress: async (token: string): Promise<ApiResponse<{ progress: any[]; points: any }>> => {
    const response = await fetch(`${API_BASE_URL}/learning/progress`, {
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
  
  completeLesson: async (token: string, data: any): Promise<ApiResponse<{ score: number }>> => {
    const response = await fetch(`${API_BASE_URL}/learning/complete-lesson`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};