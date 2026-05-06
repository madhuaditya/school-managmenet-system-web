import apiClient from '../apiClient';

export const subjectService = {
  // Get subject dashboard summary
  getSubjectDashboard: async () => {
    const response = await apiClient.get('/api/subject/dashboard');
    return response.data;
  },

  // Get subjects by class
  getSubjectsByClass: async (classId) => {
    const response = await apiClient.get(`/api/subject/class/${classId}`);
    return response.data;
  },

  // Get all subjects
  getSubjects: async () => {
    const response = await apiClient.get('/api/subject/all');
    return response.data;
  },

  // Get subject details for dashboard
  getSubjectDetails: async (subjectId, academicYear) => {
    const query = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
    const response = await apiClient.get(`/api/subject/${subjectId}/details${query}`);
    return response.data;
  },

  // Create subject
  createSubject: async (data) => {
    const response = await apiClient.post('/api/subject/create', data);
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

  // Get a single subject list entry by id via dashboard data when needed
  getSubject: async (id, academicYear) => subjectService.getSubjectDetails(id, academicYear),

  // Assign teacher to subject
  assignTeacher: async (subjectId, teacherId) => {
    const response = await apiClient.put(`/api/subject/${subjectId}`, { teacherId });
    return response.data;
  },
};

export default subjectService;
