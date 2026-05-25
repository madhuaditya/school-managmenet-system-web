import apiClient from '../apiClient';
import { useAuthStore } from '../../stores/authStore';

const isSchoolAccount = () => useAuthStore.getState().authType === 'school';

export const staffService = {
  // Get all staff
  getStaff: async () => {
    const response = await apiClient.get(isSchoolAccount() ? '/api/school-management/staff' : '/api/auth/staff/all');
    return response.data;
  },

  // Get single staff
  getStaffMember: async (id) => {
    const response = await apiClient.get(isSchoolAccount() ? `/api/school-management/staff/${id}` : `/api/staff/${id}`);
    return response.data;
  },

  // Add staff
  addStaff: async (data) => {
    const response = await apiClient.post('/api/staff', data);
    return response.data;
  },

  // Update staff
  updateStaff: async (id, data) => {
    const response = await apiClient.put(isSchoolAccount() ? `/api/school-management/staff/${id}` : `/api/staff/${id}`, data);
    return response.data;
  },

  // Delete staff
  deleteStaff: async (id) => {
    const response = await apiClient.delete(isSchoolAccount() ? `/api/school-management/staff/${id}` : `/api/staff/${id}`);
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
