import apiClient from '../apiClient';

export const studentService = {
  // Get all students
  getStudents: async () => {
    const response = await apiClient.get('/api/student');
    return response.data;
  },

  // Legacy alias: several screens still expect this method name.
  getStudentsByClass: async (classId) => {
    const response = await apiClient.get(`/api/class/${classId}/students`);
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

  getIdCardClasses: async () => {
    const response = await apiClient.get('/api/student/id-card/classes');
    return response.data;
  },

  getIdCardStudentsByClass: async (classId) => {
    const response = await apiClient.get(`/api/student/id-card/class/${classId}/students`);
    return response.data;
  },

  uploadSchoolIdCardLogo: async (logoFile) => {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await apiClient.post('/api/student/id-card/upload-school-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  uploadSchoolPrincipalSignature: async (signatureFile) => {
    const formData = new FormData();
    formData.append('signature', signatureFile);

    const response = await apiClient.post('/api/student/id-card/upload-principal-signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  uploadStudentIdCardPhoto: async (studentId, photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await apiClient.post(`/api/student/id-card/upload-student-photo/${studentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  generateSingleIdCardPdf: async (payload) => {
    const response = await apiClient.post('/api/student/id-card/generate-single', payload, {
      responseType: 'blob',
    });

    return response.data;
  },

  generateSingleIdCardHtml: async (payload) => {
    const response = await apiClient.post('/api/student/id-card/generate-single-html', payload);
    return response.data;
  },

  generateBulkIdCardPdf: async (payload) => {
    const response = await apiClient.post('/api/student/id-card/generate-bulk', payload, {
      responseType: 'blob',
    });

    return response.data;
  },

  generateBulkIdCardHtml: async (payload) => {
    const response = await apiClient.post('/api/student/id-card/generate-bulk-html', payload);
    return response.data;
  },
};

export default studentService;
