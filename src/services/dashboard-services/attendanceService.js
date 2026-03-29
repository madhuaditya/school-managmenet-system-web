import apiClient from '../apiClient';

export const attendanceService = {
  // Mark attendance
  markAttendance: async (data) => {
    const response = await apiClient.post('/api/attendance/mark', data);
    return response.data;
  },

  // Get attendance
  getAttendance: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/attendance?${queryString}`);
    return response.data;
  },

  // Get class attendance report
  getClassAttendance: async (classId) => {
    const response = await apiClient.get(`/api/attendance/class/${classId}`);
    return response.data;
  },

  // Get staff attendance
  getStaffAttendance: async (staffId) => {
    const response = await apiClient.get(`/api/attendance?userId=${staffId}`);
    return response.data;
  },

  // Get teacher attendance
  getTeacherAttendance: async (teacherId) => {
    const response = await apiClient.get(`/api/attendance?userId=${teacherId}`);
    return response.data;
  },

  // Update attendance
  updateAttendance: async (data) => {
    const response = await apiClient.post('/api/attendance/update', data);
    return response.data;
  },

  // Get today's attendance
  getTodayAttendance: async (userId) => {
    const response = await apiClient.get(`/api/attendance/get-today/${userId}`);
    return response.data;
  },
};

export default attendanceService;
