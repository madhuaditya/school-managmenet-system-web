import apiClient from '../apiClient';

export const salaryManagementService = {
  // Get monthly salary matrix for school
  getSalaryMatrixByMonth: async ({ month, year }) => {
    const response = await apiClient.get('/api/salary-management/analytics/matrix-month', {
      params: { month, year },
    });
    return response.data;
  },

  // Get yearly salary matrix for a staff member
  getYearlySalaryMatrix: async ({ staffId, year }) => {
    const response = await apiClient.get('/api/salary-management/analytics/yearly', {
      params: { staffId, year },
    });
    return response.data;
  },

  // Get pending salary list
  getPendingSalaries: async ({ month, year }) => {
    const response = await apiClient.get('/api/salary-management/analytics/pending', {
      params: { month, year },
    });
    return response.data;
  },
};

export default salaryManagementService;
