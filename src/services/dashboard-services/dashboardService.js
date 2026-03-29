import apiClient from '../apiClient';

export const dashboardService = {
  // Get overview statistics
  getOverview: async (schoolId) => {
    const response = await apiClient.get(`/api/dashboard/overview`);
    return response.data;
  },

  // Get profile
  getProfile: async () => {
    const response = await apiClient.get('/api/profile/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await apiClient.put('/api/profile/me', data);
    return response.data;
  },
};

export default dashboardService;
