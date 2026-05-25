import apiClient from '../apiClient';

export const schoolManagementService = {
  getOverview: async () => {
    const response = await apiClient.get('/api/school-management/overview');
    return response.data;
  },

  getSubscription: async () => {
    const response = await apiClient.get('/api/school-management/subscription');
    return response.data;
  },

  updateSubscription: async (payload) => {
    const response = await apiClient.put('/api/school-management/subscription', payload);
    return response.data;
  },

  renewSubscription: async (payload) => {
    const response = await apiClient.put('/api/school-management/subscription/renew', payload);
    return response.data;
  },

  getClasses: async ({ includeInactive = true } = {}) => {
    const response = await apiClient.get('/api/school-management/classes', {
      params: { includeInactive: includeInactive ? 'true' : 'false' },
    });
    return response.data;
  },

  getRoles: async (role, { includeInactive = true } = {}) => {
    role = role.toLowerCase();
    role += role.endsWith('s') ? '' : 's'; // Ensure plural form
    const response = await apiClient.get(`/api/school-management/${role}`, {
      params: { includeInactive: includeInactive ? 'true' : 'false' },
    });
    return response.data;
  },

  getRoleById: async (role, id) => {
    role = role.toLowerCase();
    role += role.endsWith('s') ? '' : 's'; // Ensure plural form
    const response = await apiClient.get(`/api/school-management/${role}/${id}`);
    return response.data;
  },

  updateRole: async (role, id, payload) => {
    role = role.toLowerCase();
    role += role.endsWith('s') ? '' : 's';
    const response = await apiClient.put(`/api/school-management/${role}/${id}`, payload);
    return response.data;
  },

  changeRolePassword: async (role, id, payload) => {
    role = role.toLowerCase();
    role += role.endsWith('s') ? '' : 's';
    const response = await apiClient.patch(`/api/school-management/${role}/${id}/password`, payload);
    return response.data;
  },

  deactivateRole: async (role, id) => {
    role = role.toLowerCase();
    role += role.endsWith('s') ? '' : 's';
    const response = await apiClient.patch(`/api/school-management/${role}/${id}/deactivate`);
    return response.data;
  },

  restoreRole: async (role, id) => {
        role = role.toLowerCase();
    role += role.endsWith('s') ? '' : 's';
    const response = await apiClient.patch(`/api/school-management/${role}/${id}/restore`);
    return response.data;
  },

  deleteRole: async (role, id) => {
        role = role.toLowerCase();
    role += role.endsWith('s') ? '' : 's';
    const response = await apiClient.delete(`/api/school-management/${role}/${id}`);
    return response.data;
  },

  generateStudentRollNumber: async (classId) => {
    const response = await apiClient.post('/api/auth/generate/roll-number', { classId });
    return response.data;
  },
};

export default schoolManagementService;