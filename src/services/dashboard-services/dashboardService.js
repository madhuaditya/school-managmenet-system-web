import apiClient from '../apiClient';
import { useAuthStore } from '../../stores/authStore';

const isSchoolAccount = () => useAuthStore.getState().authType === 'school';

export const dashboardService = {
  // Get overview statistics
  getOverview: async (schoolId) => {
    const response = await apiClient.get(`/api/dashboard/overview`);
    return response.data;
  },

  // Get profile
  getProfile: async () => {
    const response = await apiClient.get(isSchoolAccount() ? '/api/auth/school/me' : '/api/profile/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await apiClient.put(isSchoolAccount() ? '/api/auth/school/me' : '/api/profile/me', data);
    return response.data;
  },

  uploadSchoolLogo: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.put('/api/auth/school/me/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadSchoolIdCardLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await apiClient.put('/api/auth/school/me/id-card-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadSchoolPrincipalSignature: async (file) => {
    const formData = new FormData();
    formData.append('signature', file);
    const response = await apiClient.put('/api/auth/school/me/principal-signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default dashboardService;
