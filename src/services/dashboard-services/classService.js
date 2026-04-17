import apiClient from '../apiClient';

export const classService = {
  // Get all classes
  getClasses: async () => {
    const response = await apiClient.get('/api/class/all');
    return response.data;
  },

  // Get single class
  getClass: async (id) => {
    const response = await apiClient.get(`/api/class/${id}`);
    return response.data;
  },

  // Create class
  createClass: async (data) => {
    const response = await apiClient.post('/api/class', data);
    return response.data;
  },

  // Update class
  updateClass: async (id, data) => {
    const response = await apiClient.put(`/api/class/${id}`, data);
    return response.data;
  },

  // Delete class
  deleteClass: async (id) => {
    const response = await apiClient.delete(`/api/class/${id}`);
    return response.data;
  },

  // Get class students
  getClassStudents: async (classId) => {
    try {
      const response = await apiClient.get(`/api/class/${classId}/students`);
      return response.data;
    } catch (error) {
      // Fallback for environments where the dedicated endpoint is not yet deployed.
      if (error?.response?.status !== 404) {
        throw error;
      }

      const classResponse = await apiClient.get(`/api/class/${classId}`);
      const payload = classResponse.data || {};
      const students = Array.isArray(payload?.data?.students) ? payload.data.students : [];

      return {
        ...payload,
        success: payload?.success ?? true,
        data: students,
      };
    }
  },

  // Get class attendance
  getClassAttendance: async (classId) => {
    const response = await apiClient.get(`/api/attendance/class/${classId}`);
    return response.data;
  },
};

export default classService;
