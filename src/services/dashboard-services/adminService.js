import apiClient from '../apiClient';

export const adminService = {
  // Get all admins
  getAdmins: async () => {
    const response = await apiClient.get('/api/auth/admin/all');
    return response.data;
  },

  // Get single admin
  getAdmin: async (id) => {
    const response = await apiClient.get(`/api/admin/${id}`);
    return response.data;
  },

  // Add admin
  addAdmin: async (data) => {
    const response = await apiClient.post('/api/admin', data);
    return response.data;
  },

  // Update admin
  updateAdmin: async (id, data) => {
    const response = await apiClient.put(`/api/admin/${id}`, data);
    return response.data;
  },

  // Delete admin
  deleteAdmin: async (id) => {
    const response = await apiClient.delete(`/api/admin/${id}`);
    return response.data;
  },

  // Assign subject to admin
  assignSubject: async (adminId, subjectId) => {
    const response = await apiClient.put(`/api/admin/${adminId}/assign-subject`, {
      subjectId,
    });
    return response.data;
  },

  // Mark admin attendance
  markAttendance: async (id, data) => {
    const response = await apiClient.post(`/api/attendance/mark`, { userId: id, ...data });
    return response.data;
  },
};

export default adminService;
