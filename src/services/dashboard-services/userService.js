import apiClient from '../apiClient';

export const userService = {
  registerUser: async (payload) => {
    const response = await apiClient.post('/api/auth/register', payload);
    return response.data;
  },

  getClasses: async () => {
    const response = await apiClient.get('/api/class/all');
    return response.data;
  },

  assignStudentToClass: async (studentId, classId) => {
    const response = await apiClient.post('/api/student/add-to-class', { studentId, classId });
    return response.data;
  },
};

export default userService;
