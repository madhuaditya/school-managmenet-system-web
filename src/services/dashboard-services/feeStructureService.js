import apiClient from '../apiClient';

export const feeStructureService = {
  // Get all fee structures in current school
  getAllFeeStructures: async () => {
    const response = await apiClient.get('/api/fee-structure/all');
    return response.data;
  },

  // Get fee structure by class id
  getFeeStructureByClass: async (classId) => {
    const response = await apiClient.get(`/api/fee-structure/class/${classId}`);
    return response.data;
  },

  // Get single fee structure by id
  getFeeStructureById: async (id) => {
    const response = await apiClient.get(`/api/fee-structure/${id}`);
    return response.data;
  },

  // Create fee structure
  createFeeStructure: async (data) => {
    const response = await apiClient.post('/api/fee-structure/create', data);
    return response.data;
  },

  // Update fee structure
  updateFeeStructure: async (id, data) => {
    const response = await apiClient.put(`/api/fee-structure/${id}`, data);
    return response.data;
  },
};

export default feeStructureService;
