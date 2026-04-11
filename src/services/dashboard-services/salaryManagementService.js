import apiClient from '../apiClient';

export const salaryManagementService = {
  // Get all salary records of a staff member
  getStaffAllSalaries: async ({ staffId, page = 1, limit = 50 }) => {
    const response = await apiClient.get(`/api/salary-management/record/staff/${staffId}/all`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Get salary record for a staff member by month and year
  getStaffSalaryByMonth: async ({ staffId, month, year }) => {
    const response = await apiClient.get(
      `/api/salary-management/record/staff/${staffId}/month/${month}/${year}`
    );
    return response.data;
  },

  // Get salary record by id
  getSalaryRecordById: async (id) => {
    const response = await apiClient.get(`/api/salary-management/record/${id}`);
    return response.data;
  },

  // Create salary record
  createSalaryRecord: async (data) => {
    const response = await apiClient.post('/api/salary-management/record/create', data);
    return response.data;
  },

  // Update salary record
  updateSalaryRecord: async (id, data) => {
    const response = await apiClient.put(`/api/salary-management/record/${id}`, data);
    return response.data;
  },

  // Delete salary record
  deleteSalaryRecord: async (id) => {
    const response = await apiClient.delete(`/api/salary-management/record/${id}`);
    return response.data;
  },

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

  // Record salary payment
  recordSalaryPayment: async (data) => {
    const response = await apiClient.post('/api/salary-management/payment/create', data);
    return response.data;
  },

  // Get all payments for a salary record
  getSalaryPaymentsByRecord: async ({ salaryRecordId, page = 1, limit = 50 }) => {
    const response = await apiClient.get(`/api/salary-management/payment/${salaryRecordId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Get payment history for a staff member
  getStaffPaymentHistory: async ({ staffId, page = 1, limit = 50 }) => {
    const response = await apiClient.get(`/api/salary-management/payment/staff/${staffId}/history`, {
      params: { page, limit },
    });
    return response.data;
  },
};

export default salaryManagementService;
