import apiClient from '../apiClient';

export const alertService = {
  // Create alert for a user (admin only)
  createAlert: async (data) => {
    const response = await apiClient.post('/api/alert/create', data);
    return response.data;
  },

  // Get current user's unviewed alerts
  getUnviewedAlerts: async () => {
    const response = await apiClient.get('/api/alert/unviewed');
    return response.data;
  },

  // Mark a specific alert as viewed
  markAsViewed: async (alertId) => {
    const response = await apiClient.put(`/api/alert/${alertId}/mark-viewed`);
    return response.data;
  },
};

export default alertService;
