import apiClient from '../apiClient';

const toDownloadBlob = async (response) => response;

export const downloadService = {
  getDownloadHistory: async () => {
    const response = await apiClient.get('/api/download/history');
    return response.data;
  },

  getDownloadLimits: async () => {
    const response = await apiClient.get('/api/download/limits');
    return response.data;
  },

  updateDownloadLimits: async (data) => {
    const response = await apiClient.put('/api/download/limits', data);
    return response.data;
  },

  exportData: async (payload) => {
    const response = await apiClient.post('/api/download/export', payload, {
      responseType: 'blob',
    });

    return toDownloadBlob(response);
  },
};

export default downloadService;
