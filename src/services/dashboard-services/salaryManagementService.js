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

  // Get staff-wise yearly salary matrix by aggregating 12 monthly summaries
  getYearlySalaryMatrix: async ({ staffId, year }) => {
    const months = Array.from({ length: 12 }, (_, index) => index + 1);

    const monthlyResults = await Promise.all(
      months.map(async (month) => {
        try {
          const response = await apiClient.get(
            `/api/salary-management/summary/staff/${staffId}/month/${month}/${year}`
          );

          if (!response?.data?.success) {
            return {
              month,
              year: Number(year),
              expectedAmount: 0,
              paidAmount: 0,
              dueAmount: 0,
              status: 'PENDING',
              paymentCount: 0,
            };
          }

          return {
            month,
            ...(response.data.data || {}),
          };
        } catch {
          return {
            month,
            year: Number(year),
            expectedAmount: 0,
            paidAmount: 0,
            dueAmount: 0,
            status: 'PENDING',
            paymentCount: 0,
          };
        }
      })
    );

    const monthlyBreakdown = monthlyResults
      .map((item) => ({
        month: Number(item?.month || 0),
        expectedAmount: Number(item?.expectedAmount || 0),
        paidAmount: Number(item?.paidAmount || 0),
        dueAmount: Number(item?.dueAmount || 0),
        status: item?.status || 'PENDING',
        paymentCount: Number(item?.paymentCount || 0),
      }))
      .sort((a, b) => a.month - b.month);

    const yearlyPayable = monthlyBreakdown.reduce((sum, item) => sum + item.expectedAmount, 0);
    const yearlyPaid = monthlyBreakdown.reduce((sum, item) => sum + item.paidAmount, 0);
    const yearlyPending = monthlyBreakdown.reduce((sum, item) => sum + item.dueAmount, 0);

    return {
      success: true,
      msg: 'Yearly salary matrix derived successfully',
      data: {
        staffId,
        year: Number(year),
        monthlyBreakdown,
        yearlyPayable,
        yearlyPaid,
        yearlyPending,
      },
    };
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

  getSalaryPaymentSlipHtml: async (id) => {
    const response = await apiClient.get(`/api/salary-management/payment/${id}/slip-html`);
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
