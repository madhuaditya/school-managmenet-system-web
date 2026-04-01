import apiClient from '../apiClient';

export const progressService = {
  // Get all progress records
  getProgress: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/progress?${queryString}`);
    return response.data;
  },

  // Get single student progress
  getStudentProgress: async (studentId) => {
    const response = await apiClient.get(`/api/progress/student/${studentId}`);
    return response.data;
  },

  // Get single progress record by ID
  getProgressById: async (id) => {
    const response = await apiClient.get(`/api/progress/${id}`);
    return response.data;
  },

  // Create new progress record
  createProgress: async (data) => {
    const response = await apiClient.post(`/api/progress/create`, data);
    return response.data;
  },

  // Create/Update progress
  upsertProgress: async (studentId, data) => {
    const response = await apiClient.put(`/api/progress`, { studentId, ...data });
    return response.data;
  },

  // Update progress record
  updateProgress: async (id, data) => {
    const response = await apiClient.put(`/api/progress/${id}`, data);
    return response.data;
  },

  // Delete progress record
  deleteProgress: async (id) => {
    const response = await apiClient.delete(`/api/progress/${id}`);
    return response.data;
  },

  // Get valid subjects for a student
  getValidSubjectsForStudent: async (studentId) => {
    const response = await apiClient.get(`/api/progress/valid-subjects/${studentId}`);
    return response.data;
  },

  // Download performance report card
  downloadReport: async (studentId, type = 'advanced', academicYear) => {
    const response = await apiClient.get(`/api/progress/report-card-cbsc/${studentId}?type=${type}&academicYear=${academicYear}`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default progressService;
