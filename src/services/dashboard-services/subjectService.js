import apiClient from '../apiClient';

export const subjectService = {
  // Get all subjects
  getSubjects: async () => {
    const response = await apiClient.get('/api/subject/all');
    return response.data;
  },

  // Get single subject
  getSubject: async (id) => {
    const response = await apiClient.get(`/api/subject/${id}`);
    return response.data;
  },

  // Create subject
  createSubject: async (data) => {
    const response = await apiClient.post('/api/subject', data);
    return response.data;
  },

  // Update subject
  updateSubject: async (id, data) => {
    const response = await apiClient.put(`/api/subject/${id}`, data);
    return response.data;
  },

  // Delete subject
  deleteSubject: async (id) => {
    const response = await apiClient.delete(`/api/subject/${id}`);
    return response.data;
  },

  // Assign teacher to subject
  assignTeacher: async (subjectId, teacherId) => {
    const response = await apiClient.put(`/api/subject/${subjectId}`, { teacherId });
    return response.data;
  },
};

export default subjectService;
