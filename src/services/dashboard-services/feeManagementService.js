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

  getPaymentSlipHtml: async (id) => {
    const response = await apiClient.get(`/api/fee-management/payment/${id}/slip-html`);
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

  // Get class-wise fee matrix for a year by aggregating 12 monthly calls
  getYearlyFeeMatrix: async ({ classId, year }) => {
    const months = Array.from({ length: 12 }, (_, index) => index + 1);

    const monthlyResults = await Promise.all(
      months.map(async (month) => {
        try {
          const response = await apiClient.get('/api/fee-management/analytics/class-wise', {
            params: { classId, month, year },
          });

          if (!response?.data?.success) {
            return {
              month,
              classId,
              className: '',
              totalStudents: 0,
              expectedAmount: 0,
              paidAmount: 0,
              dueAmount: 0,
              paidCount: 0,
              partialCount: 0,
              pendingCount: 0,
              records: [],
            };
          }

          return {
            month,
            ...(response.data.data || {}),
          };
        } catch {
          return {
            month,
            classId,
            className: '',
            totalStudents: 0,
            expectedAmount: 0,
            paidAmount: 0,
            dueAmount: 0,
            paidCount: 0,
            partialCount: 0,
            pendingCount: 0,
            records: [],
          };
        }
      })
    );

    const monthlyBreakdown = monthlyResults
      .map((item) => ({
        month: Number(item?.month || 0),
        classId: item?.classId || classId,
        className: item?.className || '',
        count: Number(item?.totalStudents || 0),
        totalFee: Number(item?.expectedAmount || 0),
        collected: Number(item?.paidAmount || 0),
        due: Number(item?.dueAmount || 0),
        paidCount: Number(item?.paidCount || 0),
        partialCount: Number(item?.partialCount || 0),
        pendingCount: Number(item?.pendingCount || 0),
      }))
      .sort((a, b) => a.month - b.month);

    const yearlyCollection = monthlyBreakdown.reduce((sum, item) => sum + item.collected, 0);
    const yearlyDue = monthlyBreakdown.reduce((sum, item) => sum + item.due, 0);
    const yearlyExpected = monthlyBreakdown.reduce((sum, item) => sum + item.totalFee, 0);

    return {
      success: true,
      msg: 'Yearly fee summary derived successfully',
      data: {
        classId,
        year: Number(year),
        monthlyBreakdown,
        yearlyExpected,
        yearlyCollection,
        yearlyDue,
      },
    };
  },

};

export default feeManagementService;
