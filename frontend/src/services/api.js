import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', response.status, response.config.url, response.data);
    }
    
    return response;
  },
  (error) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      error.response = {
        data: {
          error: 'Network Error',
          message: 'Unable to connect to the server. Please check your internet connection.'
        }
      };
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    profile: '/api/auth/profile',
    changePassword: '/api/auth/change-password',
    logout: '/api/auth/logout',
  },
  
  // Users
  users: {
    list: '/api/users',
    get: (id) => `/api/users/${id}`,
    update: (id) => `/api/users/${id}`,
    delete: (id) => `/api/users/${id}`,
  },
  
  // Projects
  projects: {
    list: '/api/projects',
    create: '/api/projects',
    get: (id) => `/api/projects/${id}`,
    update: (id) => `/api/projects/${id}`,
    delete: (id) => `/api/projects/${id}`,
    join: (id) => `/api/projects/${id}/join`,
    leave: (id) => `/api/projects/${id}/leave`,
  },
  
  // Matching
  matching: {
    request: '/api/matching/request',
    quickMatch: '/api/matching/quick-match',
    suggestions: '/api/matching/suggestions',
    respond: '/api/matching/respond',
  },
  
  // Chat
  chat: {
    get: (projectId) => `/api/chat/${projectId}`,
    send: (projectId) => `/api/chat/${projectId}`,
  },
  
  // Files
  files: {
    upload: '/api/files/upload',
    get: (projectId) => `/api/files/${projectId}`,
    download: (fileId) => `/api/files/${fileId}/download`,
    delete: (fileId) => `/api/files/${fileId}`,
  },
  
  // Notifications
  notifications: {
    list: '/api/notifications',
    markRead: (id) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/mark-all-read',
  },
};

// Helper functions for common API operations
export const apiHelpers = {
  // Get request with error handling
  async get(url, config = {}) {
    try {
      const response = await api.get(url, config);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  // Post request with error handling
  async post(url, data = {}, config = {}) {
    try {
      const response = await api.post(url, data, config);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  // Put request with error handling
  async put(url, data = {}, config = {}) {
    try {
      const response = await api.put(url, data, config);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  // Delete request with error handling
  async delete(url, config = {}) {
    try {
      const response = await api.delete(url, config);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  // Upload file with progress tracking
  async uploadFile(url, file, onProgress, config = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

// Export the axios instance
export default api;
