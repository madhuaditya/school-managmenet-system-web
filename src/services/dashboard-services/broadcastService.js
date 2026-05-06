import apiClient from '../apiClient';

export const broadcastService = {
  previewRecipients: async (data) => {
    const response = await apiClient.post('/api/broadcast/preview-recipients', data);
    return response.data;
  },

  sendBroadcast: async (data) => {
    const response = await apiClient.post('/api/broadcast/send', data);
    return response.data;
  },

  getHistory: async () => {
    const response = await apiClient.get('/api/broadcast/history');
    return response.data;
  },

  getBroadcastById: async (broadcastId) => {
    const response = await apiClient.get(`/api/broadcast/${broadcastId}`);
    return response.data;
  },

  getDeliveries: async (broadcastId) => {
    const response = await apiClient.get(`/api/broadcast/${broadcastId}/deliveries`);
    return response.data;
  },
};

export default broadcastService;
