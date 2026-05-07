import axios from 'axios';

const baseURL = new String(import.meta.env.VITE_BACKEND_URL || 'https://school-project-backend-lwzb.onrender.com').replace(/\/+$/, '');

console.log('API Client initialized with baseURL:', baseURL);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://school-project-backend-lwzb.onrender.com';

const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 18000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  try {
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

export default apiClient;
