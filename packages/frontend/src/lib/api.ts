import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const apiClient = {
  // Auth
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
      api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
  },

  // Tenants
  tenants: {
    getCurrent: () => api.get('/tenants/current'),
  },

  // Profile
  profile: {
    get: () => api.get('/profile'),
    create: (data: any) => api.post('/profile', data),
    update: (data: any) => api.put('/profile', data),
  },

  // Plans
  plans: {
    getAll: () => api.get('/plans'),
    getById: (id: string) => api.get(`/plans/${id}`),
    generate: (data: any) => api.post('/plans/generate', data),
    generateSync: (data: any) => api.post('/plans/generate-sync', data),
    completeSession: (planId: string, sessionId: string, feedback: any) =>
      api.patch(`/plans/${planId}/sessions/${sessionId}/complete`, feedback),
    updateStatus: (id: string, status: string) =>
      api.patch(`/plans/${id}/status`, { status }),
  },

  // Templates
  templates: {
    getAll: () => api.get('/templates'),
    getById: (id: string) => api.get(`/templates/${id}`),
    create: (data: any) => api.post('/templates', data),
    update: (id: string, data: any) => api.put(`/templates/${id}`, data),
    delete: (id: string) => api.delete(`/templates/${id}`),
  },

  // Exercises
  exercises: {
    getAll: (filters?: any) => api.get('/exercises', { params: filters }),
    getById: (id: string) => api.get(`/exercises/${id}`),
    create: (data: any) => api.post('/exercises', data),
    update: (id: string, data: any) => api.put(`/exercises/${id}`, data),
    delete: (id: string) => api.delete(`/exercises/${id}`),
  },

  // Subscriptions
  subscriptions: {
    getCurrent: () => api.get('/subscriptions/current'),
    createCheckout: (data: { planTier: string }) =>
      api.post('/subscriptions/checkout', data),
  },
};
