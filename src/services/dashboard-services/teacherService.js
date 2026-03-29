import apiClient from '../apiClient';

export const teacherService = {
  // Get all teachers
  getTeachers: async () => {
    const response = await apiClient.get('/api/teacher/all');
    return response.data;
  },

  // Get single teacher
  getTeacher: async (id) => {
    const response = await apiClient.get(`/api/teacher/${id}`);
    return response.data;
  },

  // Add teacher
  addTeacher: async (data) => {
    const response = await apiClient.post('/api/teacher', data);
    return response.data;
  },

  // Update teacher
  updateTeacher: async (id, data) => {
    const response = await apiClient.put(`/api/teacher/${id}`, data);
    return response.data;
  },

  // Delete teacher
  deleteTeacher: async (id) => {
    const response = await apiClient.delete(`/api/teacher/${id}`);
    return response.data;
  },

  // Assign subject to teacher
  assignSubject: async (teacherId, subjectId) => {
    const response = await apiClient.put(`/api/teacher/${teacherId}/assign-subject`, {
      subjectId,
    });
    return response.data;
  },

  // Mark teacher attendance
  markAttendance: async (id, data) => {
    const response = await apiClient.post(`/api/attendance/mark`, { userId: id, ...data });
    return response.data;
  },
};

export default teacherService;
