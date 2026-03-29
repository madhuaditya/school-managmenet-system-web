import apiClient from '../apiClient';

export const studentService = {
  // Get all students
  getStudents: async () => {
    const response = await apiClient.get('/api/student');
    return response.data;
  },

  // Get single student
  getStudent: async (id) => {
    const response = await apiClient.get(`/api/student/${id}`);
    return response.data;
  },

  // Add student to class
  addStudent: async (data) => {
    const response = await apiClient.post('/api/student/add-to-class', data);
    return response.data;
  },

  // Update student
  updateStudent: async (id, data) => {
    const response = await apiClient.put(`/api/student/update/${id}`, data);
    return response.data;
  },

  // Remove student from class
  removeStudent: async (data) => {
    const response = await apiClient.post('/api/student/remove-from-class', data);
    return response.data;
  },

  // Update exam result
  updateExamResult: async (id, data) => {
    const response = await apiClient.put(`/api/progress`, { studentId: id, ...data });
    return response.data;
  },

  // Mark attendance
  markAttendance: async (id, data) => {
    const response = await apiClient.post(`/api/attendance/mark`, { userId: id, ...data });
    return response.data;
  },
};

export default studentService;
