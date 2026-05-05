import apiClient from '../apiClient';

export const examService = {
  // Get all exams with filters
  getExams: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(
      `/api/exam${queryString ? `?${queryString}` : ''}`
    );
    return response.data;
  },

  // Get single exam by ID
  getExamById: async (examId) => {
    const response = await apiClient.get(`/api/exam/${examId}`);
    return response.data;
  },

  // Get exams for a specific subject/class
  getExamsForSubject: async (classId, subjectId, academicYear) => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    const response = await apiClient.get(
      `/api/exam/class/${classId}/subject/${subjectId}${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  // Create new exam
  createExam: async (data) => {
    const response = await apiClient.post('/api/exam/create', data);
    return response.data;
  },

  // Update exam
  updateExam: async (examId, data) => {
    const response = await apiClient.put(`/api/exam/${examId}`, data);
    return response.data;
  },

  // Delete exam
  deleteExam: async (examId) => {
    const response = await apiClient.delete(`/api/exam/${examId}`);
    return response.data;
  },
};

export default examService;
