import apiClient from '../apiClient';

export const feeManagementService = {
  // Get student fee summary by month and year
  getStudentFeeByMonthYear: async ({ studentId, month, year }) => {
    const response = await apiClient.get(
      `/api/fee-management/summary/student/${studentId}/month/${month}/${year}`
    );
    return response.data;
  },

  // Create payment for a fee record
  createPayment: async (data) => {
    const response = await apiClient.post('/api/fee-management/payment/create', data);
    return response.data;
  },

  // Get payment by id
  getPaymentById: async (id) => {
    const response = await apiClient.get(`/api/fee-management/payment/${id}`);
    return response.data;
  },

  // Delete payment by id
  deletePayment: async (id) => {
    const response = await apiClient.delete(`/api/fee-management/payment/${id}`);
    return response.data;
  },

  // Get student payment history
  getStudentPaymentHistory: async ({ studentId, page = 1, limit = 20 }) => {
    const response = await apiClient.get(`/api/fee-management/summary/student/${studentId}/history`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Get class-wise fee matrix for a month
  getClassWiseFeeMatrix: async ({ classId, month, year }) => {
    const response = await apiClient.get('/api/fee-management/analytics/class-wise', {
      params: { classId, month, year },
    });
    return response.data;
  },

  // Get school-wise fee matrix for a month
  getSchoolWiseFeeMatrix: async ({ month, year }) => {
    const response = await apiClient.get('/api/fee-management/analytics/school-wise', {
      params: { month, year },
    });
    return response.data;
  },

};

export default feeManagementService;
