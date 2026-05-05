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
  getClassAttendance: async (classId, filters = {}) => {
    const queryString = new URLSearchParams({ classId, ...filters }).toString();
    const response = await apiClient.get(`/api/attendance/class?${queryString}`);
    return response.data;
  },

  // Class attendance dashboard summary
  getClassDashboardSummary: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/attendance/dashboard/summary?${queryString}`);
    return response.data;
  },

  // Class attendance dashboard matrix
  getClassDashboardMatrix: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/attendance/dashboard/matrix?${queryString}`);
    return response.data;
  },

  // Class attendance dashboard trend
  getClassDashboardTrend: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/attendance/dashboard/trend?${queryString}`);
    return response.data;
  },

  // Class attendance status distribution
  getClassDashboardStatusBreakdown: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/attendance/dashboard/status-breakdown?${queryString}`);
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

  // Get today's attendance for all students in a class
  getTodayClassAttendance: async (classId) => {
    const response = await apiClient.get(`/api/attendance/today/class/${classId}`);
    return response.data;
  },

  // Get today's attendance for all users of a specific role in school
  getTodayAttendanceByRole: async (role) => {
    const response = await apiClient.get(`/api/attendance/today/role/${role}`);
    return response.data;
  },

  // Bulk mark/update attendance for multiple users
  bulkMarkAttendance: async (records, date) => {
    const response = await apiClient.post('/api/attendance/bulk-mark', {
      records,
      date: date || new Date().toISOString().split('T')[0],
    });
    return response.data;
  },
};

export default attendanceService;
