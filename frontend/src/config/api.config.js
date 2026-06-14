import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://fluentfun-backend.onrender.com/api/v1';

// Export base URL for components that use fetch instead of axios
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fluentfun-backend.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor - adds auth token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - handles errors & 401 redirects
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Unauthorized - clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
