import apiClient from '../apiClient';

export const leaveService = {
  applyLeave: async (data) => {
    const response = await apiClient.post('/api/leave/apply', data);
    return response.data;
  },

  getMyLeaves: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/leave/my?${queryString}`);
    return response.data;
  },

  deleteMyLeave: async (leaveId) => {
    const response = await apiClient.delete(`/api/leave/my/${leaveId}`);
    return response.data;
  },

  getAdminLeaves: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/leave/admin?${queryString}`);
    return response.data;
  },

  reviewLeave: async (leaveId, data) => {
    const response = await apiClient.patch(`/api/leave/admin/${leaveId}/review`, data);
    return response.data;
  },
};

export default leaveService;
