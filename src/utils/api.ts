const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth API
export const apiAuth = {
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },
  
  register: async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
    specialty?: string;
    department?: string;
  }): Promise<ApiResponse<{ token: string; user: any }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  me: async (token: string): Promise<ApiResponse<{ user: any }>> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
};

// Patients API
export const apiPatients = {
  getAll: async (token: string, search: string = '', limit: number = 50, offset: number = 0): Promise<ApiResponse<{ patients: any[]; total: number }>> => {
    const response = await fetch(`${API_BASE_URL}/patients?search=${search}&limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  
  create: async (token: string, data: any): Promise<ApiResponse<{ patient: any }>> => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return response.json();
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
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  
  create: async (token: string, data: any): Promise<ApiResponse<{ appointment: any }>> => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  update: async (token: string, id: string, data: any): Promise<ApiResponse<{ appointment: any }>> => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return response.json();
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
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  
  callNext: async (token: string, doctor_id?: string): Promise<ApiResponse<{ patient: any; sound: boolean }>> => {
    const response = await fetch(`${API_BASE_URL}/queue/call-next`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ doctor_id }),
    });
    return response.json();
  },
  
  updateStatus: async (token: string, id: string, status: string): Promise<ApiResponse<{ queueItem: any }>> => {
    const response = await fetch(`${API_BASE_URL}/queue/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },
};

// Dashboard API
export const apiDashboard = {
  getStats: async (token: string): Promise<ApiResponse<{ stats: any }>> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
};

// Research API
export const apiResearch = {
  getSaved: async (token: string): Promise<ApiResponse<{ articles: any[] }>> => {
    const response = await fetch(`${API_BASE_URL}/articles/saved`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  
  save: async (token: string, data: any): Promise<ApiResponse<{ saved: boolean }>> => {
    const response = await fetch(`${API_BASE_URL}/articles/save`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Games API
export const apiGames = {
  getScores: async (token: string, game_id?: string): Promise<ApiResponse<{ scores: any[]; highScores: any }>> => {
    const query = game_id ? `?game_id=${game_id}` : '';
    const response = await fetch(`${API_BASE_URL}/games/scores${query}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  
  saveScore: async (token: string, data: any): Promise<ApiResponse<{ pointsEarned: number }>> => {
    const response = await fetch(`${API_BASE_URL}/games/save-score`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// Learning API
export const apiLearning = {
  getProgress: async (token: string): Promise<ApiResponse<{ progress: any[]; points: any }>> => {
    const response = await fetch(`${API_BASE_URL}/learning/progress`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
  
  completeLesson: async (token: string, data: any): Promise<ApiResponse<{ score: number }>> => {
    const response = await fetch(`${API_BASE_URL}/learning/complete-lesson`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};