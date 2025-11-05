import axios from 'axios';

const BASE_URL = 'https://fluentfun.onrender.com/api/v1';

// Create axios instance with base URL
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
      // For other statuses, do not trigger global UI toasts; let callers handle.
    }
    // For timeouts or network errors, avoid global toasts to prevent duplicates; let callers decide.
    return Promise.reject(error);
  }
);

export default api;
