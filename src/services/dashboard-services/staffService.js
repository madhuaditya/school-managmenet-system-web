import apiClient from '../apiClient';

export const staffService = {
  // Get all staff
  getStaff: async () => {
    const response = await apiClient.get('/api/auth/staff/all');
    return response.data;
  },

  // Get single staff
  getStaffMember: async (id) => {
    const response = await apiClient.get(`/api/staff/${id}`);
    return response.data;
  },

  // Add staff
  addStaff: async (data) => {
    const response = await apiClient.post('/api/staff', data);
    return response.data;
  },

  // Update staff
  updateStaff: async (id, data) => {
    const response = await apiClient.put(`/api/staff/${id}`, data);
    return response.data;
  },

  // Delete staff
  deleteStaff: async (id) => {
    const response = await apiClient.delete(`/api/staff/${id}`);
    return response.data;
  },

  // Mark staff attendance
  markAttendance: async (id, data) => {
    const response = await apiClient.post(`/api/attendance/mark`, { userId: id, ...data });
    return response.data;
  },

  // Get staff attendance
  getAttendance: async (id) => {
    const response = await apiClient.get(`/api/attendance?userId=${id}`);
    return response.data;
  },
};

export default staffService;
