import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1', // configured via Vite env; fallback matches current backend port
  withCredentials: true, // send cookies for auth if backend sets them
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Simple pass-through response handling (no refresh flow configured)
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
