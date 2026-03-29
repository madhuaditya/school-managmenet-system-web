import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  try {
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
