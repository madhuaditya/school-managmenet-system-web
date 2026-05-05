import apiClient from '../apiClient';

export const progressService = {
  // Get all progress records
  getProgress: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/progress?${queryString}`);
    return response.data;
  },

  // Get single student progress
  getStudentProgress: async (studentId, filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/progress/student/${studentId}${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  getStudentDashboardAnalytics: async (studentId, filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/progress/student-dashboard/${studentId}${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  getClassDashboardAnalytics: async (classId, filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/progress/class-dashboard/${classId}${queryString ? `?${queryString}` : ''}`);
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

  getReportHtml: async (studentId, type = 'advanced', academicYear) => {
    const endpointMap = {
      advanced: `/api/progress/advanced-report-html/${studentId}`,
      styled: `/api/progress/report-card-html/${studentId}`,
      cbse: `/api/progress/report-card-cbsc-html/${studentId}`,
    };

    const endpoint = endpointMap[type] || endpointMap.cbse;
    const queryString = new URLSearchParams({ academicYear }).toString();
    const response = await apiClient.get(`${endpoint}?${queryString}`);
    return response.data;
  },

  downloadCsvExport: async (studentId, filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/progress/export/csv/${studentId}${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob',
    });
    return response;
  },

  downloadExcelExport: async (studentId, filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/api/progress/export/excel/${studentId}${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default progressService;
