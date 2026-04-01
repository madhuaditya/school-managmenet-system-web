import apiClient from '../apiClient';

export const feeManagementService = {
  // Create fee record
  createFeeRecord: async (data) => {
    const response = await apiClient.post('/api/fee-management/record/create', data);
    return response.data;
  },

  // Update fee record
  updateFeeRecord: async (id, data) => {
    const response = await apiClient.put(`/api/fee-management/record/${id}`, data);
    return response.data;
  },

  // Delete fee record
  deleteFeeRecord: async (id) => {
    const response = await apiClient.delete(`/api/fee-management/record/${id}`);
    return response.data;
  },

  // Get student fee records
  getStudentAllFees: async ({ studentId, page = 1, limit = 20 }) => {
    const response = await apiClient.get(`/api/fee-management/record/student/${studentId}/all`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Get student fee by month and year
  getStudentFeeByMonthYear: async ({ studentId, month, year }) => {
    const response = await apiClient.get(`/api/fee-management/record/student/${studentId}/month/${month}/${year}`);
    return response.data;
  },

  // Create payment for a fee record
  createPayment: async (data) => {
    const response = await apiClient.post('/api/fee-management/payment/create', data);
    return response.data;
  },

  // Get payments for a fee record
  getPaymentsByFeeRecord: async ({ feeRecordId, page = 1, limit = 20 }) => {
    const response = await apiClient.get(`/api/fee-management/payment/${feeRecordId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Get student payment history
  getStudentPaymentHistory: async ({ studentId, page = 1, limit = 20 }) => {
    const response = await apiClient.get(`/api/fee-management/payment/student/${studentId}/history`, {
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

  // Get yearly fee matrix for a class
  getYearlyFeeMatrix: async ({ classId, year }) => {
    const response = await apiClient.get('/api/fee-management/analytics/yearly', {
      params: { classId, year },
    });
    return response.data;
  },
};

export default feeManagementService;
