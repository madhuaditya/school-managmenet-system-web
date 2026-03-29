import apiClient from '../apiClient';

export const noticeService = {
  // Get school valid notices
  getValidNotices: async () => {
    const response = await apiClient.get('/api/notice/valid');
    return response.data;
  },

  // Get all notices
  getNotices: async () => {
    const response = await apiClient.get('/api/notice');
    return response.data;
  },

  // Get single notice
  getNotice: async (id) => {
    const response = await apiClient.get(`/api/notice/${id}`);
    return response.data;
  },

  // Create notice
  createNotice: async (data) => {
    const response = await apiClient.post('/api/notice', data);
    return response.data;
  },

  // Update notice
  updateNotice: async (id, data) => {
    const response = await apiClient.put(`/api/notice/${id}`, data);
    return response.data;
  },

  // Delete notice
  deleteNotice: async (id) => {
    const response = await apiClient.delete(`/api/notice/${id}`);
    return response.data;
  },
};

export default noticeService;
