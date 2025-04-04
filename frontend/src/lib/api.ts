import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to login page if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  validateEmail: (email: string) => api.get(`/auth/validate-email?email=${email}`),
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh', { refreshToken }),
};

// Plan API calls
export const planAPI = {
  startPlan: (planData: any) => api.post('/plans/start', planData),
  updateQuestionnaire: (id: string, data: any) => 
    api.post(`/plans/${id}/questionnaire`, data),
  uploadLabResults: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/plans/${id}/lab-results`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateTCM: (id: string, data: any) => api.post(`/plans/${id}/tcm`, data),
  updateTimeline: (id: string, data: any) => api.post(`/plans/${id}/timeline`, data),
  updateIFMMatrix: (id: string, data: any) => api.post(`/plans/${id}/ifm-matrix`, data),
  updateFinalPlan: (id: string, data: any) => api.post(`/plans/${id}/final`, data),
  generatePlan: (id: string) => api.post(`/plans/${id}/generate`),
  exportPlan: (id: string, format = 'pdf') => 
    api.get(`/plans/${id}/export?format=${format}`),
  getUserPlans: () => api.get('/plans'),
  getPlanById: (id: string) => api.get(`/plans/${id}`),
};

// Admin API calls
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Companies
  getCompanies: () => api.get('/admin/companies'),
  getCompanyById: (id: string) => api.get(`/admin/companies/${id}`),
  createCompany: (data: any) => api.post('/admin/companies', data),
  updateCompany: (id: string, data: any) => api.put(`/admin/companies/${id}`, data),
  deleteCompany: (id: string) => api.delete(`/admin/companies/${id}`),
  
  // Users
  getUsers: (companyId?: string) => 
    api.get(`/admin/users${companyId ? `?company_id=${companyId}` : ''}`),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  // Prompts
  getPrompts: () => api.get('/admin/prompts'),
  getPromptById: (id: string) => api.get(`/admin/prompts/${id}`),
  updatePrompt: (id: string, data: any) => api.put(`/admin/prompts/${id}`, data),
  
  // Token usage
  getTokenUsage: (params: any = {}) => 
    api.get('/admin/tokens/usage', { params }),
};

export default api;
