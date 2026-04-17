import apiClient from '../apiClient';

export const salaryManagementService = {
  // Legacy alias used by older screens that expect list-style records.
  getStaffAllSalaries: async ({ staffId, page = 1, limit = 50 }) => {
    const response = await apiClient.get(`/api/salary-management/summary/staff/${staffId}/history`, {
      params: { page, limit },
    });

    const payload = response.data || {};
    const list = Array.isArray(payload?.data?.records)
      ? payload.data.records
      : Array.isArray(payload?.data?.payments)
      ? payload.data.payments
      : Array.isArray(payload?.records)
      ? payload.records
      : Array.isArray(payload?.payments)
      ? payload.payments
      : [];

    const normalized = list.map((item) => {
      const paidAmount = Number(item?.paidAmount ?? item?.amount ?? 0);
      const expectedAmount = Number(item?.expectedAmount ?? item?.netSalary ?? item?.totalAmount ?? paidAmount);
      return {
        ...item,
        netSalary: Number(item?.netSalary ?? expectedAmount),
        paidAmount,
        status: item?.status || (paidAmount >= expectedAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING'),
      };
    });

    return {
      ...payload,
      success: payload?.success ?? true,
      data: {
        ...(payload?.data || {}),
        records: normalized,
      },
    };
  },

  // Get salary summary for a staff member by month and year
  getStaffSalaryByMonth: async ({ staffId, month, year }) => {
    const response = await apiClient.get(
      `/api/salary-management/summary/staff/${staffId}/month/${month}/${year}`
    );
    return response.data;
  },

  // Get monthly salary matrix for school
  getSalaryMatrixByMonth: async ({ month, year }) => {
    const response = await apiClient.get('/api/salary-management/analytics/matrix-month', {
      params: { month, year },
    });
    return response.data;
  },

  // Record salary payment
  recordSalaryPayment: async (data) => {
    const response = await apiClient.post('/api/salary-management/payment/create', data);
    return response.data;
  },

  // Get salary payment by id
  getSalaryPaymentById: async (id) => {
    const response = await apiClient.get(`/api/salary-management/payment/${id}`);
    return response.data;
  },

  // Delete salary payment by id
  deleteSalaryPayment: async (id) => {
    const response = await apiClient.delete(`/api/salary-management/payment/${id}`);
    return response.data;
  },

  // Get payment history for a staff member
  getStaffPaymentHistory: async ({ staffId, page = 1, limit = 50 }) => {
    const response = await apiClient.get(`/api/salary-management/summary/staff/${staffId}/history`, {
      params: { page, limit },
    });
    return response.data;
  },
};

export default salaryManagementService;
