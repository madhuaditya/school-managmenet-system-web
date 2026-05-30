import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const baseURL = new String(import.meta.env.VITE_BACKEND_URL || 'https://school-project-backend-lwzb.onrender.com').replace(/\/+$/, '');

console.log('API Client initialized with baseURL:', baseURL);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://school-project-backend-lwzb.onrender.com';

const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 36000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  try {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers?.set) {
        config.headers.set('Content-Type', null);
      } else if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    // console.log('API Client initialized with baseURL:', baseURL);
    const rawStore = localStorage.getItem('school-web-auth-store');
    if (!rawStore) return config;

    const parsedStore = JSON.parse(rawStore);
    const accessToken = parsedStore?.state?.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch {
    // Keep request intact if storage parsing fails.
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 444) {
      try {
        useAuthStore.getState().clearAuthData?.();
      } catch {
        try {
          localStorage.removeItem('school-web-auth-store');
        } catch {
          // Ignore cleanup failures.
        }
      }

      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
