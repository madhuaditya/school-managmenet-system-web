import apiClient from '../apiClient';

export const salaryStructureService = {
  // Get all salary structures in current school
  getAllSalaryStructures: async () => {
    const response = await apiClient.get('/api/salary-structure/all');
    return response.data;
  },

  // Get salary structure by role
  getSalaryStructureByRole: async (role) => {
    const response = await apiClient.get(`/api/salary-structure/role/${role}`);
    return response.data;
  },

  // Get single salary structure by id
  getSalaryStructureById: async (id) => {
    const response = await apiClient.get(`/api/salary-structure/${id}`);
    return response.data;
  },

  // Create salary structure
  createSalaryStructure: async (data) => {
    const response = await apiClient.post('/api/salary-structure/create', data);
    return response.data;
  },

  // Update salary structure
  updateSalaryStructure: async (id, data) => {
    const response = await apiClient.put(`/api/salary-structure/${id}`, data);
    return response.data;
  },

  // Delete salary structure
  deleteSalaryStructure: async (id) => {
    const response = await apiClient.delete(`/api/salary-structure/${id}`);
    return response.data;
  },
};

export default salaryStructureService;
