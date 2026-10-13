import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      // If served directly by backend on 5000, use relative '/api'
      if (window.location.port === '5000') {
        return '/api';
      }
      return 'http://localhost:5000/api';
    }
  }
  // Production / Remote relative path
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
